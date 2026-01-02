// controllers/adminController.js - Admin Panel Controller
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Analytics = require('../models/Analytics');
const Return = require('../models/Return');
const Driver = require('../models/Driver');
const DeliveryTracking = require('../models/DeliveryTracking');
const { sendEmail, emailTemplates } = require('../utils/email');
const { createNotification } = require('../utils/notificationService');
const Subscription = require('../models/Subscription');
const MealPlan = require('../models/MealPlan');
const DailyMeal = require('../models/DailyMeal');
const MealCustomization = require('../models/MealCustomization');
const moment = require('moment-timezone');
const ExcelJS = require('exceljs');
const ReplaceableItem = require('../models/replaceableItems');

/**
 * Generate an admin-friendly summary of meal customizations
 * @param {Object} customization - The customization object
 * @param {Object} replacementMeal - The replacement meal details
 * @returns {String} Human-readable customization summary for admin panel
 */
function generateAdminCustomizationSummary(customization, replacementMeal) {
  const summaryParts = [];
  
  // Replacement meal
  if (replacementMeal) {
    summaryParts.push(`Meal: ${replacementMeal.name}`);
  }
  
  // Dietary preferences
  if (customization.dietaryPreference && customization.dietaryPreference !== 'regular') {
    summaryParts.push(`Diet: ${customization.dietaryPreference}`);
  }
  
  // Spice level
  if (customization.spiceLevel && customization.spiceLevel !== 'medium') {
    summaryParts.push(`Spice: ${customization.spiceLevel}`);
  }
  
  // Preferences
  const prefs = customization.preferences;
  if (prefs) {
    const prefStrings = [];
    if (prefs.noOnion) prefStrings.push('No Onion');
    if (prefs.noGarlic) prefStrings.push('No Garlic');
    if (prefs.noDairy) prefStrings.push('No Dairy');
    if (prefs.noNuts) prefStrings.push('No Nuts');
    if (prefStrings.length > 0) {
      summaryParts.push(`Avoid: ${prefStrings.join(', ')}`);
    }
    if (prefs.specialInstructions) {
      summaryParts.push(`Special: ${prefs.specialInstructions}`);
    }
  }
  
  // Add-ons
  if (customization.addons && customization.addons.length > 0) {
    const addonNames = customization.addons.map(addon => 
      `${addon.name} (₹${addon.price} x${addon.quantity})`
    ).join(', ');
    summaryParts.push(`Addons: ${addonNames}`);
  }
  
  // Extra items
  if (customization.extraItems && customization.extraItems.length > 0) {
    const extraNames = customization.extraItems.map(extra => 
      `${extra.name} (₹${extra.price} x${extra.quantity})`
    ).join(', ');
    summaryParts.push(`Extras: ${extraNames}`);
  }
  
  // Price adjustment info
  if (customization.totalpayablePrice > 0) {
    summaryParts.push(`+₹${customization.totalpayablePrice} (${customization.paymentStatus})`);
  } else if (customization.totalpayablePrice < 0) {
    summaryParts.push(`-₹${Math.abs(customization.totalpayablePrice)} discount`);
  }
  
  return summaryParts.length > 0 ? summaryParts.join(' | ') : 'Customized';
}

// Admin Dashboard
// 
exports.getAdminDashboard = async (req, res) => {
  try {

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      platformStats,
      sellerStats,
      recentOrders,
      revenueStats,
      systemHealth
    ] = await Promise.all([
      getPlatformStats(),
      getSellerStats(),
      getRecentOrders(),
      getRevenueStats(today),
      getSystemHealth()
    ]);

    res.json({
      platform: platformStats,
      sellers: sellerStats,
      orders: recentOrders,
      revenue: revenueStats,
      system: systemHealth,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Seller Management
exports.getSellers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    let query = { role: 'seller' };
    
    if (status) {
      if (status === 'approved') query['sellerInfo.isApproved'] = true;
      else if (status === 'pending') query['sellerInfo.isApproved'] = false;
      else if (status === 'active') query.isActive = true;
      else if (status === 'inactive') query.isActive = false;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'sellerInfo.storeName': { $regex: search, $options: 'i' } }
      ];
    }

    const sellers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get seller performance metrics
    const sellersWithMetrics = await Promise.all(
      sellers.map(async (seller) => {
        const metrics = await getSellerMetrics(seller._id);
        return {
          ...seller.toObject(),
          metrics
        };
      })
    );

    res.json({
      sellers: sellersWithMetrics,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { approved, reason } = req.body;

    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.sellerInfo.isApproved = approved;
    if (!approved && reason) {
      seller.sellerInfo.rejectionReason = reason;
    }

    await seller.save();

    // Send email notification
    const template = approved ? 'sellerApproved' : 'sellerRejected';
    const { subject, html, text } = emailTemplates[template](seller, reason);
    await sendEmail(seller.email, subject, html, text);

    res.json({ 
      message: `Seller ${approved ? 'approved' : 'rejected'} successfully`,
      seller: seller.toObject()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSellerCommission = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { commissionRate } = req.body;

    if (commissionRate < 0 || commissionRate > 50) {
      return res.status(400).json({ message: 'Commission rate must be between 0% and 50%' });
    }

    const seller = await User.findByIdAndUpdate(
      sellerId,
      { 'sellerInfo.commissionRate': commissionRate },
      { new: true }
    ).select('-password');

    res.json({ seller });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Orders Management
exports.getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      seller, 
      startDate, 
      endDate,
      search 
    } = req.query;

    let matchStage = {};
    
    if (status) matchStage.status = status;
    if (seller) matchStage['items.seller'] = seller;
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (search) {
      matchStage.orderNumber = { $regex: search, $options: 'i' };
    }

    const orders = await Order.find(matchStage)
      .populate('userId', 'name email phone')
      .populate('deliveryPartner', 'name phone email isOnline')
      .populate('items.seller', 'name sellerProfile.storeName')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(matchStage);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all delivery boys
exports.getDeliveryBoys = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;

    let query = { role: 'delivery' };
    
    if (status) {
      query.isActive = status === 'active';
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const deliveryBoys = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get active deliveries count for each delivery boy
    const deliveryBoysWithStats = await Promise.all(
      deliveryBoys.map(async (deliveryBoy) => {
        const activeDeliveries = await Order.countDocuments({
          deliveryPartner: deliveryBoy._id,
          status: { $in: ['confirmed', 'preparing', 'ready', 'out-for-delivery'] }
        });

        return {
          ...deliveryBoy.toObject(),
          activeDeliveries
        };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      deliveryBoys: deliveryBoysWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching delivery boys:', error);
    res.status(500).json({ message: error.message });
  }
};

// Assign delivery boy to order
exports.assignDeliveryBoy = async (req, res) => {
  try {
    const { orderId, deliveryBoyId } = req.body;

    if (!orderId || !deliveryBoyId) {
      return res.status(400).json({ 
        message: 'Order ID and Delivery Boy ID are required' 
      });
    }

    // Find the order
    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.deliveryPartner) {
      return res.status(400).json({ 
        message: 'Order already has a delivery partner assigned' 
      });
    }

    // Find the delivery boy
    const deliveryBoy = await User.findOne({ 
      _id: deliveryBoyId, 
      role: 'delivery', 
      isActive: true 
    });

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found or inactive' });
    }

    // Update order with delivery partner
    order.deliveryPartner = deliveryBoyId;
    if (order.status === 'pending') {
      order.status = 'confirmed';
    }
    
    // Add status history
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: `Delivery partner ${deliveryBoy.name} assigned`,
      updatedBy: req.user.id
    });

    await order.save();

    // Create or update delivery tracking record
    let tracking = await DeliveryTracking.findOne({ orderId: order._id.toString() });
    if (!tracking) {
      tracking = new DeliveryTracking({
        orderId: order._id.toString(),
        status: 'assigned',
        driverId: deliveryBoyId,
        timeline: [{
          status: 'order_placed',
          timestamp: order.createdAt,
          description: 'Order has been placed successfully',
          completed: true
        }, {
          status: 'assigned',
          timestamp: new Date(),
          description: `Delivery partner ${deliveryBoy.name} has been assigned to your order`,
          completed: true
        }],
        deliveryAddress: order.deliveryAddress
      });
    } else {
      tracking.driverId = deliveryBoyId;
      tracking.status = 'assigned';
      tracking.timeline.push({
        status: 'assigned',
        timestamp: new Date(),
        description: `Delivery partner ${deliveryBoy.name} has been assigned to your order`,
        completed: true
      });
    }

    // Set driver location if available
    if (deliveryBoy.driverProfile?.currentLocation) {
      tracking.currentLocation = deliveryBoy.driverProfile.currentLocation;
    }

    await tracking.save();

    // Create notification for delivery boy
    await createNotification({
      userId: deliveryBoyId,
      type: 'order_assigned',
      title: 'New Delivery Assignment',
      message: `You have been assigned to deliver order ${order.orderNumber}`,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.userId.name,
        customerPhone: order.userContactNo,
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.totalAmount
      }
    });

    // Send email notification to delivery boy
    try {
      const emailSubject = `New Delivery Assignment - Order ${order.orderNumber}`;
      const emailContent = `
        <h2>New Delivery Assignment</h2>
        <p>Hello ${deliveryBoy.name},</p>
        <p>You have been assigned a new delivery:</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px;">
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Customer:</strong> ${order.userId.name}</p>
          <p><strong>Phone:</strong> ${order.userContactNo}</p>
          <p><strong>Amount:</strong> ₹${order.totalAmount}</p>
          <p><strong>Delivery Address:</strong> ${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}</p>
          ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ''}
        </div>
        <p>Please log into your delivery dashboard to view full details and start the delivery process.</p>
        <p>Thank you!</p>
      `;

      await sendEmail(deliveryBoy.email, emailSubject, emailContent);
    } catch (emailError) {
      console.error('Error sending assignment email:', emailError);
      // Don't fail the assignment if email fails
    }

    // Emit real-time updates via sockets
    try {
      const socketService = req.app.get('socketService');
      
      if (socketService) {
        const driverData = {
          id: deliveryBoy._id,
          name: deliveryBoy.name,
          phone: deliveryBoy.phone,
          rating: deliveryBoy.rating || 4.5,
          vehicle: deliveryBoy.driverProfile?.vehicle || { type: 'bike', number: 'Coming Soon' },
          currentLocation: deliveryBoy.driverProfile?.currentLocation
        };

        const notificationData = {
          orderId: order._id,
          orderNumber: order.orderNumber,
          driver: driverData,
          status: 'assigned',
          timeline: tracking.timeline,
          message: `Driver ${deliveryBoy.name} has been assigned to your order`,
          timestamp: new Date()
        };

        // Emit to user-specific room for immediate notification
        if (order.userId) {
          socketService.io.to(`user-${order.userId}`).emit('driver-assigned-realtime', notificationData);
          console.log(`✅ Real-time driver assignment emitted to user ${order.userId}`);
        }

        // Emit to tracking room for this order
        socketService.io.to(`tracking-${order._id}`).emit('driver-assigned-realtime', notificationData);
        console.log(`✅ Real-time driver assignment emitted to tracking room ${order._id}`);

        // Legacy status update (for backward compatibility)
        socketService.io.to(`tracking-${order._id}`).emit('status-update', {
          status: 'assigned',
          timeline: tracking.timeline,
          driver: driverData
        });

        // Use order socket service for broader notifications if available
        if (socketService.orderSocketService) {
          socketService.orderSocketService.emitDriverAssignmentNotification({
            ...order.toObject(),
            deliveryPartner: {
              _id: deliveryBoy._id,
              name: deliveryBoy.name,
              phone: deliveryBoy.phone,
              rating: deliveryBoy.rating,
              vehicle: deliveryBoy.driverProfile?.vehicle
            }
          });
        }

        console.log(`✅ Real-time driver assignment notifications sent for order ${order._id}`);
      }
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
      // Don't fail the assignment if socket fails
    }

    const updatedOrder = await Order.findById(orderId)
      .populate('userId', 'name email phone')
      .populate('deliveryPartner', 'name phone email');

    res.json({
      success: true,
      message: 'Delivery boy assigned successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error assigning delivery boy:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get admin stats
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      pendingOrders,
      confirmedOrders,
      deliveredOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      User.countDocuments({ role: { $in: ['buyer', 'customer'] } }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: { $in: ['confirmed', 'preparing', 'ready'] } }),
      Order.countDocuments({ status: 'delivered' })
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.json({
      stats: {
        totalOrders,
        totalRevenue: revenue,
        totalCustomers,
        totalProducts,
        pendingOrders,
        confirmedOrders,
        deliveredOrders
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// Product Management
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      seller, 
      status,
      search 
    } = req.query;

    let query = {};
    
    if (category) query.category = category;
    if (seller) query.seller = seller;
    if (status !== undefined) query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('seller', 'name sellerInfo.storeName')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      { 
        isActive: false,
        adminNotes: reason 
      },
      { new: true }
    ).populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Notify seller
    const { subject, html, text } = emailTemplates.productRemoved(product, reason);
    await sendEmail(product.seller.email, subject, html, text);

    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Financial Management
exports.getFinancialDashboard = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const dateRange = getDateRange(period);

    const [
      revenueMetrics,
      commissionData,
      payoutData,
      taxData
    ] = await Promise.all([
      calculatePlatformRevenue(dateRange),
      calculateCommissionBreakdown(dateRange),
      getPendingPayouts(),
      calculateTaxSummary(dateRange)
    ]);

    res.json({
      revenue: revenueMetrics,
      commissions: commissionData,
      payouts: payoutData,
      tax: taxData,
      period,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.processPayouts = async (req, res) => {
  try {
    const { sellerIds, payoutDate } = req.body;

    const payoutResults = [];
    
    for (const sellerId of sellerIds) {
      try {
        const payout = await processSinglePayout(sellerId, payoutDate);
        payoutResults.push({
          sellerId,
          status: 'success',
          amount: payout.amount,
          transactionId: payout.transactionId
        });
      } catch (error) {
        payoutResults.push({
          sellerId,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      message: 'Payout processing completed',
      results: payoutResults
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// System Analytics
exports.getSystemAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const dateRange = getDateRange(period);

    const analytics = await Promise.all([
      getUserGrowthAnalytics(dateRange),
      getOrderVolumeAnalytics(dateRange),
      getRevenueGrowthAnalytics(dateRange),
      getPopularCategoriesAnalytics(dateRange),
      getGeographicAnalytics(dateRange),
      getPerformanceMetrics()
    ]);

    res.json({
      userGrowth: analytics[0],
      orderVolume: analytics[1],
      revenueGrowth: analytics[2],
      popularCategories: analytics[3],
      geographic: analytics[4],
      performance: analytics[5],
      period,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper Functions
exports.getPlatformStats = async () => {
  const [totalUsers, totalSellers, totalProducts, totalOrders] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'seller', 'sellerInfo.isApproved': true }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments()
  ]);

  return { totalUsers, totalSellers, totalProducts, totalOrders };
};

exports.getSellerStats = async () => {
  const stats = await User.aggregate([
    { $match: { role: 'seller' } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: {
          $sum: { $cond: ['$sellerInfo.isApproved', 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $not: '$sellerInfo.isApproved' }, 1, 0] }
        },
        active: {
          $sum: { $cond: ['$isActive', 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || { total: 0, approved: 0, pending: 0, active: 0 };
};

exports.getSellerMetrics = async (sellerId) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const metrics = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 
      'items.seller': sellerId,
      createdAt: { $gte: thirtyDaysAgo }
    }},
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$items.price' },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$items.price' }
      }
    }
  ]);

  const productCount = await Product.countDocuments({ 
    seller: sellerId, 
    isActive: true 
  });

  return {
    revenue30d: metrics[0]?.totalRevenue || 0,
    orders30d: metrics[0]?.totalOrders || 0,
    avgOrderValue: metrics[0]?.avgOrderValue || 0,
    activeProducts: productCount
  };
};

exports.calculatePlatformRevenue = async (dateRange) => {
  const revenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalTax: { $sum: '$taxAmount' },
        totalShipping: { $sum: '$shippingAmount' },
        totalDiscount: { $sum: '$discountAmount' },
        orderCount: { $sum: 1 }
      }
    }
  ]);

  return revenue[0] || {
    totalRevenue: 0,
    totalTax: 0,
    totalShipping: 0,
    totalDiscount: 0,
    orderCount: 0
  };
};

exports.processSinglePayout = async (sellerId, payoutDate) => {
  // Calculate payout amount
  const cutoffDate = new Date(payoutDate);
  const lastPayout = await getLastPayoutDate(sellerId);
  
  const earnings = await Order.aggregate([
    { $unwind: '$items' },
    {
      $match: {
        'items.seller': sellerId,
        paymentStatus: 'paid',
        createdAt: { 
          $gte: lastPayout,
          $lte: cutoffDate 
        }
      }
    },
    {
      $group: {
        _id: null,
        grossAmount: { $sum: '$items.price' },
        orderCount: { $sum: 1 }
      }
    }
  ]);

  if (!earnings[0] || earnings[0].grossAmount === 0) {
    throw new Error('No earnings to payout');
  }

  const seller = await User.findById(sellerId);
  const commissionRate = seller.sellerInfo.commissionRate / 100;
  const commission = earnings[0].grossAmount * commissionRate;
  const netAmount = earnings[0].grossAmount - commission;

  // Process payment (integrate with payment gateway)
  const transactionId = await processPayment(seller, netAmount);

  // Record payout
  await recordPayout({
    sellerId,
    grossAmount: earnings[0].grossAmount,
    commission,
    netAmount,
    transactionId,
    payoutDate: cutoffDate,
    orderCount: earnings[0].orderCount
  });

  return { amount: netAmount, transactionId };
};

























exports.getDailySubscriptionMeals = async (req, res) => {
  try {
    const {
      date = moment().tz('Asia/Kolkata').format('YYYY-MM-DD'),
      shift = 'both',
      status = 'all',
      planId = 'all',
      search = '',
      page = 1,
      limit = 50
    } = req.query;

    console.log('Getting daily meals for date:', date, 'shift:', shift);

    // Build match conditions
    const matchConditions = {
      status: 'active',
      $or: [
        { endDate: { $gte: new Date(date) } },
        { 'deliverySettings.lastDeliveryDate': { $gte: new Date(date) } }
      ],
      $and: [
        {
          $or: [
            { startDate: { $lte: new Date(date) } },
            { 'deliverySettings.startDate': { $lte: new Date(date) } }
          ]
        }
      ]
    };

    // Plan filter
    if (planId !== 'all') {
      matchConditions.$or = [
        { mealPlan: planId },
        { defaultMeal: planId }
      ];
    }

    // Search filter
    let userMatchConditions = {};
    if (search) {
      userMatchConditions = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get active subscriptions
    const subscriptions = await Subscription.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
          pipeline: search ? [{ $match: userMatchConditions }] : []
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'mealplans',
          localField: 'mealPlan',
          foreignField: '_id',
          as: 'mealPlan'
        }
      },
      { $unwind: '$mealPlan' },
      {
        $lookup: {
          from: 'mealplans',
          localField: 'defaultMeal',
          foreignField: '_id',
          as: 'defaultMeal'
        }
      }
    ]);

    console.log(`Found ${subscriptions} active subscriptions`);

    // Process each subscription for the specific date
    const dailyMeals = [];
    const selectedDate = moment.tz(date, 'Asia/Kolkata').startOf('day');

    for (const subscription of subscriptions) {
      const shifts = subscription.mealPlan?.shifts || ['morning', 'evening'];
      
      for (const mealShift of shifts) {
        // Skip if filtering by specific shift
        if (shift !== 'both' && shift !== mealShift) continue;

        // Note: Removed Sunday evening skip - meals should be delivered every day as per subscription shift

        // Check if meal is skipped
        const isSkipped = subscription.skippedMeals?.some(skip => {
          const skipDate = moment(skip.date).tz('Asia/Kolkata').startOf('day');
          return skipDate.isSame(selectedDate, 'day') && skip.shift === mealShift;
        });

        // Check if meal is replaced
        const replacement = subscription.customizations?.find(rep => {
          const repDate = moment(rep.date).tz('Asia/Kolkata').startOf('day');
          return repDate.isSame(selectedDate, 'day') && rep.shift === mealShift;
        });

        // Check if meal is customized
        const customization = await MealCustomization.findOne({
          subscription: subscription._id,
          date: {
            $gte: selectedDate.toDate(),
            $lt: selectedDate.clone().add(1, 'day').toDate()
          },
          shift: mealShift,
          isActive: true
        });

        // Validate customization payment status
        let validCustomization = null;
        if (customization) {
          const paymentValid = customization.paymentStatus === 'paid' || 
                              (customization.totalpayablePrice <= 0) ||
                              customization.paymentStatus === 'not_required';
          
          if (paymentValid) {
            validCustomization = customization;
          }
        }

        // Apply status filter
        const mealStatus = isSkipped ? 'skipped' : 
                          replacement ? 'replaced' : 
                          validCustomization ? 'customized' : 'active';

        if (status !== 'all' && status !== mealStatus) continue;

        // Get replacement thali details if exists
        let replacementThali = null;
        if (replacement && replacement.newThaliId) {
          replacementThali = await ReplaceableItem.findById(replacement.newThaliId);
        }

        // Get customization replacement meal details if exists
        let customizationReplacementMeal = null;
        let customizationSummary = null;
        if (validCustomization && validCustomization.replacementMeal) {
          try {
            customizationReplacementMeal = await ReplaceableItem.findById(validCustomization.replacementMeal);
          } catch (error) {
            console.error('Error fetching customization replacement meal:', error);
          }
        }

        // Generate customization summary for admin display
        if (validCustomization) {
          customizationSummary = generateAdminCustomizationSummary(validCustomization, customizationReplacementMeal);
        }

        // Create meal object
        const mealData = {
          user: {
            _id: subscription.user._id,
            name: subscription.user.name,
            email: subscription.user.email,
            phone: subscription.user.phone,
            address: subscription.user.addresses?.find(addr => addr.isDefault) || subscription.user.addresses?.[0],
            subscriptions: [{
              _id: subscription._id,
              mealPlan: subscription.mealPlan,
              status: subscription.status
            }]
          },
          subscription: {
            _id: subscription._id,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate
          },
          mealPlan: subscription.mealPlan,
          shift: mealShift,
          date: selectedDate.toDate(),
          isSkipped: isSkipped,
          isReplaced: !!replacement,
          isCustomized: !!validCustomization,
          skipReason: isSkipped ? subscription.skippedMeals.find(skip => {
            const skipDate = moment(skip.date).tz('Asia/Kolkata').startOf('day');
            return skipDate.isSame(selectedDate, 'day') && skip.shift === mealShift;
          })?.description : null,
          replacementThali: replacementThali,
          customization: validCustomization,
          customizationReplacementMeal: customizationReplacementMeal,
          customizationSummary: customizationSummary,
          deliveryAddress: subscription.user.addresses?.find(addr => addr.isDefault) || subscription.user.addresses?.[0]
        };

        dailyMeals.push(mealData);
      }
    }

    // Sort meals by user name and shift
    dailyMeals.sort((a, b) => {
      const nameCompare = a.user.name.localeCompare(b.user.name);
      if (nameCompare !== 0) return nameCompare;
      return a.shift.localeCompare(b.shift);
    });

    const paginatedMeals = dailyMeals;

    // Calculate summary statistics
    const summary = {
      totalMeals: dailyMeals.length,
      activeMeals: dailyMeals.filter(meal => !meal.isSkipped && !meal.isReplaced && !meal.isCustomized).length,
      skippedMeals: dailyMeals.filter(meal => meal.isSkipped).length,
      replacedMeals: dailyMeals.filter(meal => meal.isReplaced).length,
      customizedMeals: dailyMeals.filter(meal => meal.isCustomized).length,
      morningMeals: dailyMeals.filter(meal => meal.shift === 'morning').length,
      eveningMeals: dailyMeals.filter(meal => meal.shift === 'evening').length
    };

    res.json({
      success: true,
      data: paginatedMeals,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: dailyMeals.length,
        totalPages: Math.ceil(dailyMeals.length / limit)
      }
    });

  } catch (error) {
    console.error('Error getting daily subscription meals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily subscription meals',
      error: error.message
    });
  }
};

/**
 * Update daily meal status
 */
exports.updateDailyMealStatus = async (req, res) => {
  try {
    const { mealId } = req.params;
    const { status, date, notes } = req.body;

    // Here you would implement the logic to update meal status
    // This might involve updating subscription records, creating meal delivery records, etc.

    res.json({
      success: true,
      message: 'Meal status updated successfully',
      data: {
        mealId,
        status,
        date,
        notes,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error updating meal status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meal status',
      error: error.message
    });
  }
};

/**
 * Export daily meals data
 */
exports.exportDailyMeals = async (req, res) => {
  try {
    const {
      date = moment().tz('Asia/Kolkata').format('YYYY-MM-DD'),
      shift = 'both',
      status = 'all',
      planId = 'all',
      format = 'excel'
    } = req.query;

    // Get the same data as the main query (without pagination)
    const { data: meals } = await getDailySubscriptionMeals({
      query: { date, shift, status, planId, limit: 10000 }
    });

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Daily Meals');

      // Add headers
      worksheet.columns = [
        { header: 'User Name', key: 'userName', width: 20 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Shift', key: 'shift', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Meal Plan', key: 'mealPlan', width: 20 },
        { header: 'Replacement', key: 'replacement', width: 20 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Skip Reason', key: 'skipReason', width: 25 }
      ];

      // Add data
      meals.forEach(meal => {
        worksheet.addRow({
          userName: meal.user.name,
          phone: meal.user.phone,
          email: meal.user.email,
          shift: meal.shift,
          status: meal.isSkipped ? 'Skipped' : meal.isReplaced ? 'Replaced' : meal.isCustomized ? 'Customized' : 'Active',
          mealPlan: meal.mealPlan.name,
          replacement: meal.replacementThali?.name || '',
          address: meal.user.address ? `${meal.user.address.line1}, ${meal.user.address.city}` : '',
          skipReason: meal.skipReason || ''
        });
      });

      // Style the header
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E6F1' }
        };
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=daily-meals-${date}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();

    } else {
      // CSV format
      const csvData = meals.map(meal => ({
        'User Name': meal.user.name,
        'Phone': meal.user.phone,
        'Email': meal.user.email,
        'Shift': meal.shift,
        'Status': meal.isSkipped ? 'Skipped' : meal.isReplaced ? 'Replaced' : meal.isCustomized ? 'Customized' : 'Active',
        'Meal Plan': meal.mealPlan.name,
        'Replacement': meal.replacementThali?.name || '',
        'Address': meal.user.address ? `${meal.user.address.line1}, ${meal.user.address.city}` : '',
        'Skip Reason': meal.skipReason || ''
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=daily-meals-${date}.csv`);
      
      // Simple CSV generation (you might want to use a library like csv-writer)
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      res.send(csvContent);
    }

  } catch (error) {
    console.error('Error exporting daily meals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export daily meals',
      error: error.message
    });
  }
};

/**
 * Get daily meal statistics
 */
exports.getDailyMealStats = async (req, res) => {
  try {
    const { date = moment().tz('Asia/Kolkata').format('YYYY-MM-DD') } = req.query;

    // Use the same logic as getDailySubscriptionMeals but return only stats
    const { summary } = await getDailySubscriptionMeals({ query: { date, limit: 10000 } });

    res.json({
      success: true,
      data: {
        date,
        ...summary,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting daily meal stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily meal statistics',
      error: error.message
    });
  }
};

/**
 * Get all meal plans for admin
 */
exports.getMealPlans = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status, category } = req.query;

    // Build query conditions
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.isActive = status === 'active';
    }
    
    if (category) {
      query.category = category;
    }

    // Get meal plans with conditional population based on schema
    let mealPlansQuery = MealPlan.find(query);

    // Only populate fields that exist in the schema
    // Check if createdBy field exists before populating
    const sampleDoc = await MealPlan.findOne().limit(1);
    if (sampleDoc) {
      const schemaFields = Object.keys(sampleDoc.toObject());
      
      // Only populate if the field exists in schema
      if (schemaFields.includes('createdBy')) {
        mealPlansQuery = mealPlansQuery.populate('createdBy', 'name email');
      }
      
      if (schemaFields.includes('updatedBy')) {
        mealPlansQuery = mealPlansQuery.populate('updatedBy', 'name email');
      }
      
      // Don't populate category for now since it's causing the error
    }

    const mealPlans = await mealPlansQuery
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MealPlan.countDocuments(query);

    // Calculate additional stats
    const stats = await MealPlan.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          activePlans: { $sum: { $cond: ['$isActive', 1, 0] } },
          averagePrice: { $avg: '$price' },
          totalSubscriptions: { $sum: { $ifNull: ['$subscriberCount', 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: mealPlans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: stats[0] || {
        totalPlans: 0,
        activePlans: 0,
        averagePrice: 0,
        totalSubscriptions: 0
      }
    });

  } catch (error) {
    console.error('Error getting meal plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal plans',
      error: error.message
    });
  }
};

/**
 * Create new meal plan
 */
exports.createMealPlan = async (req, res) => {
  try {
    const mealPlanData = {
      ...req.body,
      createdBy: req.user?.id // Make it optional in case user is not available
    };

    // Remove any undefined or null values that might cause schema issues
    Object.keys(mealPlanData).forEach(key => {
      if (mealPlanData[key] === undefined || mealPlanData[key] === null) {
        delete mealPlanData[key];
      }
    });

    const mealPlan = new MealPlan(mealPlanData);
    await mealPlan.save();

    // Get the saved meal plan without problematic population
    const savedMealPlan = await MealPlan.findById(mealPlan._id);

    res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      data: savedMealPlan
    });

  } catch (error) {
    console.error('Error creating meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meal plan',
      error: error.message
    });
  }
};

/**
 * Update meal plan
 */
exports.updateMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id,
      updatedAt: new Date()
    };

    // Remove any undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const mealPlan = await MealPlan.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Meal plan updated successfully',
      data: mealPlan
    });

  } catch (error) {
    console.error('Error updating meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meal plan',
      error: error.message
    });
  }
};

/**
 * Delete meal plan
 */
exports.deleteMealPlan = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if meal plan has active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({
      $or: [
        { mealPlan: id },
        { defaultMeal: id }
      ],
      status: 'active'
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete meal plan. It has ${activeSubscriptions} active subscriptions.`
      });
    }

    const mealPlan = await MealPlan.findByIdAndDelete(id);

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Meal plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meal plan',
      error: error.message
    });
  }
};

/**
 * Get single meal plan by ID
 */
exports.getMealPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    const mealPlan = await MealPlan.findById(id);

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Get subscription count for this meal plan
    const subscriptionCount = await Subscription.countDocuments({
      $or: [
        { mealPlan: id },
        { defaultMeal: id }
      ]
    });

    const activeSubscriptionCount = await Subscription.countDocuments({
      $or: [
        { mealPlan: id },
        { defaultMeal: id }
      ],
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        ...mealPlan.toObject(),
        subscriptionCount,
        activeSubscriptionCount
      }
    });

  } catch (error) {
    console.error('Error getting meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get meal plan',
      error: error.message
    });
  }
};

/**
 * Toggle meal plan status (active/inactive)
 */
exports.toggleMealPlanStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const mealPlan = await MealPlan.findById(id);

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // If deactivating, check for active subscriptions
    if (mealPlan.isActive) {
      const activeSubscriptions = await Subscription.countDocuments({
        $or: [
          { mealPlan: id },
          { defaultMeal: id }
        ],
        status: 'active'
      });

      if (activeSubscriptions > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot deactivate meal plan. It has ${activeSubscriptions} active subscriptions.`
        });
      }
    }

    mealPlan.isActive = !mealPlan.isActive;
    mealPlan.updatedBy = req.user?.id;
    mealPlan.updatedAt = new Date();

    await mealPlan.save();

    res.json({
      success: true,
      message: `Meal plan ${mealPlan.isActive ? 'activated' : 'deactivated'} successfully`,
      data: mealPlan
    });

  } catch (error) {
    console.error('Error toggling meal plan status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle meal plan status',
      error: error.message
    });
  }
};

/**
 * Get user's daily meals with detailed information
 */
exports.getUserDailyMeals = async (req, res) => {
  try {
    const { userId } = req.params;
    const { date = moment().tz('Asia/Kolkata').format('YYYY-MM-DD') } = req.query;

    console.log('Getting daily meals for user:', userId, 'date:', date);

    // Get user's active subscriptions
    const subscriptions = await Subscription.find({
      user: userId,
      status: 'active',
      startDate: { $lte: new Date(date) },
      endDate: { $gte: new Date(date) }
    })
    .populate('mealPlan')
    .populate('user', 'name email phone addresses');

    if (!subscriptions.length) {
      return res.json({
        success: true,
        data: [],
        message: 'No active subscriptions found for this user on the selected date'
      });
    }

    const selectedDate = moment.tz(date, 'Asia/Kolkata').startOf('day');
    const userMeals = [];

    for (const subscription of subscriptions) {
      const shifts = subscription.mealPlan?.shifts || ['morning', 'evening'];
      
      for (const mealShift of shifts) {
        // Note: Removed Sunday evening skip - meals should be delivered every day as per subscription shift

        // Check if meal is skipped
        const skippedMeal = subscription.skippedMeals?.find(skip => {
          const skipDate = moment(skip.date).tz('Asia/Kolkata').startOf('day');
          return skipDate.isSame(selectedDate, 'day') && skip.shift === mealShift;
        });

        // Check if meal is replaced
        const replacement = subscription.thaliReplacements?.find(rep => {
          const repDate = moment(rep.date).tz('Asia/Kolkata').startOf('day');
          return repDate.isSame(selectedDate, 'day') && rep.shift === mealShift;
        });

        // Check if meal is customized
        const customization = await MealCustomization.findOne({
          subscription: subscription._id,
          date: {
            $gte: selectedDate.toDate(),
            $lt: selectedDate.clone().add(1, 'day').toDate()
          },
          shift: mealShift,
          isActive: true
        }).populate('addons extraItems');

        // Get replacement thali details if exists
        let replacementThali = null;
        if (replacement && replacement.newThaliId) {
          replacementThali = await MealPlan.findById(replacement.newThaliId);
        }

        // Create detailed meal object
        const mealData = {
          subscription: {
            _id: subscription._id,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate
          },
          mealPlan: subscription.mealPlan,
          shift: mealShift,
          date: selectedDate.toDate(),
          isSkipped: !!skippedMeal,
          isReplaced: !!replacement,
          isCustomized: !!customization,
          
          // Skip details
          skipReason: skippedMeal?.description,
          skipDate: skippedMeal?.createdAt,
          refundAmount: skippedMeal?.refundAmount,
          
          // Replacement details
          replacementThali: replacementThali,
          replacementReason: replacement?.reason,
          
          // Customization details
          customizations: customization?.customizations || [],
          selectedAddons: customization?.selectedAddons || [],
          selectedExtraItems: customization?.selectedExtraItems || [],
          
          // Delivery details
          deliveryAddress: subscription.user.addresses?.find(addr => addr.isDefault) || subscription.user.addresses?.[0],
          deliveryInstructions: subscription.deliveryInstructions
        };

        userMeals.push(mealData);
      }
    }

    // Sort meals by shift (morning first)
    userMeals.sort((a, b) => {
      const shiftOrder = { morning: 0, evening: 1 };
      return shiftOrder[a.shift] - shiftOrder[b.shift];
    });

    res.json({
      success: true,
      data: userMeals,
      date: date,
      user: subscriptions[0]?.user
    });

  } catch (error) {
    console.error('Error getting user daily meals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user daily meals',
      error: error.message
    });
  }
};
