const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const MealPlan = require('../models/MealPlan');
const DailyMeal = require('../models/DailyMeal');
const DailyOrder = require('../models/DailyOrder');
const MealCustomization = require('../models/MealCustomization');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create a new subscription
 * @route   POST /api/v2/subscriptions
 * @access  Private
 */
exports.createSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      mealPlanId,
      planType,
      duration,
      deliveryTiming,
      selectedAddOns = [],
      customizations = {},
      dietaryPreference = 'vegetarian',
      deliveryAddress,
      startDate,
      autoRenewal = true,
      pricing
    } = req.body;

    const userId = req.user.id;

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'pending_payment'] }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription. Please cancel or complete your existing subscription first.',
        data: {
          existingSubscription: {
            id: existingSubscription._id,
            status: existingSubscription.status,
            startDate: existingSubscription.startDate,
            endDate: existingSubscription.endDate
          }
        }
      });
    }

    // Validate meal plan
    const mealPlan = await MealPlan.findById(mealPlanId).session(session);
    if (!mealPlan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Calculate meals per day based on delivery timing
    const mealsPerDay = (deliveryTiming.morning.enabled ? 1 : 0) + 
                       (deliveryTiming.evening.enabled ? 1 : 0);
    
    if (mealsPerDay === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'At least one meal timing must be selected'
      });
    }

    // Calculate subscription dates
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(duration));

    // Calculate pricing
    const calculatedPricing = await calculateSubscriptionPricing({
      mealPlan,
      planType,
      duration,
      mealsPerDay,
      selectedAddOns,
      customizations,
      deliveryAddress,
      pricing // Use provided pricing or calculate
    });

    // Create subscription
    const subscription = new Subscription({
      user: userId,
      subscriptionId: `SUB_${uuidv4().slice(0, 8).toUpperCase()}`,
      mealPlan: mealPlanId,
      defaultMeal: mealPlanId, // Set default meal
      planType,
      duration: parseInt(duration),
      deliverySettings: {
        startDate: start,
        startShift: deliveryTiming?.startShift || 'evening',
        deliveryDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        deliveryTiming: deliveryTiming,
        timezone: 'Asia/Kolkata'
      },
      mealCounts: {
        totalMeals: calculatedPricing.totalMeals || 0,
        delivered: 0,
        skipped: 0,
        remaining: calculatedPricing.totalMeals || 0
      },
      pricing: calculatedPricing,
      selectedAddOns,
      customizations: [], // Will be populated with customizations
      customizationPreferences: {
        dietaryPreference: dietaryPreference || 'vegetarian',
        preferences: [],
        notes: ''
      },
      customizationHistory: [],
      permanentCustomization: {
        isActive: false,
        mealPlan: null,
        addOns: [],
        extraItems: [],
        preferences: {
          dietaryPreference: dietaryPreference || 'vegetarian',
          customOptions: [],
          spiceLevel: 'medium',
          specialInstructions: '',
          noOnion: false,
          noGarlic: false
        }
      },
      deliveryAddress,
      autoRenewal,
      status: 'pending_payment',
      paymentStatus: 'pending',
      startDate: start,
      endDate: end,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await subscription.save({ session });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(calculatedPricing.finalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `sub_${subscription.subscriptionId}_${Date.now()}`,
      notes: {
        subscriptionId: subscription._id.toString(),
        userId: userId.toString(),
        type: 'subscription_payment',
        mealPlanId: mealPlanId.toString(),
        duration: duration.toString()
      }
    });

    // Update subscription with Razorpay order ID
    subscription.razorpayOrderId = razorpayOrder.id;
    await subscription.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully. Please complete the payment.',
      data: {
        subscription: {
          id: subscription._id,
          subscriptionId: subscription.subscriptionId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          pricing: subscription.pricing
        },
        payment: {
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
};

/**
 * @desc    Get subscription details
 * @route   GET /api/v2/subscriptions/:id
 * @access  Private
 */
exports.getSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      _id: id,
      user: userId
    })
    .populate('defaultMeal', 'name description price image')
    .populate('mealPlan', 'name description price image')
    .populate('customizations');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get upcoming deliveries (next 7 days)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const deliveries = await DailyOrder.find({
      subscription: subscription._id,
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    }).sort({ date: 1 });

    // Format response
    const response = {
      id: subscription._id,
      subscriptionId: subscription.subscriptionId,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenewal: subscription.autoRenewal,
      deliveryTiming: subscription.deliveryTiming,
      deliveryAddress: subscription.deliveryAddress,
      pricing: subscription.pricing,
      defaultMeal: subscription.defaultMeal,
      customizations: subscription.customizations,
      upcomingDeliveries: deliveries,
      mealPreferences: subscription.defaultMealPreferences,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    logger.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message
    });
  }
};

/**
 * @desc    Update subscription
 * @route   PUT /api/v2/subscriptions/:id
 * @access  Private
 */
exports.updateSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Find subscription
    const subscription = await Subscription.findOne({
      _id: id,
      user: userId
    }).session(session);

    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = [
      'deliveryTiming',
      'deliveryAddress',
      'autoRenewal',
      'defaultMealPreferences',
      'status'
    ];

    // Apply updates
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        subscription[key] = updateData[key];
      }
    });

    // Recalculate pricing if delivery timing changed
    if (updateData.deliveryTiming) {
      const mealsPerDay = (updateData.deliveryTiming.morning.enabled ? 1 : 0) + 
                         (updateData.deliveryTiming.evening.enabled ? 1 : 0);
      
      if (mealsPerDay === 0) {
        throw new Error('At least one meal timing must be enabled');
      }

      // Recalculate pricing based on new delivery timing
      const pricing = await calculateSubscriptionPricing({
        mealPlan: await MealPlan.findById(subscription.mealPlan).session(session),
        planType: subscription.planType,
        duration: subscription.duration,
        mealsPerDay,
        selectedAddOns: subscription.selectedAddOns,
        customizations: subscription.customizations,
        deliveryAddress: subscription.deliveryAddress,
        pricing: subscription.pricing
      });

      subscription.pricing = pricing;
    }

    subscription.updatedAt = new Date();
    await subscription.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: subscription
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel subscription
 * @route   DELETE /api/v2/subscriptions/:id
 * @access  Private
 */
exports.cancelSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason, refundAmount } = req.body;
    const userId = req.user.id;

    // Find subscription
    const subscription = await Subscription.findOne({
      _id: id,
      user: userId,
      status: { $in: ['active', 'paused'] }
    }).session(session);

    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found or already cancelled'
      });
    }

    // Update subscription status
    subscription.status = 'cancelled';
    subscription.cancellationDate = new Date();
    subscription.cancellationReason = reason || 'User requested cancellation';
    subscription.updatedAt = new Date();

    // Process refund if applicable
    if (refundAmount && refundAmount > 0) {
      // TODO: Implement refund logic using Razorpay
      subscription.refundAmount = refundAmount;
      subscription.refundStatus = 'pending';
    }

    await subscription.save({ session });
    
    // Cancel any pending customizations
    await MealCustomization.updateMany(
      {
        subscription: subscription._id,
        status: { $in: ['pending', 'confirmed'] },
        date: { $gte: new Date() }
      },
      { 
        $set: { 
          status: 'cancelled',
          cancellationReason: 'Subscription cancelled',
          updatedAt: new Date()
        } 
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // TODO: Send cancellation email/notification

    res.json({
      success: true,
      message: 'Subscription has been cancelled successfully',
      data: {
        subscriptionId: subscription._id,
        status: subscription.status,
        cancellationDate: subscription.cancellationDate,
        refundAmount: subscription.refundAmount,
        refundStatus: subscription.refundStatus
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
};

/**
 * @desc    Pause subscription
 * @route   POST /api/v2/subscriptions/:id/pause
 * @access  Private
 */
exports.pauseSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;
    const userId = req.user.id;

    // Validate dates
    const pauseStart = new Date(startDate);
    const pauseEnd = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pauseStart < today) {
      throw new Error('Pause start date cannot be in the past');
    }

    if (pauseEnd <= pauseStart) {
      throw new Error('Pause end date must be after start date');
    }

    // Find subscription
    const subscription = await Subscription.findOne({
      _id: id,
      user: userId,
      status: 'active'
    }).session(session);

    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found'
      });
    }

    // Check for existing pauses that overlap
    const hasOverlappingPause = subscription.pausePeriods.some(period => {
      return (
        (pauseStart >= period.startDate && pauseStart <= period.endDate) ||
        (pauseEnd >= period.startDate && pauseEnd <= period.endDate) ||
        (pauseStart <= period.startDate && pauseEnd >= period.endDate)
      );
    });

    if (hasOverlappingPause) {
      throw new Error('Overlapping pause period already exists');
    }

    // Add pause period
    subscription.pausePeriods.push({
      startDate: pauseStart,
      endDate: pauseEnd,
      reason: reason || 'User requested pause',
      createdAt: new Date()
    });

    // Extend subscription end date by pause duration
    const pauseDuration = Math.ceil((pauseEnd - pauseStart) / (1000 * 60 * 60 * 24));
    subscription.endDate = new Date(subscription.endDate.getTime() + (pauseDuration * 24 * 60 * 60 * 1000));
    
    // If pausing immediately, update status
    if (pauseStart <= today) {
      subscription.status = 'paused';
      subscription.pauseStartDate = pauseStart;
      subscription.pauseEndDate = pauseEnd;
    }

    subscription.updatedAt = new Date();
    await subscription.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    // TODO: Send pause confirmation email/notification

    res.json({
      success: true,
      message: 'Subscription has been paused successfully',
      data: {
        subscriptionId: subscription._id,
        status: subscription.status,
        pauseStartDate: pauseStart,
        pauseEndDate: pauseEnd,
        newEndDate: subscription.endDate
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error('Error pausing subscription:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to pause subscription',
      error: error.message
    });
  }
};

/**
 * @desc    Resume subscription
 * @route   POST /api/v2/subscriptions/:id/resume
 * @access  Private
 */
exports.resumeSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find subscription
    const subscription = await Subscription.findOne({
      _id: id,
      user: userId,
      status: 'paused'
    }).session(session);

    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Paused subscription not found'
      });
    }

    // Update subscription status
    subscription.status = 'active';
    subscription.pauseEndDate = new Date();
    subscription.updatedAt = new Date();
    
    // Update any active pause periods that include today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    subscription.pausePeriods = subscription.pausePeriods.map(period => {
      if (period.endDate > today && !period.endedAt) {
        return {
          ...period.toObject(),
          endDate: today,
          endedAt: new Date(),
          resumeReason: 'User requested resume'
        };
      }
      return period;
    });

    await subscription.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    // TODO: Send resume confirmation email/notification

    res.json({
      success: true,
      message: 'Subscription has been resumed successfully',
      data: {
        subscriptionId: subscription._id,
        status: subscription.status,
        resumeDate: new Date()
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    logger.error('Error resuming subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume subscription',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's active subscription
 * @route   GET /api/v2/subscriptions/active
 * @access  Private
 */
exports.getActiveSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'paused'] }
    })
    .populate('defaultMeal', 'name description price image')
    .populate('mealPlan', 'name description price image')
    .populate({
      path: 'customizations',
      match: { status: { $in: ['pending', 'confirmed'] } },
      options: { sort: { createdAt: -1 } },
      populate: [
        { path: 'baseMeal', select: 'name description price image' },
        { path: 'replacementMeal', select: 'name description price image' }
      ]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Get upcoming deliveries (next 7 days)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const deliveries = await DailyOrder.find({
      subscription: subscription._id,
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    })
    .sort({ date: 1, shift: 1 })
    .populate('items.mealPlan', 'name description price image')
    .populate('items.customizationId');

    // Format response
    const response = {
      id: subscription._id,
      subscriptionId: subscription.subscriptionId,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenewal: subscription.autoRenewal,
      deliveryTiming: subscription.deliveryTiming,
      deliveryAddress: subscription.deliveryAddress,
      pricing: subscription.pricing,
      defaultMeal: subscription.defaultMeal,
      customizations: subscription.customizations,
      upcomingDeliveries: deliveries,
      mealPreferences: subscription.defaultMealPreferences,
      pausePeriods: subscription.pausePeriods,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    logger.error('Error fetching active subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active subscription',
      error: error.message
    });
  }
};

/**
 * Helper function to calculate subscription pricing
 */
async function calculateSubscriptionPricing({
  mealPlan,
  planType,
  duration,
  mealsPerDay,
  selectedAddOns = [],
  customizations = {},
  deliveryAddress,
  pricing = {}
}) {
  // If pricing is provided and marked as final, use it
  if (pricing.finalAmount && pricing.isFinal) {
    return {
      ...pricing,
      calculatedAt: new Date()
    };
  }

  // Calculate base price based on plan type and duration
  let basePrice = 0;
  let totalMeals = 0;
  
  if (planType === 'daily') {
    basePrice = mealPlan.prices.daily || 0;
    totalMeals = 1 * mealsPerDay;
  } else if (planType === 'weekly') {
    basePrice = mealPlan.prices.weekly || 0;
    totalMeals = 7 * mealsPerDay;
  } else if (planType === 'monthly') {
    basePrice = mealPlan.prices.monthly || 0;
    totalMeals = 30 * mealsPerDay; // Assuming 30 days for a month
  } else if (planType === 'custom' && duration) {
    // For custom durations, calculate based on daily rate
    const dailyRate = mealPlan.prices.daily || 0;
    basePrice = dailyRate * duration * mealsPerDay;
    totalMeals = duration * mealsPerDay;
  }

  // Calculate add-ons price
  const addOnsPrice = selectedAddOns.reduce((total, addOn) => {
    return total + (addOn.price * (addOn.quantity || 1));
  }, 0);

  // Calculate customizations price (if any)
  let customizationPrice = 0;
  if (customizations.morning && customizations.morning.isCustomized) {
    customizationPrice += customizations.morning.extraPrice || 0;
  }
  if (customizations.evening && customizations.evening.isCustomized) {
    customizationPrice += customizations.evening.extraPrice || 0;
  }

  // Calculate delivery charges based on address (simplified)
  // In a real app, this would integrate with a delivery service
  let deliveryCharge = 0;
  if (deliveryAddress && deliveryAddress.distanceInKm > 5) {
    // Example: ₹10 per km after 5km
    deliveryCharge = (deliveryAddress.distanceInKm - 5) * 10;
  }

  // Calculate subtotal
  const subtotal = basePrice + addOnsPrice + customizationPrice + deliveryCharge;
  
  // Calculate taxes (GST 5%)
  const gst = subtotal * 0.05;
  
  // Calculate final amount
  const finalAmount = subtotal + gst;

  return {
    basePrice,
    planType,
    duration,
    mealsPerDay,
    totalMeals,
    addOnsPrice,
    customizationPrice,
    deliveryCharge,
    subtotal,
    gst,
    finalAmount,
    currency: 'INR',
    calculatedAt: new Date(),
    isFinal: false
  };
}

/**
 * Helper function to validate subscription dates
 */
function validateSubscriptionDates(startDate, endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  // Start date cannot be in the past (except today)
  if (start < today) {
    throw new Error('Start date cannot be in the past');
  }
  
  // End date must be after start date
  if (end <= start) {
    throw new Error('End date must be after start date');
  }
  
  // Subscription cannot be longer than 1 year
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (end > oneYearFromNow) {
    throw new Error('Subscription cannot be longer than 1 year');
  }
  
  return { start, end };
}

/**
 * @desc    Get all subscriptions for seller
 * @route   GET /api/v2/seller/subscriptions
 * @access  Private/Seller
 */
exports.getSellerSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 100, status } = req.query;
    // const skip = (page - 1) * limit;
    
    // Get seller's meal plans
    const mealPlans = await MealPlan.find({ seller: req.user.id }).select('_id');
    const mealPlanIds = mealPlans.map(plan => plan._id);
    
    // Build query
const query = { 
  mealPlan: { $in: mealPlanIds }, 
  // seller: req.user.id 
};

    if (status) {
      query.status = status;
    }
    // console.log("query is  : ",query);
    
    // Get subscriptions with pagination
    const subscriptions = await Subscription.find(query)
      .populate('user', 'name email phone')
      .populate('mealPlan', 'name description')
      .sort({ createdAt: -1 })
      // .skip(skip)
      .limit(parseInt(limit));
    // console.log("subscrition : ",subscriptions);
    // Get total count for pagination
    const total = await Subscription.countDocuments(query);
    
    res.json({
      success: true,
      count: subscriptions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: subscriptions
    });
    
  } catch (error) {
    console.error('Error getting seller subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get subscription statistics for seller dashboard
 * @route   GET /api/v2/seller/subscriptions/stats
 * @access  Private/Seller
 */
exports.getSellerSubscriptionStats = async (req, res) => {
  try {
    // Get seller's meal plans
    const mealPlans = await MealPlan.find({ seller: req.user.id }).select('_id');
    const mealPlanIds = mealPlans.map(plan => plan._id);
    
    // Get counts by status
    const [total, active, paused, cancelled] = await Promise.all([
      Subscription.countDocuments({ mealPlan: { $in: mealPlanIds } }),
      Subscription.countDocuments({ 
        mealPlan: { $in: mealPlanIds },
        status: 'active' 
      }),
      Subscription.countDocuments({ 
        mealPlan: { $in: mealPlanIds },
        status: 'paused' 
      }),
      Subscription.countDocuments({ 
        mealPlan: { $in: mealPlanIds },
        status: 'cancelled' 
      })
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        active,
        paused,
        cancelled
      }
    });
    
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get upcoming deliveries for seller
 * @route   GET /api/v2/seller/subscriptions/deliveries/upcoming
 * @access  Private/Seller
 */
exports.getUpcomingDeliveries = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + parseInt(days));
    
    // Get seller's meal plans
    const mealPlans = await MealPlan.find({ seller: req.user.id }).select('_id');
    const mealPlanIds = mealPlans.map(plan => plan._id);
    
    // Find upcoming deliveries
    const deliveries = await DailyOrder.find({
      'subscription.mealPlan': { $in: mealPlanIds },
      deliveryDate: { $gte: startDate, $lte: endDate },
      status: { $nin: ['delivered', 'cancelled'] }
    })
    .populate('subscription', 'user mealPlan')
    .populate('subscription.user', 'name phone')
    .populate('subscription.mealPlan', 'name')
    .sort({ deliveryDate: 1 });
    
    res.json({
      success: true,
      count: deliveries.length,
      data: deliveries
    });
    
  } catch (error) {
    console.error('Error getting upcoming deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get delivery history for seller
 * @route   GET /api/v2/seller/subscriptions/deliveries/history
 * @access  Private/Seller
 */
exports.getDeliveryHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    
    // Get seller's meal plans
    const mealPlans = await MealPlan.find({ seller: req.user.id }).select('_id');
    const mealPlanIds = mealPlans.map(plan => plan._id);
    
    // Build date range query
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
    
    // Build main query
    const query = {
      'subscription.mealPlan': { $in: mealPlanIds },
      status: { $in: ['delivered', 'cancelled'] }
    };
    
    if (Object.keys(dateQuery).length > 0) {
      query.deliveryDate = dateQuery;
    }
    
    // Get deliveries with pagination
    const deliveries = await DailyOrder.find(query)
      .populate('subscription', 'user mealPlan')
      .populate('subscription.user', 'name')
      .populate('subscription.mealPlan', 'name')
      .sort({ deliveryDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await DailyOrder.countDocuments(query);
    
    res.json({
      success: true,
      count: deliveries.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: deliveries
    });
    
  } catch (error) {
    console.error('Error getting delivery history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a subscription (admin/seller)
 * @route   DELETE /api/v2/seller/subscriptions/:id
 * @access  Private/Seller
 */
exports.deleteSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    // Find the subscription
    const subscription = await Subscription.findOne({
      _id: id,
      'mealPlan.seller': sellerId
    }).session(session);

    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Subscription not found or not authorized'
      });
    }

    // Check if subscription can be deleted
    if (subscription.status === 'active') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active subscription. Please cancel it first.'
      });
    }

    // Delete related daily orders
    await DailyOrder.deleteMany({
      subscription: subscription._id,
      status: { $ne: 'delivered' }
    }).session(session);

    // Delete the subscription
    await Subscription.deleteOne({ _id: id }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Subscription deleted successfully',
      data: { id: subscription._id }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Delete subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export the controller methods
module.exports = {
  createSubscription: exports.createSubscription,
  getSubscription: exports.getSubscription,
  updateSubscription: exports.updateSubscription,
  cancelSubscription: exports.cancelSubscription,
  pauseSubscription: exports.pauseSubscription,
  resumeSubscription: exports.resumeSubscription,
  getActiveSubscription: exports.getActiveSubscription,
  deleteSubscription: exports.deleteSubscription, // Added deleteSubscription
  // Seller endpoints
  getSellerSubscriptions: exports.getSellerSubscriptions,
  getSellerSubscriptionStats: exports.getSellerSubscriptionStats,
  getUpcomingDeliveries: exports.getUpcomingDeliveries,
  getDeliveryHistory: exports.getDeliveryHistory,
  // Helper functions (for testing)
  _calculateSubscriptionPricing: calculateSubscriptionPricing,
  _validateSubscriptionDates: validateSubscriptionDates
};
