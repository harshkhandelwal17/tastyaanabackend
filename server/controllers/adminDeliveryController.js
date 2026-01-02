const Subscription = require('../models/Subscription');
const User = require('../models/User');
const MealPlan = require('../models/MealPlan');
const MealCustomization = require('../models/MealCustomization');
// const DriverRoute = require('../models/DriverRoute');
// const ReplaceableItem = require('../models/replaceableItems');
// const DailyMealDelivery = require('../models/DailyMealDelivery');
const moment = require('moment-timezone');
const mongoose = require('mongoose');

/**
 * Generate a driver-friendly summary of meal customizations
 * @param {Object} customization - The customization object
 * @param {Object} replacementMeal - The replacement meal details
 * @returns {String} Human-readable customization summary
 */
function generateCustomizationSummary(customization, replacementMeal) {
  const summaryParts = [];
  
  // Replacement meal
  if (replacementMeal) {
    summaryParts.push(`🔄 Meal changed to: ${replacementMeal.name}`);
  }
  
  // Dietary preferences
  if (customization.dietaryPreference && customization.dietaryPreference !== 'regular') {
    summaryParts.push(`🥗 Diet: ${customization.dietaryPreference}`);
  }
  
  // Spice level
  if (customization.spiceLevel && customization.spiceLevel !== 'medium') {
    summaryParts.push(`🌶️ Spice: ${customization.spiceLevel}`);
  }
  
  // Cooking preferences
  if (customization.cookingPreference) {
    summaryParts.push(`👨‍🍳 Cooking: ${customization.cookingPreference}`);
  }
  
  // Special instructions
  if (customization.specialInstructions && customization.specialInstructions.trim()) {
    summaryParts.push(`📝 Note: ${customization.specialInstructions.trim()}`);
  }
  
  return summaryParts.length > 0 ? summaryParts.join(' | ') : 'No customizations';
}

/**
 * Parse date in Indian timezone
 * @param {String} dateStr - Date string to parse
 * @returns {Date} Parsed date object
 */
function parseIndianDate(dateStr) {
  const indianDate = moment.tz(dateStr, 'Asia/Kolkata');
  return indianDate.startOf('day').toDate();
}

/**
 * @desc    Get admin daily deliveries (driver-style implementation)
 * @route   GET /api/admin/deliveries
 * @access  Private (Admin only)
 * @param   {String} date - YYYY-MM-DD format
 * @param   {String} shift - morning, evening, or both
 * @param   {String} status - all, pending, delivered, skipped
 * @param   {String} zone - all or specific zone
 * @param   {String} driverId - all or specific driver ID
 * @param   {String} sellerId - all or specific seller ID
 * @param   {String} mealPlanId - all or specific meal plan ID
 * @param   {String} priceRange - all or price range like "100-200"
 * @param   {String} search - search term for user/seller names
 * @param   {String} sortBy - field to sort by
 * @param   {String} sortOrder - asc or desc
 * @param   {Number} page - page number
 * @param   {Number} limit - items per page
 */
exports.getAdminDailyDeliveries = async (req, res) => {
  try {
    console.log('🔥 Admin deliveries API called with params:', req.query);
    
    const {
      date,
      shift = 'both',
      status = 'all', 
      zone = 'all',
      driverId = 'all',
      sellerId = 'all',
      mealPlanId = 'all',
      priceRange = 'all',
      search = '',
      sortBy = 'user.name',
      sortOrder = 'asc',
      page = 1,
      limit = 50
    } = req.query;

    if (!date) {
      console.log('❌ Missing date parameter');
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }
    
    console.log('✅ Date parameter provided:', date);

    const targetDate = parseIndianDate(date);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build base query for active subscriptions on target date
    const baseQuery = {
      isActive: true,
      startDate: { $lte: targetDate },
      $or: [
        { endDate: { $gte: targetDate } },
        { endDate: null }
      ]
    };

    // Add seller filter if specified
    if (sellerId && sellerId !== 'all') {
      baseQuery.sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    // Add meal plan filter if specified 
    if (mealPlanId && mealPlanId !== 'all') {
      baseQuery.mealPlan = new mongoose.Types.ObjectId(mealPlanId);
    }

    // Get all matching subscriptions with populated data
    const subscriptions = await Subscription.find(baseQuery)
      .populate({
        path: 'user', // Note: field is 'user', not 'userId' 
        select: 'name phone email deliveryAddress'
      })
      .populate({
        path: 'mealPlan', // Note: field is 'mealPlan', not 'mealPlanId'
        select: 'name description price type shift'
      })
      .populate({
        path: 'sellerId', // Note: field is 'sellerId' 
        select: 'businessName name'
      })
      .lean();

    let deliveries = [];

    for (const subscription of subscriptions) {
      // Check if this subscription has deliveries for the target date
      const hasDeliveryForDate = subscription.deliveryTracking?.some(tracking => {
        const trackingDate = moment(tracking.date).format('YYYY-MM-DD');
        return trackingDate === date;
      });

      if (!hasDeliveryForDate) {
        // Create delivery tracking entries if they don't exist
        const shifts = subscription.mealPlan?.shift === 'both' ? ['morning', 'evening'] : [subscription.mealPlan?.shift || 'morning'];
        
        for (const deliveryShift of shifts) {
          const newTracking = {
            date: targetDate,
            shift: deliveryShift,
            status: 'pending',
            zone: subscription.zone || 'unassigned',
            estimatedDeliveryTime: deliveryShift === 'morning' ? '09:00' : '18:00'
          };

          if (!subscription.deliveryTracking) {
            subscription.deliveryTracking = [];
          }
          subscription.deliveryTracking.push(newTracking);
        }

        // Save the updated subscription
        await Subscription.findByIdAndUpdate(
          subscription._id,
          { $push: { deliveryTracking: { $each: shifts.map(shift => ({ 
            date: targetDate,
            shift,
            status: 'pending',
            zone: subscription.zone || 'unassigned',
            estimatedDeliveryTime: shift === 'morning' ? '09:00' : '18:00'
          })) } } },
          { new: true }
        );
      }

      // Get delivery tracking for this date
      const todayTrackings = subscription.deliveryTracking?.filter(tracking => {
        const trackingDate = moment(tracking.date).format('YYYY-MM-DD');
        return trackingDate === date;
      }) || [];

      // Check if meal is skipped
      const isSkipped = subscription.skipMeals?.some(skip => {
        const skipDate = moment(skip.date).format('YYYY-MM-DD');
        return skipDate === date;
      });

      // Get meal customization for this date
      let customizationDetails = null;
      try {
        const customization = await MealCustomization.findOne({
          subscriptionId: subscription._id,
          date: {
            $gte: moment(targetDate).startOf('day').toDate(),
            $lt: moment(targetDate).endOf('day').toDate()
          }
        });

        if (customization && (
          customization.paymentStatus === 'paid' || 
          customization.paymentStatus === 'confirmed' ||
          (customization.totalpayablePrice <= 0) ||
          customization.paymentStatus === 'not_required'
        )) {
          // TODO: Re-enable replacement meal lookup when ReplaceableItem import is restored
          let replacementMealDetails = null;
          /*
          if (customization.replacementMeal) {
            try {
              replacementMealDetails = await ReplaceableItem.findById(customization.replacementMeal);
            } catch (error) {
              console.error('Error fetching replacement meal details:', error);
            }
          }
          */

          customizationDetails = {
            customizationId: customization._id,
            type: customization.type,
            baseMeal: customization.baseMeal,
            replacementMeal: replacementMealDetails,
            specialInstructions: customization.specialInstructions,
            dietaryPreference: customization.dietaryPreference,
            spiceLevel: customization.spiceLevel,
            cookingPreference: customization.cookingPreference,
            summary: generateCustomizationSummary(customization, replacementMealDetails)
          };
        }
      } catch (error) {
        console.error('Error fetching customization:', error);
      }

      // Create delivery records for each shift
      for (const tracking of todayTrackings) {
        // Apply shift filter
        if (shift !== 'both' && tracking.shift !== shift) continue;

        // Apply zone filter
        if (zone !== 'all' && tracking.zone !== zone) continue;

        // Apply driver filter
        if (driverId !== 'all' && (!tracking.driverId || tracking.driverId.toString() !== driverId)) continue;

        // Apply status filter
        if (status !== 'all') {
          if (status === 'skipped' && !isSkipped) continue;
          if (status !== 'skipped' && tracking.status !== status) continue;
        }

        // Apply price range filter
        if (priceRange !== 'all' && priceRange.includes('-')) {
          const [min, max] = priceRange.split('-').map(p => parseInt(p));
          if (subscription.mealPlan?.price < min || subscription.mealPlan?.price > max) continue;
        }

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const userName = subscription.user?.name?.toLowerCase() || '';
          const userPhone = subscription.user?.phone?.toLowerCase() || '';
          const userEmail = subscription.user?.email?.toLowerCase() || '';
          const sellerName = subscription.sellerId?.businessName?.toLowerCase() || subscription.sellerId?.name?.toLowerCase() || '';
          
          if (!userName.includes(searchLower) && 
              !userPhone.includes(searchLower) && 
              !userEmail.includes(searchLower) && 
              !sellerName.includes(searchLower)) continue;
        }

        deliveries.push({
          _id: tracking._id,
          subscriptionId: subscription._id,
          subscriptionNumber: subscription.subscriptionId,
          user: subscription.user,
          mealPlan: subscription.mealPlan,
          seller: subscription.sellerId, // Note: this field is still sellerId in the schema
          address: subscription.user?.deliveryAddress,
          date: targetDate,
          shift: tracking.shift,
          zone: tracking.zone,
          status: isSkipped ? 'skipped' : tracking.status,
          driver: tracking.driverId,
          estimatedTime: tracking.estimatedDeliveryTime,
          actualTime: tracking.actualDeliveryTime,
          notes: tracking.notes,
          isSkipped,
          customization: customizationDetails,
          price: subscription.mealPlanId?.price || 0
        });
      }
    }

    // Sort deliveries
    deliveries.sort((a, b) => {
      const aVal = sortBy.split('.').reduce((obj, key) => obj?.[key], a) || '';
      const bVal = sortBy.split('.').reduce((obj, key) => obj?.[key], b) || '';
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Apply pagination
    const paginatedDeliveries = deliveries.slice(skip, skip + parseInt(limit));

    // Generate statistics
    const stats = {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === 'pending').length,
      delivered: deliveries.filter(d => d.status === 'delivered').length,
      skipped: deliveries.filter(d => d.isSkipped).length,
      morning: deliveries.filter(d => d.shift === 'morning').length,
      evening: deliveries.filter(d => d.shift === 'evening').length,
      successRate: deliveries.length > 0 ? Math.round((deliveries.filter(d => d.status === 'delivered').length / deliveries.length) * 100) : 0
    };

    res.status(200).json({
      success: true,
      data: paginatedDeliveries,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: deliveries.length,
        pages: Math.ceil(deliveries.length / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching admin daily deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily deliveries',
      error: error.message
    });
  }
};

/**
 * @desc    Admin skip meal for user
 * @route   POST /api/admin/daily-deliveries/:subscriptionId/skip
 * @access  Private (Admin only)
 */
exports.adminSkipMeal = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { dates, reason, shift = 'both' } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dates array is required'
      });
    }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Process each date
    for (const dateStr of dates) {
      const skipDate = parseIndianDate(dateStr);
      
      // Check if already skipped
      const existingSkip = subscription.skipMeals?.find(skip => 
        moment(skip.date).format('YYYY-MM-DD') === moment(skipDate).format('YYYY-MM-DD')
      );

      if (!existingSkip) {
        subscription.skipMeals.push({
          date: skipDate,
          reason: reason || 'Admin skip',
          shift,
          skippedBy: 'admin'
        });
      }
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: `Meals skipped for ${dates.length} date(s)`,
      data: subscription.skipMeals
    });

  } catch (error) {
    console.error('Error skipping meals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip meals',
      error: error.message
    });
  }
};

/**
 * @desc    Admin customize meal for user
 * @route   POST /api/admin/daily-deliveries/:subscriptionId/customize
 * @access  Private (Admin only)
 */
exports.adminCustomizeMeal = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const customizationData = req.body;

    // Validate subscription exists
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Create or update meal customization
    const customization = await MealCustomization.findOneAndUpdate(
      {
        subscriptionId: subscriptionId,
        date: {
          $gte: moment(customizationData.date).startOf('day').toDate(),
          $lt: moment(customizationData.date).endOf('day').toDate()
        }
      },
      {
        ...customizationData,
        subscriptionId,
        customizedBy: 'admin'
      },
      { 
        new: true, 
        upsert: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Meal customization saved successfully',
      data: customization
    });

  } catch (error) {
    console.error('Error customizing meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to customize meal',
      error: error.message
    });
  }
};

/**
 * @desc    Update delivery status
 * @route   PUT /api/admin/daily-deliveries/:trackingId/status
 * @access  Private (Admin only)
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { status, notes, driverId, estimatedTime, actualTime } = req.body;

    // Find subscription with the delivery tracking
    const subscription = await Subscription.findOne({
      'deliveryTracking._id': trackingId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Delivery tracking not found'
      });
    }

    // Update the specific tracking entry
    const trackingEntry = subscription.deliveryTracking.id(trackingId);
    if (trackingEntry) {
      trackingEntry.status = status || trackingEntry.status;
      trackingEntry.notes = notes || trackingEntry.notes;
      trackingEntry.driverId = driverId || trackingEntry.driverId;
      trackingEntry.estimatedDeliveryTime = estimatedTime || trackingEntry.estimatedDeliveryTime;
      
      if (status === 'delivered' && !trackingEntry.actualDeliveryTime) {
        trackingEntry.actualDeliveryTime = new Date();
      } else if (actualTime) {
        trackingEntry.actualDeliveryTime = actualTime;
      }

      await subscription.save();
    }

    res.status(200).json({
      success: true,
      message: 'Delivery status updated successfully',
      data: trackingEntry
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery status',
      error: error.message
    });
  }
};

/**
 * @desc    Get delivery details
 * @route   GET /api/admin/daily-deliveries/:trackingId
 * @access  Private (Admin only)
 */
exports.getDeliveryDetails = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const subscription = await Subscription.findOne({
      'deliveryTracking._id': trackingId
    })
    .populate('userId', 'name phone email deliveryAddress')
    .populate('mealPlanId', 'name description price type shift')
    .populate('sellerId', 'businessName name');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    const trackingEntry = subscription.deliveryTracking.id(trackingId);

    res.status(200).json({
      success: true,
      data: {
        tracking: trackingEntry,
        subscription: subscription,
        user: subscription.userId,
        mealPlan: subscription.mealPlanId,
        seller: subscription.sellerId
      }
    });

  } catch (error) {
    console.error('Error fetching delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery details',
      error: error.message
    });
  }
};

/**
 * @desc    Get delivery statistics
 * @route   GET /api/admin/daily-deliveries/stats
 * @access  Private (Admin only)
 */
exports.getDeliveryStats = async (req, res) => {
  try {
    const { date, zone = 'all' } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const targetDate = parseIndianDate(date);

    // Build aggregation pipeline for stats
    const pipeline = [
      {
        $match: {
          isActive: true,
          startDate: { $lte: targetDate },
          $or: [
            { endDate: { $gte: targetDate } },
            { endDate: null }
          ]
        }
      },
      {
        $unwind: '$deliveryTracking'
      },
      {
        $match: {
          'deliveryTracking.date': {
            $gte: moment(targetDate).startOf('day').toDate(),
            $lt: moment(targetDate).endOf('day').toDate()
          },
          ...(zone !== 'all' && { 'deliveryTracking.zone': zone })
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          pendingDeliveries: {
            $sum: { $cond: [{ $eq: ['$deliveryTracking.status', 'pending'] }, 1, 0] }
          },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ['$deliveryTracking.status', 'delivered'] }, 1, 0] }
          },
          morningDeliveries: {
            $sum: { $cond: [{ $eq: ['$deliveryTracking.shift', 'morning'] }, 1, 0] }
          },
          eveningDeliveries: {
            $sum: { $cond: [{ $eq: ['$deliveryTracking.shift', 'evening'] }, 1, 0] }
          }
        }
      }
    ];

    const [stats] = await Subscription.aggregate(pipeline);

    const result = {
      total: stats?.totalDeliveries || 0,
      pending: stats?.pendingDeliveries || 0,
      delivered: stats?.deliveredCount || 0,
      morning: stats?.morningDeliveries || 0,
      evening: stats?.eveningDeliveries || 0,
      successRate: stats?.totalDeliveries > 0 
        ? Math.round((stats.deliveredCount / stats.totalDeliveries) * 100)
        : 0
    };

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery stats',
      error: error.message
    });
  }
};

/**
 * @desc    Get delivery filters (zones, drivers, sellers, etc.)
 * @route   GET /api/admin/daily-deliveries/filters
 * @access  Private (Admin only)
 */
exports.getDeliveryFilters = async (req, res) => {
  try {
    // Get unique zones
    const zones = await Subscription.distinct('zone', { isActive: true });

    // Get active drivers
    const drivers = await User.find({ role: 'driver', isActive: true })
      .select('name email')
      .lean();

    // Get active sellers
    const sellers = await User.find({ role: 'seller', isActive: true })
      .select('businessName name')
      .lean();

    // Get meal plans
    const mealPlans = await MealPlan.find({ isActive: true })
      .select('name type shift price')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        zones: ['all', ...zones.filter(z => z)],
        drivers: [
          { _id: 'all', name: 'All Drivers' },
          ...drivers
        ],
        sellers: [
          { _id: 'all', name: 'All Sellers' },
          ...sellers
        ],
        mealPlans: [
          { _id: 'all', name: 'All Meal Plans' },
          ...mealPlans
        ],
        priceRanges: [
          { value: 'all', label: 'All Prices' },
          { value: '0-100', label: '₹0 - ₹100' },
          { value: '100-200', label: '₹100 - ₹200' },
          { value: '200-300', label: '₹200 - ₹300' },
          { value: '300-500', label: '₹300 - ₹500' },
          { value: '500-1000', label: '₹500+' }
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching delivery filters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery filters',
      error: error.message
    });
  }
};

/**
 * @desc    Test endpoint to verify controller is working
 * @route   GET /api/admin/deliveries/test
 * @access  Public (for testing)
 */
exports.testAdminDelivery = async (req, res) => {
  try {
    console.log('🎯 Test admin delivery endpoint called');
    res.status(200).json({
      success: true,
      message: 'Admin delivery controller is working!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed',
      error: error.message
    });
  }
};