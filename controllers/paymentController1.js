const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Subscription = require('../models/Subscription');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const mongoose = require('mongoose')
const { sendOrderConfirmation } = require('../utils/emailService');


// ============================================
// Initialize Razorpay Instance
// ============================================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazorpayOrder = async (req, res) => {
  try {
    const {
      amount,
      currency = 'INR',
      orderData,
      customerDetails,
      subscriptionData,
    } = req.body;
    // console.log("data coming into the create rozarpayorder : ", req.body);   
    const userId = req.user._id;
    console.log("body is : ", req.body);
    // Validate Razorpay instance
    if (!razorpay || !razorpay.orders) {
      console.error('❌ Razorpay instance not properly initialized');
      return res.status(500).json({
        success: false,
        message: 'Payment service not available. Please contact support.'
      });
    }

    // Validate required fields
    if (!amount || !customerDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount or customerDetails'
      });
    }

    // Validate amount
    if (amount < 1 || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Amount must be greater than 0'
      });
    }
    let savedRecord;
    let orderNumber;
    let recordType; // 'subscription' or 'order'

    // Check if this is a subscription order
    if (subscriptionData && orderData?.type === 'subscription') {
      console.log('🔄 Processing subscription order');
      recordType = 'subscription';

      // **CRITICAL FIX**: Check for existing active subscription BEFORE processing payment
      // This prevents the duplicate key error that occurs when trying to activate a subscription
      const existingActiveSubscription = await Subscription.findOne({
        user: userId,
        status: 'active'
      });

      if (existingActiveSubscription) {
        console.log(`❌ User ${userId} already has an active subscription: ${existingActiveSubscription.subscriptionId}`);
        return res.status(409).json({
          success: false,
          message: 'You already have an active subscription. Please cancel your current subscription before creating a new one.',
          code: 'DUPLICATE_ACTIVE_SUBSCRIPTION',
          existingSubscription: {
            id: existingActiveSubscription.subscriptionId,
            mealPlan: existingActiveSubscription.mealPlan,
            startDate: existingActiveSubscription.startDate,
            status: existingActiveSubscription.status
          }
        });
      }

      // FIXED: Don't create a new subscription - find the existing one that was already created
      // The subscription should have been created by the createSubscription API call from ConfirmOrderPage.jsx

      // Extract subscription details - handle nested structure
      const subDetails = subscriptionData.subscriptionDetails || subscriptionData;
      const pricing = subscriptionData.subscriptionDetails.pricing;
      const deliveryTiming = subDetails.originalOrderData.deliveryTiming || subscriptionData.deliveryTiming;

      // Validate subscription data
      if (!subDetails.mealPlanId || !pricing || !deliveryTiming) {
        console.log('❌ Validation failed:', {
          mealPlanId: !!subDetails.mealPlanId,
          pricing: !!pricing,
          deliveryTiming: !!deliveryTiming
        });
        return res.status(400).json({
          success: false,
          message: 'Missing required subscription fields: mealPlanId, pricing, or deliveryTiming'
        });
      }

      // FIXED: Find the existing subscription instead of creating a new one
      // Look for the subscription that was already created by the createSubscription API
      const existingSubscription = await Subscription.findOne({
        user: userId,
        status: { $in: ['pending_payment', 'pending'] },
        mealPlan: subDetails.mealPlanId,
        planType: subDetails.planType || 'thirtyDays',
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Created in last 10 minutes
      });

      if (!existingSubscription) {
        console.log('❌ No existing subscription found for payment');
        return res.status(400).json({
          success: false,
          message: 'No subscription found. Please create a subscription first.',
          error: 'SUBSCRIPTION_NOT_FOUND'
        });
      }

      console.log('✅ Found existing subscription:', existingSubscription.subscriptionId);

      // Use the existing subscription instead of creating a new one
      savedRecord = existingSubscription;
      orderNumber = existingSubscription.subscriptionNumber;

      // FIXED: Don't create new subscription - just use the existing one
      console.log('✅ Using existing subscription for payment:', savedRecord.subscriptionId);
    } else {
      console.log('📦 Processing regular order');
      recordType = 'order';
      
      if(!customerDetails.phone){
         return res.status(400).json({
          success: false,
          message: 'customer contact no is required '
        });
      }
      // Validate order data for regular orders
      if (!orderData || !orderData.items) {
        return res.status(400).json({
          success: false,
          message: 'Missing order data or items'
        });
      }

      // Generate order number
      const orderCount = await Order.countDocuments();
      orderNumber = `GKK${String(orderCount + 1).padStart(6, '0')}`;

      // Process items
      const processedItems = orderData.items.map(item => {

        const processedItem = {
          name: item.product?.name,
          quantity: item.quantity || 1,
          price: item.price || 0,
          category: item?.product?.category?.name || item.category?.name?.toLowerCase() || item.category,
          customizations: item.customizations || [],
          product: item.productId || null,
          originalPrice: item.originalPrice || item.price || 0,
          discount: item.discount || 0,
          image: item.image || null,
          seller: new mongoose.Types.ObjectId(item.seller),
          isCollegeBranded: item.isCollegeBranded || false,
          ...(item.collegeName && { collegeName: item.collegeName }) // Include college name if present
        };

        if (item.customizations && Array.isArray(item.customizations)) {
          processedItem.customizations = item.customizations.map(customization => ({
            name: customization.name || '',
            quantity: customization.quantity || 1,
            price: customization.price || 0
          }));
        }

        return processedItem;
      });
      // Create order in database
      const newOrder = new Order({
        orderNumber,
        userId,
        type: orderData.type || 'RO',
        items: processedItems,
        customer: {
          name: customerDetails.name,
          email: customerDetails.email,
          phone: customerDetails.phone
        },
        deliveryAddress: {
          street: customerDetails.shippingAddress?.line1 || '',
          city: customerDetails.shippingAddress?.city || '',
          state: customerDetails.shippingAddress?.state || '',
          pincode: customerDetails.shippingAddress?.pincode || '',
          country: customerDetails.shippingAddress?.country || 'India',
          instructions: orderData.specialInstructions || '',
          coordinates: customerDetails.coordinates
        },
        deliveryDate: orderData.deliveryDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
        deliverySlot: orderData.deliverySlot || 'anytime',
        subtotal: orderData.subtotal || amount,
        discountAmount: orderData.discount || 0,
        taxes: orderData.chargesBreakdown,
        totalAmount: amount,
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
        status: 'pending',
        specialInstructions: orderData.specialInstructions || '',
        isAutoOrder: orderData.isAutoOrder || false,
        isCustomized: orderData.isCustomized || false,
        userContactNo: customerDetails.phone,
        billingAddress: {
          name: customerDetails.name,
          phone: customerDetails.phone,
          street: customerDetails.shippingAddress?.line1 || '',
          city: customerDetails.shippingAddress?.city || '',
          state: customerDetails.shippingAddress?.state || '',
          pincode: customerDetails.shippingAddress?.pincode || '',
          country: customerDetails.shippingAddress?.country || 'India'
        },
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          note: 'Order created and awaiting payment'
        }]
      });

      savedRecord = await newOrder.save();

      // Record coupon usage if coupon was applied
      if (orderData.couponCode && orderData.couponId) {
        try {
          console.log(`Recording coupon usage: ${orderData.couponCode} for user ${userId} on order ${savedRecord.orderNumber}`);

          const couponUsage = new CouponUsage({
            couponId: orderData.couponId,
            userId: userId,
            usageType: 'order',
            orderId: savedRecord._id,
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

          console.log(`✅ Coupon ${orderData.couponCode} usage recorded successfully for order ${savedRecord.orderNumber} with discount ₹${orderData.discount || 0}`);
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
    }

    // Create Razorpay order
    const razorpayOrderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `${recordType}_${savedRecord._id}`,
      notes: {
        recordId: savedRecord._id.toString(),
        recordNumber: savedRecord.subscriptionNumber || savedRecord.orderNumber,
        userId: userId.toString(),
        customerName: customerDetails.name,
        customerEmail: customerDetails.email || '',
        customerPhone: customerDetails.phone || '',
        type: recordType
      }
    };

    // console.log("savd record in the payment controller : ", savedRecord);
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);
    } catch (razorpayError) {
      console.error('❌ Razorpay API error:', razorpayError);
      // Delete the record we created since Razorpay order failed
      if (recordType === 'subscription') {
        await Subscription.findByIdAndDelete(savedRecord._id);
      } else {
        await Order.findByIdAndDelete(savedRecord._id);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order. Please try again.',
        error: process.env.NODE_ENV === 'development' ? razorpayError.message : 'Payment service error'
      });
    }

    // Update record with Razorpay order ID
    savedRecord.transactionId = razorpayOrder.id;
    await savedRecord.save();

    res.status(200).json({
      success: true,
      recordId: savedRecord._id,
      recordNumber: savedRecord.subscriptionNumber || savedRecord.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      type: recordType,
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: customerDetails.phone
      }
    });

  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper function to generate unique order number
const generateUniqueOrderNumber = async (type) => {
  const prefix = type === 'gkk' ? 'GKK' : 'ORD';

  // Use findOneAndUpdate with atomic increment
  const counter = await Order.findOneAndUpdate(
    { _id: 'order_counter' }, // Virtual document for counter
    { $inc: { count: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).catch(() => {
    // Fallback to timestamp-based unique number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return { count: parseInt(timestamp + random) };
  });

  const orderCount = counter.count || await Order.countDocuments() + 1;
  return `${prefix}${String(orderCount).padStart(6, '0')}`;
};

// ============================================
// Handle Payment Success (Enhanced for Subscriptions)
// ============================================
const handlePaymentSuccess = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
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
      console.error('❌ Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // CUSTOMIZATION: Simple Verification
    if (type === 'customization') {
      return res.status(200).json({
        success: true,
        message: 'Customization Payment Verified',
        data: {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature
        }
      });
    }

    // Get payment details from Razorpay
    let payment;
    try {
      payment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log('✅ Payment details fetched from Razorpay');
    } catch (fetchError) {
      console.error('⚠️ Could not fetch payment details from Razorpay:', fetchError);
      payment = null;
    }

    let record;
    let recordType;

    // FIXED: Determine record type and find the correct record
    if (type === 'subscription') {
      recordType = 'subscription';
      record = await Subscription.findById(recordId);
    } else {
      recordType = 'order';
      record = await Order.findById(recordId);
    }

    // FIXED: If type is not provided, try to find record by transactionId
    if (!record && razorpay_order_id) {
      console.log('🔍 Type not provided, searching by transactionId...');

      // Try to find subscription first
      record = await Subscription.findOne({ transactionId: razorpay_order_id });
      if (record) {
        recordType = 'subscription';
        console.log('✅ Found subscription by transactionId');
      } else {
        // Try to find order
        record = await Order.findOne({ transactionId: razorpay_order_id });
        if (record) {
          recordType = 'order';
          console.log('✅ Found order by transactionId');
        }
      }
    }

    if (!record) {
      console.error('❌ Record not found:', { recordId, type, razorpay_order_id });
      return res.status(404).json({
        success: false,
        message: `${recordType || 'Record'} not found`
      });
    }

    // Check if payment was already processed
    if (record.paymentStatus === 'paid' || record.paymentStatus === "completed" ) {
      return res.status(200).json({
        success: true,
        message: 'Payment already processed',
        [recordType]: {
          _id: record._id,
          [`${recordType}Number`]: record.subscriptionNumber || record.orderNumber,
          status: record.status,
          paymentStatus: record.paymentStatus,
          totalAmount: record.pricing?.finalAmount || record.totalAmount
        }
      });
    }

    // Update record with payment details
    record.paymentStatus = 'paid';
    record.transactionId = razorpay_payment_id;
    record.paidAt = new Date();

    if (recordType === 'subscription') {
      record.status = 'active';
      record.statusHistory.push({
        status: 'active',
        timestamp: new Date(),
        note: 'Payment successful via Razorpay - Subscription activated'
      });
    } else {
      record.status = 'confirmed';
      record.statusHistory.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: 'Payment successful via Razorpay'
      });
    }

    // Add payment details to record
    if (payment) {
      record.paymentDetails = {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentMethod: payment.method || 'unknown',
        bank: payment.bank || null,
        cardId: payment.card_id || null,
        amount: payment.amount / 100,
        currency: payment.currency || 'INR',
        status: payment.status || 'captured',
        createdAt: new Date(payment.created_at * 1000)
      };
    } else {
      record.paymentDetails = {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amount: record.pricing?.finalAmount || record.totalAmount,
        currency: 'INR',
        status: 'captured',
        createdAt: new Date()
      };
    }

    await record.save();

    // Handle post-payment logic
    if (recordType === 'subscription') {
      try {
        // Credit the full amount to user's wallet for subscription
        const creditAmount = record.pricing.finalAmount;

        const walletTransaction = {
          amount: creditAmount,
          type: 'credit',
          note: `Subscription payment credited to wallet - ${record.subscriptionNumber}`,
          timestamp: new Date(),
          referenceId: razorpay_payment_id,
          subscriptionId: record._id
        };

        await User.findByIdAndUpdate(record.userId, {
          $push: { 'wallet.transactions': walletTransaction },
          $inc: {
            'wallet.balance': creditAmount,
            loyaltyPoints: Math.floor(creditAmount / 10)
          }
        });

        console.log('✅ Subscription amount credited to wallet');

        // Clear user's cart
        await Cart.findOneAndUpdate(
          { userId: record.userId },
          { $set: { items: [] } }
        );

      } catch (walletError) {
        console.error('⚠️ Error updating wallet for subscription:', walletError);
      }
    } else {
      try {
        const transactionRecord = {
          amount: record.totalAmount,
          type: 'debit',
          note: `Payment for order ${record.orderNumber}`,
          timestamp: new Date(),
          referenceId: razorpay_payment_id
        };

        await User.findByIdAndUpdate(record.userId, {
          $push: { 'wallet.transactions': transactionRecord },
          $inc: { loyaltyPoints: Math.floor(record.totalAmount / 10) }
        });

        // Clear cart
        await Cart.findOneAndUpdate(
          { userId: record.userId },
          { $set: { items: [] } }
        );

        console.log('✅ User wallet and cart updated for order');
      } catch (updateError) {
        console.error('⚠️ Error updating user wallet/cart:', updateError);
      }
    }

    const responseData = {
      success: true,
      message: `Payment verified successfully`,
      [recordType]: {
        _id: record._id,
        [`${recordType}Number`]: record.subscriptionNumber || record.orderNumber,
        status: record.status,
        paymentStatus: record.paymentStatus,
        totalAmount: record.pricing?.finalAmount || record.totalAmount,
        estimatedDelivery: record.deliveryDate || record.startDate || new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    };

    // Add subscription-specific data
    if (recordType === 'subscription') {
      responseData.subscription.walletCredited = record.pricing.finalAmount;
      responseData.subscription.dailyDeduction = (record.pricing.finalAmount / record.pricing.totalDays).toFixed(2);
      responseData.subscription.startDate = record.startDate;
      responseData.subscription.endDate = record.endDate;
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Verification error'
    });
  }
};

// ============================================
// Verify Payment Signature
// ============================================
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === razorpaySignature;
  } catch (error) {
    console.error('❌ Error verifying payment signature:', error);
    return false;
  }
};

// ============================================
// Handle Payment Failure (Enhanced for Subscriptions)
// ============================================
const handlePaymentFailure = async (req, res) => {
  try {
    const { recordId, razorpay_order_id, error, type } = req.body;

    console.log('⚠️ Processing payment failure:', { recordId, razorpay_order_id, error, type });

    let record;
    let recordType;

    // FIXED: Determine record type and find the correct record
    if (type === 'subscription') {
      recordType = 'subscription';
      record = await Subscription.findById(recordId);
    } else if (type === 'order') {
      recordType = 'order';
      record = await Order.findById(recordId);
    } else {
      // FIXED: If type is not provided, try to find by transactionId
      record = await Subscription.findOne({ transactionId: razorpay_order_id });
      if (record) {
        recordType = 'subscription';
      } else {
        record = await Order.findOne({ transactionId: razorpay_order_id });
        recordType = 'order';
      }
    }

    if (record) {
      record.paymentStatus = 'failed';
      record.status = 'cancelled';
      record.cancellationReason = `Payment failed: ${error?.description || 'Unknown error'}`;
      record.cancelledAt = new Date();
      record.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: `Payment failed: ${error?.description || 'Unknown error'}`
      });
      await record.save();
      console.log(`✅ ${recordType || 'Record'} marked as failed/cancelled`);
    }

    res.status(200).json({
      success: false,
      message: 'Payment failed',
      recordId: recordId,
      reason: error?.description || 'Payment processing failed'
    });

  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment failure'
    });
  }
};

// ============================================
// Get Payment Status (Enhanced for Subscriptions)
// ============================================
const getPaymentStatus = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { type } = req.query;

    let record;
    let recordType;

    if (type === 'subscription') {
      record = await Subscription.findById(recordId)
        .populate('userId', 'name email phone')
        .select('subscriptionNumber status paymentStatus pricing paymentDetails startDate statusHistory');
      recordType = 'subscription';
    } else if (type === 'order') {
      record = await Order.findById(recordId)
        .populate('userId', 'name email phone')
        .select('orderNumber status paymentStatus totalAmount paymentDetails deliveryDate statusHistory');
      recordType = 'order';
    } else {
      // FIXED: Try both if type not provided
      record = await Subscription.findById(recordId);
      if (record) {
        recordType = 'subscription';
      } else {
        record = await Order.findById(recordId);
        recordType = 'order';
      }
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `${type || 'Record'} not found`
      });
    }

    res.status(200).json({
      success: true,
      [recordType]: record
    });

  } catch (error) {
    console.error('❌ Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment status'
    });
  }
};

// ============================================
// Create Simple Payment Order (Legacy Support)
// ============================================
const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', orderId } = req.body;
    const userId = req.user.id;

    // Validate Razorpay instance
    if (!razorpay || !razorpay.orders) {
      return res.status(500).json({
        success: false,
        message: 'Payment service not available'
      });
    }

    // Validate amount
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Amount must be at least 1 INR'
      });
    }

    console.log("📝 Creating payment order:", userId, amount);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId,
        orderId: orderId
      }
    });

    console.log("✅ Razorpay order created:", razorpayOrder);

    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        key: process.env.RAZORPAY_KEY_ID,
      }
    });
  } catch (error) {
    console.error('❌ Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Payment service error'
    });
  }
};

// ============================================
// Verify Payment (Enhanced for Subscriptions)
// ============================================
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      recordId,
      type
    } = req.body;

    console.log('🔍 Verifying payment:', {
      razorpay_order_id,
      razorpay_payment_id,
      recordId,
      type
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields'
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      console.error('❌ Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    console.log('✅ Payment signature verified successfully');

    // CUSTOMIZATION: Simple Verification
    if (type === 'customization') {
      return res.status(200).json({
        success: true,
        message: 'Customization Payment Verified',
        data: {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature
        }
      });
    }

    let updatedRecord;
    let recordType;


    // FIXED: Handle both subscription and order payments
    if (type === 'subscription') {
      updatedRecord = await Subscription.findById(recordId);
      recordType = 'subscription';

      if (!updatedRecord) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }

      // Update subscription status
      updatedRecord.paymentStatus = 'completed';
      updatedRecord.status = 'active';
      updatedRecord.razorpayPaymentId = razorpay_payment_id;
      updatedRecord.razorpayOrderId = razorpay_order_id;
      updatedRecord.razorpaySignature = razorpay_signature;
      updatedRecord.paymentCompletedAt = new Date();

      // // Add to status history
      // updatedRecord.statusHistory.push({
      //   status: 'active',
      //   timestamp: new Date(),
      //   note: 'Payment completed successfully, subscription activated'
      // });

      await updatedRecord.save();
      console.log('✅ Subscription updated successfully:', updatedRecord);

      // Send subscription confirmation email to customer and admin
      try {
        //blocked
        // await sendOrderConfirmation(req.user.email, updatedRecord);
        // await sendOrderConfirmation("order@tastyaana.com", updatedRecord);
        console.log('✅ Subscription confirmation emails sent');
      } catch (emailError) {
        console.error('❌ Error sending subscription confirmation email:', emailError);
        // Don't fail the request if email sending fails
      }

    } else {
      // Handle regular order payments
      updatedRecord = await Order.findById(recordId);
      recordType = 'order';

      if (!updatedRecord) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Update order status
      updatedRecord.paymentStatus = 'completed';
      updatedRecord.status = 'confirmed';
      updatedRecord.razorpayPaymentId = razorpay_payment_id;
      updatedRecord.razorpayOrderId = razorpay_order_id;
      updatedRecord.razorpaySignature = razorpay_signature;
      updatedRecord.paymentCompletedAt = new Date();
      updatedRecord.transactionId = razorpay_payment_id;

      // Add to status history
      updatedRecord.statusHistory.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: 'Payment completed successfully, order confirmed'
      });

      await updatedRecord.save();
      console.log('✅ Order updated successfully:', updatedRecord.orderNumber);
      await sendOrderConfirmation(req.user.email, updatedRecord);
      await sendOrderConfirmation("order@tastyaana.com", updatedRecord);
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: `${recordType === 'subscription' ? 'Subscription' : 'Order'} payment verified successfully`,
      data: updatedRecord,
      paymentDetails: {
        razorpay_payment_id,
        razorpay_order_id,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Handle payment failures
const handlePaymentFailed = async (req, res) => {
  try {
    const { recordId, razorpay_order_id, error, type } = req.body;

    console.log('❌ Handling payment failure:', { recordId, type, error });

    let record;
    let recordType;

    if (type === 'subscription') {
      record = await Subscription.findById(recordId);
      recordType = 'subscription';
    } else if (type === 'order') {
      record = await Order.findById(recordId);
      recordType = 'order';
    } else {
      // Try to find by transactionId if type not provided
      record = await Subscription.findOne({ transactionId: razorpay_order_id });
      if (record) {
        recordType = 'subscription';
      } else {
        record = await Order.findOne({ transactionId: razorpay_order_id });
        recordType = 'order';
      }
    }

    if (record) {
      record.paymentStatus = 'failed';
      record.status = 'payment_failed';
      record.statusHistory.push({
        status: 'payment_failed',
        timestamp: new Date(),
        note: `Payment failed: ${error?.description || 'Unknown error'}`
      });
      await record.save();
      console.log(`✅ ${recordType} marked as payment failed`);
    }

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded'
    });

  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle payment failure'
    });
  }
};

// ============================================
// Get Payment History
// ============================================
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Get orders
    const orders = await Order.find({
      userId: userId,
      paymentStatus: { $in: ['paid', 'refunded'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.product', 'name images')
      .lean();

    // Get subscriptions
    const subscriptions = await Subscription.find({
      userId: userId,
      paymentStatus: { $in: ['paid', 'completed'] }
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('mealPlan', 'name description')
      .lean();

    const totalOrders = await Order.countDocuments({
      userId: userId,
      paymentStatus: { $in: ['paid', 'refunded'] }
    });

    const totalSubscriptions = await Subscription.countDocuments({
      userId: userId,
      paymentStatus: { $in: ['paid', 'completed'] }
    });

    const total = totalOrders + totalSubscriptions;

    res.json({
      success: true,
      data: {
        orders: orders,
        subscriptions: subscriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Data fetch error'
    });
  }
};

// ============================================
// Refund Payment (Enhanced)
// ============================================
const refundPayment = async (req, res) => {
  try {
    const { recordId, refundAmount, reason, type } = req.body;

    if (!razorpay || !razorpay.payments) {
      return res.status(500).json({
        success: false,
        message: 'Refund service not available'
      });
    }

    let record;
    let recordType;

    if (type === 'subscription') {
      record = await Subscription.findById(recordId);
      recordType = 'subscription';
    } else {
      record = await Order.findById(recordId);
      recordType = 'order';
    }

    if (!record || record.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: `${recordType} not found or payment not completed`
      });
    }

    const totalAmount = record.pricing?.finalAmount || record.totalAmount;

    // Validate refund amount
    if (refundAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed total amount'
      });
    }

    console.log('💰 Processing refund:', { recordId, refundAmount, reason, type });

    // Create refund
    const refund = await razorpay.payments.refund(
      record.paymentDetails?.razorpayPaymentId || record.transactionId,
      {
        amount: Math.round(refundAmount * 100), // Convert to paise
        notes: {
          reason: reason,
          recordId: recordId,
          type: recordType
        }
      }
    );

    // Update record
    record.paymentStatus = 'refunded';
    record.refundAmount = refundAmount;
    record.statusHistory.push({
      status: 'refunded',
      timestamp: new Date(),
      note: `Refund initiated: ₹${refundAmount}. Reason: ${reason}`
    });

    // Add refund details
    if (!record.refunds) record.refunds = [];
    record.refunds.push({
      refundId: refund.id,
      amount: refundAmount,
      reason: reason,
      status: refund.status,
      processedAt: new Date()
    });

    await record.save();

    console.log('✅ Refund processed successfully');

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    });

  } catch (error) {
    console.error('❌ Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Refund service error'
    });
  }
};

// ============================================
// Process Refund (Admin - Legacy Support)
// ============================================
const processRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason, type } = req.body;

    if (!razorpay || !razorpay.payments) {
      return res.status(500).json({
        success: false,
        message: 'Refund service not available'
      });
    }

    // Process refund through Razorpay
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
      notes: {
        reason: reason
      }
    });

    // Update record with refund details
    if (type === 'subscription') {
      await Subscription.findOneAndUpdate(
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
          paymentStatus: refund.status === 'processed' ? 'refunded' : 'processing_refund'
        }
      );
    } else {
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
          paymentStatus: refund.status === 'processed' ? 'refunded' : 'processing_refund'
        }
      );
    }

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
    console.error('❌ Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Refund processing error'
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

    if (!webhookSecret) {
      console.error('❌ Webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;
    console.log('📡 Webhook received:', event);

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
        console.log(`ℹ️ Unhandled webhook event: ${event}`);
    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// ============================================
// Webhook Helper Functions
// ============================================
const handlePaymentCaptured = async (payment) => {
  try {
    console.log('💰 Processing payment captured webhook:', payment.order_id);

    // Try to find subscription first
    let record = await Subscription.findOne({ transactionId: payment.order_id });
    let recordType = 'subscription';

    if (!record) {
      record = await Order.findOne({ transactionId: payment.order_id });
      recordType = 'order';
    }

    if (record && record.paymentStatus === 'pending') {
      record.paymentStatus = 'paid';
      record.status = recordType === 'subscription' ? 'active' : 'confirmed';
      record.paidAt = new Date();
      record.statusHistory.push({
        status: recordType === 'subscription' ? 'active' : 'confirmed',
        timestamp: new Date(),
        note: 'Payment captured via webhook'
      });
      await record.save();
      console.log(`✅ ${recordType} status updated via webhook`);
    }
  } catch (error) {
    console.error('❌ Error handling payment captured webhook:', error);
  }
};

const handlePaymentFailedWebhook = async (payment) => {
  try {
    console.log('⚠️ Processing payment failed webhook:', payment.order_id);

    // Try to find subscription first
    let record = await Subscription.findOne({ transactionId: payment.order_id });
    let recordType = 'subscription';

    if (!record) {
      record = await Order.findOne({ transactionId: payment.order_id });
      recordType = 'order';
    }

    if (record && record.paymentStatus === 'pending') {
      record.paymentStatus = 'failed';
      record.status = 'cancelled';
      record.cancelledAt = new Date();
      record.cancellationReason = 'Payment failed (webhook)';
      record.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: 'Payment failed via webhook'
      });
      await record.save();
      console.log(`✅ ${recordType} marked as failed via webhook`);
    }
  } catch (error) {
    console.error('❌ Error handling payment failed webhook:', error);
  }
};

const handleRefundProcessed = async (refund) => {
  try {
    console.log('💸 Processing refund webhook:', refund.payment_id);

    // Try to find subscription first
    let record = await Subscription.findOne({
      $or: [
        { 'paymentDetails.razorpayPaymentId': refund.payment_id },
        { transactionId: refund.payment_id }
      ]
    });

    if (!record) {
      record = await Order.findOne({
        $or: [
          { 'paymentDetails.razorpayPaymentId': refund.payment_id },
          { transactionId: refund.payment_id }
        ]
      });
    }

    if (record) {
      record.paymentStatus = 'refunded';
      record.refundAmount = refund.amount / 100;
      record.statusHistory.push({
        status: 'refunded',
        timestamp: new Date(),
        note: `Refund processed: ₹${refund.amount / 100} via webhook`
      });

      // Update refund record if exists
      if (record.refunds && record.refunds.length > 0) {
        const refundRecord = record.refunds.find(r => r.refundId === refund.id);
        if (refundRecord) {
          refundRecord.status = 'processed';
          refundRecord.processedAt = new Date();
        }
      }

      await record.save();
      console.log('✅ Refund status updated via webhook');
    }
  } catch (error) {
    console.error('❌ Error handling refund processed webhook:', error);
  }
};

// ============================================
// Additional Utility Functions
// ============================================

// Get record by Razorpay order ID (Enhanced for subscriptions)
const getRecordByRazorpayId = async (req, res) => {
  try {
    const { razorpayOrderId } = req.params;

    // Try to find subscription first
    let record = await Subscription.findOne({ transactionId: razorpayOrderId })
      .populate('userId', 'name email phone')
      .select('subscriptionNumber status paymentStatus pricing paymentDetails startDate');

    let recordType = 'subscription';

    if (!record) {
      record = await Order.findOne({ transactionId: razorpayOrderId })
        .populate('userId', 'name email phone')
        .select('orderNumber status paymentStatus totalAmount paymentDetails deliveryDate');
      recordType = 'order';
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.status(200).json({
      success: true,
      type: recordType,
      [recordType]: record
    });

  } catch (error) {
    console.error('❌ Error fetching record by Razorpay ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching record'
    });
  }
};

// Cancel pending payment (Enhanced for subscriptions)
const cancelPendingPayment = async (req, res) => {
  try {
    const { recordId, type } = req.body;
    const userId = req.user.id;

    let record;
    let recordType;

    if (type === 'subscription') {
      record = await Subscription.findOne({
        _id: recordId,
        userId: userId,
        paymentStatus: 'pending'
      });
      recordType = 'subscription';
    } else {
      record = await Order.findOne({
        _id: recordId,
        userId: userId,
        paymentStatus: 'pending'
      });
      recordType = 'order';
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Pending ${recordType} not found`
      });
    }

    // Update record status
    record.status = 'cancelled';
    record.paymentStatus = 'cancelled';
    record.cancelledAt = new Date();
    record.cancellationReason = 'Payment cancelled by user';
    record.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: 'Payment cancelled by user'
    });

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Payment cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Error cancelling payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel payment'
    });
  }
};

// Retry failed payment (Enhanced for subscriptions)
const retryFailedPayment = async (req, res) => {
  try {
    const { recordId, type } = req.body;
    const userId = req.user.id;

    if (!razorpay || !razorpay.orders) {
      return res.status(500).json({
        success: false,
        message: 'Payment service not available'
      });
    }

    let record;
    let recordType;

    if (type === 'subscription') {
      record = await Subscription.findOne({
        _id: recordId,
        userId: userId,
        paymentStatus: 'failed'
      });
      recordType = 'subscription';
    } else {
      record = await Order.findOne({
        _id: recordId,
        userId: userId,
        paymentStatus: 'failed'
      });
      recordType = 'order';
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Failed ${recordType} not found`
      });
    }

    const amount = record.pricing?.finalAmount || record.totalAmount;

    // Create new Razorpay order
    const razorpayOrderOptions = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `retry_${record._id}_${Date.now()}`,
      notes: {
        recordId: record._id.toString(),
        recordNumber: record.subscriptionNumber || record.orderNumber,
        userId: userId.toString(),
        retryAttempt: 'true',
        type: recordType
      }
    };

    const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);

    // Update record
    record.transactionId = razorpayOrder.id;
    record.paymentStatus = 'pending';
    record.status = 'pending';
    record.statusHistory.push({
      status: 'pending',
      timestamp: new Date(),
      note: 'Payment retry initiated'
    });

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Payment retry initiated',
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      type: recordType
    });

  } catch (error) {
    console.error('❌ Error retrying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry payment'
    });
  }
};

// Get payment analytics (Admin) - Enhanced for subscriptions
const getPaymentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchCondition = {
      createdAt: {
        $gte: new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        $lte: new Date(endDate || new Date())
      }
    };

    // Order analytics
    const orderAnalytics = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          avgAmount: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Subscription analytics
    const subscriptionAnalytics = await Subscription.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.finalAmount' },
          avgAmount: { $avg: '$pricing.finalAmount' }
        }
      }
    ]);

    // Daily stats for orders
    const dailyOrderStats = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
          successfulPayments: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
          failedPayments: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    // Daily stats for subscriptions
    const dailySubscriptionStats = await Subscription.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSubscriptions: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$pricing.finalAmount', 0] } },
          successfulPayments: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
          failedPayments: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    res.json({
      success: true,
      data: {
        orders: {
          summary: orderAnalytics,
          dailyStats: dailyOrderStats
        },
        subscriptions: {
          summary: subscriptionAnalytics,
          dailyStats: dailySubscriptionStats
        },
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching payment analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// Validate Razorpay configuration
const validateRazorpayConfig = async (req, res) => {
  try {
    const isConfigured = !!(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      razorpay &&
      razorpay.orders
    );

    res.json({
      success: true,
      configured: isConfigured,
      keyId: process.env.RAZORPAY_KEY_ID ? '***' + process.env.RAZORPAY_KEY_ID.slice(-4) : null,
      webhookConfigured: !!process.env.RAZORPAY_WEBHOOK_SECRET
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Configuration check failed'
    });
  }
};

// ============================================
// Export all functions
// ============================================
module.exports = {
  // Main payment functions
  createRazorpayOrder,
  createPaymentOrder,
  handlePaymentSuccess,
  verifyPayment,
  handlePaymentFailure,
  getPaymentStatus,
  getPaymentHistory,
  refundPayment,
  processRefund,
  handleRazorpayWebhook,

  // Webhook handlers
  handlePaymentCaptured,
  handlePaymentFailedWebhook,
  handleRefundProcessed,
  handlePaymentFailed,

  // Additional utility functions
  getRecordByRazorpayId, // Renamed from getOrderByRazorpayId
  cancelPendingPayment,
  retryFailedPayment,
  getPaymentAnalytics,
  validateRazorpayConfig,

  // Utility functions
  verifyPaymentSignature,

  // Razorpay instance (for testing)
  razorpay: process.env.NODE_ENV === 'development' ? razorpay : undefined
};
