const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');

// Initialize Razorpay 
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret'
});

const paymentController = {
  // Create Razorpay payment order
  createPaymentOrder: async (req, res) => {
    try {
      const { amount, currency = 'INR', receipt, orderId } = req.body;
      const userId = req.user.id;
      // Validate amount
      if (!amount || amount < 1) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount'
        });
      }

      console.log("fgvfgbvcgf", userId, amount, receipt);
      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes: {
          userId: userId,
          orderId: orderId
        }
      });
      console.log(razorpayOrder);
      res.json({
        success: true,
        data: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt
        }
      });
    } catch (error) {
      console.error('Error creating payment order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: error.message
      });
    }
  },

  // Verify payment signature
  verifyPayment: async (req, res) => {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      const userId = req.user.id;

      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_key_secret')
        .update(text)
        .digest('hex');

      if (signature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      // Update order with payment details
      const order = await Order.findOneAndUpdate(
        {
          'paymentDetails.razorpayOrderId': razorpay_order_id,
          customer: userId
        },
        {
          'paymentDetails.razorpayPaymentId': razorpay_payment_id,
          'paymentDetails.razorpaySignature': razorpay_signature,
          paymentStatus: 'paid',
          status: 'confirmed',
          paidAt: new Date()
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          orderId: order._id,
          paymentId: razorpay_payment_id,
          amount: order.totalAmount
        }
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: error.message
      });
    }
  },

  // Get payment history
  getPaymentHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const orders = await Order.find({
        customer: userId,
        'paymentDetails.razorpayPaymentId': { $exists: true }
      })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('items.product', 'name images')
        .lean();

      const total = await Order.countDocuments({
        customer: userId,
        'paymentDetails.razorpayPaymentId': { $exists: true }
      });

      res.json({
        success: true,
        data: {
          payments: orders,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history',
        error: error.message
      });
    }
  },

  // Process refund (Admin only)
  processRefund: async (req, res) => {
    try {
      const { paymentId, amount, reason } = req.body;

      // Process refund through Razorpay
      const refund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(amount * 100), // Convert to paise
        notes: {
          reason: reason
        }
      });

      // Update order with refund details
      await Order.findOneAndUpdate(
        { 'paymentDetails.razorpayPaymentId': paymentId },
        {
          $push: {
            refunds: {
              refundId: refund.id,
              amount: amount,
              reason: reason,
              status: refund.status,
              processedAt: new Date()
            }
          },
          status: refund.status === 'processed' ? 'refunded' : 'processing_refund'
        }
      );

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          refundId: refund.id,
          amount: amount,
          status: refund.status
        }
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: error.message
      });
    }
  },

  // Get payment status
  getPaymentStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        _id: orderId,
        customer: userId
      }).select('paymentStatus paymentDetails totalAmount');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: {
          orderId: order._id,
          paymentStatus: order.paymentStatus,
          amount: order.totalAmount,
          paymentDetails: order.paymentDetails
        }
      });
    } catch (error) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment status',
        error: error.message
      });
    }
  }
};

module.exports = paymentController;
// ============================================
// BACKEND - Payment Controller (Node.js/Express)
// ============================================

const Cart = require('../models/Cart');

// ============================================
// 1. Create Razorpay Order
// ============================================
const createRazorpayOrder = async (req, res) => {
  try {
    const {
      amount,
      currency = 'INR',
      orderData,
      customerDetails
    } = req.body;

    const userId = req.user.id;

    // Debug logging for payment controller
    console.log('Payment Controller Debug:', {
      amount,
      orderData,
      packagingCharges: orderData?.packagingCharges,
      type: orderData?.type,
      calculatedPackagingCharges: (orderData?.type || 'gkk') === 'gkk' ? 10 : 0
    });

    // Validate required fields
    if (!amount || !orderData || !customerDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate order number manually to ensure it's set
    const orderCount = await Order.countDocuments();
    const orderNumber = `GKK${String(orderCount + 2000 + 1).padStart(6, '0')}`;

    // Create order in database first (pending status)
    const newOrder = new Order({
      orderNumber, // Explicitly set the order number
      userId,
      type: orderData.type || 'gkk',
      items: await Promise.all(orderData.items.map(async (item) => {
        let sellerId = item.seller;

        // If seller ID not provided, try to fetch from product
        if (!sellerId && item.productId) {
          try {
            const Product = require('../models/Product');
            const product = await Product.findById(item.productId).select('seller');
            if (product && product.seller) {
              sellerId = product.seller;
            }
          } catch (error) {
            console.warn(`Could not fetch seller for product ${item.productId}:`, error.message);
          }
        }

        return {
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: item.category || 'main',
          customizations: [],
          // E-commerce fields
          product: item.productId || null,
          seller: sellerId || null,
          originalPrice: item.price,
          discount: 0,
          image: item.image || null,
          isCollegeBranded: item.isCollegeBranded || false,
          ...(item.collegeName && { collegeName: item.collegeName }) // Include college name if present
        };
      })),
      deliveryAddress: {
        street: customerDetails.shippingAddress.line1,
        city: customerDetails.shippingAddress.city,
        state: customerDetails.shippingAddress.state,
        pincode: customerDetails.shippingAddress.pincode,
        country: customerDetails.shippingAddress.country || 'India',
        instructions: orderData.specialInstructions || ''
      },
      deliveryDate: orderData.deliveryDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      deliverySlot: orderData.deliverySlot || 'anytime',
      subtotal: orderData.subtotal,
      discountAmount: orderData.discount || 0,
      taxes: {
        gst: orderData.tax || 0,
        deliveryCharges: orderData.shipping || orderData.deliveryCharges || 0,
        packagingCharges: orderData.packagingCharges || ((orderData.type || 'gkk') === 'gkk' ? 10 : 0),
        rainCharges: orderData.rainCharges || 0,
        serviceCharges: orderData.serviceCharges || orderData.handlingCharges || 0
      },
      // Calculate totalAmount using the same formula as Order model validation
      totalAmount: Math.round((orderData.subtotal - (orderData.discount || 0) + (orderData.tax || 0) + (orderData.shipping || orderData.deliveryCharges || 0) + (orderData.packagingCharges || ((orderData.type || 'gkk') === 'gkk' ? 10 : 0)) + (orderData.rainCharges || 0) + (orderData.serviceCharges || orderData.handlingCharges || 0)) * 100) / 100,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      status: 'pending',
      specialInstructions: orderData.specialInstructions || '',
      isAutoOrder: orderData.isAutoOrder || false,
      // Add billing address
      billingAddress: {
        name: customerDetails.name,
        phone: customerDetails.phone,
        street: customerDetails.shippingAddress.line1,
        city: customerDetails.shippingAddress.city,
        state: customerDetails.shippingAddress.state,
        pincode: customerDetails.shippingAddress.pincode,
        country: customerDetails.shippingAddress.country || 'India'
      }
    });

    const savedOrder = await newOrder.save();

    // Record coupon usage if coupon was applied
    if (orderData.couponCode && orderData.couponId) {
      try {
        console.log(`Recording coupon usage: ${orderData.couponCode} for user ${userId} on order ${savedOrder.orderNumber}`);

        const couponUsage = new CouponUsage({
          couponId: orderData.couponId,
          userId: userId,
          orderId: savedOrder._id,
          discountAmount: orderData.discount || 0,
          orderTotal: orderData.subtotal || amount,
          couponCode: orderData.couponCode
        });

        await couponUsage.save();

        // Update coupon usage count
        await Coupon.findByIdAndUpdate(orderData.couponId, {
          $inc: { usedCount: 1 },
          $set: { lastUsedAt: new Date() }
        });

        console.log(`✅ Coupon ${orderData.couponCode} usage recorded successfully for order ${savedOrder.orderNumber} with discount ₹${orderData.discount || 0}`);
      } catch (couponError) {
        console.error('❌ Error recording coupon usage:', couponError);

        // Check if it's a duplicate key error (user already used this coupon)
        if (couponError.code === 11000) {
          console.log(`⚠️ User ${userId} has already used coupon ${orderData.couponCode}`);
        }

        // Don't fail order creation if coupon tracking fails
      }
    } else {
      console.log(`No coupon usage to record - couponCode: ${orderData.couponCode}, couponId: ${orderData.couponId}`);
    }

    // Create Razorpay order
    const razorpayOrderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `order_${savedOrder._id}`,
      notes: {
        orderId: savedOrder._id.toString(),
        orderNumber: savedOrder.orderNumber,
        userId: userId.toString(),
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone
      }
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);

    // Update order with Razorpay order ID
    savedOrder.transactionId = razorpayOrder.id;
    await savedOrder.save();

    res.status(200).json({
      success: true,
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: customerDetails.phone
      }
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// ============================================
// 2. Verify Payment Signature
// ============================================
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === razorpaySignature;
};

// ============================================
// 3. Handle Payment Success
// ============================================
const handlePaymentSuccess = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      recordId,
      type
    } = req.body;

    // Verify signature
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // Handle subscription payments
    if (type === 'subscription') {
      // Find the pending subscription
      const subscription = await Subscription.findById(recordId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }

      // Update subscription status to active
      subscription.status = 'active';
      subscription.paymentStatus = 'paid';
      subscription.razorpayPaymentId = razorpay_payment_id;
      subscription.transactionId = razorpay_payment_id;
      subscription.activatedAt = new Date();

      await subscription.save();

      // Add payment transaction to user wallet
      const transactionRecord = {
        amount: subscription.pricing.finalAmount,
        type: 'debit',
        note: `Payment for subscription ${subscription.subscriptionId}`,
        timestamp: new Date(),
        referenceId: razorpay_payment_id
      };

      await User.findByIdAndUpdate(subscription.user, {
        $push: { 'wallet.transactions': transactionRecord },
        $inc: { loyaltyPoints: Math.floor(subscription.pricing.finalAmount / 10) }
      });

      return res.status(200).json({
        success: true,
        message: 'Subscription payment verified successfully',
        data: {
          subscription: {
            _id: subscription._id,
            subscriptionId: subscription.subscriptionId,
            status: subscription.status,
            paymentStatus: subscription.paymentStatus,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            totalAmount: subscription.pricing.finalAmount
          }
        }
      });
    }

    // Handle regular order payments (existing logic)
    const order = await Order.findById(orderId || recordId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order with payment details
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.transactionId = razorpay_payment_id;
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Payment successful via Razorpay'
    });

    // Add payment details to order
    order.paymentDetails = {
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentMethod: payment.method,
      bank: payment.bank,
      cardId: payment.card_id,
      amount: payment.amount / 100, // Convert from paise
      currency: payment.currency,
      status: payment.status,
      createdAt: new Date(payment.created_at * 1000)
    };

    await order.save();

    // Clear user's cart
    const transactionRecord = {
      amount: order.totalAmount,
      type: 'debit', // 'debit' because user paid money
      note: `Payment for order ${order.orderNumber}`,
      timestamp: new Date(),
      referenceId: razorpay_payment_id
    };

    await User.findByIdAndUpdate(order.userId, {
      $push: { 'wallet.transactions': transactionRecord }, // Use $push for arrays
      $inc: { loyaltyPoints: Math.floor(order.totalAmount / 10) }
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          estimatedDelivery: order.estimatedDelivery
        }
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// ============================================
// 4. Handle Payment Failure
// ============================================
const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, recordId, razorpay_order_id, error, type } = req.body;
    const finalRecordId = recordId || orderId;

    if (type === 'subscription') {
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findById(finalRecordId);
      if (subscription) {
        subscription.paymentStatus = 'failed';
        // Optionally cancelled if it was pending payment
        // subscription.status = 'cancelled';
        await subscription.save();
      }
      return res.status(200).json({
        success: false,
        message: 'Subscription match failed',
        recordId: finalRecordId
      });
    }

    // Default: Order
    const order = await Order.findById(finalRecordId);
    if (order) {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.cancellationReason = `Payment failed: ${error?.description || 'Unknown error'}`;
      order.cancelledAt = new Date();
      order.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: `Payment failed: ${error?.description || 'Unknown error'}`
      });
      await order.save();
    }

    res.status(200).json({
      success: false,
      message: 'Payment failed processed',
      orderId: finalRecordId
    });

  } catch (error) {
    console.error('Error handling payment failure:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment failure'
    });
  }
};

// ============================================
// 5. Get Payment Status
// ============================================
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone')
      .select('orderNumber status paymentStatus totalAmount paymentDetails estimatedDelivery');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status'
    });
  }
};

// ============================================
// 6. Refund Payment
// ============================================
const refundPayment = async (req, res) => {
  try {
    const { orderId, refundAmount, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order || order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order not found or payment not completed'
      });
    }

    // Create refund
    const refund = await razorpay.payments.refund(order.transactionId, {
      amount: Math.round(refundAmount * 100), // Convert to paise
      notes: {
        reason: reason,
        orderId: orderId
      }
    });

    // Update order
    order.paymentStatus = 'refunded';
    order.refundAmount = refundAmount;
    order.statusHistory.push({
      status: 'refunded',
      timestamp: new Date(),
      note: `Refund initiated: ₹${refundAmount}. Reason: ${reason}`
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      refundId: refund.id,
      amount: refund.amount / 100
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: error.message
    });
  }
};

// ============================================
// WEBHOOK - Handle Razorpay Events
// ============================================
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailedWebhook(payload.payment.entity);
        break;

      case 'refund.processed':
        await handleRefundProcessed(payload.refund.entity);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

const handlePaymentCaptured = async (payment) => {
  try {
    const order = await Order.findOne({ transactionId: payment.order_id });
    if (order && order.paymentStatus === 'pending') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();
    }
  } catch (error) {
    console.error('Error handling payment captured webhook:', error);
  }
};

const handlePaymentFailedWebhook = async (payment) => {
  try {
    const order = await Order.findOne({ transactionId: payment.order_id });
    if (order) {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      await order.save();
    }
  } catch (error) {
    console.error('Error handling payment failed webhook:', error);
  }
};

const handleRefundProcessed = async (refund) => {
  try {
    const order = await Order.findOne({ transactionId: refund.payment_id });
    if (order) {
      order.paymentStatus = 'refunded';
      order.refundAmount = refund.amount / 100;
      await order.save();
    }
  } catch (error) {
    console.error('Error handling refund processed webhook:', error);
  }
};

// Export all functions
module.exports = {
  createRazorpayOrder,
  handlePaymentSuccess,
  handlePaymentFailure,
  getPaymentStatus,
  refundPayment,
  handleRazorpayWebhook
};