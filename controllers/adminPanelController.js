const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const Product = require('../models/Product');
const MealPlan = require('../models/MealPlan');
const DeliveryTracking = require('../models/DeliveryTracking');
const moment = require('moment');

// Admin activity logging helper
const logAdminActivity = async (adminId, action, details, req) => {
  try {
    const logEntry = {
      adminId,
      action,
      details,
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // You could save this to a dedicated AdminLog model/collection
    console.log('Admin Activity:', logEntry);

    // For now, we'll just log to console. 
    // In production, you should save to database
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
};

/**
 * Dashboard Analytics
 * GET /api/admin/dashboard
 */
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'VIEW_DASHBOARD', 'Accessed dashboard analytics', req);

    const today = moment().startOf('day');
    const thisMonth = moment().startOf('month');
    const lastMonth = moment().subtract(1, 'month').startOf('month');
    const thisYear = moment().startOf('year');

    // User Analytics
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today.toDate() }
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonth.toDate() }
    });

    // Subscription Analytics
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const pausedSubscriptions = await Subscription.countDocuments({ status: 'paused' });
    const expiredSubscriptions = await Subscription.countDocuments({ status: 'expired' });

    // Order Analytics
    const totalOrders = await Order.countDocuments();
    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: today.toDate() }
    });
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: thisMonth.toDate() }
    });

    // Revenue Analytics
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const revenueToday = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today.toDate() },
          status: { $in: ['confirmed', 'delivered'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const revenueThisMonth = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth.toDate() },
          status: { $in: ['confirmed', 'delivered'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Delivery Analytics
    const deliveriesCompleted = await DeliveryTracking.countDocuments({
      deliveryStatus: 'delivered'
    });
    const deliveriesPending = await DeliveryTracking.countDocuments({
      deliveryStatus: 'pending'
    });

    // Growth Analytics (Month over Month)
    const lastMonthUsers = await User.countDocuments({
      createdAt: {
        $gte: lastMonth.toDate(),
        $lt: thisMonth.toDate()
      }
    });

    const lastMonthOrders = await Order.countDocuments({
      createdAt: {
        $gte: lastMonth.toDate(),
        $lt: thisMonth.toDate()
      }
    });

    const userGrowth = lastMonthUsers ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers * 100) : 0;
    const orderGrowth = lastMonthOrders ? ((ordersThisMonth - lastMonthOrders) / lastMonthOrders * 100) : 0;

    // Recent Activities
    const recentOrders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber totalAmount status createdAt user');

    const recentSubscriptions = await Subscription.find()
      .populate('user', 'name email')
      .populate('mealPlan', 'name price')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('subscriptionId status createdAt user mealPlan pricing');

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          today: newUsersToday,
          thisMonth: newUsersThisMonth,
          growth: userGrowth
        },
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          paused: pausedSubscriptions,
          expired: expiredSubscriptions
        },
        orders: {
          total: totalOrders,
          today: ordersToday,
          thisMonth: ordersThisMonth,
          growth: orderGrowth
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: revenueToday[0]?.total || 0,
          thisMonth: revenueThisMonth[0]?.total || 0
        },
        deliveries: {
          completed: deliveriesCompleted,
          pending: deliveriesPending
        },
        recentActivity: {
          orders: recentOrders,
          subscriptions: recentSubscriptions
        }
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics'
    });
  }
};

/**
 * User Management
 * GET /api/admin/users
 */
exports.getUsers = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'VIEW_USERS', `Accessed users list with filters: ${JSON.stringify(req.query)}`, req);

    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const users = await User.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password')
      .lean();

    const totalUsers = await User.countDocuments(query);

    // Add subscription and order counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const subscriptionCount = await Subscription.countDocuments({ user: user._id });
        const orderCount = await Order.countDocuments({ userId: user._id });
        const totalSpent = await Order.aggregate([
          { $match: { userId: user._id, status: { $in: ['confirmed', 'delivered'] } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        return {
          ...user,
          stats: {
            subscriptions: subscriptionCount,
            orders: orderCount,
            totalSpent: totalSpent[0]?.total || 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: page < Math.ceil(totalUsers / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

/**
 * User Details
 * GET /api/admin/users/:id
 */
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's subscriptions
    const subscriptions = await Subscription.find({ user: id })
      .populate('mealPlan', 'name price type')
      .sort({ createdAt: -1 })
      .lean();

    // Get user's orders
    const orders = await Order.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get user's delivery tracking
    const deliveries = await DeliveryTracking.find({ user: id })
      .populate('subscription', 'subscriptionId')
      .sort({ deliveryDate: -1 })
      .limit(10)
      .lean();

    // Calculate user statistics
    const userStats = {
      totalOrders: await Order.countDocuments({ userId: id }),
      totalSpent: await Order.aggregate([
        { $match: { userId: id, status: { $in: ['confirmed', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      activeSubscriptions: await Subscription.countDocuments({ user: id, status: 'active' }),
      completedDeliveries: await DeliveryTracking.countDocuments({ user: id, deliveryStatus: 'delivered' }),
      avgOrderValue: await Order.aggregate([
        { $match: { userId: id, status: { $in: ['confirmed', 'delivered'] } } },
        { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
      ]).then(result => result[0]?.avg || 0)
    };

    res.json({
      success: true,
      data: {
        user,
        subscriptions,
        orders,
        deliveries,
        stats: userStats
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
};

/**
 * Get Single User by ID
 * GET /api/admin-panel/users/:userId
 */
exports.getUserById = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'VIEW_USER_DETAIL', `Accessed user detail for ID: ${req.params.userId}`, req);

    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const subscriptionCount = await Subscription.countDocuments({ user: userId });
    const orderCount = await Order.countDocuments({ userId: userId });

    // Calculate total spent
    const totalSpent = await Order.aggregate([
      { $match: { userId: user._id, status: { $in: ['confirmed', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const userWithStats = {
      ...user.toObject(),
      totalOrders: orderCount,
      totalSpent: totalSpent[0]?.total || 0,
      activeSubscriptions: subscriptionCount,
      loyaltyPoints: user.loyaltyPoints || 0
    };

    res.json({
      success: true,
      data: {
        user: userWithStats
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
};

/**
 * Update User
 * PUT /api/admin-panel/users/:userId
 */
exports.updateUser = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'UPDATE_USER', `Updated user ${req.params.userId}: ${JSON.stringify(req.body)}`, req);

    const { userId } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

/**
 * Update User Status
 * PUT /api/admin-panel/users/:userId/status
 */
exports.updateUserStatus = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'UPDATE_USER_STATUS', `Updated user ${req.params.userId} status to ${req.body.status}`, req);

    const { userId } = req.params;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

/**
 * Subscription Management
 * GET /api/admin/subscriptions
 */
exports.getSubscriptions = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'VIEW_SUBSCRIPTIONS', `Accessed subscriptions list with filters: ${JSON.stringify(req.query)}`, req);

    const {
      page = 1,
      limit = 50,
      search = '',
      status = '',
      mealPlan = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      query.$or = [
        { subscriptionId: { $regex: search, $options: 'i' } },
        { user: { $in: users.map(u => u._id) } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (mealPlan) {
      query.mealPlan = mealPlan;
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const subscriptions = await Subscription.find(query)
      .populate('user', 'name email phone')
      .populate('mealPlan', 'name price type title')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalSubscriptions = await Subscription.countDocuments(query);

    // Add delivery statistics for each subscription
    const subscriptionsWithStats = await Promise.all(
      subscriptions.map(async (subscription) => {
        const deliveryStats = await DeliveryTracking.aggregate([
          { $match: { subscription: subscription._id } },
          {
            $group: {
              _id: '$deliveryStatus',
              count: { $sum: 1 }
            }
          }
        ]);

        const stats = {
          delivered: 0,
          pending: 0,
          skipped: 0,
          ...Object.fromEntries(deliveryStats.map(stat => [stat._id, stat.count]))
        };

        return {
          ...subscription,
          deliveryStats: stats
        };
      })
    );

    res.json({
      success: true,
      data: {
        subscriptions: subscriptionsWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSubscriptions / limit),
          totalSubscriptions,
          hasNext: page < Math.ceil(totalSubscriptions / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
};

/**
 * Subscription Details
 * GET /api/admin/subscriptions/:id
 */
exports.getSubscriptionDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id)
      .populate('user', 'name email phone')
      .populate('mealPlan', 'name price type description')
      .lean();

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get delivery tracking for this subscription
    const deliveries = await DeliveryTracking.find({ subscription: id })
      .sort({ deliveryDate: -1 })
      .lean();

    // Calculate subscription statistics
    const deliveryStats = {
      total: deliveries.length,
      delivered: deliveries.filter(d => d.deliveryStatus === 'delivered').length,
      pending: deliveries.filter(d => d.deliveryStatus === 'pending').length,
      skipped: deliveries.filter(d => d.deliveryStatus === 'skipped').length,
      replaced: deliveries.filter(d => d.isReplaced).length
    };

    res.json({
      success: true,
      data: {
        subscription,
        deliveries,
        stats: deliveryStats
      }
    });
  } catch (error) {
    console.error('Get subscription details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription details'
    });
  }
};

/**
 * Get Single Subscription by ID
 * GET /api/admin-panel/subscriptions/:subscriptionId
 */
exports.getSubscriptionById = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'VIEW_SUBSCRIPTION_DETAIL', `Accessed subscription detail for ID: ${req.params.subscriptionId}`, req);

    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId)
      .populate('user', 'name email phone')
      .populate('mealPlan', 'name description price duration category');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get delivery schedule/history
    const deliveries = await DeliveryTracking.find({
      subscriptionId: subscription._id
    }).sort({ scheduledDate: 1 });

    res.json({
      success: true,
      data: {
        subscription: {
          ...subscription.toObject(),
          deliverySchedule: deliveries
        }
      }
    });
  } catch (error) {
    console.error('Get subscription by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription details'
    });
  }
};

/**
 * Update Subscription Status
 * PUT /api/admin-panel/subscriptions/:subscriptionId/status
 */
exports.updateSubscriptionStatus = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'UPDATE_SUBSCRIPTION_STATUS', `Updated subscription ${req.params.subscriptionId} status to ${req.body.status}`, req);

    const { subscriptionId } = req.params;
    const { status } = req.body;

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email').populate('mealPlan', 'name');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription status updated successfully',
      data: {
        subscription
      }
    });
  } catch (error) {
    console.error('Update subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription status'
    });
  }
};

/**
 * Order Management
 * GET /api/admin/orders
 */
exports.getOrders = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'VIEW_ORDERS', `Accessed orders list with filters: ${JSON.stringify(req.query)}`, req);

    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      dateFrom = '',
      dateTo = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { userId: { $in: users.map(u => u._id) } }
      ];
    }

    if (status !== "all") {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    // console.log("orders : ",orders,query);
    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNext: page < Math.ceil(totalOrders / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

/**
 * Order Details
 * GET /api/admin/orders/:id
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
};

/**
 * Get Single Order by ID
 * GET /api/admin-panel/orders/:orderId
 */
exports.getOrderById = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'VIEW_ORDER_DETAIL', `Accessed order detail for ID: ${req.params.orderId}`, req);

    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details'
    });
  }
};

/**
 * Update Order Status
 * PUT /api/admin-panel/orders/:orderId/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    // Log admin activity
    await logAdminActivity(req.user.id, 'UPDATE_ORDER_STATUS', `Updated order ${req.params.orderId} status to ${req.body.status}`, req);

    const { orderId } = req.params;
    const { status } = req.body;

    const updateData = { status };

    // Add delivered timestamp if status is delivered
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // === T-COINS EARNING LOGIC ===
    if (status === 'delivered' && (!order.coinsEarned || order.coinsEarned === 0)) {
      const EARN_RATE = 0.1;
      const coinsToEarn = Math.floor(order.totalAmount * EARN_RATE);

      console.log(`[ADMIN-PANEL] Order Delivered. Total: ${order.totalAmount}, Coins to Earn: ${coinsToEarn}`);

      if (coinsToEarn > 0) {
        order.coinsEarned = coinsToEarn;

        // Update user wallet
        const customer = await User.findById(order.userId);
        if (customer) {
          console.log('[ADMIN-PANEL] Customer found:', customer._id);

          // Initialize if missing
          if (!customer.tCoins) {
            console.log('[ADMIN-PANEL] Initializing tCoins for customer');
            customer.tCoins = { balance: 0, history: [] };
          }

          customer.tCoins.balance += coinsToEarn;
          customer.tCoins.history.push({
            points: coinsToEarn,
            action: 'earned',
            reason: `Earned from Order #${order.orderNumber}`,
            date: new Date()
          });

          // Force Mongoose to register the change
          customer.markModified('tCoins');

          await customer.save();
          console.log(`🌟 [ADMIN-PANEL] T-Coins Saved! New Balance: ${customer.tCoins.balance}`);
        } else {
          console.log('[ADMIN-PANEL] Customer NOT found for ID:', order.userId);
        }
      }
      // Save the updated order with coinsEarned
      await order.save();
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

/**
 * Meal Plan Analytics
 * GET /api/admin/mealplans
 */
exports.getMealPlanAnalytics = async (req, res) => {
  try {
    // Get all meal plans with subscription counts
    const mealPlans = await MealPlan.find().lean();

    const mealPlanStats = await Promise.all(
      mealPlans.map(async (plan) => {
        const subscriptionCount = await Subscription.countDocuments({ mealPlan: plan._id });
        const activeSubscriptions = await Subscription.countDocuments({
          mealPlan: plan._id,
          status: 'active'
        });

        const revenue = await Subscription.aggregate([
          { $match: { mealPlan: plan._id } },
          { $group: { _id: null, total: { $sum: '$pricing.finalAmount' } } }
        ]);

        return {
          ...plan,
          stats: {
            totalSubscriptions: subscriptionCount,
            activeSubscriptions,
            totalRevenue: revenue[0]?.total || 0
          }
        };
      })
    );

    // Get product analytics
    const products = await Product.find().lean();
    const productStats = await Promise.all(
      products.map(async (product) => {
        const orderCount = await Order.aggregate([
          { $unwind: '$items' },
          { $match: { 'items.productId': product._id } },
          { $count: 'orders' }
        ]);

        const quantitySold = await Order.aggregate([
          { $unwind: '$items' },
          { $match: { 'items.productId': product._id } },
          { $group: { _id: null, total: { $sum: '$items.quantity' } } }
        ]);

        return {
          ...product,
          stats: {
            orderCount: orderCount[0]?.orders || 0,
            quantitySold: quantitySold[0]?.total || 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        mealPlans: mealPlanStats,
        products: productStats
      }
    });
  } catch (error) {
    console.error('Get meal plan analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plan analytics'
    });
  }
};

/**
 * Analytics Data
 * GET /api/admin/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let dateFilter;
    const now = moment();

    switch (period) {
      case '7days':
        dateFilter = { $gte: now.subtract(7, 'days').toDate() };
        break;
      case '30days':
        dateFilter = { $gte: now.subtract(30, 'days').toDate() };
        break;
      case '90days':
        dateFilter = { $gte: now.subtract(90, 'days').toDate() };
        break;
      case '1year':
        dateFilter = { $gte: now.subtract(1, 'year').toDate() };
        break;
      default:
        dateFilter = { $gte: now.subtract(30, 'days').toDate() };
    }

    // User growth analytics
    const userGrowth = await User.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Order analytics
    const orderAnalytics = await Order.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Subscription analytics
    const subscriptionAnalytics = await Subscription.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          subscriptions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Order status distribution
    const orderStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top customers by revenue
    const topCustomers = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'delivered'] } } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    res.json({
      success: true,
      data: {
        userGrowth,
        orderAnalytics,
        subscriptionAnalytics,
        orderStatus,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// All functions are already exported using exports. syntax above