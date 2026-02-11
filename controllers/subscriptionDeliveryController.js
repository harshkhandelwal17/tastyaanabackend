const Subscription = require('../models/Subscription');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

// @desc    Get delivery tracking for a subscription
// @route   GET /api/subscriptions/:subscriptionId/delivery-tracking
// @access  Private
const getDeliveryTracking = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const { startDate, endDate } = req.query;

  const subscription = await Subscription.findOne({
    subscriptionId,
    $or: [
      { user: req.user.id },
      { seller: req.user.id },
      { 'deliveryPerson._id': req.user.id }
    ]
  });

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found or access denied');
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  const tracking = subscription.getDeliveryTracking(start, end);
  
  res.json({
    success: true,
    data: tracking,
    subscriptionId: subscription.subscriptionId,
    user: subscription.user,
    mealPlan: subscription.mealPlan,
    thaliCount: subscription.thaliCount
  });
});

// @desc    Update delivery status for a subscription
// @route   PUT /api/subscriptions/:subscriptionId/delivery-tracking/status
// @access  Private (Seller/Delivery Person)
const updateDeliveryStatus = [
  body('date').isISO8601().toDate(),
  body('shift').isIn(['morning', 'evening']),
  body('status').isIn(['preparing', 'out_for_delivery', 'delivered', 'cancelled']),
  body('notes').optional().isString(),
  
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscriptionId } = req.params;
    const { date, shift, status, notes } = req.body;

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      res.status(404);
      throw new Error('Subscription not found or access denied');
    }

    await subscription.updateDeliveryStatus(date, shift, status, {
      deliveredBy: req.user.id,
      notes
    });

    const updatedSubscription = await Subscription.findOne({ subscriptionId })
      .populate('user', 'name phone')
      .populate('mealPlan', 'name');

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      subscription: updatedSubscription
    });
  })
];

// @desc    Skip a delivery for a subscription
// @route   POST /api/subscriptions/:subscriptionId/delivery-tracking/skip
// @access  Private (User/Seller)
const skipDelivery = [
  body('date').isISO8601().toDate(),
  body('shift').isIn(['morning', 'evening']),
  body('reason').isString().notEmpty(),
  
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscriptionId } = req.params;
    const { date, shift, reason } = req.body;

    const subscription = await Subscription.findOne({
      subscriptionId,
      $or: [
        { user: req.user.id },
        { seller: req.user.id }
      ]
    });

    if (!subscription) {
      res.status(404);
      throw new Error('Subscription not found or access denied');
    }

    // Check if user has enough skips left
    if (subscription.skipSettings && 
        subscription.skipSettings.maxSkipsPerMonth > 0 &&
        subscription.skipSettings.skipsUsedThisMonth >= subscription.skipSettings.maxSkipsPerMonth) {
      res.status(400);
      throw new Error('Maximum number of skips for this month has been reached');
    }

    await subscription.skipDelivery(date, shift, reason);

    // Update skip count
    if (subscription.skipSettings) {
      subscription.skipSettings.skipsUsedThisMonth = (subscription.skipSettings.skipsUsedThisMonth || 0) + 1;
      await subscription.save();
    }

    res.json({
      success: true,
      message: 'Delivery skipped successfully',
      skipsRemaining: subscription.skipSettings ? 
        (subscription.skipSettings.maxSkipsPerMonth - subscription.skipSettings.skipsUsedThisMonth) : 'unlimited'
    });
  })
];

// @desc    Get upcoming deliveries
// @route   GET /api/subscriptions/upcoming-deliveries
// @access  Private (Seller/Delivery Person)
// const getUpcomingDeliveries = asyncHandler(async (req, res) => {
//   const { date, shift, status, page = 1, limit = 100 } = req.query;
//   // const skip = (page - 1) * limit;

//   const query = {
//     status: 'active',
//     'deliveryTracking.status': status || { $in: ['pending', 'preparing', 'out_for_delivery'] }
//   };

//   if (date) {
//     const startDate = new Date(date);
//     startDate.setHours(0, 0, 0, 0);
//     const endDate = new Date(date);
//     endDate.setHours(23, 59, 59, 999);
    
//     query['deliveryTracking.date'] = { $gte: startDate, $lte: endDate };
//   }

//   if (shift) {
//     query['deliveryTracking.shift'] = shift;
//   }

//   const subscriptions = await Subscription.find(query)
//     .populate('user', 'name phone address')
//     .populate('mealPlan', 'name')
//     // .skip(skip)
//     .limit(parseInt(limit));

//   // Flatten the delivery tracking for easier consumption by frontend
//   const deliveries = [];
//   subscriptions.forEach(sub => {
//     sub.deliveryTracking.forEach(delivery => {
//       if ((!date || (delivery.date >= new Date(date).setHours(0, 0, 0, 0) && 
//                      delivery.date <= new Date(date).setHours(23, 59, 59, 999))) &&
//           (!shift || delivery.shift === shift) &&
//           (!status || delivery.status === status)) {
//         deliveries.push({
//           subscriptionId: sub.subscriptionId,
//           user: sub.user,
//           mealPlan: sub.mealPlan,
//           thaliCount: sub.thaliCount,
//           ...delivery.toObject()
//         });
//       }
//     });
//   });

//   // Sort by date and shift
//   deliveries.sort((a, b) => {
//     if (a.date.getTime() === b.date.getTime()) {
//       return a.shift === 'morning' ? -1 : 1;
//     }
//     return a.date - b.date;
//   });

//   res.json({
//     success: true,
//     count: deliveries.length,
//     page: parseInt(page),
//     pages: Math.ceil(deliveries.length / limit),
//     data: deliveries
//   });
// });

const getUpcomingDeliveries = asyncHandler(async (req, res) => {
  console.log('🔍 [getUpcomingDeliveries] Request received with query:', req.query);
  
  try {
    const { 
      date = new Date().toISOString().split('T')[0], 
      shift, 
      status = 'active',
      userId,
      page = 1,
      limit = 10 // Default to 10 items per page if not specified
    } = req.query;
    
    // Validate page and limit
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    if (pageNum < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Page number must be greater than 0' 
      });
    }
    
    if (limitNum < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Limit must be greater than 0' 
      });
    }

    console.log('📅 Processing date:', date);
    const deliveryDate = moment(date).startOf('day').toDate();
    const todayDay = moment(deliveryDate).format('dddd').toLowerCase();
    console.log('📆 Formatted delivery day:', todayDay);

    // Base query
    const query = {
      status: status,
      isActive: true,
      startDate: { $lte: deliveryDate },
      endDate: { $gte: deliveryDate }
    };

    if (userId) {
      query.user = userId;
      console.log('👤 Filtering by user ID:', userId);
    }

    console.log('🔎 Running query with params:', JSON.stringify(query, null, 2));
    const subscriptions = await Subscription.find(query)
      .populate('user', 'name phone address')
      .populate('mealPlan', 'name')
      .lean();

    console.log(`📋 Found ${subscriptions.length} active subscriptions`);

    const validDeliveries = [];
    let skippedCount = 0;
    const skipReasons = {
      paused: 0,
      notDeliveryDay: 0,
      wrongShift: 0,
      noMealsLeft: 0
    };

    for (const [index, sub] of subscriptions.entries()) {
      console.log(`\n🔍 Processing subscription ${index + 1}/${subscriptions.length}:`, sub._id);
      
      // 1. Check pause dates
      const isPaused = sub.pausedDates?.some(pause => 
        moment(deliveryDate).isBetween(
          moment(pause.startDate),
          moment(pause.endDate),
          'day',
          '[]'
        )
      );
      
      if (isPaused) {
        console.log('⏸️  Skipping - Subscription is paused for this date');
        skipReasons.paused++;
        skippedCount++;
        continue;
      }

      // 2. Check delivery days
      const deliversToday = sub.deliverySettings?.deliveryDays?.some(
        d => d.day.toLowerCase() === todayDay
      );
      
      if (!deliversToday) {
        console.log('📅 Skipping - Not a delivery day for this subscription');
        skipReasons.notDeliveryDay++;
        skippedCount++;
        continue;
      }

      // 3. Shift check
      if (shift && sub.shift !== 'both' && sub.shift !== shift) {
        console.log(`🕒 Skipping - Shift doesn't match (sub: ${sub.shift}, requested: ${shift})`);
        skipReasons.wrongShift++;
        skippedCount++;
        continue;
      }

      // 4. Check remaining meals
      if (sub.mealCounts?.mealsRemaining <= 0) {
        console.log('🍽️  Skipping - No meals remaining in subscription');
        skipReasons.noMealsLeft++;
        skippedCount++;
        continue;
      }

      // 5. Check existing delivery status
      const existingDelivery = sub.deliveryTracking?.find(t => 
        moment(t.date).isSame(deliveryDate, 'day') && 
        (shift ? t.shift === shift : true)
      );

      console.log('✅ Valid delivery found, adding to results');
      validDeliveries.push({
        _id: `${sub._id}-${deliveryDate.toISOString().split('T')[0]}-${shift || sub.shift}`,
        subscriptionId: sub._id,
        subscriptionNumber: sub.subscriptionNumber,
        user: sub.user,
        mealPlan: sub.mealPlan,
        deliveryDate,
        shift: shift || sub.shift,
        status: existingDelivery?.status || 'pending',
        thaliCount: sub.thaliCount || 1,
        customizations: existingDelivery?.customizations || [],
        isActive: true,
        deliveredAt: existingDelivery?.deliveredAt,
        deliveredBy: existingDelivery?.deliveredBy,
        notes: existingDelivery?.notes,
        pricing: {
          totalAmount: sub.totalPrice,
          currency: 'INR'
        }
      });
    }

    console.log('\n📊 Delivery Processing Summary:');
    console.log(`- Total subscriptions processed: ${subscriptions.length}`);
    console.log(`- Valid deliveries found: ${validDeliveries.length}`);
    console.log(`- Skipped deliveries: ${skippedCount}`);
    console.log('Skip reasons:', skipReasons);

    // Sort by user name for consistent ordering
    validDeliveries.sort((a, b) => 
      (a.user?.name || '').localeCompare(b.user?.name || '')
    );

    console.log('\n📤 Sending response with', validDeliveries.length, 'deliveries');
    // Apply pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const paginatedData = validDeliveries.slice(startIndex, endIndex);
    const totalPages = Math.ceil(validDeliveries.length / limitNum);

    res.json({
      success: true,
      count: paginatedData.length,
      total: validDeliveries.length,
      page: pageNum,
      pages: totalPages,
      limit: limitNum,
      data: paginatedData,
      debug: process.env.NODE_ENV === 'development' ? {
        queryParams: req.query,
        processedDate: deliveryDate,
        dayOfWeek: todayDay,
        skipReasons,
        totalAvailable: validDeliveries.length
      } : undefined
    });

  } catch (error) {
    console.error('❌ Error in getUpcomingDeliveries:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming deliveries',
      error: error.message,
      debug: {
        query: req.query,
        errorDetails: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          fullError: error.toString()
        } : undefined
      }
    });
  }
});



module.exports = {
  getDeliveryTracking,
  updateDeliveryStatus,
  skipDelivery,
  getUpcomingDeliveries
};
