const Subscription = require('../models/Subscription');
const MealCustomization = require('../models/MealCustomization');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');
const moment = require('moment-timezone');

/**
 * @desc    Get thali delivery overview for seller
 * @route   GET /api/seller/thali-overview
 * @access  Private (Seller)
 */
exports.getThaliOverview = async (req, res) => {
  try {
    const { date, shift } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const targetShift = shift || 'both';

    // Get all active subscriptions with their customizations
    const subscriptions = await Subscription.find({
      status: 'active',
      isActive: true
    })
    .populate('user', 'name email phone')
    .populate('mealPlan', 'name description items image price')
    .populate('defaultMeal', 'name description items image price')
    .populate({
      path: 'customizations',
      match: { 
        status: 'confirmed',
        isActive: true,
        $or: [
          { type: 'permanent' },
          { date: targetDate },
          { 'dates.date': targetDate }
        ]
      },
      populate: [
        { path: 'baseMeal', select: 'name description items image price' },
        { path: 'replacementMeal', select: 'name description items image price' }
      ]
    });

    // Get meal customizations for the specific date
    const customizations = await MealCustomization.find({
      status: 'confirmed',
      isActive: true,
      $or: [
        { type: 'permanent' },
        { date: targetDate },
        { 'dates.date': targetDate }
      ]
    })
    .populate('user', 'name email phone')
    .populate('subscription', 'subscriptionId')
    .populate('baseMeal', 'name description items image price')
    .populate('replacementMeal', 'name description items image price');

    // Process thali data
    const thaliData = [];
    
    for (const subscription of subscriptions) {
      // Check if subscription should deliver on this date
      const shouldDeliver = checkDeliveryDate(subscription, targetDate);
      if (!shouldDeliver) continue;

      // Get shifts for this subscription
      const shifts = getSubscriptionShifts(subscription, targetShift);
      
      for (const currentShift of shifts) {
        // Find customizations for this subscription and shift
        const subscriptionCustomizations = customizations.filter(c => 
          c.subscription._id.toString() === subscription._id.toString() &&
          (c.shift === currentShift || c.type === 'permanent')
        );

        // Get base thali details
        const baseThali = subscription.defaultMeal || subscription.mealPlan;
        let finalThali = baseThali;
        let isReplaced = false;
        let addons = [];
        let extraItems = [];
        let customPreferences = {};

        // Apply customizations
        if (subscriptionCustomizations.length > 0) {
          const customization = subscriptionCustomizations[0]; // Take the first active customization
          
          if (customization.replacementMeal) {
            finalThali = customization.replacementMeal;
            isReplaced = true;
          }

          addons = customization.addons || [];
          extraItems = customization.extraItems || [];
          customPreferences = {
            dietaryPreference: customization.dietaryPreference,
            spiceLevel: customization.spiceLevel,
            preferences: customization.preferences
          };
        }

        // Check for thali replacements in subscription
        const thaliReplacement = subscription.thaliReplacements.find(tr => 
          moment(tr.date).isSame(targetDate, 'day')
        );

        if (thaliReplacement && thaliReplacement.replacementThali) {
          const replacementMeal = await MealPlan.findById(thaliReplacement.replacementThali);
          if (replacementMeal) {
            finalThali = replacementMeal;
            isReplaced = true;
          }
        }

        thaliData.push({
          subscriptionId: subscription.subscriptionId,
          userId: subscription.user._id,
          userName: subscription.user.name,
          userContact: {
            email: subscription.user.email,
            phone: subscription.user.phone
          },
          deliveryAddress: subscription.deliveryAddress,
          shift: currentShift,
          thaliCount: subscription.thaliCount || 1,
          
          // Thali details
          baseThali: {
            id: baseThali._id,
            name: baseThali.name,
            description: baseThali.description,
            items: baseThali.items || [],
            image: baseThali.image,
            price: baseThali.price
          },
          
          finalThali: {
            id: finalThali._id,
            name: finalThali.name,
            description: finalThali.description,
            items: finalThali.items || [],
            image: finalThali.image,
            price: finalThali.price
          },
          
          isReplaced,
          replacementReason: thaliReplacement?.reason || 'Customer customization',
          
          // Customizations
          addons: addons.map(addon => ({
            name: addon.name,
            quantity: addon.quantity,
            price: addon.price,
            totalPrice: addon.price * addon.quantity
          })),
          
          extraItems: extraItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.price * item.quantity
          })),
          
          preferences: customPreferences,
          
          // Pricing
          totalPrice: calculateThaliTotalPrice(finalThali, addons, extraItems),
          
          // Status
          deliveryStatus: 'pending',
          preparedAt: null,
          deliveredAt: null
        });
      }
    }

    // Group by shift and calculate statistics
    const statistics = calculateDeliveryStatistics(thaliData);

    res.json({
      success: true,
      data: {
        date: targetDate,
        shift: targetShift,
        totalThalis: thaliData.length,
        statistics,
        thaliDetails: thaliData
      }
    });

  } catch (error) {
    console.error('Error fetching thali overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thali overview',
      error: error.message
    });
  }
};

/**
 * @desc    Get thali preparation summary
 * @route   GET /api/seller/thali-preparation
 * @access  Private (Seller)
 */
exports.getThaliPreparationSummary = async (req, res) => {
  try {
    const { date, shift } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // Get all thali data for the date
    const thaliOverview = await getThaliOverviewData(targetDate, shift);

    // Group by thali type and calculate preparation requirements
    const preparationSummary = {};
    const ingredientRequirements = {};

    thaliOverview.forEach(thali => {
      const thaliKey = `${thali.finalThali.name}_${thali.shift}`;
      
      if (!preparationSummary[thaliKey]) {
        preparationSummary[thaliKey] = {
          thaliName: thali.finalThali.name,
          shift: thali.shift,
          items: thali.finalThali.items || [],
          count: 0,
          customers: [],
          addons: {},
          extraItems: {}
        };
      }

      preparationSummary[thaliKey].count += thali.thaliCount;
      preparationSummary[thaliKey].customers.push({
        name: thali.userName,
        address: thali.deliveryAddress,
        count: thali.thaliCount,
        preferences: thali.preferences
      });

      // Count addons
      thali.addons.forEach(addon => {
        if (!preparationSummary[thaliKey].addons[addon.name]) {
          preparationSummary[thaliKey].addons[addon.name] = 0;
        }
        preparationSummary[thaliKey].addons[addon.name] += addon.quantity * thali.thaliCount;
      });

      // Count extra items
      thali.extraItems.forEach(item => {
        if (!preparationSummary[thaliKey].extraItems[item.name]) {
          preparationSummary[thaliKey].extraItems[item.name] = 0;
        }
        preparationSummary[thaliKey].extraItems[item.name] += item.quantity * thali.thaliCount;
      });
    });

    res.json({
      success: true,
      data: {
        date: targetDate,
        shift: shift || 'both',
        preparationSummary: Object.values(preparationSummary)
      }
    });

  } catch (error) {
    console.error('Error fetching preparation summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preparation summary',
      error: error.message
    });
  }
};

// Helper functions
function checkDeliveryDate(subscription, targetDate) {
  const deliveryDays = subscription.deliverySettings?.deliveryDays || [];
  const dayName = moment(targetDate).format('dddd').toLowerCase();
  
  return deliveryDays.some(day => day.day === dayName);
}

function getSubscriptionShifts(subscription, targetShift) {
  if (targetShift === 'both') {
    const shifts = [];
    if (subscription.shift === 'both' || subscription.shift === 'morning') {
      shifts.push('morning');
    }
    if (subscription.shift === 'both' || subscription.shift === 'evening') {
      shifts.push('evening');
    }
    return shifts;
  }
  
  if (subscription.shift === 'both' || subscription.shift === targetShift) {
    return [targetShift];
  }
  
  return [];
}

function calculateThaliTotalPrice(thali, addons, extraItems) {
  let total = thali.price || 0;
  
  addons.forEach(addon => {
    total += (addon.price || 0) * (addon.quantity || 1);
  });
  
  extraItems.forEach(item => {
    total += (item.price || 0) * (item.quantity || 1);
  });
  
  return total;
}

function calculateDeliveryStatistics(thaliData) {
  const stats = {
    morning: {
      totalThalis: 0,
      uniqueThaliTypes: new Set(),
      totalAddons: 0,
      totalExtraItems: 0,
      totalRevenue: 0
    },
    evening: {
      totalThalis: 0,
      uniqueThaliTypes: new Set(),
      totalAddons: 0,
      totalExtraItems: 0,
      totalRevenue: 0
    }
  };

  thaliData.forEach(thali => {
    const shift = thali.shift;
    stats[shift].totalThalis += thali.thaliCount;
    stats[shift].uniqueThaliTypes.add(thali.finalThali.name);
    stats[shift].totalAddons += thali.addons.length;
    stats[shift].totalExtraItems += thali.extraItems.length;
    stats[shift].totalRevenue += thali.totalPrice * thali.thaliCount;
  });

  // Convert Sets to arrays for JSON serialization
  stats.morning.uniqueThaliTypes = Array.from(stats.morning.uniqueThaliTypes);
  stats.evening.uniqueThaliTypes = Array.from(stats.evening.uniqueThaliTypes);

  return stats;
}

async function getThaliOverviewData(targetDate, shift) {
  // This is a simplified version of the main function for reuse
  const subscriptions = await Subscription.find({
    status: 'active',
    isActive: true
  })
  .populate('user', 'name email phone')
  .populate('mealPlan', 'name description items image price')
  .populate('defaultMeal', 'name description items image price');

  const customizations = await MealCustomization.find({
    status: 'confirmed',
    isActive: true,
    $or: [
      { type: 'permanent' },
      { date: targetDate },
      { 'dates.date': targetDate }
    ]
  })
  .populate('baseMeal', 'name description items image price')
  .populate('replacementMeal', 'name description items image price');

  // Process and return thali data (simplified version)
  return []; // Implementation similar to main function
}

// module.exports = {
//   getThaliOverview,
//   getThaliPreparationSummary
// };
