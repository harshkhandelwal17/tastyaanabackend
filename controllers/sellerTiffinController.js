// const DailyOrder = require('../models/DailyOrder');
// const Order = require('../models/Order');
// const Subscription = require('../models/Subscription');
// const User = require('../models/User');
// const mongoose = require('mongoose');
// const moment = require('moment-timezone');

// /**
//  * Get seller's dashboard data with today's statistics
//  */
// exports.getSellerDashboard = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
//     const tomorrow = moment().tz('Asia/Kolkata').startOf('day').add(1, 'day').toDate();

//     // Get today's order count (normal orders only, excluding subscription orders)
//     const todayOrdersCount = await Order.countDocuments({
//       'items.seller': sellerId,
//       type: { $ne: 'gkk' }, // Exclude subscription orders
//       createdAt: { $gte: today, $lt: tomorrow }
//     });

//     // Get delivered orders count for today
//     const deliveredOrdersCount = await Order.countDocuments({
//       'items.seller': sellerId,
//       type: { $ne: 'gkk' },
//       status: 'delivered',
//       createdAt: { $gte: today, $lt: tomorrow }
//     });

//     // Get today's tiffin lists count for both shifts
//     const morningTiffinCount = await DailyOrder.countDocuments({
//       vendorId: sellerId,
//       date: { $gte: today, $lt: tomorrow },
//       shift: 'morning',
//       orderType: 'subscription'
//     });

//     const eveningTiffinCount = await DailyOrder.countDocuments({
//       vendorId: sellerId,
//       date: { $gte: today, $lt: tomorrow },
//       shift: 'evening',
//       orderType: 'subscription'
//     });

//     // Get penalty/delayed orders count
//     const delayedOrdersCount = await Order.countDocuments({
//       'items.seller': sellerId,
//       isDelayed: true,
//       status: { $nin: ['delivered', 'cancelled'] }
//     });

//     const delayedTiffinCount = await DailyOrder.countDocuments({
//       vendorId: sellerId,
//       isDelayed: true,
//       status: { $nin: ['delivered', 'cancelled'] }
//     });

//     // Get live orders count with countdown information
//     const liveOrders = await Order.find({
//       'items.seller': sellerId,
//       status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'] }
//     }).select('_id createdAt status preparationStartTime preparationDeadline');

//     // Add countdown info to live orders
//     const liveOrdersWithCountdown = liveOrders.map(order => {
//       const countdownInfo = order.getCountdownInfo();
//       return {
//         id: order._id,
//         status: order.status,
//         countdown: countdownInfo
//       };
//     });

//     const liveOrdersCount = liveOrders.length;

//     // Calculate total penalty amount
//     const totalPenaltyAmount = await Order.aggregate([
//       { $match: { 'items.seller': sellerId, isDelayed: true } },
//       { $group: { _id: null, total: { $sum: '$penaltyAmount' } } }
//     ]);

//     const dashboardData = {
//       todayOrders: todayOrdersCount,
//       deliveredOrders: deliveredOrdersCount,
//       tiffinCounts: {
//         morning: morningTiffinCount,
//         evening: eveningTiffinCount,
//         total: morningTiffinCount + eveningTiffinCount
//       },
//       penalties: {
//         delayedOrders: delayedOrdersCount + delayedTiffinCount,
//         totalPenaltyAmount: totalPenaltyAmount[0]?.total || 0
//       },
//       liveOrders: {
//         count: liveOrdersCount,
//         orders: liveOrdersWithCountdown
//       },
//       currentShift: moment().tz('Asia/Kolkata').hour() < 14 ? 'morning' : 'evening'
//     };

//     res.json({
//       success: true,
//       data: dashboardData
//     });

//   } catch (error) {
//     console.error('Error fetching seller dashboard:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching dashboard data',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * Get today's tiffin list for a specific shift
//  */
// exports.getTodayTiffinList = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const { shift } = req.params; // 'morning' or 'evening'

//     if (!['morning', 'evening'].includes(shift)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid shift parameter. Must be "morning" or "evening"'
//       });
//     }

//     const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
//     const tomorrow = moment().tz('Asia/Kolkata').startOf('day').add(1, 'day').toDate();

//     const tiffinOrders = await DailyOrder.find({
//       vendorId: sellerId,
//       date: { $gte: today, $lt: tomorrow },
//       shift: shift,
//       orderType: 'subscription'
//     }).populate([
//       { 
//         path: 'subscriptionId', 
//         select: 'subscriptionId planType',
//         populate: {
//           path: 'mealPlan',
//           select: 'title'
//         }
//       },
//       { path: 'assignedDriver', select: 'name phone' },
//       { path: 'userId', select: 'name phone' }
//     ]).sort({ preparationTime: 1 });

//     // Transform data for frontend
//     const transformedOrders = tiffinOrders.map(order => ({
//       id: order._id,
//       subscriptionId: order.subscriptionId?.subscriptionId,
//       planType: order.subscriptionId?.mealPlan?.title || order.planType,
//       itemForToday: order.subscriptionId?.mealPlan?.title,
//       preparationTime: moment(order.preparationTime).format('HH:mm'),
//       status: order.status,
//       handoverFlag: order.isDelayed ? 'delay' : null,
//       assignedDriver: order.assignedDriver ? {
//         name: order.assignedDriver.name,
//         phone: order.assignedDriver.phone
//       } : null,
//       customerInfo: {
//         name: order.userId?.name,
//         phone: order.userId?.phone
//       },
//       delayInfo: order.isDelayed ? {
//         delayedAt: order.delayedAt,
//         delayReason: order.delayReason,
//         penaltyAmount: order.penaltyAmount
//       } : null
//     }));

//     res.json({
//       success: true,
//       data: {
//         shift: shift,
//         date: moment(today).format('YYYY-MM-DD'),
//         count: transformedOrders.length,
//         orders: transformedOrders
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching tiffin list:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching tiffin list',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * Update tiffin order status
//  */
// exports.updateTiffinStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status, notes } = req.body;
//     const sellerId = req.user._id;

//     const validStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'not_prepared'];

//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
//       });
//     }

//     const order = await DailyOrder.findOne({
//       _id: orderId,
//       vendorId: sellerId
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Tiffin order not found'
//       });
//     }

//     // Update order status
//     await order.updateOrderStatus(status, notes);

//     // If marked as ready_for_pickup, trigger driver notifications
//     if (status === 'ready_for_pickup') {
//       // This could trigger driver notifications via socket or other means
//       // Implementation depends on your notification system
//     }

//     res.json({
//       success: true,
//       message: 'Tiffin status updated successfully',
//       data: {
//         orderId: order._id,
//         status: order.status,
//         isDelayed: order.isDelayed,
//         penaltyAmount: order.penaltyAmount
//       }
//     });

//   } catch (error) {
//     console.error('Error updating tiffin status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating tiffin status',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * Get penalty/flag section data
//  */
// exports.getPenaltySection = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const skip = (page - 1) * limit;

//     // Get delayed normal orders
//     const delayedNormalOrders = await Order.find({
//       'items.seller': sellerId,
//       isDelayed: true
//     }).populate('userId', 'name phone')
//       .sort({ delayedAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     // Get delayed tiffin orders
//     const delayedTiffinOrders = await DailyOrder.find({
//       vendorId: sellerId,
//       isDelayed: true
//     }).populate([
//       { path: 'subscriptionId', select: 'subscriptionId planType' },
//       { path: 'userId', select: 'name phone' }
//     ]).sort({ delayedAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     // Transform data
//     const normalOrderPenalties = delayedNormalOrders.map(order => ({
//       id: order._id,
//       type: 'normal_order',
//       orderId: order.orderNumber,
//       customerName: order.userId?.name,
//       customerPhone: order.userId?.phone,
//       delayedAt: order.delayedAt,
//       delayReason: order.delayReason,
//       penaltyAmount: order.penaltyAmount || 0,
//       status: order.status
//     }));

//     const tiffinOrderPenalties = delayedTiffinOrders.map(order => ({
//       id: order._id,
//       type: 'tiffin_order',
//       orderId: order.subscriptionId?.subscriptionId,
//       planType: order.planType,
//       customerName: order.userId?.name,
//       customerPhone: order.userId?.phone,
//       delayedAt: order.delayedAt,
//       delayReason: order.delayReason,
//       penaltyAmount: order.penaltyAmount || 0,
//       status: order.status,
//       shift: order.shift
//     }));

//     // Combine and sort by date
//     const allPenalties = [...normalOrderPenalties, ...tiffinOrderPenalties]
//       .sort((a, b) => new Date(b.delayedAt) - new Date(a.delayedAt));

//     // Calculate total penalty amount
//     const totalPenalty = allPenalties.reduce((sum, penalty) => sum + penalty.penaltyAmount, 0);

//     res.json({
//       success: true,
//       data: {
//         penalties: allPenalties.slice(0, limit),
//         totalPenaltyAmount: totalPenalty,
//         pagination: {
//           page,
//           limit,
//           total: allPenalties.length,
//           hasMore: allPenalties.length > limit
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching penalty section:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching penalty data',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * Update normal order status with delay tracking
//  */
// exports.updateNormalOrderStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status, notes } = req.body;
//     const sellerId = req.user._id;

//     const validStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'not_prepared'];

//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid status'
//       });
//     }

//     const order = await Order.findOne({
//       _id: orderId,
//       'items.seller': sellerId
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Check for delay if not marking as ready within 25 minutes of order creation
//     const now = new Date();
//     const orderTime = new Date(order.createdAt);
//     const delayThreshold = new Date(orderTime.getTime() + 25 * 60 * 1000); // 25 minutes

//     if (status !== 'ready_for_pickup' && now > delayThreshold && !order.isDelayed) {
//       order.isDelayed = true;
//       order.delayedAt = new Date();
//       order.delayReason = 'Order not ready within 25 minutes';
//       order.penaltyAmount = order.totalAmount; // 100% penalty as mentioned
//     }

//     // Update order status and track preparation times
//     if (status === 'preparing' && !order.preparationStartTime) {
//       order.preparationStartTime = new Date();
//       order.preparationDeadline = new Date(Date.now() + 25 * 60 * 1000); // 25 minutes from now
//     }

//     order.status = status;
//     if (notes) {
//       order.sellerNotes = notes;
//     }

//     await order.save();

//     res.json({
//       success: true,
//       message: 'Order status updated successfully',
//       data: {
//         orderId: order._id,
//         status: order.status,
//         isDelayed: order.isDelayed,
//         penaltyAmount: order.penaltyAmount
//       }
//     });

//   } catch (error) {
//     console.error('Error updating normal order status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error updating order status',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * Get normal orders analytics
//  */
// exports.getNormalOrdersAnalytics = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const { period = 'daily' } = req.query;

//     let startDate, endDate, groupBy;
//     const now = moment().tz('Asia/Kolkata');

//     switch (period) {
//       case 'daily':
//         startDate = now.startOf('day').toDate();
//         endDate = now.endOf('day').toDate();
//         groupBy = { $dateToString: { format: "%H", date: "$createdAt" } };
//         break;
//       case 'weekly':
//         startDate = now.startOf('week').toDate();
//         endDate = now.endOf('week').toDate();
//         groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
//         break;
//       case 'monthly':
//         startDate = now.startOf('month').toDate();
//         endDate = now.endOf('month').toDate();
//         groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
//         break;
//       default:
//         return res.status(400).json({ success: false, message: 'Invalid period' });
//     }

//     // Get order statistics
//     const orderStats = await Order.aggregate([
//       { $unwind: '$items' },
//       { 
//         $match: { 
//           'items.seller': sellerId,
//           type: { $ne: 'gkk' }, // Exclude subscription orders
//           createdAt: { $gte: startDate, $lte: endDate }
//         } 
//       },
//       {
//         $group: {
//           _id: groupBy,
//           orderCount: { $sum: 1 },
//           totalSalesAmount: { $sum: '$items.priceForSeller' },
//           totalAmount: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]);

//     // Calculate app commission (20% of total sales)
//     const totalSales = orderStats.reduce((sum, stat) => sum + stat.totalSalesAmount, 0);
//     const appCommission = totalSales * 0.2;
//     const sellerEarnings = totalSales - appCommission;

//     // Get order history including delivered orders
//     const orderHistory = await Order.find({
//       'items.seller': sellerId,
//       type: { $ne: 'gkk' },
//       $or: [
//         { createdAt: { $gte: startDate, $lte: endDate } },
//         { deliveredAt: { $gte: startDate, $lte: endDate } }
//       ]
//     }).populate('userId', 'name')
//       .select('orderNumber items totalAmount deliveredAt status createdAt')
//       .sort({ createdAt: -1 })
//       .limit(50);

//     const transformedHistory = orderHistory.map(order => ({
//       orderId: order.orderNumber,
//       items: order.items.map(item => `${item.name} x ${item.quantity} ${item.unit || ''}`).join(', '),
//       price: order.items.find(item => item.seller.toString() === sellerId.toString())?.priceForSeller || 0,
//       deliveredAt: order.deliveredAt,
//       status: order.status
//     }));

//     res.json({
//       success: true,
//       data: {
//         period,
//         analytics: {
//           totalOrders: orderStats.reduce((sum, stat) => sum + stat.orderCount, 0),
//           totalSalesAmount: sellerEarnings,
//           appCommission,
//           orderStats
//         },
//         orderHistory: transformedHistory
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching normal orders analytics:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching analytics',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// /**
//  * Get subscription analytics
//  */
// exports.getSubscriptionAnalytics = async (req, res) => {
//   try {
//     const sellerId = req.user._id;

//     // Get subscription statistics
//     const subscriptionStats = await Subscription.aggregate([
//       {
//         $lookup: {
//           from: 'mealplans',
//           localField: 'mealPlan',
//           foreignField: '_id',
//           as: 'mealPlanDetails'
//         }
//       },
//       {
//         $match: {
//           'mealPlanDetails.vendor': sellerId
//         }
//       },
//       {
//         $group: {
//           _id: '$status',
//           count: { $sum: 1 },
//           totalAmount: { $sum: '$pricing.finalAmount' }
//         }
//       }
//     ]);

//     const totalSubscriptions = subscriptionStats.reduce((sum, stat) => sum + stat.count, 0);
//     const activeSubscriptions = subscriptionStats.find(s => s._id === 'active')?.count || 0;
//     const pausedSubscriptions = subscriptionStats.find(s => s._id === 'paused')?.count || 0;
//     const totalSubscriptionAmount = subscriptionStats.reduce((sum, stat) => sum + stat.totalAmount, 0);

//     // Calculate app commission (20% of subscription amount)
//     const appCommission = totalSubscriptionAmount * 0.2;
//     const sellerEarnings = totalSubscriptionAmount - appCommission;

//     // Get subscription list
//     const subscriptions = await Subscription.find({})
//       .populate({
//         path: 'mealPlan',
//         match: { vendor: sellerId },
//         select: 'title'
//       })
//       .populate('user', 'name')
//       .select('subscriptionId mealCounts planType pricing')
//       .sort({ createdAt: -1 });

//     const filteredSubscriptions = subscriptions.filter(sub => sub.mealPlan);

//     const subscriptionList = filteredSubscriptions.map(sub => ({
//       subscriptionId: sub.subscriptionId,
//       totalMeals: sub.mealCounts.totalMeals,
//       remaining: sub.mealCounts.mealsRemaining,
//       delivered: sub.mealCounts.mealsDelivered,
//       planType: sub.planType,
//       mealsPerDay: sub.pricing.mealsPerDay
//     }));

//     res.json({
//       success: true,
//       data: {
//         analytics: {
//           totalSubscriptions,
//           activeSubscriptions,
//           pausedSubscriptions,
//           totalSubscriptionAmount: sellerEarnings,
//           appCommission
//         },
//         subscriptionList
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching subscription analytics:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching subscription analytics',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };
const DailyOrder = require('../models/DailyOrder');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const DailyMeal = require('../models/DailyMeal');
const User = require('../models/User');
const mongoose = require('mongoose');
const moment = require('moment-timezone');

/**
 * Get seller's dashboard data with today's statistics
 */
exports.getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
    const tomorrow = moment().tz('Asia/Kolkata').startOf('day').add(1, 'day').toDate();

    // Get today's normal order count (type: 'addon' only)
    const todayOrders = await Order.find({
      $and: [
        {
          $or: [
            { restaurantId: sellerId },
            { 'items.seller': sellerId }
          ]
        },
        {
          $or: [
            { type: 'addon' }, // Normal addon orders
            { type: { $exists: false } }, // Legacy orders without type field
            { type: null } // Orders with null type
          ]
        }
      ],
      createdAt: { $gte: today, $lt: tomorrow }
    }).lean();

    // Count distinct orders properly
    let todayOrdersCount = 0;
    let deliveredOrdersCount = 0;
    let todayRevenue = 0;

    todayOrders.forEach(order => {
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();
      const hasSellerItems = (order.items || []).some(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );

      if (isRestaurantOrder || hasSellerItems) {
        todayOrdersCount++;

        if (order.status === 'delivered') {
          deliveredOrdersCount++;
        }

        // Calculate revenue
        if (isRestaurantOrder) {
          todayRevenue += order.totalAmount || 0;
        } else {
          const sellerItems = (order.items || []).filter(item =>
            item.seller && item.seller.toString() === sellerId.toString()
          );
          const sellerTotal = sellerItems.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
          );
          todayRevenue += sellerTotal;
        }
      }
    });

    // Get today's tiffin lists count for both shifts
    const morningTiffinCount = await DailyOrder.countDocuments({
      vendorId: sellerId,
      date: { $gte: today, $lt: tomorrow },
      shift: 'morning',
      orderType: 'subscription'
    });

    const eveningTiffinCount = await DailyOrder.countDocuments({
      vendorId: sellerId,
      date: { $gte: today, $lt: tomorrow },
      shift: 'evening',
      orderType: 'subscription'
    });

    // Get penalty/delayed normal orders count
    const delayedOrders = await Order.find({
      $and: [
        {
          $or: [
            { restaurantId: sellerId },
            { 'items.seller': sellerId }
          ]
        },
        {
          $or: [
            { type: 'addon' }, // Normal addon orders
            { type: { $exists: false } }, // Legacy orders without type field
            { type: null } // Orders with null type
          ]
        }
      ],
      isDelayed: true,
      status: { $nin: ['delivered', 'cancelled'] }
    }).lean();

    let delayedOrdersCount = 0;
    delayedOrders.forEach(order => {
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();
      const hasSellerItems = (order.items || []).some(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );

      if (isRestaurantOrder || hasSellerItems) {
        delayedOrdersCount++;
      }
    });

    const delayedTiffinCount = await DailyOrder.countDocuments({
      vendorId: sellerId,
      isDelayed: true,
      status: { $nin: ['delivered', 'cancelled'] }
    });

    // Get live normal orders count with countdown information
    const liveOrders = await Order.find({
      $and: [
        {
          $or: [
            { restaurantId: sellerId },
            { 'items.seller': sellerId }
          ]
        },
        {
          $or: [
            { type: 'addon' }, // Normal addon orders
            { type: { $exists: false } }, // Legacy orders without type field
            { type: null } // Orders with null type
          ]
        }
      ],
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'] }
    }).select('_id createdAt status preparationStartTime preparationDeadline restaurantId items');

    // Filter and process live orders for this seller
    let liveOrdersCount = 0;
    const liveOrdersWithCountdown = [];

    liveOrders.forEach(order => {
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();
      const hasSellerItems = (order.items || []).some(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );

      if (isRestaurantOrder || hasSellerItems) {
        liveOrdersCount++;

        const countdownInfo = order.getCountdownInfo ? order.getCountdownInfo() : null;
        liveOrdersWithCountdown.push({
          id: order._id,
          status: order.status,
          countdown: countdownInfo
        });
      }
    });

    // Calculate total penalty amount from normal orders
    const penaltyOrders = await Order.find({
      $and: [
        {
          $or: [
            { restaurantId: sellerId },
            { 'items.seller': sellerId }
          ]
        },
        {
          $or: [
            { type: 'addon' }, // Normal addon orders
            { type: { $exists: false } }, // Legacy orders without type field
            { type: null } // Orders with null type
          ]
        }
      ],
      isDelayed: true,
      penaltyAmount: { $exists: true, $gt: 0 }
    }).select('penaltyAmount restaurantId items').lean();

    let totalPenaltyAmount = 0;
    penaltyOrders.forEach(order => {
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();
      const hasSellerItems = (order.items || []).some(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );

      if (isRestaurantOrder || hasSellerItems) {
        totalPenaltyAmount += order.penaltyAmount || 0;
      }
    });

    const dashboardData = {
      todayOrders: todayOrdersCount,
      deliveredOrders: deliveredOrdersCount,
      todayRevenue: Math.round(todayRevenue), // Add today's revenue
      tiffinCounts: {
        morning: morningTiffinCount,
        evening: eveningTiffinCount,
        total: morningTiffinCount + eveningTiffinCount
      },
      penalties: {
        delayedOrders: delayedOrdersCount + delayedTiffinCount,
        totalPenaltyAmount: Math.round(totalPenaltyAmount)
      },
      liveOrders: {
        count: liveOrdersCount,
        orders: liveOrdersWithCountdown
      },
      currentShift: moment().tz('Asia/Kolkata').hour() < 14 ? 'morning' : 'evening',
      menuStatus: {
        today: !!(await DailyMeal.findOne({ restaurantId: sellerId, date: { $gte: today, $lt: tomorrow } })),
        tomorrow: !!(await DailyMeal.findOne({ restaurantId: sellerId, date: { $gte: tomorrow, $lt: moment(tomorrow).add(1, 'day').toDate() } }))
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get today's tiffin list for a specific shift
 */
exports.getTodayTiffinList = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { shift } = req.params; // 'morning' or 'evening'

    if (!['morning', 'evening'].includes(shift)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shift parameter. Must be "morning" or "evening"'
      });
    }

    const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
    const tomorrow = moment().tz('Asia/Kolkata').startOf('day').add(1, 'day').toDate();

    // Get today's daily meal data for this seller
    const DailyMeal = require('../models/DailyMeal');
    const todaysDailyMeal = await DailyMeal.findOne({
      restaurantId: sellerId,
      date: { $gte: today, $lt: tomorrow }
    }).select('meals date');

    const tiffinOrders = await DailyOrder.find({
      vendorId: sellerId,
      date: { $gte: today, $lt: tomorrow },
      shift: shift,
      orderType: 'subscription'
    }).populate([
      {
        path: 'subscriptionId',
        select: 'subscriptionId planType pricing deliveryTiming',
        populate: {
          path: 'mealPlan',
          select: 'title includes vendor'
        }
      },
      { path: 'deliveryPartner', select: 'name phone' },
      { path: 'userId', select: 'name phone' },
      { path: 'morning.dailyMealId', select: 'meals date' },
      { path: 'evening.dailyMealId', select: 'meals date' }
    ]);

    // Transform data for frontend
    const transformedOrders = tiffinOrders.map(order => {
      // Calculate cutoff time (delivery time - 20 minutes)
      let cutoffTime = 'Not set';
      const deliveryTiming = order.subscriptionId?.deliveryTiming;
      const shiftTiming = deliveryTiming?.[shift]?.time;

      if (shiftTiming) {
        const [hours, minutes] = shiftTiming.split(':').map(Number);
        const deliveryTime = moment().tz('Asia/Kolkata').hour(hours).minute(minutes).second(0);
        const cutoffMoment = deliveryTime.clone().subtract(20, 'minutes');
        cutoffTime = cutoffMoment.format('HH:mm');
        console.log("cutoffTime is ", cutoffTime)
      }

      // Get meal items based on shift from DailyMeal
      let itemsForToday = [];

      const mappedPlan = {
        "Royal Dining Experience": "RoyalDiningThali",
        "Special Dining Thali": "SpecialDiningThali",
        "Everyman's Thali": 'EveryMensThali',
      }

      if (todaysDailyMeal && todaysDailyMeal.meals) {
        // Get the correct meal tier (default to 'basic' if not specified)
        const mealTier = mappedPlan[order?.subscriptionId?.mealPlan?.title]
        console.log("order title", order)
        // Get lunch for morning shift, dinner for evening shift
        const mealType = shift === 'morning' ? 'lunch' : 'dinner';
        const mealItems = todaysDailyMeal.meals[mealTier]?.[mealType]?.items || [];
        console.log("meal tier", mealTier)
        console.log("itme for today meals", todaysDailyMeal.meals[mealTier])
        itemsForToday = mealItems.map(item => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity
        }));
      }

      // Fallback to individual order's dailyMeal if no common daily meal
      if (itemsForToday.length === 0) {
        const orderDailyMeal = order[shift]?.dailyMealId;
        if (orderDailyMeal && orderDailyMeal.meals) {
          const mealTier = order.planType === 'premium' ? 'premium' :
            order.planType === 'low' ? 'low' : 'basic';
          const mealType = shift === 'morning' ? 'lunch' : 'dinner';
          const mealItems = orderDailyMeal.meals[mealTier]?.[mealType]?.items || [];

          itemsForToday = mealItems.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity
          }));
        }
      }

      // Fallback to mealPlan includes if no DailyMeal items
      if (itemsForToday.length === 0 && order.subscriptionId?.mealPlan?.includes) {
        itemsForToday = order.subscriptionId.mealPlan.includes.map(item => ({
          name: item.name,
          description: item.description || '',
          quantity: item.quantity || '1'
        }));
      }

      return {
        id: order._id,
        subscriptionId: order.subscriptionId?.subscriptionId,
        basePrice: order.subscriptionId?.pricing?.basePricePerMeal || 0,
        itemForToday: itemsForToday,
        preparationTime: cutoffTime, // Show cutoff time instead of preparation time
        deliveryTime: shiftTiming?.time || 'Not set',
        status: order.status,
        handoverFlag: order.isDelayed ? 'delay' : null,
        deliveryParnter: order.deliveryPartner ? {
          name: order.deliveryPartner?.name || order.assignedDriver?.name,
          phone: order.deliveryPartner?.phone || order.assignedDriver?.phone
        } : null,
        customerInfo: {
          name: order.userId?.name,
          phone: order.userId?.phone
        },
        delayInfo: order.isDelayed ? {
          delayedAt: order.delayedAt,
          delayReason: order.delayReason,
          delayType: order.delayType,
          penaltyAmount: order.penaltyAmount
        } : null,
        // Add sorting field for cutoff time
        _cutoffTimestamp: shiftTiming && shiftTiming.time ?
          moment().tz('Asia/Kolkata').hour(Number(shiftTiming.time.split(':')[0])).minute(Number(shiftTiming.time.split(':')[1])).subtract(20, 'minutes').valueOf()
          : 0
      };
    });

    // Sort by cutoff time
    transformedOrders.sort((a, b) => a._cutoffTimestamp - b._cutoffTimestamp);

    // Remove sorting field from response
    transformedOrders.forEach(order => delete order._cutoffTimestamp);

    res.json({
      success: true,
      data: {
        shift: shift,
        date: moment(today).format('YYYY-MM-DD'),
        count: transformedOrders.length,
        orders: transformedOrders
      }
    });

  } catch (error) {
    console.error('Error fetching tiffin list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tiffin list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update tiffin order status with delay tracking
 */
exports.updateTiffinStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const sellerId = req.user._id;

    const validStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'delivered', 'not_prepared'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }

    const order = await DailyOrder.findOne({
      _id: orderId,
      vendorId: sellerId
    }).populate('subscriptionId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Tiffin order not found'
      });
    }

    const now = moment().tz('Asia/Kolkata');
    let delayInfo = {};

    // Get delivery timing from subscription
    const deliveryTiming = order.subscriptionId?.deliveryTiming;
    const shiftTiming = deliveryTiming?.[order.shift];

    if (shiftTiming && shiftTiming.enabled && shiftTiming.time) {
      // Parse delivery time (format: "HH:mm")
      const [hours, minutes] = shiftTiming.time.split(':').map(Number);
      const deliveryTime = moment().tz('Asia/Kolkata').hour(hours).minute(minutes).second(0);
      const cutoffTime = deliveryTime.clone().subtract(20, 'minutes'); // 20 minutes before delivery time

      // Check seller delay when marking as ready_for_pickup
      if (status === 'ready_for_pickup') {
        if (now.isAfter(cutoffTime)) {
          // Seller is late - tiffin should have been ready 20 minutes before delivery time
          const delayMinutes = now.diff(cutoffTime, 'minutes');

          if (!order.isDelayed) {
            order.isDelayed = true;
            order.delayedAt = now.toDate();
            order.delayReason = `Seller delay: Tiffin ready ${delayMinutes} minutes late (should be ready by ${cutoffTime.format('HH:mm')})`;
            order.delayType = 'seller';
            // You can add penalty logic here if needed
            // order.penaltyAmount = calculateSellerPenalty(delayMinutes);
          }

          delayInfo.sellerDelay = {
            delayMinutes,
            expectedReadyTime: cutoffTime.format('HH:mm'),
            actualReadyTime: now.format('HH:mm'),
            deliveryTime: deliveryTime.format('HH:mm')
          };
        }

        // Set ready time for driver delay calculation
        order.readyForPickupAt = now.toDate();
      }

      // Check driver delay when marking as picked_up
      if (status === 'picked_up' && order.readyForPickupAt) {
        const readyTime = moment(order.readyForPickupAt).tz('Asia/Kolkata');
        const pickupDelayMinutes = now.diff(readyTime, 'minutes');

        if (pickupDelayMinutes > 10) {
          // Driver is late - took more than 10 minutes to pick up
          if (!order.isDelayed || order.delayType === 'seller') {
            // If already delayed by seller, update delay reason to include driver delay
            if (order.isDelayed && order.delayType === 'seller') {
              order.delayReason += ` + Driver delay: ${pickupDelayMinutes} minutes to pickup (should pickup within 10 minutes)`;
              order.delayType = 'both';
            } else {
              order.isDelayed = true;
              order.delayedAt = now.toDate();
              order.delayReason = `Driver delay: Took ${pickupDelayMinutes} minutes to pickup (should pickup within 10 minutes)`;
              order.delayType = 'driver';
            }
            // You can add penalty logic here if needed
            // order.penaltyAmount += calculateDriverPenalty(pickupDelayMinutes);
          }

          delayInfo.driverDelay = {
            delayMinutes: pickupDelayMinutes,
            readyTime: readyTime.format('HH:mm'),
            pickupTime: now.format('HH:mm'),
            expectedPickupWindow: '10 minutes'
          };
        }

        order.pickedUpAt = now.toDate();
      }
    }

    // Update order status
    order.status = status;
    if (notes) {
      order.notes = notes;
    }

    // Update status timestamps
    if (status === 'preparing') {
      order.preparingAt = now.toDate();
    } else if (status === 'delivered') {
      order.deliveredAt = now.toDate();
    }

    await order.save();

    // If marked as ready_for_pickup, trigger driver notifications
    if (status === 'ready_for_pickup') {
      // This could trigger driver notifications via socket or other means
      // Implementation depends on your notification system
    }

    res.json({
      success: true,
      message: 'Tiffin status updated successfully',
      data: {
        orderId: order._id,
        status: order.status,
        isDelayed: order.isDelayed,
        delayType: order.delayType,
        delayReason: order.delayReason,
        penaltyAmount: order.penaltyAmount,
        delayInfo,
        timestamps: {
          readyForPickupAt: order.readyForPickupAt,
          pickedUpAt: order.pickedUpAt,
          deliveredAt: order.deliveredAt
        }
      }
    });

  } catch (error) {
    console.error('Error updating tiffin status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tiffin status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get penalty/flag section data
 */
exports.getPenaltySection = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get delayed normal orders
    const delayedNormalOrders = await Order.find({
      'items.seller': sellerId,
      isDelayed: true
    }).populate('userId', 'name phone')
      .sort({ delayedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get delayed tiffin orders
    const delayedTiffinOrders = await DailyOrder.find({
      vendorId: sellerId,
      isDelayed: true
    }).populate([
      { path: 'subscriptionId', select: 'subscriptionId planType' },
      { path: 'userId', select: 'name phone' }
    ]).sort({ delayedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform data
    const normalOrderPenalties = delayedNormalOrders.map(order => ({
      id: order._id,
      type: 'normal_order',
      orderId: order.orderNumber,
      customerName: order.userId?.name,
      customerPhone: order.userId?.phone,
      delayedAt: order.delayedAt,
      delayReason: order.delayReason,
      penaltyAmount: order.penaltyAmount || 0,
      status: order.status
    }));

    const tiffinOrderPenalties = delayedTiffinOrders.map(order => ({
      id: order._id,
      type: 'tiffin_order',
      orderId: order.subscriptionId?.subscriptionId,
      planType: order.planType,
      customerName: order.userId?.name,
      customerPhone: order.userId?.phone,
      delayedAt: order.delayedAt,
      delayReason: order.delayReason,
      penaltyAmount: order.penaltyAmount || 0,
      status: order.status,
      shift: order.shift
    }));

    // Combine and sort by date
    const allPenalties = [...normalOrderPenalties, ...tiffinOrderPenalties]
      .sort((a, b) => new Date(b.delayedAt) - new Date(a.delayedAt));

    // Calculate total penalty amount
    const totalPenalty = allPenalties.reduce((sum, penalty) => sum + penalty.penaltyAmount, 0);

    res.json({
      success: true,
      data: {
        penalties: allPenalties.slice(0, limit),
        totalPenaltyAmount: totalPenalty,
        pagination: {
          page,
          limit,
          total: allPenalties.length,
          hasMore: allPenalties.length > limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching penalty section:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching penalty data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update normal order status with delay tracking
 */
exports.updateNormalOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const sellerId = req.user._id;

    const validStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'not_prepared'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      'items.seller': sellerId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check for delay if not marking as ready within 25 minutes of order creation
    const now = new Date();
    const orderTime = new Date(order.createdAt);
    const delayThreshold = new Date(orderTime.getTime() + 25 * 60 * 1000); // 25 minutes

    if (status !== 'ready_for_pickup' && now > delayThreshold && !order.isDelayed) {
      order.isDelayed = true;
      order.delayedAt = new Date();
      order.delayReason = 'Order not ready within 25 minutes';
      order.penaltyAmount = order.totalAmount; // 100% penalty as mentioned
    }

    // Update order status and track preparation times
    if (status === 'preparing' && !order.preparationStartTime) {
      order.preparationStartTime = new Date();
      order.preparationDeadline = new Date(Date.now() + 25 * 60 * 1000); // 25 minutes from now
    }

    order.status = status;
    if (notes) {
      order.sellerNotes = notes;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order._id,
        status: order.status,
        isDelayed: order.isDelayed,
        penaltyAmount: order.penaltyAmount
      }
    });

  } catch (error) {
    console.error('Error updating normal order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get normal orders analytics
 */
exports.getNormalOrdersAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { period = 'daily' } = req.query;

    let startDate, endDate, groupBy;
    const now = moment().tz('Asia/Kolkata');

    switch (period) {
      case 'daily':
        startDate = now.startOf('day').toDate();
        endDate = now.endOf('day').toDate();
        groupBy = { $dateToString: { format: "%H", date: "$createdAt" } };
        break;
      case 'weekly':
        startDate = now.startOf('week').toDate();
        endDate = now.endOf('week').toDate();
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case 'monthly':
        startDate = now.startOf('month').toDate();
        endDate = now.endOf('month').toDate();
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid period' });
    }

    // Get orders for the period - properly count distinct orders
    const orders = await Order.find({
      $and: [
        {
          $or: [
            { restaurantId: sellerId },
            { 'items.seller': sellerId }
          ]
        },
        {
          $or: [
            { type: 'addon' }, // Normal addon orders
            { type: { $exists: false } }, // Legacy orders without type field
            { type: null } // Orders with null type
          ]
        }
      ],
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean();

    // Process orders to get correct statistics
    let totalOrdersCount = 0;
    let totalSalesAmount = 0;
    const statsMap = new Map();

    orders.forEach(order => {
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();
      const hasSellerItems = order.items && order.items.some(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );

      if (isRestaurantOrder || hasSellerItems) {
        totalOrdersCount++;

        // Calculate seller's revenue from this order
        let orderRevenue = 0;
        if (isRestaurantOrder) {
          orderRevenue = order.totalAmount || 0;
        } else if (hasSellerItems) {
          const sellerItems = order.items.filter(item =>
            item.seller && item.seller.toString() === sellerId.toString()
          );
          orderRevenue = sellerItems.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
          );
        }

        totalSalesAmount += orderRevenue;

        // Group by time period for stats
        let groupKey;
        const orderDate = moment(order.createdAt).tz('Asia/Kolkata');

        switch (period) {
          case 'daily':
            groupKey = orderDate.format('HH');
            break;
          case 'weekly':
          case 'monthly':
            groupKey = orderDate.format('YYYY-MM-DD');
            break;
        }

        if (!statsMap.has(groupKey)) {
          statsMap.set(groupKey, {
            _id: groupKey,
            orderCount: 0,
            totalSalesAmount: 0,
            totalAmount: 0
          });
        }

        const stat = statsMap.get(groupKey);
        stat.orderCount += 1;
        stat.totalSalesAmount += orderRevenue;
        stat.totalAmount += orderRevenue;
      }
    });

    // Convert map to array and sort
    const orderStats = Array.from(statsMap.values()).sort((a, b) => a._id.localeCompare(b._id));

    // Calculate app commission (20% of total sales as requested)
    const appCommission = totalSalesAmount * 0.20; // 20% commission
    const sellerEarnings = totalSalesAmount - appCommission;

    // Get order history including delivered orders - normal orders only (type: 'addon')
    const orderHistory = await Order.find({
      $and: [
        {
          $or: [
            { restaurantId: sellerId },
            { 'items.seller': sellerId }
          ]
        },
        {
          $or: [
            { type: 'addon' }, // Normal addon orders
            { type: { $exists: false } }, // Legacy orders without type field
            { type: null } // Orders with null type
          ]
        },
        {
          $or: [
            { createdAt: { $gte: startDate, $lte: endDate } },
            { deliveredAt: { $gte: startDate, $lte: endDate } }
          ]
        }
      ]
    }).populate('userId', 'name')
      .select('orderNumber items totalAmount deliveredAt status createdAt restaurantId')
      .sort({ createdAt: -1 })
      .limit(50);

    const transformedHistory = orderHistory.map(order => {
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();
      let sellerItems = [];
      let orderPrice = 0;

      if (isRestaurantOrder) {
        // If seller owns the restaurant, show all items
        sellerItems = order.items || [];
        orderPrice = order.totalAmount || 0;
      } else {
        // Filter items that belong to this seller
        sellerItems = (order.items || []).filter(item =>
          item.seller && item.seller.toString() === sellerId.toString()
        );
        orderPrice = sellerItems.reduce((sum, item) =>
          sum + (item.price * item.quantity), 0
        );
      }

      return {
        orderId: order.orderNumber,
        items: sellerItems.map(item => `${item.name} x ${item.quantity} ${item.unit || ''}`).join(', '),
        price: orderPrice,
        deliveredAt: order.deliveredAt,
        status: order.status,
        createdAt: order.createdAt,
        customerName: order.userId?.name || 'N/A',
        itemsCount: sellerItems.length
      };
    }).filter(order => order.itemsCount > 0); // Only show orders with seller's items

    res.json({
      success: true,
      data: {
        period,
        analytics: {
          totalOrders: totalOrdersCount,
          totalSalesAmount: sellerEarnings,
          grossSalesAmount: totalSalesAmount,
          appCommission,
          orderStats
        },
        orderHistory: transformedHistory
      }
    });

  } catch (error) {
    console.error('Error fetching normal orders analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get subscription analytics
 */
exports.getSubscriptionAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get seller's payment information and Sunday availability
    const seller = await User.findById(sellerId).select('sellerProfile.payments sellerProfile.sundayAvailability');
    const sellerPayments = seller?.sellerProfile?.payments || {};
    const sundayAvailability = seller?.sellerProfile?.sundayAvailability || { morning: false, evening: false };

    // Get all subscriptions for this seller with detailed information
    const subscriptions = await Subscription.find({
      sellerId: sellerId,
      status: 'active'
    }).select('status pricing mealCounts shift planType deliverySettings').lean();

    // Calculate subscription statistics with Sunday availability consideration
    let totalSubscriptions = 0;
    let activeSubscriptions = 0;
    let pausedSubscriptions = 0;
    let expiredSubscriptions = 0;
    let totalSubscriptionAmount = 0;
    let adjustedSubscriptionAmount = 0; // Amount after Sunday availability adjustment
    let priceDiffer = 0;
    subscriptions.forEach(subscription => {
      totalSubscriptions++;

      if (subscription.status === 'active') activeSubscriptions++;
      else if (subscription.status === 'paused') pausedSubscriptions++;
      else if (subscription.status === 'expired') expiredSubscriptions++;

      const originalAmount = subscription.pricing?.totalAmount || 0;
      totalSubscriptionAmount += originalAmount;

      // Check if subscription includes Sundays and adjust based on seller's Sunday availability
      let adjustedAmount = originalAmount;
      // console.log("original amount",originalAmount);
      // Check if subscription includes Sundays based on meal count
      // If totalMeals includes Sunday meals, we need to adjust
      const totalMeals = subscription.mealCounts?.totalMeals || 0;
      const shift = subscription.shift;
      priceDiffer = subscription.pricing?.basePricePerMeal - subscription.pricing?.sellerBasePrice;
      // Calculate expected meals for 30 days without Sundays
      // 30 days = ~4.3 weeks, so ~26 weekdays
      // For 30 days: 26 weekdays * 2 shifts = 52 meals (both shifts), 26 meals (single shift)
      let expectedMealsWithoutSunday = 0;
      if (shift === 'both' && subscription.pricing.totalDays == 30) {
        expectedMealsWithoutSunday = 52; // 26 weekdays * 2 shifts
      } else if ((shift === 'morning' || shift === 'evening') && subscription.pricing.totalDays == 30) {
        expectedMealsWithoutSunday = 26; // 26 weekdays * 1 shift
      } else if (shift === 'both' && subscription.pricing.totalDays == 10) {
        expectedMealsWithoutSunday = 18;
      } else {
        expectedMealsWithoutSunday = 9;
      }

      // If totalMeals > expectedMealsWithoutSunday, then Sundays are included
      const sundaysIncluded = totalMeals >= expectedMealsWithoutSunday;

      if (sundaysIncluded) {
        // Check seller's Sunday availability for this shift
        let canServeSunday = false;

        if (shift === 'both') {
          canServeSunday = sundayAvailability.morning && sundayAvailability.evening;
        } else if (shift === 'morning') {
          canServeSunday = sundayAvailability.morning;
        } else if (shift === 'evening') {
          canServeSunday = sundayAvailability.evening;
        }

        if (!canServeSunday) {
          // Calculate the Sunday meals that can't be served
          if (sundayAvailability.morning || sundayAvailability.evening) {
            const sundayMeals = totalMeals - expectedMealsWithoutSunday;
            const pricePerMeal = (originalAmount - totalMeals * priceDiffer) / totalMeals;
            const sundayAmount = (sundayMeals / 2) * pricePerMeal;
            adjustedAmount = (originalAmount - totalMeals * priceDiffer) - sundayAmount;
          }

          // else if(sundayAvailability.morning&&sundAvailability.evening){
          //       const sundayMeals = totalMeals - expectedMealsWithoutSunday;
          //      const pricePerMeal = (originalAmount - totalMeals*priceDiffer) / totalMeals;
          //      const sundayAmount = sundayMeals * pricePerMeal;
          //      adjustedAmount = ( originalAmount - totalMeals*priceDiffer ) - sundayAmount;
          // }

          else {
            const sundayMeals = totalMeals - expectedMealsWithoutSunday;
            const pricePerMeal = (originalAmount - totalMeals * priceDiffer) / totalMeals;
            const sundayAmount = sundayMeals * pricePerMeal;

            // Adjust the amount by removing Sunday meals that can't be served
            adjustedAmount = (originalAmount - totalMeals * priceDiffer) - sundayAmount;
          }
        }
      }

      adjustedSubscriptionAmount += adjustedAmount;
    });

    // Use adjusted amount for commission calculation
    const commissionRate = totalSubscriptions < 10 ? 0.15 : 0.20; // 15% for <10 subscriptions, 20% for ≥10
    const appCommission = adjustedSubscriptionAmount * commissionRate;
    const sellerEarnings = adjustedSubscriptionAmount - appCommission;
    res.json({
      success: true,
      data: {
        analytics: {
          totalSubscriptions,
          activeSubscriptions,
          pausedSubscriptions,
          expiredSubscriptions,
          totalRevenue: sellerEarnings, // Frontend expects 'totalRevenue' (after Sunday adjustment & commissinon)
          totalSubscriptionAmount: totalSubscriptionAmount, // Original gross amount (what customer paid)
          adjustedSubscriptionAmount: adjustedSubscriptionAmount, // Adjusted amount based on Sunday availability
          appCommission,
          commissionRate: commissionRate * 100, // Send as percentage
          // Add payment information
          advancePayment: sellerPayments.advancePayment || 0,
          receivedPayment: sellerPayments.receivedPayment || 0,
          totalReceivedPayment: sellerPayments.totalReceivedPayment || 0,
          // Sunday availability information
          sundayAvailability: {
            morning: sundayAvailability.morning,
            evening: sundayAvailability.evening
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get seller's subscriptions list without customer details
 */
exports.getSellerSubscriptions = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get all subscriptions for this seller using direct sellerId field
    const subscriptions = await Subscription.find({
      sellerId: sellerId,
      status: 'active'
    })
      .populate('mealPlan', 'title') // Still populate mealPlan for title
      .select({
        _id: 1,
        subscriptionId: 1,
        planType: 1,
        status: 1,
        shift: 1,
        mealCounts: 1,
        deliverySettings: 1,
        startDate: 1,
        endDate: 1,
        createdAt: 1,
        pricing: 1
      })
      .sort({ createdAt: -1 })
      .lean();

    //  console.log("subscriptions",subscriptions[2].mealPlanDetails)
    // Transform data to match frontend expectations
    const formattedSubscriptions = subscriptions.map(sub => ({
      _id: sub._id,
      subscriptionId: sub.subscriptionId,
      planType: sub.planType,
      status: sub.status,
      shift: sub.shift,
      // Frontend looks for these specific field names
      totalMeals: sub.mealCounts?.totalMeals || 0,
      delivered: sub.mealCounts?.mealsDelivered || 0,
      remaining: sub.mealCounts?.mealsRemaining || 0,
      mealCounts: sub.mealCounts, // Also include original structure
      deliverySettings: {
        startDate: sub.deliverySettings?.startDate || sub.startDate,
        endDate: sub.deliverySettings?.lastDeliveryDate || sub.endDate,
        ...sub.deliverySettings
      },
      createdAt: sub.createdAt,
      mealPlan: {
        title: sub.mealPlan?.title || 'Meal Plan'
      },
      pricing: sub.pricing
    }));


    res.json({
      success: true,
      data: {
        subscriptions: formattedSubscriptions,
        totalCount: formattedSubscriptions.length
      }
    });

  } catch (error) {
    console.error('Error fetching seller subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get tiffin delivery history without customer details
 */
exports.getTiffinHistory = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { limit = 50, page = 1, shift, status, startDate, endDate } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = { vendorId: sellerId };

    if (shift && shift !== 'all') {
      query.shift = shift;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    // Date range filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.date.$lte = endOfDay;
      }
    }

    // Get tiffin history from DailyOrder
    const tiffinHistory = await DailyOrder.find(query)
      .populate({
        path: 'subscriptionId',
        select: 'subscriptionId planType pricing' // Include pricing info
      })
      .populate({
        path: 'mealPlan',
        select: 'title items'
      })
      .populate({
        path: 'deliveryPartner',
        select: 'name phone' // Include driver details
      })
      .populate({
        path: 'morning.dailyMealId',
        select: 'items mealName description'
      })
      .populate({
        path: 'evening.dailyMealId',
        select: 'items mealName description'
      })
      .select({
        // Don't include user details
        userId: 0,
        'deliveryAddress': 0 // Remove address for privacy
      })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await DailyOrder.countDocuments(query);

    // Format the response
    const formattedHistory = tiffinHistory.map(item => {
      // Get base price from meal plan or subscription
      const basePrice = item.subscriptionId?.pricing?.basePricePerMeal || 0;

      // Get items from meal plan or daily order
      let items = [];

      // First try to get items from meal plan
      if (item.mealPlan?.items && item.mealPlan.items.length > 0) {
        items = item.mealPlan.items;
      } else {
        // Build items from morning and evening meals
        const mealItems = [];

        if (item.morning) {
          if (item.morning.dailyMealId) {
            // If daily meal is populated, use its items
            const morningMeal = item.morning.dailyMealId;
            if (morningMeal.items && morningMeal.items.length > 0) {
              mealItems.push(...morningMeal.items.map(i => `Morning: ${i.name || i}`));
            } else if (morningMeal.mealName) {
              mealItems.push(`Morning: ${morningMeal.mealName}`);
            } else {
              mealItems.push(`Morning: ${item.morning.mealType || 'Default'}`);
            }
          } else {
            mealItems.push(`Morning: ${item.morning.mealType || 'Default'}`);
          }

          // Add extra items if any
          if (item.morning.customization?.extraItems) {
            item.morning.customization.extraItems.forEach(extra => {
              mealItems.push(`Morning Extra: ${extra.name} x${extra.quantity}`);
            });
          }
        }

        if (item.evening) {
          if (item.evening.dailyMealId) {
            // If daily meal is populated, use its items
            const eveningMeal = item.evening.dailyMealId;
            if (eveningMeal.items && eveningMeal.items.length > 0) {
              mealItems.push(...eveningMeal.items.map(i => `Evening: ${i.name || i}`));
            } else if (eveningMeal.mealName) {
              mealItems.push(`Evening: ${eveningMeal.mealName}`);
            } else {
              mealItems.push(`Evening: ${item.evening.mealType || 'Default'}`);
            }
          } else {
            mealItems.push(`Evening: ${item.evening.mealType || 'Default'}`);
          }

          // Add extra items if any
          if (item.evening.customization?.extraItems) {
            item.evening.customization.extraItems.forEach(extra => {
              mealItems.push(`Evening Extra: ${extra.name} x${extra.quantity}`);
            });
          }
        }

        items = mealItems;
      }

      return {
        _id: item._id,
        subscriptionId: item.subscriptionId?.subscriptionId || item._id,
        planType: item.subscriptionId?.planType || 'Standard',
        date: item.date,
        shift: item.shift,
        status: item.status,
        preparationTime: item.preparationTime,
        deliveredAt: item.deliveredAt,
        isDelayed: item.isDelayed,
        penaltyAmount: item.penaltyAmount || 0,
        mealPlan: item.mealPlan?.title || 'Meal Plan',
        basePrice: basePrice,
        driver: item.assignedDriver ? {
          name: item.assignedDriver.name,
          phone: item.assignedDriver.phone
        } : null,
        items: items,
        // Additional pricing info
        totalExtraCost: item.totalExtraCost || 0,
        totalPaymentAmount: item.totalPaymentAmount || basePrice
      };
    });

    res.json({
      success: true,
      data: formattedHistory,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNextPage: skip + parseInt(limit) < totalCount,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching tiffin history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tiffin history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
