// controllers/sellerController.js
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const MealPlan = require('../models/MealPlan');
const DailyMeal = require('../models/DailyMeal');
const Notification = require('../models/Notification');
const CustomMealRequest = require('../models/CustomMealRequest');
const RestaurantBid = require('../models/RestaurentBid');
const TiffinWashLog = require('../models/TiffinWashlog');
const MenuChange = require('../models/Menuchange');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { BadRequestError } = require('../utils/errors');

/**
 * Get seller dashboard statistics
 */
exports.getDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Use IST timezone for proper date calculation
    const moment = require('moment-timezone');
    const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
    const tomorrow = moment().tz('Asia/Kolkata').startOf('day').add(1, 'day').toDate();

    console.log('Dashboard date range:', { today, tomorrow, sellerId });

    // Today's orders metrics - properly count distinct normal orders (type: 'addon'), not items
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

    // Calculate today's stats properly
    let todayOrdersCount = 0;
    let todayRevenue = 0;
    let customizedOrdersCount = 0;

    todayOrders.forEach(order => {
      // Check if this order belongs to this seller
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();
      const hasSellerItems = order.items && order.items.some(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );

      if (isRestaurantOrder || hasSellerItems) {
        todayOrdersCount++;

        if (order.isCustomized) {
          customizedOrdersCount++;
        }

        // Calculate revenue for this seller
        if (isRestaurantOrder) {
          // If seller owns the restaurant, get full order amount
          todayRevenue += order.totalAmount || 0;
        } else if (hasSellerItems) {
          // If multi-vendor order, calculate seller's portion
          const sellerItems = order.items.filter(item =>
            item.seller && item.seller.toString() === sellerId.toString()
          );
          const sellerAmount = sellerItems.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
          );
          todayRevenue += sellerAmount;
        }
      }
    });

    const todayStats = {
      totalOrders: todayOrdersCount,
      totalRevenue: todayRevenue,
      customizedOrders: customizedOrdersCount
    };

    // Lifetime normal orders metrics - properly count distinct orders (type: 'addon'), not items
    const lifetimeOrders = await Order.find({
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
      ]
    }).lean();

    // Calculate lifetime stats properly
    let lifetimeOrdersCount = 0;
    let lifetimeRevenue = 0;

    lifetimeOrders.forEach(order => {
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();

      if (isRestaurantOrder) {
        // If restaurantId matches, count the order and add total amount
        lifetimeOrdersCount++;
        lifetimeRevenue += order.totalAmount || 0;
      } else {
        // Check if order has items from this seller
        const sellerItems = (order.items || []).filter(item =>
          item.seller && item.seller.toString() === sellerId.toString()
        );

        if (sellerItems.length > 0) {
          lifetimeOrdersCount++;
          // Add seller-specific revenue
          const sellerTotal = sellerItems.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
          );
          lifetimeRevenue += sellerTotal;
        }
      }
    });

    const lifetime = {
      totalOrders: lifetimeOrdersCount,
      totalRevenue: lifetimeRevenue
    };

    // Product statistics
    const productStats = await Product.aggregate([
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          lowStock: {
            $sum: {
              $cond: [
                { $lte: ['$stock', '$lowStockThreshold'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const products = productStats[0] || {
      total: 0,
      active: 0,
      lowStock: 0
    };

    // Meal Plans statistics
    const mealPlanStats = await MealPlan.aggregate([
      { $match: { createdBy: sellerId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
        }
      }
    ]);

    const mealPlans = mealPlanStats[0] || {
      total: 0,
      active: 0
    };

    // Recent orders with detailed information
    const recentOrders = await Order.find({
      'items.seller': sellerId
    })
      .populate('userId', 'name email phone')
      .populate('items.product', 'title images')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Process recent orders to show only seller's items
    const processedRecentOrders = recentOrders.map(order => {
      const sellerItems = order.items.filter(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );

      const sellerTotal = sellerItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
      );

      // Debug: Log college information for each item
      sellerItems.forEach(item => {
        if (item.isCollegeBranded || item.collegeName) {
          console.log('College item found:', {
            itemName: item.name || item.product?.title,
            isCollegeBranded: item.isCollegeBranded,
            collegeName: item.collegeName
          });
        }
      });

      return {
        ...order,
        items: sellerItems,
        totalAmount: sellerTotal,
        customer: order.userId
      };
    });

    // Low stock products
    const lowStockProducts = await Product.find({
      seller: sellerId,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    })
      .select('title stock lowStockThreshold')
      .limit(5)
      .lean()
      .then(products =>
        products.map(product => ({
          _id: product._id,
          name: product.title,
          stock: product.stock,
          threshold: product.lowStockThreshold || 10
        }))
      );

    // Unread notifications
    const notifications = await Notification.find({
      userId: sellerId,
      isRead: false
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Custom meal requests for today
    const todayCustomRequests = await CustomMealRequest.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'open'
    });

    // Pending bids
    const pendingBids = await RestaurantBid.countDocuments({
      restaurantId: sellerId,
      status: 'pending'
    });

    // Calculate live normal orders (orders that are not delivered or cancelled)
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
      status: { $nin: ['delivered', 'cancelled'] }
    }).lean();

    // Count actual live orders for this seller
    let liveOrdersCount = 0;
    liveOrders.forEach(order => {
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();
      const hasSellerItems = order.items && order.items.some(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );

      if (isRestaurantOrder || hasSellerItems) {
        liveOrdersCount++;
      }
    });

    // Get seller commission rate - fixed to 20% as requested
    const commissionRate = 20; // Fixed 20% commission

    // Calculate commission breakdown
    const todayGrossRevenue = Math.round(todayStats.totalRevenue);
    const todayCommission = Math.round((todayGrossRevenue * commissionRate) / 100);
    const todayNetRevenue = todayGrossRevenue - todayCommission;

    const lifetimeGrossRevenue = Math.round(lifetime.totalRevenue);
    const lifetimeCommission = Math.round((lifetimeGrossRevenue * commissionRate) / 100);
    const lifetimeNetRevenue = lifetimeGrossRevenue - lifetimeCommission;


    const liveOrdersBreakdown = {
      pending: 0,
      preparing: 0,
      ready: 0
    };

    liveOrders.forEach(order => {
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();
      const hasSellerItems = order.items && order.items.some(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );

      if (isRestaurantOrder || hasSellerItems) {
        if (order.status === 'pending' || order.status === 'confirmed') liveOrdersBreakdown.pending++;
        if (order.status === 'preparing') liveOrdersBreakdown.preparing++;
        if (order.status === 'ready' || order.status === 'ready_for_pickup') liveOrdersBreakdown.ready++;
      }
    });

    // Calculate unique customers count (proxy for visits)
    const uniqueCustomers = new Set();
    todayOrders.forEach(order => {
      // Check if this order belongs to this seller
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();
      const hasSellerItems = order.items && order.items.some(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );
      if ((isRestaurantOrder || hasSellerItems) && order.userId) {
        uniqueCustomers.add(order.userId.toString());
      }
    });

    res.json({
      success: true,
      data: {
        today: {
          orders: todayStats.totalOrders,
          revenue: todayGrossRevenue,
          netRevenue: todayNetRevenue,
          commission: todayCommission,
          commissionRate: commissionRate,
          customizedOrders: todayStats.customizedOrders,
          nonCustomizedOrders: todayStats.totalOrders - todayStats.customizedOrders,
          customRequests: todayCustomRequests,
          pendingBids: pendingBids,
          visits: uniqueCustomers.size // Real unique customers
        },
        liveOrders: {
          count: liveOrdersCount,
          ...liveOrdersBreakdown // Add breakdown
        },
        inventory: { // Match frontend expectation
          lowStock: products.lowStock || 0,
          outOfStock: products.outOfStock || 0, // Need to ensure products stats includes this
          total: products.total || 0
        },
        lifetime: {
          orders: lifetime.totalOrders,
          revenue: lifetimeGrossRevenue,
          netRevenue: lifetimeNetRevenue,
          commission: lifetimeCommission,
          commissionRate: commissionRate
        },
        products,
        mealPlans,
        recentOrders: processedRecentOrders,
        lowStockProducts,
        notifications: notifications.map(notif => ({
          _id: notif._id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          isRead: notif.isRead,
          createdAt: notif.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Seller dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get seller subscription orders with filtering and pagination
 */
exports.getSubscriptionOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      date = 'all',
      shift = 'both',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const sellerId = req.user._id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('Subscription orders request:', { sellerId, date, status, shift });

    // Build date filter
    let dateFilter = {};
    const today = new Date();

    if (date !== 'all') {
      switch (date) {
        case 'today':
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const startOfYesterday = new Date(yesterday);
          startOfYesterday.setHours(0, 0, 0, 0);
          const endOfYesterday = new Date(yesterday);
          endOfYesterday.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } };
          break;
        case '7d':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = { createdAt: { $gte: weekAgo } };
          break;
        case '30d':
          const monthAgo = new Date(today);
          monthAgo.setDate(monthAgo.getDate() - 30);
          dateFilter = { createdAt: { $gte: monthAgo } };
          break;
      }
    }

    // Convert sellerId to ObjectId for proper comparison
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Build the main query for subscription orders (type: 'gkk')
    const mainQuery = {
      $or: [
        { restaurantId: sellerObjectId },
        { 'items.seller': sellerObjectId }
      ],
      type: 'gkk', // Only subscription orders
      ...dateFilter
    };

    // Add status filter
    if (status && status !== 'all') {
      mainQuery.status = status;
    }

    // Add shift filter for subscription orders
    if (shift && shift !== 'both') {
      mainQuery.deliverySlot = shift;
    }

    // Add search filter
    if (search) {
      mainQuery.$and = mainQuery.$and || [];
      mainQuery.$and.push({
        $or: [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'items.name': { $regex: search, $options: 'i' } }
        ]
      });
    }

    console.log('Subscription orders query:', JSON.stringify(mainQuery, null, 2));

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute the query to get subscription orders
    const orders = await Order.find(mainQuery)
      .populate('userId', 'name email phone')
      .populate('subscriptionId', 'subscriptionId planType')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log('Subscription orders found:', orders.length);

    // Get total count for pagination
    const total = await Order.countDocuments(mainQuery);
    console.log('Total subscription orders count:', total);

    // Process subscription orders to show subscription-specific data
    const processedOrders = orders.map(order => {
      console.log('Processing subscription order:', order.orderNumber);

      let sellerItems = [];
      let sellerTotal = 0;

      // Check if this order belongs to the seller
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();

      if (isRestaurantOrder) {
        // If restaurantId matches, include all items
        sellerItems = order.items || [];
        console.log('Restaurant subscription order - using all items:', sellerItems.length);
      } else {
        // Filter items that have seller field matching the sellerId
        sellerItems = (order.items || []).filter(item =>
          item.seller && item.seller.toString() === sellerId.toString()
        );
        console.log('Multi-vendor subscription order - filtered items:', sellerItems.length);
      }

      // Calculate seller-specific total
      sellerTotal = sellerItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
      );

      console.log('Subscription order totals:', { sellerTotal });

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.userId ? {
          name: order.userId.name,
          phone: order.userId.phone || order.userContactNo,
          email: order.userId.email
        } : {
          name: order.billingAddress?.name || 'N/A',
          phone: order.billingAddress?.phone || 'N/A',
          email: 'N/A'
        },
        items: sellerItems.map(item => ({
          ...item,
          subscriptionId: order.subscriptionId?.subscriptionId,
          planType: order.subscriptionId?.planType
        })),
        totalAmount: isRestaurantOrder ? order.totalAmount : sellerTotal,
        status: order.status,
        type: order.type,
        deliverySlot: order.deliverySlot, // This represents shift for subscription orders
        shift: order.deliverySlot,
        createdAt: order.createdAt,
        deliveryDate: order.deliveryDate,
        orderDate: order.orderDate,
        specialInstructions: order.specialInstructions,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        // Subscription-specific fields
        subscriptionId: order.subscriptionId?.subscriptionId,
        planType: order.subscriptionId?.planType,
        isSubscriptionOrder: true,
        // Timing fields
        preparationStartTime: order.preparationStartTime,
        preparationDeadline: order.preparationDeadline,
        isDelayed: order.isDelayed,
        delayedAt: order.delayedAt,
        delayReason: order.delayReason,
        penaltyAmount: order.penaltyAmount,
        // Driver assignment
        deliveryPartner: order.deliveryPartner,
        // Calculated fields
        itemCount: sellerItems.reduce((sum, item) => sum + item.quantity, 0),
        sellerRevenue: sellerTotal,
        handoverFlag: order.isDelayed ? 'delay' : null
      };
    }).filter(order => order.items.length > 0);

    console.log('Processed subscription orders:', processedOrders.length);

    // Calculate summary statistics
    const summary = {
      totalOrders: processedOrders.length,
      totalRevenue: processedOrders.reduce((sum, order) => sum + (order.sellerRevenue || 0), 0),
      morningOrders: processedOrders.filter(order => order.shift === 'morning').length,
      eveningOrders: processedOrders.filter(order => order.shift === 'evening').length,
      pendingOrders: processedOrders.filter(order => order.status === 'pending').length,
      confirmedOrders: processedOrders.filter(order => order.status === 'confirmed').length,
      deliveredOrders: processedOrders.filter(order => order.status === 'delivered').length,
      totalItems: processedOrders.reduce((sum, order) => sum + order.itemCount, 0)
    };

    res.json({
      success: true,
      data: {
        orders: processedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total: processedOrders.length,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit),
          showing: processedOrders.length
        },
        summary,
        debug: {
          sellerId: sellerId.toString(),
          dateFilter: date,
          finalCount: total,
          processedCount: processedOrders.length
        }
      }
    });

  } catch (error) {
    console.error('Get subscription orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get seller products with filtering and pagination
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      status,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const sellerId = req.user._id;
    // const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = { seller: sellerId };
    // const pr = await Product.find(query);
    if (status) {
      query.isActive = true;
    }

    if (category) {
      query.category = category;
    }

    if (search && !search === "all") {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    console.log(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .lean();
    // console.log(products);
    const total = await Product.countDocuments(query);


    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


/**
 * Get seller orders with filtering and pagination
 */
// exports.getOrders = async (req, res) => {
//   try {
//     const { 
//       page = 1, 
//       limit = 20, 
//       status, 
//       type,
//       customized,
//       search,
//       date = 'all',
//       sortBy = 'createdAt',
//       sortOrder = 'desc'
//     } = req.query;

//     const sellerId = req.user._id;
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Build date filter
//     let dateFilter = {};
//     const today = new Date();

//     switch (date) {
//       case 'today':
//         const startOfDay = new Date(today);
//         startOfDay.setHours(0, 0, 0, 0);
//         const endOfDay = new Date(today);
//         endOfDay.setHours(23, 59, 59, 999);
//         dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
//         break;
//       case 'yesterday':
//         const yesterday = new Date(today);
//         yesterday.setDate(yesterday.getDate() - 1);
//         const startOfYesterday = new Date(yesterday);
//         startOfYesterday.setHours(0, 0, 0, 0);
//         const endOfYesterday = new Date(yesterday);
//         endOfYesterday.setHours(23, 59, 59, 999);
//         dateFilter = { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } };
//         break;
//       case '7d':
//         const weekAgo = new Date(today);
//         weekAgo.setDate(weekAgo.getDate() - 7);
//         dateFilter = { createdAt: { $gte: weekAgo } };
//         break;
//       case '30d':
//         const monthAgo = new Date(today);
//         monthAgo.setDate(monthAgo.getDate() - 30);
//         dateFilter = { createdAt: { $gte: monthAgo } };
//         break;
//     }

//     // Build aggregation pipeline
//     const pipeline = [
//       {
//         $match: {
//           'items.seller': sellerId,
//           ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
//         }
//       },
//       {
//         $addFields: {
//           sellerItems: {
//             $filter: {
//               input: '$items',
//               cond: { $eq: ['$$this.seller', sellerId] }
//             }
//           }
//         }
//       }
//     ];

//     const rs = await Order.aggregate([
//       ...pipeline,
//     ]);

//     // Add additional filters
//     if (status && status !== 'all') {
//       pipeline.push({ $match: { status } });
//     }

//     if (type && type !== 'all') {
//       pipeline.push({ $match: { type } });
//     }

//     if (customized && customized !== 'all') {
//       pipeline.push({ 
//         $match: { 
//           isCustomized: customized === 'true' 
//         } 
//       });
//     }

//     if (search) {
//       pipeline.push({
//         $match: {
//           $or: [
//             { orderNumber: { $regex: search, $options: 'i' } },
//             { 'sellerItems.name': { $regex: search, $options: 'i' } }
//           ]
//         }
//       });
//     }

//     // Add population
//     pipeline.push(
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'userId',
//           foreignField: '_id',
//           as: 'customer'
//         }
//       },
//       {
//         $unwind: '$customer'
//       }
//     );

//     // Add sorting
//     const sortObj = {};
//     sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
//     pipeline.push({ $sort: sortObj });

//     // Execute aggregation for orders
//     const ordersResult = await Order.aggregate([
//       ...pipeline,
//       { $skip: skip },
//       { $limit: parseInt(limit) }
//     ]);

//     // Get total count
//     const totalResult = await Order.aggregate([
//       ...pipeline,
//       { $count: 'total' }
//     ]);

//     const total = totalResult[0]?.total || 0;

//     // Process orders to calculate seller-specific totals
//     const processedOrders = ordersResult.map(order => {
//       const sellerTotal = order.sellerItems.reduce((sum, item) => 
//         sum + (item.price * item.quantity), 0
//       );

//       return {
//         _id: order._id,
//         orderNumber: order.orderNumber,
//         customer: {
//           name: order.customer.name,
//           phone: order.customer.phone,
//           email: order.customer.email
//         },
//         items: order.sellerItems,
//         totalAmount: sellerTotal,
//         status: order.status,
//         type: order.type,
//         isCustomized: order.isCustomized,
//         deliverySlot: order.deliverySlot,
//         createdAt: order.createdAt,
//         deliveryDate: order.deliveryDate,
//         specialInstructions: order.specialInstructions,
//         customizations: order.customizationCharges?.items || []
//       };
//     });

//     res.json({
//       success: true,
//       data: {
//         orders: processedOrders,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(total / parseInt(limit)),
//           total,
//           hasNext: skip + parseInt(limit) < total,
//           hasPrev: parseInt(page) > 1,
//           limit: parseInt(limit)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get orders error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch orders',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };


exports.getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      status,
      type,
      customized,
      search,
      date = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const sellerId = req.user._id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // console.log('Seller ID:', sellerId);
    // console.log('Date filter:', date);

    // Build date filter
    let dateFilter = {};
    const today = new Date();

    if (date !== 'all') {
      switch (date) {
        case 'today':
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const startOfYesterday = new Date(yesterday);
          startOfYesterday.setHours(0, 0, 0, 0);
          const endOfYesterday = new Date(yesterday);
          endOfYesterday.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } };
          break;
        case '7d':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = { createdAt: { $gte: weekAgo } };
          break;
        case '30d':
          const monthAgo = new Date(today);
          monthAgo.setDate(monthAgo.getDate() - 30);
          dateFilter = { createdAt: { $gte: monthAgo } };
          break;
      }
    }

    console.log('Date filter applied:', dateFilter);

    // Convert sellerId to ObjectId for proper comparison
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Build the main query for normal orders (type: 'addon' or legacy orders without type)
    const mainQuery = {
      $and: [
        {
          $or: [
            { restaurantId: sellerObjectId }, // Main restaurant field
            { 'items.seller': sellerObjectId } // Individual item seller field
          ]
        },
        {
          $or: [
            { type: 'addon' },
            { type: 'gkk' }, // Normal addon orders
            { type: { $exists: false } }, // Legacy orders without type field
            { type: null } // Orders with null type
          ]
        }
      ]
    };

    // Add date filter only if it's not 'all'
    if (Object.keys(dateFilter).length > 0) {
      Object.assign(mainQuery, dateFilter);
    }

    // console.log('Main query:', JSON.stringify(mainQuery, null, 2));

    // Test queries for debugging
    const testQuery = await Order.find(mainQuery).countDocuments();
    console.log('Test query count:', testQuery);

    if (testQuery === 0) {
      const restaurantQuery = await Order.find({ restaurantId: sellerObjectId }).countDocuments();
      const itemsSellerQuery = await Order.find({ 'items.seller': sellerObjectId }).countDocuments();
      console.log('Restaurant query count:', restaurantQuery);
      console.log('Items seller query count:', itemsSellerQuery);

      // Check what orders exist for debugging
      const allOrders = await Order.find({}).select('orderNumber restaurantId items.seller');
      // console.log('Sample orders in DB:', allOrders);
    }

    // Build additional filters
    const additionalFilters = {};

    if (status && status !== 'all') {
      additionalFilters.status = status;
    }

    if (type && type !== 'all') {
      additionalFilters.type = type;
    }

    if (customized && customized !== 'all') {
      additionalFilters.isCustomized = customized === 'true';
    }

    // Combine all filters
    const finalQuery = { ...mainQuery, ...additionalFilters };

    // Add search filter
    if (search) {
      finalQuery.$and = finalQuery.$and || [];
      finalQuery.$and.push({
        $or: [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'items.name': { $regex: search, $options: 'i' } }
        ]
      });
    }

    console.log('Final query:', JSON.stringify(finalQuery, null, 2));

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute the query to get orders
    const orders = await Order.find(finalQuery)
      .populate('userId', 'name email phone')
      .sort(sortObj)
      // .skip(skip)
      // .limit(parseInt(limit))
      .lean();

    console.log('Orders found:', orders.length);

    // Get total count for pagination
    const total = await Order.countDocuments(finalQuery);
    console.log('Total count:', total);

    // Process orders to show only seller-specific data
    const processedOrders = orders.map(order => {
      console.log('Processing order:', order.orderNumber);

      let sellerItems = [];
      let sellerTotal = 0;
      let customizationTotal = 0;

      // Check if this order belongs to the seller
      const isRestaurantOrder = order.restaurantId && order.restaurantId.toString() === sellerId.toString();

      if (isRestaurantOrder) {
        // If restaurantId matches, include all items
        sellerItems = order.items || [];
        console.log('Restaurant order - using all items:', sellerItems.length);
      } else {
        // Filter items that have seller field matching the sellerId
        sellerItems = (order.items || []).filter(item =>
          item.seller && item.seller.toString() === sellerId.toString()
        );
        console.log('Multi-vendor order - filtered items:', sellerItems.length);
      }

      // Calculate seller-specific total
      sellerTotal = sellerItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
      );

      // Get customization charges for this seller
      if (order.customizationCharges && order.customizationCharges.items) {
        const customizations = order.customizationCharges.items;
        const sellerCustomizations = customizations.filter(customItem => {
          return sellerItems.some(item =>
            item.customizations && item.customizations.includes(customItem.name)
          );
        });
        customizationTotal = sellerCustomizations.reduce((sum, item) =>
          sum + (item.price * item.quantity), 0
        );
      } else {
        customizationTotal = order.customizationCharges?.total || 0;
      }

      console.log('Totals:', { sellerTotal, customizationTotal });

      // Calculate countdown information for active orders
      let countdownInfo = null;
      let delayInfo = null;

      if (['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(order.status)) {
        // Get countdown info if order has preparation deadline
        if (order.preparationDeadline) {
          const now = new Date();
          const timeRemaining = new Date(order.preparationDeadline) - now;
          const minutesRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60)));
          const isOverdue = timeRemaining < 0;

          countdownInfo = {
            preparationDeadline: order.preparationDeadline,
            timeRemaining: Math.max(0, timeRemaining),
            minutesRemaining,
            isOverdue,
            isDelayed: order.isDelayed,
            delayReason: order.delayReason,
            penaltyAmount: order.penaltyAmount
          };

          delayInfo = {
            isDelayed: order.isDelayed,
            delayReason: order.delayReason,
            delayedAt: order.delayedAt,
            timeRemaining: minutesRemaining,
            isOverdue,
            delayMinutes: isOverdue ? Math.floor((now - new Date(order.preparationDeadline)) / (1000 * 60)) : 0
          };
        } else if (order.status === 'confirmed' && !order.preparationStartTime) {
          // If order is confirmed but preparation hasn't started, start the countdown
          const preparationDurationMinutes = order.preparationDurationMinutes || 25;
          const preparationDeadline = new Date(Date.now() + preparationDurationMinutes * 60 * 1000);

          countdownInfo = {
            preparationDeadline,
            timeRemaining: preparationDurationMinutes * 60 * 1000,
            minutesRemaining: preparationDurationMinutes,
            isOverdue: false,
            isDelayed: false,
            delayReason: null,
            penaltyAmount: 0
          };

          delayInfo = {
            isDelayed: false,
            delayReason: null,
            delayedAt: null,
            timeRemaining: preparationDurationMinutes,
            isOverdue: false,
            delayMinutes: 0
          };
        }
      }

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.userId ? {
          name: order.userId.name,
          phone: order.userId.phone || order.userContactNo,
          email: order.userId.email
        } : {
          name: order.billingAddress?.name || 'N/A',
          phone: order.billingAddress?.phone || 'N/A',
          email: 'N/A'
        },
        items: sellerItems.map(item => ({
          ...item,
          // Ensure college information is included
          collegeName: item.collegeName || null,
          isCollegeBranded: item.isCollegeBranded || false
        })),
        totalAmount: isRestaurantOrder ? order.totalAmount : (sellerTotal + customizationTotal),
        status: order.status,
        type: order.type,
        isCustomized: order.isCustomized || false,
        deliverySlot: order.deliverySlot,
        createdAt: order.createdAt,
        deliveryDate: order.deliveryDate,
        orderDate: order.orderDate,
        specialInstructions: order.specialInstructions,
        customizations: order.customizationCharges?.items || [],
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        billingAddress: order.billingAddress,
        // Additional fields from actual schema
        subtotal: isRestaurantOrder ? order.subtotal : sellerTotal,
        discountAmount: order.discountAmount || 0,
        taxes: order.taxes,
        transactionId: order.transactionId,
        paymentDetails: order.paymentDetails,
        refunds: order.refunds || [],
        isGift: order.isGift || false,
        isAutoOrder: order.isAutoOrder || false,
        isPartOfSubscription: order.isPartOfSubscription || false,
        specialSunday: order.specialSunday || false,
        // Preparation and timing fields
        preparationStartTime: order.preparationStartTime,
        preparationDeadline: order.preparationDeadline,
        preparationDurationMinutes: order.preparationDurationMinutes || 25,
        isDelayed: order.isDelayed,
        delayedAt: order.delayedAt,
        delayReason: order.delayReason,
        penaltyAmount: order.penaltyAmount,
        // Countdown and delay information
        countdownInfo,
        delayInfo,
        // Calculated fields
        itemCount: sellerItems.reduce((sum, item) => sum + item.quantity, 0),
        hasCustomizations: order.isCustomized && (order.customizationCharges?.items?.length > 0),
        sellerRevenue: sellerTotal + customizationTotal
      };
    }).filter(order => order.items.length > 0);

    console.log('Processed orders:', processedOrders.length);

    // Only show normal orders in this API - subscription orders will have separate API

    // Calculate summary statistics for normal orders only
    const summary = {
      totalOrders: processedOrders.length,
      totalRevenue: processedOrders.reduce((sum, order) => sum + (order.sellerRevenue || 0), 0),
      customizedOrders: processedOrders.filter(order => order.isCustomized).length,
      averageOrderValue: processedOrders.length > 0 ?
        Math.round(processedOrders.reduce((sum, order) => sum + (order.sellerRevenue || 0), 0) / processedOrders.length) : 0,
      pendingOrders: processedOrders.filter(order => order.status === 'pending').length,
      confirmedOrders: processedOrders.filter(order => order.status === 'confirmed').length,
      totalItems: processedOrders.reduce((sum, order) => sum + order.itemCount, 0)
    };

    res.json({
      success: true,
      data: {
        orders: processedOrders,
        pagination: {
          // currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total: processedOrders.length,
          // hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit),
          showing: processedOrders.length
        },
        summary,
        debug: {
          sellerId: sellerId.toString(),
          dateFilter: date,
          queryCount: testQuery,
          finalCount: total,
          processedCount: processedOrders.length
        }
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get thali orders only for specific seller (68af25f91cf5e34b4cbc47ad)
 */
exports.getThaliOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      status,
      search,
      date = 'today',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    if (!(req.user.id == "68aac6dd973de34afcf19fc3")) {
      return res.json({ success: true, data: [] })
    }
    // Thali IDs to filter for
    const THALI_NAMES = [
      "Special Dining Thali", // Special Dining Thali
      "Royal Dining Experience", // Royal Dining Thali
      "Everyman's Thali"  // Everyman's Thali
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build date filter
    let dateFilter = {};
    const today = new Date();

    if (date !== 'all') {
      switch (date) {
        case 'today':
          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const startOfYesterday = new Date(yesterday);
          startOfYesterday.setHours(0, 0, 0, 0);
          const endOfYesterday = new Date(yesterday);
          endOfYesterday.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } };
          break;
        case '7d':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = { createdAt: { $gte: weekAgo } };
          break;
        case '30d':
          const monthAgo = new Date(today);
          monthAgo.setDate(monthAgo.getDate() - 30);
          dateFilter = { createdAt: { $gte: monthAgo } };
          break;
      }
    }

    // Build query to find orders that contain thali items
    const mainQuery = {
      'items': {
        $elemMatch: {
          'name': { $in: THALI_NAMES }
        }
      }
    };

    // Add date filter
    if (Object.keys(dateFilter).length > 0) {
      Object.assign(mainQuery, dateFilter);
    }

    // Build additional filters
    const additionalFilters = {};

    if (status && status !== 'all') {
      additionalFilters.status = status;
    }

    // Combine all filters
    const finalQuery = { ...mainQuery, ...additionalFilters };

    // Add search filter
    if (search) {
      finalQuery.$and = finalQuery.$and || [];
      finalQuery.$and.push({
        $or: [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'items.name': { $regex: search, $options: 'i' } }
        ]
      });
    }

    console.log('Thali orders query:', JSON.stringify(finalQuery, null, 2));

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute the query to get orders
    const orders = await Order.find(finalQuery)
      .populate('userId', 'name email phone')
      .sort(sortObj)
      .lean();

    console.log('Thali orders found:', orders.length);

    // Process orders to show only thali items
    const processedOrders = orders.map(order => {
      // Filter only thali items from the order
      const thaliItems = (order.items || []).filter(item => {
        const itemName = item.name ? item.name.toString() : '';
        return THALI_NAMES.includes(itemName);
      });

      // Calculate thali-specific total
      const thaliTotal = thaliItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
      );

      // Calculate countdown information for active orders
      let countdownInfo = null;
      let delayInfo = null;

      if (['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(order.status)) {
        if (order.preparationDeadline) {
          const now = new Date();
          const timeRemaining = new Date(order.preparationDeadline) - now;
          const minutesRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60)));
          const isOverdue = timeRemaining < 0;

          countdownInfo = {
            preparationDeadline: order.preparationDeadline,
            timeRemaining: Math.max(0, timeRemaining),
            minutesRemaining,
            isOverdue,
            isDelayed: order.isDelayed,
            delayReason: order.delayReason,
            penaltyAmount: order.penaltyAmount
          };

          delayInfo = {
            isDelayed: order.isDelayed,
            delayReason: order.delayReason,
            delayedAt: order.delayedAt,
            timeRemaining: minutesRemaining,
            isOverdue,
            delayMinutes: isOverdue ? Math.floor((now - new Date(order.preparationDeadline)) / (1000 * 60)) : 0
          };
        }
      }

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        customer: order.userId ? {
          name: order.userId.name,
          phone: order.userId.phone,
          email: order.userId.email
        } : {
          name: order.billingAddress?.name || 'N/A',
          phone: order.billingAddress?.phone || 'N/A',
          email: 'N/A'
        },
        items: thaliItems, // Only thali items
        totalAmount: thaliTotal, // Only thali items total
        status: order.status,
        type: order.type,
        deliverySlot: order.deliverySlot,
        createdAt: order.createdAt,
        deliveryDate: order.deliveryDate,
        orderDate: order.orderDate,
        specialInstructions: order.specialInstructions,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        billingAddress: order.billingAddress,

        // Subscription fields if applicable
        subscriptionId: order.subscriptionId,
        planType: order.planType,
        isSubscriptionOrder: order.isSubscriptionOrder || order.type === 'gkk',
        shift: order.deliverySlot,

        // Timing fields
        preparationStartTime: order.preparationStartTime,
        preparationDeadline: order.preparationDeadline,
        preparationTime: order.preparationTime,
        isDelayed: order.isDelayed,
        delayedAt: order.delayedAt,
        delayReason: order.delayReason,
        penaltyAmount: order.penaltyAmount,
        handoverFlag: order.isDelayed ? 'delay' : null,

        // Countdown and delay information
        countdownInfo,
        delayInfo,

        // Additional fields
        itemCount: thaliItems.reduce((sum, item) => sum + item.quantity, 0),
        viewedBySellers: order.viewedBySellers || []
      };
    }).filter(order => order.items.length > 0); // Only orders with thali items

    // Apply pagination to processed orders
    const total = processedOrders.length;
    const paginatedOrders = processedOrders.slice(skip, skip + parseInt(limit));

    console.log('Processed thali orders:', paginatedOrders.length, 'of', total);

    // Calculate summary statistics
    const summary = {
      totalOrders: total,
      totalRevenue: processedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      pendingOrders: processedOrders.filter(order => order.status === 'pending').length,
      confirmedOrders: processedOrders.filter(order => order.status === 'confirmed').length,
      preparingOrders: processedOrders.filter(order => order.status === 'preparing').length,
      readyOrders: processedOrders.filter(order => order.status === 'ready').length,
      deliveredOrders: processedOrders.filter(order => order.status === 'delivered').length,
      totalItems: processedOrders.reduce((sum, order) => sum + order.itemCount, 0)
    };

    res.json({
      success: true,
      data: {
        orders: paginatedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit),
          showing: paginatedOrders.length
        },
        summary
      }
    });

  } catch (error) {
    console.error('Get thali orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thali orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

exports.getSellerOrderStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { period = '30d' } = req.query;

    // Build date filter
    let dateFilter = {};
    const today = new Date();

    switch (period) {
      case 'today':
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
        break;
      case '7d':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { createdAt: { $gte: weekAgo } };
        break;
      case '30d':
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        dateFilter = { createdAt: { $gte: monthAgo } };
        break;
    }

    const stats = await Order.aggregate([
      {
        $match: {
          'items.seller': sellerId,
          ...dateFilter
        }
      },
      {
        $addFields: {
          sellerItems: {
            $filter: {
              input: '$items',
              cond: { $eq: ['$$this.seller', sellerId] }
            }
          }
        }
      },
      {
        $addFields: {
          sellerTotal: {
            $reduce: {
              input: '$sellerItems',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  { $multiply: ['$$this.price', '$$this.quantity'] }
                ]
              }
            }
          },
          hasAddons: {
            $gt: [{
              $size: {
                $filter: {
                  input: '$sellerItems',
                  cond: { $eq: ['$$this.category', 'addon'] }
                }
              }
            }, 0]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$sellerTotal' },
          customizedOrders: {
            $sum: {
              $cond: [{ $eq: ['$isCustomized', true] }, 1, 0]
            }
          },
          ordersWithAddons: {
            $sum: {
              $cond: ['$hasAddons', 1, 0]
            }
          },
          averageOrderValue: { $avg: '$sellerTotal' },
          statuses: {
            $push: '$status'
          },
          types: {
            $push: '$type'
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      customizedOrders: 0,
      ordersWithAddons: 0,
      averageOrderValue: 0,
      statuses: [],
      types: []
    };

    // Calculate breakdown
    const statusBreakdown = result.statuses.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const typeBreakdown = result.types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        ...result,
        statusBreakdown,
        typeBreakdown,
        customizationRate: result.totalOrders > 0 ?
          (result.customizedOrders / result.totalOrders * 100).toFixed(2) : 0,
        addonRate: result.totalOrders > 0 ?
          (result.ordersWithAddons / result.totalOrders * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Get seller order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update order status for seller's items
 */
/**
 * @desc    Update seller password
 * @route   PUT /api/seller/update-password
 * @access  Private (Seller)
 */
exports.updateSellerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const seller = req.user;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, seller.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    seller.password = await bcrypt.hash(newPassword, salt);

    // Save the updated seller
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error updating seller password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// =============================================
// Get Seller Profile
// =============================================
/**
 * @route   GET /api/seller/profile
 * @desc    Get seller profile
 * @access  Private (Seller)
 */
exports.getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Find seller and exclude sensitive fields
    const seller = await User.findById(sellerId)
      .select('-password -__v -resetPasswordToken -resetPasswordExpire -otp -otpExpire')
      .populate({
        path: 'sellerProfile.bankDetails',
        select: '-_id -__v -seller',
        options: { strictPopulate: false } // Allow populating non-existent paths
      });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Calculate seller statistics
    const [totalProducts, activeProducts, totalOrders, totalRevenue] = await Promise.all([
      Product.countDocuments({ seller: sellerId }),
      Product.countDocuments({ seller: sellerId, isActive: true }),
      Order.countDocuments({ 'items.seller': sellerId }),
      Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.seller': sellerId } },
        { $group: { _id: null, total: { $sum: '$items.price' } } }
      ])
    ]);

    // Prepare response data
    const responseData = {
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      avatar: seller.avatar,
      role: seller.role,
      isVerified: seller.isVerified,
      isActive: seller.isActive,
      sellerProfile: {
        ...(seller.sellerProfile?.toObject?.() || {}),
        bankDetails: seller.sellerProfile?.bankDetails || null
      },
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        rating: seller.sellerProfile?.rating || 0,
        totalReviews: seller.sellerProfile?.totalReviews || 0
      },
      createdAt: seller.createdAt,
      updatedAt: seller.updatedAt
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateDeliverySettings = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const sellerId = req.user._id;

    const validStatuses = [
      'pending', 'confirmed', 'preparing', 'ready',
      'out-for-delivery', 'delivered', 'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if seller has items in this order
    const hasSellerItems = order.items.some(item =>
      item.seller && item.seller.toString() === sellerId.toString()
    );

    if (!hasSellerItems) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this order'
      });
    }

    // Update order status
    order.status = status;

    // Add to status history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: notes || `Status updated to ${status} by seller`
    });

    // Set delivery time if delivered
    if (status === 'delivered') {
      order.actualDelivery = new Date();
    }

    await order.save();

    // Create notification for customer
    await Notification.create({
      userId: order.userId,
      title: 'Order Status Updated',
      message: `Your order #${order.orderNumber} status has been updated to ${status}`,
      type: 'order',
      data: {
        orderId: order._id,
        status,
        orderNumber: order.orderNumber
      }
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order._id,
        status: order.status,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get seller meal plans
 */
exports.getMealPlans = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      tier,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const sellerId = req.user._id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = { createdBy: sellerId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (tier && tier !== 'all') {
      query.tier = tier;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const mealPlans = await MealPlan.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await MealPlan.countDocuments(query);

    res.json({
      success: true,
      data: {
        mealPlans,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plans',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get seller analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    console.log("hellow motop")
    const { period = '7d', startDate, endDate } = req.query;
    const sellerId = req.user._id;

    let dateRange = {};
    const now = new Date();

    switch (period) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateRange = { $gte: today, $lt: tomorrow };
        break;
      case '7d':
        dateRange = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          $lte: now
        };
        break;
      case '30d':
        dateRange = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          $lte: now
        };
        break;
      case '90d':
        dateRange = {
          $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          $lte: now
        };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateRange = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        break;
    }

    // Revenue and order trends
    const orderTrends = await Order.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          'items.seller': sellerId,
          createdAt: dateRange
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] }
          },
          orders: { $sum: 1 },
          customizedOrders: {
            $sum: { $cond: ['$isCustomized', 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          'items.seller': sellerId,
          createdAt: dateRange,
          status: { $in: ['delivered', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: '$items.name',
          sales: { $sum: '$items.quantity' },
          revenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] }
          }
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 10 }
    ]);

    // Order type breakdown
    const orderTypeBreakdown = await Order.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          'items.seller': sellerId,
          createdAt: dateRange
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            isCustomized: '$isCustomized'
          },
          count: { $sum: 1 },
          revenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] }
          }
        }
      }
    ]);

    // Calculate totals
    const totals = await Order.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          'items.seller': sellerId,
          createdAt: dateRange
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] }
          },
          totalOrders: { $sum: 1 },
          customizedOrders: {
            $sum: { $cond: ['$isCustomized', 1, 0] }
          }
        }
      }
    ]);

    const summary = totals[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      customizedOrders: 0
    };

    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: Object.keys(dateRange).length ? new Date(dateRange.$gte) : null,
          end: Object.keys(dateRange).length ? new Date(dateRange.$lte || dateRange.$lt) : null
        },
        summary: {
          ...summary,
          averageOrderValue: summary.totalOrders > 0
            ? Math.round(summary.totalRevenue / summary.totalOrders)
            : 0,
          customizationRate: summary.totalOrders > 0
            ? Math.round((summary.customizedOrders / summary.totalOrders) * 100)
            : 0
        },
        orderTrends,
        topProducts,
        orderTypeBreakdown
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get seller notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      isRead,
      type
    } = req.query;

    const sellerId = req.user._id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { userId: sellerId };

    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: sellerId,
      isRead: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Mark notification as read
 */
exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: sellerId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().select('name _id')?.lean();
    return res.status(200).json({
      status: "ok",
      message: "category received succesfully",
      data: categories
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "An error occured at server side",
      error: error.message
    })
  }

}





















exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const sellerId = req.user._id;

    const validStatuses = [
      'pending', 'confirmed', 'preparing', 'ready',
      'out-for-delivery', 'delivered', 'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const THALI_NAMES = ['Special Dining Thali', 'Royal Dining Experience', "Everyman's Thali"]

    // Check if seller has items in this order
    const hasSellerItems = order.items.some(item =>
      item.seller && item.seller.toString() === sellerId.toString() || (THALI_NAMES.includes(item.name) && req.user.id == '68aac6dd973de34afcf19fc3')
    );

    if (!hasSellerItems) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this order'
      });
    }

    // Special handling for 'ready' status - mark restaurant ready for handover
    if (status === 'ready') {
      await order.markRestaurantReady(sellerId);
    } else {
      // Update order status normally
      order.status = status;

      // Add to status history
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: notes || `Status updated to ${status} by seller`
      });

      // Set delivery time if delivered
      if (status === 'delivered') {
        order.actualDelivery = new Date();
      }

      await order.save();
    }

    // Create notification for customer
    await Notification.create({
      userId: order.userId,
      title: 'Order Status Updated',
      message: `Your order #${order.orderNumber} status has been updated to ${status}`,
      type: 'order',
      data: {
        orderId: order._id,
        status,
        orderNumber: order.orderNumber
      }
    });

    // Get updated order with delay info
    const updatedOrder = await Order.findById(orderId);
    const delayInfo = updatedOrder.getDelayInfo();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        orderId: order._id,
        status: updatedOrder.status,
        updatedAt: new Date(),
        delayInfo,
        timeRemaining: updatedOrder.timeRemaining,
        isOverdue: updatedOrder.isOverdue,
        handoverFlag: updatedOrder.handoverFlag
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Mark order ready for handover (Restaurant Ready)
 */
exports.markOrderReady = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if seller has items in this order
    const hasSellerItems = order.items.some(item =>
      item.seller && item.seller.toString() === sellerId.toString()
    );

    if (!hasSellerItems) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this order'
      });
    }

    await order.markRestaurantReady(sellerId);

    res.json({
      success: true,
      message: 'Order marked as ready for handover',
      data: {
        orderId: order._id,
        handoverStatus: order.handoverDetails.handoverStatus,
        markedReadyAt: order.handoverDetails.restaurantMarkedReady.markedAt,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Mark order ready error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark order ready',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get delayed orders for seller dashboard
 */
exports.getDelayedOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const delayedOrders = await Order.find({
      'items.seller': sellerId,
      isDelayed: true,
      status: { $nin: ['delivered', 'cancelled'] }
    })
      .populate('userId', 'name email phone')
      .populate('deliveryPartner', 'name phone')
      .sort({ delayedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const totalDelayed = await Order.countDocuments({
      'items.seller': sellerId,
      isDelayed: true,
      status: { $nin: ['delivered', 'cancelled'] }
    });

    // Enhance orders with delay info
    const enhancedOrders = delayedOrders.map(order => {
      const delayMinutes = order.preparationDeadline ?
        Math.floor((new Date() - new Date(order.preparationDeadline)) / (1000 * 60)) : 0;

      return {
        ...order,
        delayInfo: {
          delayMinutes,
          delayReason: order.delayReason,
          isOverdue: new Date() > new Date(order.preparationDeadline)
        }
      };
    });

    res.json({
      success: true,
      data: {
        orders: enhancedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalDelayed / limit),
          totalItems: totalDelayed,
          hasNext: page < Math.ceil(totalDelayed / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get delayed orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delayed orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


// Get all products for seller
exports.getSellerProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
    const sellerId = req.user.id;

    // Build query
    let query = { seller: sellerId };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate({
        path: 'seller',
        select: 'sellerProfile.storeStatus',
        populate: {
          path: 'sellerProfile',
          select: 'storeStatus'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
      .exec();

    // Add storeStatus to each product
    products.forEach(product => {
      product.storeStatus = product.seller?.sellerProfile?.storeStatus || 'open';
    });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      seller: req.user.id,
      createdBy: req.user.id
    };

    const product = new Product(productData);
    await product.save();

    await product.populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create product'
    });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user.id
    }).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update product'
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  }
  catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

// Toggle product status
exports.toggleProductStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      { isActive },
      { new: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: product
    });
  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product status'
    });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    const { stock, lowStockThreshold } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      { stock, lowStockThreshold },
      { new: true }
    ).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check for low stock and emit socket event
    if (stock <= lowStockThreshold) {
      req.io.to(`seller_${req.user.id}`).emit('lowStockAlert', {
        product: product,
        message: `${product.title} is running low on stock`
      });
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock'
    });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      seller: req.user.id,
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    })
      .populate('category', 'name')
      .sort({ stock: 1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products'
    });
  }

  // Bulk update prices


  // Update seller profile

  // Update delivery settings
  // exports.updateDeliverySettings = async (req, res) => {
  //   try {
  //     const sellerId = req.user._id;
  //     const { deliverySettings } = req.body;

  //     if (!deliverySettings) {



  // Update product price controller

  // Toggle shop shutdown status
};
exports.bulkUpdatePrices = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { products } = req.body;

    // Input validation
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required'
      });
    }

    // Validate each product in the array
    const validProducts = products.filter(product =>
      product.productId &&
      typeof product.price === 'number' &&
      product.price >= 0
    );

    if (validProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid products provided. Each product must have a valid productId and positive price.'
      });
    }

    // Prepare bulk operations
    const bulkOps = validProducts.map(product => ({
      updateOne: {
        filter: { _id: product.productId, seller: sellerId },
        update: {
          $set: {
            price: product.price,
            updatedAt: new Date()
          },
          $push: {
            priceHistory: {
              date: new Date(),
              price: product.price,
              updatedBy: sellerId
            }
          }
        }
      }
    }));

    // Execute bulk operation
    const result = await Product.bulkWrite(bulkOps);

    // Emit socket event if needed
    if (req.io) {
      req.io.emit('pricesUpdated', {
        sellerId,
        updatedCount: result.modifiedCount,
        timestamp: new Date()
      });
    }

    // Return success response
    res.json({
      success: true,
      message: 'Prices updated successfully',
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount
      }
    });
  } catch (error) {
    console.error('Bulk update prices error:', error);

    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Default error response
    res.status(500).json({
      success: false,
      message: 'Failed to update prices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// exports.updateSellerProfile = async (req, res) => {
//   try {
//     const updateData = req.body;

//     // Remove sensitive fields
//     delete updateData.password;
//     delete updateData.role;

//     const seller = await User.findByIdAndUpdate(
//       req.user.id,
//       updateData,
//       { new: true, runValidators: true }
//     ).select('-password');

//     res.json({
//       success: true,
//       message: 'Profile updated successfully',
//       data: seller
//     });
//   } catch (error) {
//     console.error('Update seller profile error:', error);
//     res.status(400).json({
//       success: false,
//       message: error.message || 'Failed to update profile'
//     });
//   }
// };
exports.updatePricesForCategory = async (req, res) => {
  try {
    const { updates } = req.body; // Array of {id, price}
    const targetCategoryId = '6882f8f15b1ba9254864dfe7'; // Your specific category ID

    // First verify all products belong to the required category
    const productIds = updates.map(update => update.id);
    const products = await Product.find({
      _id: { $in: productIds },
      seller: req.user.id
    });

    // Check if any product doesn't belong to the target category
    const invalidProducts = products.filter(
      product => product.category.toString() !== targetCategoryId
    );

    if (invalidProducts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some products do not belong to the required category',
        invalidProductIds: invalidProducts.map(p => p._id)
      });
    }

    // Prepare bulk operations
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: {
          _id: update.id,
          seller: req.user.id,
          category: targetCategoryId // Additional safety check
        },
        update: {
          price: update.price,
          $push: {
            priceHistory: {
              date: new Date(),
              price: update.price
            }
          }
        }
      }
    }));

    const result = await Product.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: 'Prices updated successfully for category',
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  }
  catch (error) {
    console.error('Update prices for category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prices for category'
    });
  }
};


exports.toggleShopShutdown = async (req, res) => {
  try {
    const { isShutdown, reason } = req.body;

    // Input validation
    if (typeof isShutdown !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isShutdown must be a boolean value'
      });
    }

    const newStatus = isShutdown ? 'closed' : 'open';
    const statusReason = reason || (isShutdown ? 'Shop temporarily closed' : 'Shop reopened');

    const seller = await User.findByIdAndUpdate(
      req.user.id,
      {
        'sellerProfile.storeStatus': newStatus,
        'sellerProfile.statusReason': statusReason,
        'sellerProfile.lastStatusUpdate': new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Emit socket event if socket.io is available
    if (req.io) {
      req.io.emit('shopStatusChanged', {
        sellerId: req.user.id,
        status: newStatus,
        reason: statusReason,
        timestamp: new Date()
      });
    }

    // Log the status change
    console.log(`Shop ${newStatus} by seller ${req.user.id}: ${statusReason}`);

    // Return success response
    res.json({
      success: true,
      message: `Shop ${isShutdown ? 'shutdown' : 'reopened'} successfully`,
      data: {
        status: seller.sellerProfile.storeStatus,
        reason: seller.sellerProfile.statusReason,
        lastUpdated: seller.sellerProfile.lastStatusUpdate
      }
    });
  } catch (error) {
    console.error('Toggle shop shutdown error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors ? Object.values(error.errors).map(e => e.message) : []
      });
    }

    // Default error response
    res.status(500).json({
      success: false,
      message: 'Failed to update shop status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Add this to your existing routes file
exports.getShopStatus = async (req, res) => {
  try {
    const seller = await User.findById(req.user.id)
      .select('sellerProfile.storeStatus sellerProfile.statusReason sellerProfile.lastStatusUpdate');

    if (!seller || !seller.sellerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: seller.sellerProfile.storeStatus,
        reason: seller.sellerProfile.statusReason,
        lastUpdated: seller.sellerProfile.lastStatusUpdate
      }
    });
  } catch (error) {
    console.error('Get shop status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shop status'
    });
  }
};





// Bulk update regular prices
exports.bulkUpdatePrices = async (req, res) => {
  try {
    const { updates } = req.body;
    const sellerId = req.user.id;

    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id, seller: sellerId },
        update: {
          price: update.price,
          $push: {
            priceHistory: {
              date: new Date(),
              price: update.price,
            },
          },
        },
      },
    }));

    const result = await Product.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "Prices updated successfully",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Bulk price update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update prices",
    });
  }
};

// Bulk update weight option prices
exports.bulkUpdateWeightPrices = async (req, res) => {
  try {
    const { updates } = req.body;
    const sellerId = req.user.id;

    const bulkOps = updates.map((update) => {
      const updatePath = `weightOptions.${update.weightIndex}.price`;
      return {
        updateOne: {
          filter: { _id: update.productId, seller: sellerId },
          update: {
            [updatePath]: update.price,
            $push: {
              priceHistory: {
                date: new Date(),
                price: update.price,
                weight: update.weight,
              },
            },
          },
        },
      };
    });

    const result = await Product.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "Weight prices updated successfully",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Bulk weight price update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update weight prices",
    });
  }
};


























exports.updateProductPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const sellerId = req.user.id;

    // Validate price
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, seller: sellerId },
      {
        price,
        $push: {
          priceHistory: {
            date: new Date(),
            price: price
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you are not authorized'
      });
    }

    res.json({
      success: true,
      message: 'Price updated successfully',
      data: {
        newPrice: product.price,
        updatedAt: product.updatedAt,
        priceHistory: product.priceHistory
      }
    });
  } catch (error) {
    console.error('Update price error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(val => val.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update price',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};















// =============================================
// Update Seller Profile
// =============================================
/**
 * @route   PUT /api/seller/profile
 * @desc    Update seller profile
 * @access  Private (Seller)
 */
exports.updateSellerProfile = async (req, res) => {
  try {
    const { name, storeName, phone, address, avatar } = req.body;
    const sellerId = req.user.id;

    // Find the seller
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Update basic profile fields
    if (name) seller.name = name;
    if (phone) seller.phone = phone;
    if (avatar) seller.avatar = avatar; // Update avatar if provided

    // Update seller profile fields
    if (!seller.sellerProfile) {
      seller.sellerProfile = {};
    }

    if (storeName) seller.sellerProfile.storeName = storeName;
    if (address) seller.sellerProfile.storeAddress = address;

    // Save the updated seller
    await seller.save();

    // Return the updated profile (excluding sensitive data)
    const updatedSeller = await User.findById(sellerId)
      .select('-password -__v -resetPasswordToken -resetPasswordExpire -otp -otpExpire')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedSeller
    });

  } catch (error) {
    console.error('Update seller profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Get single order by ID for seller
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const sellerId = req.user._id;

    console.log('Getting order:', orderId, 'for seller:', sellerId);

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Find order that belongs to this seller
    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { restaurantId: sellerObjectId },
        { 'items.seller': sellerObjectId }
      ]
    })
      .populate('userId', 'name email phone')
      .populate('items.product', 'name price')
      .populate('restaurantId', 'name storeAddress')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not authorized'
      });
    }

    // Filter items to show only those belonging to this seller
    if (order.items) {
      order.items = order.items.filter(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );
    }

    res.status(200).json({
      success: true,
      message: 'Order fetched successfully',
      data: order
    });

  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Generate invoice for an order
 */
exports.generateOrderInvoice = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const sellerId = req.user._id;

    console.log('=== INVOICE GENERATION REQUEST ===');
    console.log('Invoice generation request:', {
      orderId,
      sellerId,
      userInfo: req.user
    });
    console.log('Request URL:', req.originalUrl);
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);

    if (!mongoose.isValidObjectId(orderId)) {
      console.log('Invalid order ID format:', orderId);
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Find order that belongs to this seller
    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { restaurantId: sellerObjectId },
        { 'items.seller': sellerObjectId }
      ]
    })
      .populate('userId', 'name email phone address')
      .populate('items.product', 'name price')
      .populate('restaurantId', 'name storeAddress phone email')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not authorized'
      });
    }

    // Filter items to show only those belonging to this seller
    let sellerItems = [];
    let sellerTotal = 0;

    if (order.items) {
      sellerItems = order.items.filter(item =>
        item.seller && item.seller.toString() === sellerId.toString()
      );
      sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Generate HTML invoice
    const invoiceDate = new Date().toLocaleDateString('en-IN');
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN');

    const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice - Order #${order.orderNumber}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; }
            .company-name { color: #4CAF50; font-size: 28px; font-weight: bold; margin-bottom: 5px; }
            .invoice-title { font-size: 24px; margin-bottom: 10px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .invoice-info div { width: 48%; }
            .section-title { font-weight: bold; margin-bottom: 10px; color: #4CAF50; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .items-table th { background-color: #4CAF50; color: white; }
            .items-table tr:nth-child(even) { background-color: #f9f9f9; }
            .total-section { text-align: right; margin-top: 20px; }
            .total-amount { font-size: 18px; font-weight: bold; color: #4CAF50; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">Tastyaana</div>
            <div class="invoice-title">Invoice</div>
        </div>

        <div class="invoice-info">
            <div>
                <div class="section-title">Bill To:</div>
                <strong>Order #${order.orderNumber}</strong><br>
                Order Date: ${orderDate}<br>
                Payment Method: ${order.paymentMethod || 'Not specified'}<br>
                Status: ${order.status}
            </div>
            <div>
                <div class="section-title">Invoice Details:</div>
                Invoice #: INV-${order.orderNumber}<br>
                Invoice Date: ${invoiceDate}<br>
                Seller: ${order.restaurantId?.name || 'Tastyaana Seller'}
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${sellerItems.map(item => `
                    <tr>
                        <td>${item.name || item.product?.name || 'Unknown Item'}</td>
                        <td>${item.quantity}</td>
                        <td>₹${item.price.toFixed(2)}</td>
                        <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="total-section">
            <div>Subtotal: ₹${sellerTotal.toFixed(2)}</div>
            ${order.deliveryCharges ? `<div>Delivery Charges: ₹${order.deliveryCharges.toFixed(2)}</div>` : ''}
            ${order.discount ? `<div>Discount: -₹${order.discount.toFixed(2)}</div>` : ''}
            <div class="total-amount">Total Amount: ₹${sellerTotal.toFixed(2)}</div>
        </div>

        <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice. No signature required.</p>
            <p>For any queries, contact us at support@tastyaana.com</p>
        </div>

        <script>
            window.onload = function() {
                window.print();
            }
        </script>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${order.orderNumber}.html"`);
    res.send(invoiceHTML);

  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mark order as viewed by seller
 */
exports.markOrderAsViewed = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user._id;

    console.log('=== MARK ORDER AS VIEWED ===');
    console.log('Mark order as viewed:', { orderId, sellerId });

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Find order that belongs to this seller
    const order = await Order.findOne({
      _id: orderId,
      $or: [
        { sellerId: sellerId },
        { 'items.seller': sellerId }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized access'
      });
    }

    // Update order to mark as viewed by this seller
    await Order.findByIdAndUpdate(orderId, {
      $addToSet: {
        viewedBySellers: sellerId
      }
    });

    console.log('Order marked as viewed by seller:', sellerId);

    res.status(200).json({
      success: true,
      message: 'Order marked as viewed'
    });

  } catch (error) {
    console.error('Mark order as viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark order as viewed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};