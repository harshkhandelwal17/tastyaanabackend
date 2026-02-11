const Subscription = require('../models/Subscription');
const User = require('../models/User');
const MealPlan = require('../models/MealPlan');
const { createNotification } = require('../utils/notificationService');
const mongoose = require('mongoose');

// Get all subscriptions with filtering and pagination
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, userId, sellerId } = req.query;
    
    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (userId) {
      query.user = mongoose.Types.ObjectId(userId);
    }
    
    if (sellerId) {
      query.sellerId = mongoose.Types.ObjectId(sellerId);
    }
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { subscriptionId: searchRegex },
        { 'user.name': searchRegex },
        { 'user.email': searchRegex },
        { 'mealPlan.name': searchRegex }
      ];
    }
    
    // Execute query with pagination
    const subscriptions = await Subscription.find(query)
      .populate('user', 'name email phone')
      .populate('sellerId', 'businessName email')
      .populate('mealPlan', 'name description')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    // Get total count for pagination
    const count = await Subscription.countDocuments(query);
    
    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
};

// Get subscription by ID
exports.getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = await Subscription.findById(id)
      .populate('user', 'name email phone')
      .populate('sellerId', 'businessName email')
      .populate('mealPlan', 'name description')
      .lean();
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    res.json({
      success: true,
      data: subscription
    });
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: error.message
    });
  }
};

// Create a new subscription (admin)
exports.createSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { 
      userId, 
      sellerId, 
      mealPlanId, 
      planType, 
      startDate, 
      shift,
      deliveryDays,
      thaliCount = 1,
      isActive = true,
      notes
    } = req.body;
    
    // Validate required fields
    if (!userId || !sellerId || !mealPlanId || !planType || !startDate || !shift || !deliveryDays) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Validate user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Validate seller exists
    const seller = await User.findById(sellerId).session(session);
    if (!seller || seller.role !== 'seller') {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Seller not found or invalid'
      });
    }
    
    // Validate meal plan exists
    const mealPlan = await MealPlan.findById(mealPlanId).session(session);
    if (!mealPlan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }
    
    // Create subscription
    const subscription = new Subscription({
      user: userId,
      sellerId,
      mealPlan: mealPlanId,
      planType,
      startDate: new Date(startDate),
      shift,
      deliveryDays,
      thaliCount,
      isActive,
      status: 'active',
      notes,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
    
    await subscription.save({ session });
    
    // Update user's subscription status
    user.hasActiveSubscription = true;
    user.activeSubscription = subscription._id;
    await user.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Send notification to user
    await createNotification({
      user: userId,
      title: 'New Subscription Created',
      message: `Your ${mealPlan.name} subscription has been created successfully.`,
      type: 'subscription_created',
      relatedId: subscription._id
    });
    
    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedBy: req.user._id };
    
    // Validate input
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID'
      });
    }
    
    // Find and update subscription
    const subscription = await Subscription.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, session }
    ).populate('user', 'name email phone');
    
    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // Get user details for notification
    const user = await User.findById(subscription.user).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Send notification to user about the update
    try {
      await createNotification({
        userId: user._id,
        title: 'Subscription Updated',
        message: 'Your subscription details have been updated.',
        type: 'general',
        data: {
          subscriptionId: subscription._id,
          status: updateData.status || subscription.status,
          actionUrl: `/subscriptions/${subscription._id}`
        },
        channels: {
          inApp: true,
          email: true,
          sms: true
        }
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the request if notification fails
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: subscription
    });
    
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message
    });
  }
};

// Delete subscription
exports.deleteSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    // Find subscription first to get user info
    const subscription = await Subscription.findById(id).session(session);
    
    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // Soft delete by setting isDeleted flag
    subscription.isDeleted = true;
    subscription.deletedAt = new Date();
    subscription.deletedBy = req.user._id;
    await subscription.save({ session });
    
    // Update user's subscription status if this was their active subscription
    if (subscription.user) {
      const user = await User.findById(subscription.user).session(session);
      if (user && user.activeSubscription && user.activeSubscription.equals(subscription._id)) {
        user.hasActiveSubscription = false;
        user.activeSubscription = undefined;
        await user.save({ session });
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    // Send notification to user
    await createNotification({
      user: subscription.user,
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled by the administrator.',
      type: 'subscription_cancelled',
      relatedId: subscription._id
    });
    
    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error deleting subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscription',
      error: error.message
    });
  }
};

// Pause subscription
exports.pauseSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, resumeDate } = req.body;
    
    if (!reason || !resumeDate) {
      return res.status(400).json({
        success: false,
        message: 'Reason and resume date are required'
      });
    }
    
    const subscription = await Subscription.findByIdAndUpdate(
      id,
      {
        $set: {
          'pause.isPaused': true,
          'pause.reason': reason,
          'pause.pausedAt': new Date(),
          'pause.resumeDate': new Date(resumeDate),
          'pause.pausedBy': req.user._id,
          updatedBy: req.user._id
        }
      },
      { new: true }
    );
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // Send notification to user
    await createNotification({
      user: subscription.user,
      title: 'Subscription Paused',
      message: `Your subscription has been paused. Reason: ${reason}. It will resume on ${new Date(resumeDate).toLocaleDateString()}.`,
      type: 'subscription_paused',
      relatedId: subscription._id
    });
    
    res.json({
      success: true,
      message: 'Subscription paused successfully',
      data: subscription
    });
    
  } catch (error) {
    console.error('Error pausing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause subscription',
      error: error.message
    });
  }
};

// Resume subscription
exports.resumeSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscription = await Subscription.findByIdAndUpdate(
      id,
      {
        $set: {
          'pause.isPaused': false,
          'pause.resumedAt': new Date(),
          'pause.resumedBy': req.user._id,
          updatedBy: req.user._id
        },
        $unset: {
          'pause.reason': 1,
          'pause.resumeDate': 1
        }
      },
      { new: true }
    );
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // Send notification to user
    await createNotification({
      user: subscription.user,
      title: 'Subscription Resumed',
      message: 'Your subscription has been resumed successfully.',
      type: 'subscription_resumed',
      relatedId: subscription._id
    });
    
    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      data: subscription
    });
    
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume subscription',
      error: error.message
    });
  }
};

// Get subscription statistics
exports.getSubscriptionStats = async (req, res) => {
  try {
    const [
      total,
      active,
      paused,
      cancelled,
      thisMonth
    ] = await Promise.all([
      // Total subscriptions
      Subscription.countDocuments({ isDeleted: { $ne: true } }),
      
      // Active subscriptions
      Subscription.countDocuments({ 
        status: 'active',
        isDeleted: { $ne: true },
        'pause.isPaused': { $ne: true }
      }),
      
      // Paused subscriptions
      Subscription.countDocuments({ 
        'pause.isPaused': true,
        isDeleted: { $ne: true }
      }),
      
      // Cancelled subscriptions
      Subscription.countDocuments({ 
        status: 'cancelled',
        isDeleted: { $ne: true }
      }),
      
      // New subscriptions this month
      Subscription.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        },
        isDeleted: { $ne: true }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        active,
        paused,
        cancelled,
        thisMonth
      }
    });
    
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription statistics',
      error: error.message
    });
  }
};
