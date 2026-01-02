const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const DailyMeal = require('../models/DailyMeal');
const User = require('../models/User');
const MealPlan = require('../models/MealPlan');
const SellerMealPlan = require('../models/SellerMealPlan');

/**
 * Get current date in Indian timezone (IST) in YYYY-MM-DD format
 */
function getIndianDate() {
  const now = new Date();
  const indianTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // IST is UTC+5:30
  return indianTime.toISOString().split('T')[0];
}

/**
 * Parse a date string and create a proper Indian timezone date at midnight
 */
function parseIndianDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create UTC date for the given date at 18:30:00 (which is midnight IST)
  const utcDate = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
  return utcDate;
}

/**
 * @desc    Get seller meal edit dashboard
 * @route   GET /api/seller/meal-edit/dashboard
 * @access  Private (Seller only)
 */
exports.getMealEditDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const userRole = req.user.role;
    
    console.log('Getting meal edit dashboard for seller:', sellerId);
    console.log('User role:', userRole);
    console.log('Seller ID type:', typeof sellerId);
    
    // Get seller information
    const seller = await User.findById(sellerId).select('name email businessName role');
    console.log('Found seller:', seller ? seller.name : 'Not found');
    
    // Get meal plans - debug the query
    console.log('Searching for meal plans with seller:', sellerId);
    const mealPlans = await MealPlan.find({ seller: sellerId })
      .populate('seller', 'name businessName')
      .sort({ createdAt: -1 });
    console.log('Found meal plans:', mealPlans.length, mealPlans.map(p => p.title || p._id));
    
    // Also try searching without filter to see if there are any meal plans at all
    const allMealPlans = await MealPlan.find().limit(5);
    console.log('Total meal plans in DB (first 5):', allMealPlans.length, allMealPlans.map(p => ({ id: p._id, seller: p.seller, title: p.title })));
    
    // Get active subscriptions with user details - debug the query
    console.log('Searching for subscriptions with sellerId:', sellerId);
    const subscriptions = await Subscription.find({
      sellerId: sellerId,
      status: { $in: ['active', 'paused'] }
    })
      .populate('user', 'name email phone')
      .populate('mealPlan', 'name tier description price')
      .sort({ createdAt: -1 });
    console.log('Found subscriptions:', subscriptions.length);
    
    // Also try searching without sellerId filter
    const allActiveSubscriptions = await Subscription.find({ status: 'active' }).limit(5);
    console.log('Total active subscriptions in DB (first 5):', allActiveSubscriptions.length, allActiveSubscriptions.map(s => ({ id: s._id, sellerId: s.sellerId })));
    
    // Get seller meal templates (if using SellerMealPlan model)
    const mealTemplates = await SellerMealPlan.find({ seller: sellerId })
      .populate('seller', 'name businessName')
      .sort({ createdAt: -1 });
    console.log('Found meal templates:', mealTemplates.length);
    
    // Get today's orders count
    const today = getIndianDate();
    const todayOrdersCount = await Subscription.countDocuments({
      sellerId: sellerId,
      status: 'active'
    });
    console.log('Today orders count:', todayOrdersCount);
    
    res.status(200).json({
      success: true,
      data: {
        seller,
        subscriptions,
        mealPlans,
        mealTemplates: mealTemplates.length > 0 ? mealTemplates : null,
        stats: {
          mealPlans: mealPlans.length,
          activeSubscriptions: subscriptions.length,
          todayOrders: todayOrdersCount
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting seller meal edit dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
};

/**
 * @desc    Get seller's meal templates
 * @route   GET /api/seller/meal-edit/meal-templates
 * @access  Private (Seller only)
 */
exports.getMealTemplates = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    console.log('Getting meal templates for seller:', sellerId);
    
    // Get seller meal plans (templates)
    const sellerMealPlans = await SellerMealPlan.find({ seller: sellerId })
      .populate('seller', 'name businessName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: sellerMealPlans,
      count: sellerMealPlans.length
    });
    
  } catch (error) {
    console.error('Error getting seller meal templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal templates',
      error: error.message
    });
  }
};

/**
 * @desc    Get seller's meal plans
 * @route   GET /api/seller/meal-edit/meal-plans
 * @access  Private (Seller only)
 */
exports.getMealPlans = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    console.log('Getting meal plans for seller:', sellerId);
    
    // Get meal plans for this seller
    const mealPlans = await MealPlan.find({ seller: sellerId })
      .populate('seller', 'name businessName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: mealPlans,
      count: mealPlans.length
    });
    
  } catch (error) {
    console.error('Error getting seller meal plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal plans',
      error: error.message
    });
  }
};

/**
 * @desc    Get meal plan by tier and shift
 * @route   GET /api/seller/meal-edit/tier/:tier/shift/:shift
 * @access  Private (Seller only)
 */
exports.getMealPlanByTierShift = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { tier, shift } = req.params;
    
    console.log(`Getting meal data for seller: ${sellerId}, tier: ${tier}, shift: ${shift}`);
    
    // Find active subscriptions for this seller with the specified tier
    const subscriptions = await Subscription.find({
      sellerId: sellerId,
      status: 'active'
    })
    .populate('mealPlan', 'tier name title')
    .populate('user', 'name email');
    
    console.log(`Found ${subscriptions.length} total active subscriptions for seller`);
    
    // Filter subscriptions by tier
    const tierSubscriptions = subscriptions.filter(sub => 
      sub.mealPlan && sub.mealPlan.tier === tier
    );
    
    console.log(`Found ${tierSubscriptions.length} subscriptions matching tier ${tier}`);
    
    // Get todayMeal data from the first subscription or use default
    let todayMealData = {
      items: [],
      mealType: 'lunch',
      isAvailable: true
    };
    
    if (tierSubscriptions.length > 0) {
      const firstSub = tierSubscriptions[0];
      if (firstSub.todayMeal) {
        todayMealData = {
          items: firstSub.todayMeal.items || [],
          mealType: firstSub.todayMeal.mealType || 'lunch',
          isAvailable: firstSub.todayMeal.isAvailable !== false
        };
        console.log('Using existing todayMeal data from subscription:', firstSub._id);
      } else {
        console.log('No existing todayMeal data found, using defaults');
      }
    } else {
      // If no subscriptions found, try to get from meal plan
      const mealPlans = await MealPlan.find({
        seller: sellerId,
        tier: tier,
      }).populate('seller', 'name businessName');
      
      if (mealPlans.length > 0 && mealPlans[0].todayMeal) {
        todayMealData = {
          items: mealPlans[0].todayMeal.items || [],
          mealType: mealPlans[0].todayMeal.mealType || 'lunch',
          isAvailable: mealPlans[0].todayMeal.isAvailable !== false
        };
        console.log('Using meal plan todayMeal data as fallback');
      }
    }
    
    // Structure the response to match what the frontend expects
    const responseData = {
      tier: tier,
      shift: shift,
      subscriptionCount: tierSubscriptions.length,
      todayMeal: todayMealData
    };
    
    res.status(200).json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error('Error getting meal plan by tier and shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal plan',
      error: error.message
    });
  }
};

/**
 * @desc    Update meal plan by tier and shift
 * @route   PUT /api/seller/meal-edit/tier/:tier/shift/:shift/meal
 * @access  Private (Seller only)
 */
exports.updateMealPlanByTierShift = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { tier, shift } = req.params;
    const { items, mealType, isAvailable } = req.body;
    
    console.log(`Updating meals for ALL subscriptions - seller: ${sellerId}, tier: ${tier}, shift: ${shift}`);
    console.log('Update data:', { items, mealType, isAvailable });
    
    // Find all active subscriptions for this seller with the specified tier
    const subscriptions = await Subscription.find({
      sellerId: sellerId,
      status: 'active'
    })
    .populate('mealPlan', 'tier')
    .populate('user', 'name email');
    
    console.log(`Found ${subscriptions.length} total active subscriptions for seller`);
    
    // Filter subscriptions by tier
    const tierSubscriptions = subscriptions.filter(sub => 
      sub.mealPlan && sub.mealPlan.tier === tier
    );
    
    console.log(`Found ${tierSubscriptions.length} subscriptions matching tier ${tier}`);
    
    if (tierSubscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No active subscriptions found for tier ${tier}`
      });
    }
    
    // Prepare the todayMeal data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMealData = {
      items: (items || []).map(item => ({
        name: item.name || '',
        description: item.description || '',
        quantity: item.quantity || '1 serving'
      })),
      mealType: mealType || 'lunch',
      date: today,
      isAvailable: isAvailable !== false,
      lastUpdated: new Date(),
      shift: shift,
      tier: tier
    };
    
    console.log('Updating subscriptions with todayMeal data:', todayMealData);
    
    // Update all matching subscriptions
    const updatePromises = tierSubscriptions.map(async (subscription) => {
      subscription.todayMeal = todayMealData;
      await subscription.save();
      console.log(`Updated subscription ${subscription._id} for user ${subscription.user.name}`);
      return subscription;
    });
    
    await Promise.all(updatePromises);
    
    // Also update the meal plan for consistency
    const mealPlans = await MealPlan.find({
      seller: sellerId,
      tier: tier
    });
    
    if (mealPlans.length > 0) {
      const mealPlanUpdateData = {
        todayMeal: todayMealData,
        updatedAt: new Date()
      };
      
      await MealPlan.findByIdAndUpdate(
        mealPlans[0]._id,
        mealPlanUpdateData,
        { new: true }
      );
      
      console.log('Also updated meal plan template');
    }
    
    res.status(200).json({
      success: true,
      message: `Meal updated for ${tierSubscriptions.length} ${tier} tier subscriptions`,
      data: {
        updatedSubscriptions: tierSubscriptions.length,
        tier: tier,
        shift: shift,
        mealData: todayMealData
      }
    });
    
  } catch (error) {
    console.error('Error updating tier meals for subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tier meals',
      error: error.message
    });
  }
};

/**
 * @desc    Get seller's daily orders (delivery tracking)
 * @route   GET /api/seller/meal-edit/daily-orders
 * @access  Private (Seller only)
 */
exports.getSellerDailyOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const {
      date = getIndianDate(),
      shift = 'both',
      status = 'all',
      page = 1,
      limit = 50
    } = req.query;
    
    console.log(`Getting seller daily orders for seller: ${sellerId}, date: ${date}, shift: ${shift}`);
    
    // Build match conditions for subscriptions
    const matchConditions = {
      sellerId: new mongoose.Types.ObjectId(sellerId),
      status: 'active'
    };
    
    // Parse the selected date
    const selectedDate = parseIndianDate(date);
    
    // Find subscriptions with delivery tracking for the specified date
    const subscriptions = await Subscription.find(matchConditions)
      .populate('user', 'name email phone')
      .populate('mealPlan', 'name title tier shifts')
        .populate('sellerId', 'name businessName')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${subscriptions.length} active subscriptions for seller`);
    
    // Process delivery data
    const deliveries = [];
    
    for (const subscription of subscriptions) {
      // Get subscription shifts
      let subscriptionShifts = [];
      
      if (subscription.shift === 'both') {
        subscriptionShifts = ['morning', 'evening'];
      } else if (['morning', 'evening'].includes(subscription.shift)) {
        subscriptionShifts = [subscription.shift];
      } else {
        subscriptionShifts = subscription.mealPlan?.shifts || ['evening'];
      }
      
      for (const mealShift of subscriptionShifts) {
        // Skip if filtering by specific shift
        if (shift !== 'both' && shift !== mealShift) continue;
        
        // Find existing delivery tracking for this date and shift
        const existingDelivery = subscription.deliveryTracking?.find(track => {
          const trackDate = new Date(track.date);
          const indianTrackDate = new Date(trackDate.getTime() + (5.5 * 60 * 60 * 1000));
          const trackDateStr = indianTrackDate.toISOString().split('T')[0];
          return trackDateStr === date && track.shift === mealShift;
        });

        // Check for meal customization or skipped meals in todayMeal
        let mealInfo = null;
        let mealStatus = 'standard'; // standard, customized, skipped
        
        if (subscription.todayMeal) {
          const todayMealDate = new Date(subscription.todayMeal.date);
          const indianMealDate = new Date(todayMealDate.getTime() + (5.5 * 60 * 60 * 1000));
          const mealDateStr = indianMealDate.toISOString().split('T')[0];
          
          if (mealDateStr === date && subscription.todayMeal.mealType === 'lunch') {
            mealInfo = subscription.todayMeal;
            
            // Check if meal is available
            if (mealInfo.isAvailable === false) {
              mealStatus = 'skipped';
            } else if (mealInfo.items && mealInfo.items.length > 0) {
              mealStatus = 'customized';
            }
          }
        }

        // Check for skipped meals in skipMeals array
        const skippedMeal = subscription.skippedMeals?.find(skip => {
          const skipDate = new Date(skip.date);
          const indianSkipDate = new Date(skipDate.getTime() + (5.5 * 60 * 60 * 1000));
          const skipDateStr = indianSkipDate.toISOString().split('T')[0];
          return skipDateStr === date && skip.shift === mealShift;
        });
        
        if (skippedMeal) {
          mealStatus = 'skipped';
        }
        
        if (existingDelivery || mealStatus !== 'standard') {
          const deliveryStatus = existingDelivery?.status || (mealStatus === 'skipped' ? 'skipped' : 'pending');
          
          // Apply status filter
          if (status !== 'all') {
            if (status === 'pending' && !['pending', 'assigned'].includes(deliveryStatus)) continue;
            if (status === 'delivered' && deliveryStatus !== 'delivered') continue;
            if (status === 'failed' && deliveryStatus !== 'failed') continue;
            if (status === 'skipped' && deliveryStatus !== 'skipped') continue;
          }
          
          const delivery = {
            _id: existingDelivery?._id || `${subscription._id}_${mealShift}_${date}`,
            subscriptionId: subscription._id,
            user: subscription.user,
            mealPlan: subscription.mealPlan,
            deliveryAddress: subscription.deliveryAddress,
            date: new Date(date),
            shift: mealShift,
            status: deliveryStatus,
            mealStatus: mealStatus, // NEW: standard, customized, skipped
            mealInfo: mealInfo, // NEW: customized meal details
            skipReason: skippedMeal?.reason || (mealStatus === 'skipped' && mealInfo ? 'Meal not available' : null),
            deliveredAt: existingDelivery?.deliveredAt,
            deliveredBy: existingDelivery?.deliveredBy,
            driver: existingDelivery?.driver,
            notes: existingDelivery?.notes,
            checkpoints: existingDelivery?.checkpoints || [],
            createdAt: existingDelivery?.createdAt || subscription.createdAt
          };
          
          deliveries.push(delivery);
        }
      }
    }
    
    console.log(`Generated ${deliveries.length} deliveries for seller on ${date}`);
    
    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedDeliveries = deliveries
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + parseInt(limit));
    
    // Calculate statistics
    const stats = {
      total: deliveries.length,
      pending: deliveries.filter(d => ['pending', 'assigned'].includes(d.status)).length,
      delivered: deliveries.filter(d => d.status === 'delivered').length,
      failed: deliveries.filter(d => d.status === 'failed').length,
      skipped: deliveries.filter(d => d.status === 'skipped').length,
      customized: deliveries.filter(d => d.mealStatus === 'customized').length,
      standard: deliveries.filter(d => d.mealStatus === 'standard').length,
      morning: deliveries.filter(d => d.shift === 'morning').length,
      evening: deliveries.filter(d => d.shift === 'evening').length
    };
    
    res.status(200).json({
      success: true,
      data: paginatedDeliveries,
      stats,
      meta: {
        date,
        shift,
        status,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: deliveries.length,
          pages: Math.ceil(deliveries.length / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting seller daily orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily orders',
      error: error.message
    });
  }
};

/**
 * @desc    Mark no meal available for today/shift
 * @route   POST /api/seller/meal-edit/no-meal-today
 * @access  Private (Seller only)
 */
exports.markNoMealToday = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { date = getIndianDate(), shift = 'both', reason = 'No meal available today' } = req.body;
    
    console.log(`Marking no meal for seller: ${sellerId}, date: ${date}, shift: ${shift}`);
    
    // Create or update DailyMeal entry to mark no meal
    const shifts = shift === 'both' ? ['morning', 'evening'] : [shift];
    
    for (const mealShift of shifts) {
      const dailyMealData = {
        seller: sellerId,
        date: parseIndianDate(date),
        shift: mealShift,
        noMealAvailable: true,
        noMealReason: reason,
        updatedAt: new Date()
      };
      
      await DailyMeal.findOneAndUpdate(
        {
          seller: sellerId,
          date: parseIndianDate(date),
          shift: mealShift
        },
        dailyMealData,
        {
          upsert: true,
          new: true
        }
      );
    }
    
    res.status(200).json({
      success: true,
      message: `No meal marked for ${shift} shift on ${date}`,
      data: {
        seller: sellerId,
        date,
        shift,
        reason
      }
    });
    
  } catch (error) {
    console.error('Error marking no meal today:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark no meal',
      error: error.message
    });
  }
};

/**
 * @desc    Get no meal status for today
 * @route   GET /api/seller/meal-edit/no-meal-status
 * @access  Private (Seller only)
 */
exports.getNoMealStatus = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { date = getIndianDate() } = req.query;
    
    console.log(`Getting no meal status for seller: ${sellerId}, date: ${date}`);
    
    // Find no meal entries for this seller and date
    const noMealEntries = await DailyMeal.find({
      seller: sellerId,
      date: parseIndianDate(date),
      noMealAvailable: true
    });
    
    const noMealStatus = {
      morning: false,
      evening: false,
      morningReason: null,
      eveningReason: null
    };
    
    noMealEntries.forEach(entry => {
      if (entry.shift === 'morning') {
        noMealStatus.morning = true;
        noMealStatus.morningReason = entry.noMealReason;
      } else if (entry.shift === 'evening') {
        noMealStatus.evening = true;
        noMealStatus.eveningReason = entry.noMealReason;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        seller: sellerId,
        date,
        noMealStatus
      }
    });
    
  } catch (error) {
    console.error('Error getting no meal status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get no meal status',
      error: error.message
    });
  }
};

/**
 * @desc    Remove no meal restriction
 * @route   DELETE /api/seller/meal-edit/no-meal-today
 * @access  Private (Seller only)
 */
exports.removeNoMealToday = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { date = getIndianDate(), shift = 'both' } = req.body;
    
    console.log(`Removing no meal restriction for seller: ${sellerId}, date: ${date}, shift: ${shift}`);
    
    // Remove or update DailyMeal entries
    const shifts = shift === 'both' ? ['morning', 'evening'] : [shift];
    
    for (const mealShift of shifts) {
      await DailyMeal.findOneAndUpdate(
        {
          seller: sellerId,
          date: parseIndianDate(date),
          shift: mealShift
        },
        {
          noMealAvailable: false,
          noMealReason: null,
          updatedAt: new Date()
        }
      );
    }
    
    res.status(200).json({
      success: true,
      message: `No meal restriction removed for ${shift} shift on ${date}`,
      data: {
        seller: sellerId,
        date,
        shift
      }
    });
    
  } catch (error) {
    console.error('Error removing no meal restriction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove no meal restriction',
      error: error.message
    });
  }
};

/**
 * @desc    Get specific subscription today's meal
 * @route   GET /api/seller/meal-edit/subscription/:subscriptionId/today-meal
 * @access  Private (Seller only)
 */
exports.getSubscriptionTodayMeal = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { subscriptionId } = req.params;
    
    console.log(`Getting today's meal for subscription: ${subscriptionId}`);
    console.log(`Seller ID: ${sellerId}`);
    
    // Get subscription and verify it belongs to this seller
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      sellerId: sellerId,
      status: 'active'
    })
      .populate('user', 'name email')
      .populate('mealPlan', 'title tier')
      .select('todayMeal user mealPlan sellerId shift');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found or unauthorized'
      });
    }

    console.log('Found subscription todayMeal:', subscription.todayMeal);
    
    res.status(200).json({
      success: true,
      data: {
        subscription: {
          _id: subscription._id,
          user: subscription.user,
          mealPlan: subscription.mealPlan,
          shift: subscription.shift,
          todayMeal: subscription.todayMeal
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting subscription today meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription meal',
      error: error.message
    });
  }
};

/**
 * @desc    Update specific subscription today's meal
 * @route   PUT /api/seller/meal-edit/subscription/:subscriptionId/today-meal
 * @access  Private (Seller only)
 */
exports.updateSubscriptionTodayMeal = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { subscriptionId } = req.params;
    const { items, mealType, isAvailable } = req.body;
    
    console.log(`=== UPDATE SUBSCRIPTION MEAL DEBUG ===`);
    console.log(`Seller ID: ${sellerId}`);
    console.log(`Subscription ID: ${subscriptionId}`);
    console.log(`Request Body:`, { items, mealType, isAvailable });

    // Validate items array
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }

    // Validate each item structure
    const validItems = items.every(item => 
      item.name && typeof item.name === 'string'
    );

    if (!validItems) {
      return res.status(400).json({
        success: false,
        message: 'Each item must have at least a name field'
      });
    }
    
    // First, let's check if the subscription exists and belongs to the seller
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      sellerId: sellerId,
      status: 'active'
    }).populate('user', 'name email phone');
    
    console.log('Subscription found:', subscription ? 'YES' : 'NO');
    if (!subscription) {
      console.log('No subscription found with criteria:', {
        _id: subscriptionId,
        sellerId: sellerId,
        status: 'active'
      });
      return res.status(404).json({
        success: false,
        message: 'Subscription not found or unauthorized'
      });
    }

    console.log('Current todayMeal before update:', subscription.todayMeal);

    // Update today's meal - same structure as admin
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    subscription.todayMeal = {
      items: items.map(item => ({
        name: item.name,
        description: item.description || '',
        quantity: item.quantity || '1 serving'
      })),
      mealType: mealType || (subscription.shift === 'morning' ? 'lunch' : 'dinner'),
      date: today,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      lastUpdated: new Date()
    };

    await subscription.save();
    
    console.log('Updated subscription todayMeal:', subscription.todayMeal);
    
    res.status(200).json({
      success: true,
      message: `Meal updated for ${subscription.user.name}`,
      data: {
        subscription: subscription
      }
    });
    
  } catch (error) {
    console.error('Error updating subscription today meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription meal',
      error: error.message
    });
  }
};

/**
 * @desc    Update seller meal availability status
 * @route   PUT /api/seller/meal-edit/availability
 * @access  Private (Seller only)
 */
exports.updateMealAvailability = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { 
      shift, // 'morning', 'evening', or 'both'
      isAvailable, 
      status, // 'available', 'temporarily_off', 'maintenance', 'holiday'
      reason 
    } = req.body;

    console.log(`Updating meal availability for seller: ${sellerId}, shift: ${shift}, isAvailable: ${isAvailable}, status: ${status}`);

    // Get current seller profile
    const User = require('../models/User');
    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Initialize sellerProfile.mealAvailability if not exists
    if (!seller.sellerProfile.mealAvailability) {
      seller.sellerProfile.mealAvailability = {
        isAvailable: true,
        status: 'available',
        reason: null,
        lastUpdated: new Date(),
        shifts: {
          morning: {
            isAvailable: true,
            status: 'available',
            reason: null
          },
          evening: {
            isAvailable: true,
            status: 'available',
            reason: null
          }
        }
      };
    }

    // Update based on shift
    if (shift === 'both' || !shift) {
      // Update overall availability
      seller.sellerProfile.mealAvailability.isAvailable = isAvailable;
      seller.sellerProfile.mealAvailability.status = status || 'available';
      seller.sellerProfile.mealAvailability.reason = reason;
      seller.sellerProfile.mealAvailability.lastUpdated = new Date();

      // Update both shifts
      seller.sellerProfile.mealAvailability.shifts.morning.isAvailable = isAvailable;
      seller.sellerProfile.mealAvailability.shifts.morning.status = status || 'available';
      seller.sellerProfile.mealAvailability.shifts.morning.reason = reason;

      seller.sellerProfile.mealAvailability.shifts.evening.isAvailable = isAvailable;
      seller.sellerProfile.mealAvailability.shifts.evening.status = status || 'available';
      seller.sellerProfile.mealAvailability.shifts.evening.reason = reason;
    } else {
      // Update specific shift
      seller.sellerProfile.mealAvailability.shifts[shift].isAvailable = isAvailable;
      seller.sellerProfile.mealAvailability.shifts[shift].status = status || 'available';
      seller.sellerProfile.mealAvailability.shifts[shift].reason = reason;
      
      // Update overall availability based on shifts
      const morningAvailable = seller.sellerProfile.mealAvailability.shifts.morning.isAvailable;
      const eveningAvailable = seller.sellerProfile.mealAvailability.shifts.evening.isAvailable;
      
      seller.sellerProfile.mealAvailability.isAvailable = morningAvailable || eveningAvailable;
      seller.sellerProfile.mealAvailability.lastUpdated = new Date();
    }

    await seller.save();

    res.status(200).json({
      success: true,
      message: `Meal availability updated for ${shift || 'all'} shifts`,
      data: {
        mealAvailability: seller.sellerProfile.mealAvailability
      }
    });

  } catch (error) {
    console.error('Error updating meal availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meal availability',
      error: error.message
    });
  }
};

/**
 * @desc    Get seller meal availability status
 * @route   GET /api/seller/meal-edit/availability
 * @access  Private (Seller only)
 */
exports.getMealAvailability = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const User = require('../models/User');
    const seller = await User.findById(sellerId).select('sellerProfile.mealAvailability role');
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Initialize default meal availability if not exists
    const defaultMealAvailability = {
      isAvailable: true,
      status: 'available',
      reason: null,
      lastUpdated: new Date(),
      shifts: {
        morning: {
          isAvailable: true,
          status: 'available',
          reason: null
        },
        evening: {
          isAvailable: true,
          status: 'available',
          reason: null
        }
      }
    };

    const mealAvailability = seller.sellerProfile?.mealAvailability || defaultMealAvailability;

    res.status(200).json({
      success: true,
      data: {
        mealAvailability
      }
    });

  } catch (error) {
    console.error('Error getting meal availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal availability',
      error: error.message
    });
  }
};

module.exports = {
  getMealEditDashboard: exports.getMealEditDashboard,
  getMealTemplates: exports.getMealTemplates,
  getMealPlans: exports.getMealPlans,
  getMealPlanByTierShift: exports.getMealPlanByTierShift,
  updateMealPlanByTierShift: exports.updateMealPlanByTierShift,
  getSellerDailyOrders: exports.getSellerDailyOrders,
  markNoMealToday: exports.markNoMealToday,
  getNoMealStatus: exports.getNoMealStatus,
  removeNoMealToday: exports.removeNoMealToday,
  getSubscriptionTodayMeal: exports.getSubscriptionTodayMeal,
  updateSubscriptionTodayMeal: exports.updateSubscriptionTodayMeal,
  updateMealAvailability: exports.updateMealAvailability,
  getMealAvailability: exports.getMealAvailability
};