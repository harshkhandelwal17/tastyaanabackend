const LaundrySubscription = require('../models/LaundrySubscription');
const LaundryVendor = require('../models/LaundryVendor');

// @desc    Create subscription
// @route   POST /api/laundry/subscriptions
// @access  Private
exports.createSubscription = async (req, res) => {
  try {
    const {
      vendorId,
      planId,
      startDate,
      preferences,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Validate vendor
    const vendor = await LaundryVendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (!vendor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is currently inactive. Please choose another vendor.'
      });
    }

    // Find plan
    if (!vendor.subscriptionPlans || vendor.subscriptionPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No subscription plans available for this vendor'
      });
    }

    const plan = vendor.subscriptionPlans.find(p => p.id === planId || p.id?.toString() === planId?.toString());
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found. Please select a valid plan.'
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This plan is currently inactive. Please select another plan.'
      });
    }

    // Check if user already has active subscription with this vendor
    const existingSubscription = await LaundrySubscription.findOne({
      user: req.user._id,
      vendor: vendorId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription with this vendor'
      });
    }

    // Calculate dates
    // Handle both date string and Date object
    // Default to today if not provided
    let start;
    if (startDate) {
      start = new Date(startDate);
      // Set to start of day for comparison
      start.setHours(0, 0, 0, 0);
    } else {
      start = new Date();
      start.setHours(0, 0, 0, 0);
    }
    
    // Ensure start date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) {
      // If past date provided, default to today
      start = new Date();
      start.setHours(0, 0, 0, 0);
    }
    
    // Calculate end date based on plan schedule (weekly or monthly)
    const end = new Date(start);
    const schedule = plan.schedule || {};
    if (schedule.frequencyType === 'weekly') {
      // For weekly plans, end date is 4 weeks (1 month) from start
      end.setMonth(end.getMonth() + 1);
    } else {
      // For monthly plans, end date is 1 month from start
      end.setMonth(end.getMonth() + 1);
    }
    const nextRenewal = new Date(end);

    // Create subscription
    const subscription = await LaundrySubscription.create({
      user: req.user._id,
      vendor: vendorId,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        maxWeight: plan.maxWeight || null,
        features: {
          unlimitedPickups: plan.features?.unlimitedPickups || false,
          services: plan.features?.services || [],
          freeDryClean: plan.features?.freeDryClean || 0,
          freeExpressService: plan.features?.freeExpressService || 0,
          quickServiceQuota: plan.features?.quickServiceQuota || 0,
          quickServiceDiscount: plan.features?.quickServiceDiscount || 0,
          shoeCleaningFree: plan.features?.shoeCleaningFree || 0,
          turnaroundTime: plan.features?.turnaroundTime || '48 hours',
          priority: plan.features?.priority || false,
          vipSupport: plan.features?.vipSupport || false
        }
      },
      period: {
        startDate: start,
        endDate: end,
        nextRenewalDate: nextRenewal
      },
      usage: {
        currentMonth: {
          weightUsed: 0,
          weightRemaining: plan.maxWeight || null, // null means unlimited
          pickupsCompleted: 0,
          itemsCleaned: 0,
          dryCleanUsed: 0,
          dryCleanRemaining: plan.features?.freeDryClean || 0,
          expressServiceUsed: 0,
          expressServiceRemaining: plan.features?.freeExpressService || 0,
          quickServicesUsed: 0,
          quickServicesRemaining: plan.features?.quickServiceQuota || 0,
          orders: []
        },
        history: []
      },
      preferences: preferences || {},
      billing: {
        autoRenewal: true,
        paymentMethod: paymentMethod || 'upi',
        lastPayment: {
          amount: plan.price,
          date: new Date(),
          status: 'pending' // Will be updated after payment confirmation
        },
        nextPayment: {
          amount: plan.price,
          dueDate: nextRenewal
        }
      }
    });

    // Update vendor stats (initialize if not exists)
    if (!vendor.activeSubscriptions) {
      vendor.activeSubscriptions = 0;
    }
    vendor.activeSubscriptions += 1;
    await vendor.save();

    // Populate subscription with vendor and user details for response
    const populatedSubscription = await LaundrySubscription.findById(subscription._id)
      .populate('vendor', 'name logo phone rating')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: populatedSubscription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message
    });
  }
};

// @desc    Get user subscriptions
// @route   GET /api/laundry/subscriptions
// @access  Private
exports.getUserSubscriptions = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    const subscriptions = await LaundrySubscription.find(query)
      .populate('vendor', 'name logo rating phone address quickServiceConfig')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};

// @desc    Get single subscription
// @route   GET /api/laundry/subscriptions/:id
// @access  Private
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await LaundrySubscription.findById(req.params.id)
      .populate('vendor', 'name logo rating phone address quickServiceConfig')
      .populate('usage.currentMonth.orders', 'orderNumber status deliverySpeed createdAt');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Calculate remaining usage
    subscription.calculateRemaining();

    res.status(200).json({
      success: true,
      data: subscription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message
    });
  }
};

// @desc    Get subscription usage stats
// @route   GET /api/laundry/subscriptions/:id/usage
// @access  Private
exports.getSubscriptionUsage = async (req, res) => {
  try {
    const subscription = await LaundrySubscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    subscription.calculateRemaining();

    const usageStats = {
      currentMonth: subscription.usage.currentMonth,
      history: subscription.usage.history,
      plan: {
        name: subscription.plan.name,
        maxWeight: subscription.plan.maxWeight,
        features: subscription.plan.features
      },
      utilizationPercentage: subscription.plan.maxWeight 
        ? Math.round((subscription.usage.currentMonth.weightUsed / subscription.plan.maxWeight) * 100)
        : 0
    };

    res.status(200).json({
      success: true,
      data: usageStats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching usage',
      error: error.message
    });
  }
};

// @desc    Update subscription preferences
// @route   PATCH /api/laundry/subscriptions/:id/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    const subscription = await LaundrySubscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    subscription.preferences = {
      ...subscription.preferences,
      ...req.body
    };

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: subscription.preferences
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
      error: error.message
    });
  }
};

// @desc    Pause subscription
// @route   POST /api/laundry/subscriptions/:id/pause
// @access  Private
exports.pauseSubscription = async (req, res) => {
  try {
    const { reason } = req.body;
    const subscription = await LaundrySubscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active subscriptions can be paused'
      });
    }

    subscription.status = 'paused';
    subscription.pauseHistory = subscription.pauseHistory || [];
    subscription.pauseHistory.push({
      pausedAt: new Date(),
      reason: reason || 'User request'
    });

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription paused successfully',
      data: subscription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error pausing subscription',
      error: error.message
    });
  }
};

// @desc    Resume subscription
// @route   POST /api/laundry/subscriptions/:id/resume
// @access  Private
exports.resumeSubscription = async (req, res) => {
  try {
    const subscription = await LaundrySubscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (subscription.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Only paused subscriptions can be resumed'
      });
    }

    subscription.status = 'active';
    
    // Update pause history
    if (subscription.pauseHistory && subscription.pauseHistory.length > 0) {
      const lastPause = subscription.pauseHistory[subscription.pauseHistory.length - 1];
      if (lastPause && !lastPause.resumedAt) {
        lastPause.resumedAt = new Date();
        const daysPaused = Math.ceil((lastPause.resumedAt - lastPause.pausedAt) / (1000 * 60 * 60 * 24));
        lastPause.daysExtended = daysPaused;
        
        // Extend end date by days paused
        if (subscription.period && subscription.period.endDate) {
          const newEndDate = new Date(subscription.period.endDate);
          newEndDate.setDate(newEndDate.getDate() + daysPaused);
          subscription.period.endDate = newEndDate;
          subscription.period.nextRenewalDate = newEndDate;
        }
      }
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription resumed successfully',
      data: subscription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resuming subscription',
      error: error.message
    });
  }
};

// @desc    Cancel subscription
// @route   POST /api/laundry/subscriptions/:id/cancel
// @access  Private
exports.cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;
    const subscription = await LaundrySubscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already cancelled'
      });
    }

    subscription.status = 'cancelled';
    subscription.cancellation = {
      reason: reason || 'User request',
      cancelledAt: new Date(),
      refundStatus: 'pending'
    };

    // Update vendor stats
    const vendor = await LaundryVendor.findById(subscription.vendor);
    if (vendor && vendor.activeSubscriptions > 0) {
      vendor.activeSubscriptions = Math.max(0, vendor.activeSubscriptions - 1);
      await vendor.save();
    }

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

// @desc    Toggle auto-renewal
// @route   PATCH /api/laundry/subscriptions/:id/auto-renewal
// @access  Private
exports.toggleAutoRenewal = async (req, res) => {
  try {
    const subscription = await LaundrySubscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    subscription.billing.autoRenewal = !subscription.billing.autoRenewal;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: `Auto-renewal ${subscription.billing.autoRenewal ? 'enabled' : 'disabled'}`,
      data: subscription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling auto-renewal',
      error: error.message
    });
  }
};

// @desc    Get vendor subscriptions (for vendor dashboard)
// @route   GET /api/laundry/vendors/me/subscriptions
// @access  Private (Vendor)
exports.getVendorSubscriptions = async (req, res) => {
  try {
    // Find vendor by user
    const vendor = await LaundryVendor.findOne({ 
      $or: [
        { createdBy: req.user._id },
        { createdBy: req.user._id?.toString() },
        { email: req.user.email },
        { phone: req.user.phone }
      ]
    });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const { status } = req.query;
    const query = { vendor: vendor._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const subscriptions = await LaundrySubscription.find(query)
      .populate('user', 'name email phone')
      .populate('usage.currentMonth.orders', 'orderNumber status deliverySpeed createdAt pricing')
      .sort('-createdAt');

    // Calculate summary stats
    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'active').length,
      paused: subscriptions.filter(s => s.status === 'paused').length,
      cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
      expired: subscriptions.filter(s => s.status === 'expired').length,
      totalRevenue: subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.plan?.price || 0), 0)
    };

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      stats,
      data: subscriptions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor subscriptions',
      error: error.message
    });
  }
};

// @desc    Get single subscription for vendor
// @route   GET /api/laundry/vendors/me/subscriptions/:id
// @access  Private (Vendor)
exports.getVendorSubscription = async (req, res) => {
  try {
    const vendor = await LaundryVendor.findOne({ 
      $or: [
        { createdBy: req.user._id },
        { createdBy: req.user._id?.toString() },
        { email: req.user.email },
        { phone: req.user.phone }
      ]
    });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found'
      });
    }

    const subscription = await LaundrySubscription.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('vendor', 'name logo phone rating')
      .populate('usage.currentMonth.orders', 'orderNumber status deliverySpeed createdAt pricing items schedule');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Verify subscription belongs to this vendor
    if (subscription.vendor._id.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this subscription'
      });
    }

    // Calculate remaining usage
    subscription.calculateRemaining();

    res.status(200).json({
      success: true,
      data: subscription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message
    });
  }
};
