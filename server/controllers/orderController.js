const mongoose = require('mongoose');
// Models
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Driver = require('../models/Driver');
const DeliveryTracking = require('../models/DeliveryTracking');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const { generateOrderNumber } = require('../utils/orderUtils');
const { generateOTP } = require("../utils/Otpservice");
const { sendOrderConfirmation } = require('../utils/emailService');
const { createNotification } = require('../utils/notificationService');
const { ensureCoordinates } = require('../utils/geocoding');
const MealPlan = require('../models/MealPlan');
const Category = require("../models/Category");

const orderController = {
  // ====== Unified Order Creation ======
  // createOrder: async (req, res) => {
  //   try {
  //     const { 
  //       type = 'addon',
  //       items,
  //       deliveryDate,
  //       deliverySlot,
  //       shippingAddress,
  //       payment,
  //       notes,
  //       giftMessage,
  //       isGift,
  //       specialInstructions
  //     } = req.body;

  //     // Handle both cart-based and direct orders
  //     let orderItems = [];
  //     let totalAmount = 0;
  //     let cart = null;

  //     // Scenario 1: Cart-based order (e-commerce)
  //     if (!items && req.user) {
  //       cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  //       if (!cart || cart.items.length === 0) {
  //         return res.status(400).json({ message: 'Cart is empty' });
  //       }

  //       orderItems = cart.items.map(item => ({
  //         product: item.product._id,
  //         name: item.product.name,
  //         quantity: item.quantity,
  //         price: item.price,
  //         originalPrice: item.originalPrice,
  //         discount: item.originalPrice - item.price,
  //         image: item.product.images[0]?.url,
  //         category: 'product'
  //       }));

  //       totalAmount = payment?.amount;
  //     } 
  //     // Scenario 2: Direct food order (GKK)
  //     else if (items) {
  //       orderItems = items.map(item => ({
  //         name: item.name,
  //         quantity: item.quantity,
  //         price: item.price,
  //         category: item.category || 'addon',
  //         customizations: item.customizations || []
  //       }));
  //       totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  //     }

  //     // Validate delivery date for GKK orders
  //     if (deliveryDate) {
  //       const selectedDate = new Date(deliveryDate);
  //       const today = new Date();
  //       today.setHours(0, 0, 0, 0);
  //       if (selectedDate < today) {
  //         return res.status(400).json({ message: 'Delivery date cannot be in the past' });
  //       }
  //     }

  //     // Calculate charges
  //     const gst = totalAmount * 0.05; // 5% GST
  //     const deliveryCharges = type === 'gkk' ? 0 : (totalAmount >= 500 ? 0 : 50);
  //     const packagingCharges = type === 'gkk' ? 10 : 0;
  //     const finalAmount = totalAmount + gst + deliveryCharges + packagingCharges;

  //     // Generate order details
  //     const orderNumber = await generateOrderNumber(type);
  //     const otp = type === 'gkk' ? generateOTP(4) : null;
  //     const cancelBefore = deliveryDate ? new Date(deliveryDate) : new Date();
  //     cancelBefore.setHours(6, 0, 0, 0); // GKK cancellation deadline

  //     // Create order
  //     const order = new Order({
  //       orderNumber,
  //       userId: req.user?.id || req.userId,
  //       type,
  //       items: orderItems,
  //       ...(deliveryDate && { deliveryDate }),
  //       ...(deliverySlot && { deliverySlot }),
  //       subtotal: totalAmount,
  //       discount: cart?.totalDiscount || 0,
  //       taxes: {
  //         gst,
  //         deliveryCharges,
  //         packagingCharges
  //       },
  //       totalAmount: finalAmount,
  //       paymentMethod: payment?.method || 'cod',
  //       paymentStatus: payment?.status || 'pending',
  //       ...(shippingAddress && { shippingAddress }),
  //       ...(deliveryDate && { cancelBefore }),
  //       specialInstructions,
  //       otp,
  //       notes,
  //       giftMessage,
  //       isGift
  //     });

  //     // Process payment
  //     if (order.paymentMethod === 'wallet') {
  //       const user = await User.findById(order.userId);
  //       if (user.wallet.balance < finalAmount) {
  //         return res.status(400).json({ message: 'Insufficient wallet balance' });
  //       }
  //       user.wallet.balance -= finalAmount;
  //       user.wallet.transactions.push({
  //         amount: finalAmount,
  //         type: 'debit',
  //         note: `Order ${orderNumber}`,
  //         referenceId: orderNumber
  //       });
  //       order.paymentStatus = 'paid';
  //       await user.save();
  //     }

  //     await order.save();

  //     // Post-order actions
  //     if (cart) await Cart.findOneAndUpdate(
  //       { user: req.user.id },
  //       { items: [], totalAmount: 0, totalDiscount: 0 }
  //     );

  //     // Notifications
  //     await createNotification({
  //       userId: order.userId,
  //       title: `Order ${orderNumber} Confirmed`,
  //       message: `Your ${type === 'gkk' ? 'meal' : 'order'} will be ${deliveryDate ? `delivered on ${new Date(deliveryDate).toDateString()}` : 'processed shortly'}`,
  //       type: 'order'
  //     });

  //     if (req.user?.email) {
  //       await sendOrderConfirmation(req.user.email, order);
  //     }

  //     res.status(201).json({
  //       success: true,
  //       order: await Order.findById(order._id)
  //         .populate('user', 'name email')
  //         .populate('items.product'),
  //     });

  //   } catch (error) {
  //     console.error('Order creation error:', error);
  //     res.status(500).json({ 
  //       success: false,
  //       message: error.message 
  //     });
  //   }
  // },
// Enhanced createOrder controller
 createOrder : async (req, res) => {
  try {
    const {
      type = 'addon',
      items,
      deliveryDate,
      deliverySlot,
      preferredDeliveryTime,
      deliveryInstructions,
      shippingAddress,
      billingAddress,
      payment,
      notes,
      giftMessage,
      isGift,
      specialInstructions,
      customer,
      orderSummary
    } = req.body;

    let orderItems = [];
    let totalAmount = 0;
    let cart = null;
    console.log("order summary ",orderSummary);
    console.log('rq body data ',req.body);
    // If items not explicitly sent, fetch from cart
    if (!items && req.user) {
      cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }


      orderItems = cart.items.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
        discount: item.originalPrice - item.price,
        image: item.product.images[0]?.url,
        category: item?.category?.name,
        seller: item?.product?.seller ? new mongoose.Types.ObjectId(item.product.seller) : new mongoose.Types.ObjectId('68b0cbf4b645a7444132cbb3'),
        variant: item.variant || {},
        isCollegeBranded: item.isCollegeBranded || false,
        ...(item.collegeName && { collegeName: item.collegeName }) // Include college name if present
      }));

      // Use subtotal from request body if provided, otherwise use payment amount
      totalAmount = req.body?.orderSummary?.subtotal
    } else if (items && Array.isArray(items)) {
      // Debug: Log incoming items to check college information
      console.log('Incoming items for direct order creation:', items.map(item => ({
        name: item.name,
        isCollegeBranded: item.isCollegeBranded,
        collegeName: item.collegeName
      })));

      // Expanded validation for all product types
      // const allowedCategories = ['main', 'addon', 'sweets', 'beverage', 'tiffin', 'vegetables', 'fastfood', 'product','stationery','FoodZone','grocery','foodzone'];
     const categories = await Category.find({}, { name: 1, _id: 0 });
      const allowedCategories = categories.map(cat => cat.name.toLowerCase());
      console.log(allowedCategories, "items categories are ",items)
      orderItems = items.map((item, idx) => {
        if (!item.name || typeof item.name !== 'string') {
          throw new Error(`Order item at index ${idx} is missing a valid 'name'.`);
        }
        if (typeof item.price !== 'number' || isNaN(item.price)) {
          throw new Error(`Order item '${item.name}' at index ${idx} has invalid 'price'.`);
        }
        // if (!allowedCategories.includes(item?.category)) {
        //   throw new Error(`Order item '${item?.name}' at index ${idx} has invalid 'category': ${item.category?.name}`);
        // }
        
        // Handle custom add-ons (items without real product IDs)
        const isCustomAddOn = item.productId && typeof item.productId === 'string' && !item.productId.match(/^[0-9a-fA-F]{24}$/);
        
        return {
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: item.category,
          customizations: item.customizations || [],
          product: isCustomAddOn ? undefined : item.productId, // Don't set product for custom add-ons
          seller: item.seller || new mongoose.Types.ObjectId('687242b702db822f91b13586'), // Default to main seller ID
          originalPrice: item.originalPrice,
          discount: item.discount,
          image: item?.image?.url,
          variant: item.variant || {},
          isCollegeBranded: item.isCollegeBranded || false,
          ...(item.collegeName && { collegeName: item.collegeName }) // Include college name if present
        };
      });




      totalAmount = req.body?.orderSummary?.subtotal || orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    } else {
      return res.status(400).json({ message: 'No items provided for order' });
    }

    // Validate delivery date
    if (deliveryDate) {
      const selectedDate = new Date(deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return res.status(400).json({ message: 'Delivery date cannot be in the past' });
      }
    }

    // Use charges from frontend if provided, otherwise calculate using charges system
    let gst = req.body?.tax || 0;
    let deliveryCharges = req.body?.deliveryCharges || 0;
    let packagingCharges = req.body?.packagingCharges || 0;
    let rainCharges = req.body?.rainCharges || 0;
    let serviceCharges = req.body?.serviceCharges || req.body?.handlingCharges || 0;
    
    // Only calculate charges using the charges system if frontend didn't provide them
    const hasFrontendCharges = req.body?.deliveryCharges !== undefined || 
                              req.body?.packagingCharges !== undefined || 
                              req.body?.serviceCharges !== undefined || 
                              req.body?.handlingCharges !== undefined;
    
    if (!hasFrontendCharges) {
      try {
        // Get applicable charges from the charges system
        const ChargesAndTaxes = require('../models/ChargesAndTaxes');
        
        // Prepare items for charges calculation
        const itemsForCharges = orderItems.map(item => ({
          category: item.category || { _id: null },
          price: item.price,
          quantity: item.quantity
        }));
        
        const applicableCharges = await ChargesAndTaxes.getApplicableCharges({
          items: itemsForCharges,
          subtotal: totalAmount,
          orderDate: new Date()
        });
        
        // Apply charges based on type
        applicableCharges.forEach(charge => {
          const amount = charge.calculatedAmount || 0;
          
          switch (charge.chargeType) {
            case 'tax':
              gst += amount;
              break;
            case 'delivery':
              if (!deliveryCharges) deliveryCharges = amount;
              break;
            case 'packing':
              packagingCharges += amount;
              break;
            case 'rain':
              rainCharges += amount;
              break;
            case 'service':
              serviceCharges += amount;
              break;
            default:
              // Add other charges to service charges
              serviceCharges += amount;
          }
        });
        
      } catch (chargesError) {
        console.error('Error calculating charges:', chargesError);
        // Fallback to basic calculation if charges system fails
        if (totalAmount > 100) {
          gst = Math.round((totalAmount * 0.05) * 100) / 100; // 5% GST
        }
        
        if (!deliveryCharges) {
          if (type === 'gkk') {
            deliveryCharges = 0;
          } else {
            deliveryCharges = totalAmount >= 500 ? 0 : 50;
          }
        }
        
        if (type === 'gkk') {
          packagingCharges = 10;
        } else {
          packagingCharges = totalAmount < 200 ? 15 : 0;
        }
      }
    } else {
      console.log('Using frontend-provided charges:', {
        gst, deliveryCharges, packagingCharges, rainCharges, serviceCharges
      });
    }
    // Handle coupon validation and discount calculation
    let discount = req.body?.discountAmount || cart?.totalDiscount || 0;
    let couponId = null;
    let couponCode = null;
    
    // If coupon code is provided, use frontend-provided data (already validated)
    if (req.body?.couponCode && req.body?.couponId && req.body?.discountAmount) {
      // Trust the frontend validation and use the provided data
      couponId = req.body.couponId;
      couponCode = req.body.couponCode;
      discount = req.body.discountAmount;
      
      try {
        const coupon = await Coupon.findById(couponId);
        if (!coupon || !coupon.isActive) {

          couponId = null;
          couponCode = null;
          discount = 0;
        } else {
          console.log('✅ Coupon still active, proceeding with order');
        }
      } catch (error) {
        console.error('Error validating coupon during order creation:', error);
        // Don't fail the order, just remove coupon
        couponId = null;
        couponCode = null;
        discount = 0;
      }
    } else if (req.body?.couponCode) {
      try {
        const coupon = await Coupon.findOne({ 
          code: req.body.couponCode.toUpperCase(),
          isActive: true
        });


        if (!coupon) {
          console.log('❌ Coupon not found, proceeding without coupon');
          // Don't fail the order, just proceed without coupon
        } else if (!coupon.isValid) {
          console.log('❌ Coupon not valid, proceeding without coupon');
          // Don't fail the order, just proceed without coupon
        } else {
          // Use coupon discount if it's higher than existing discount
          const discountResult = coupon.calculateDiscount(totalAmount, orderItems);
          if (discountResult.discount > discount) {
            discount = discountResult.discount;
            couponId = coupon._id;
            couponCode = coupon.code;
            console.log(`✅ Coupon ${coupon.code} applied with discount ₹${discountResult.discount}`);
            console.log('🎯 Coupon Variables Set:', { couponId, couponCode, discount });
          } else {
            console.log(`⚠️ Coupon ${coupon.code} not applied - existing discount ₹${discount} is higher than coupon discount ₹${discountResult.discount}`);
          }
        }
      } catch (error) {
        console.error('Error validating coupon:', error);
        // Don't fail the order, just proceed without coupon
      }
    }

    // Match the Order model validation formula exactly - now includes all charges
    const finalAmount = Math.round((totalAmount - discount + gst + deliveryCharges + packagingCharges + rainCharges + serviceCharges) * 100) / 100;

    // Generate order metadata
    const orderNumber = await generateOrderNumber(type);
    const otp = type === 'gkk' ? generateOTP(4) : null;
    const cancelBefore = deliveryDate ? new Date(deliveryDate) : new Date();
    cancelBefore.setHours(6, 0, 0, 0);

    // Create Order
    const order = new Order({
      orderNumber,
      userId: req.user?.id || req.userId,
      type,
      deliveryInstructions,
      items: orderItems,
      deliveryDate,
      deliverySlot:preferredDeliveryTime,
      deliveryAddress:shippingAddress,
      billingAddress,
      subtotal: totalAmount,
      discountAmount: discount,
      taxes: { 
        gst, 
        deliveryCharges, 
        packagingCharges, 
        rainCharges, 
        serviceCharges 
      },
      totalAmount: finalAmount,
      paymentMethod: payment?.method || 'cod'||"COD",
      paymentStatus: payment?.status || 'pending',
      cancelBefore,
      specialInstructions,
      otp,
      notes,
      giftMessage,
      isGift,
      userContactNo:customer.phone,
      couponCode: couponCode,
      couponId: couponId
    });

    // Handle wallet payment
    if (order.paymentMethod === 'wallet') {
      const user = await User.findById(order.userId);
      if (user.wallet.balance < finalAmount) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      user.wallet.balance -= finalAmount;
      user.wallet.transactions.push({
        amount: finalAmount,
        type: 'debit',
        note: `Order ${orderNumber}`,
        referenceId: orderNumber,
      });
      order.paymentStatus = 'paid';
      await user.save();
    }


    await order.save();
    
    if (couponId && couponCode) {
      try {
        console.log(`Recording coupon usage: ${couponCode} for user ${order.userId} on order ${order.orderNumber}`);
        
        // Verify coupon exists and is valid
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
          console.error(`❌ Coupon ${couponId} not found`);
          throw new Error('Coupon not found');
        }

        
// Create coupon usage record
const couponUsage = new CouponUsage({
  couponId: couponId,
  userId: order.userId,
  orderId: order._id,
  usageType: 'order',
  discountAmount: discount,
  orderTotal: totalAmount,
  couponCode: couponCode,
  status: 'applied',
  appliedAt: new Date()
});

// Save coupon usage record
await couponUsage.save();
console.log(`✅ Coupon usage record created: ${couponUsage._id}`);
        // Update coupon usage count and last used date
        await Coupon.findByIdAndUpdate(couponId, {
          $inc: { usedCount: 1 },
          $set: { 
            lastUsedAt: new Date(),
            lastUsedBy: order.userId
          }
        });

        console.log(`✅ Coupon ${couponCode} usage recorded successfully for order ${order.orderNumber} with discount ₹${discount}`);
      } catch (couponError) {
        console.error('❌ Error recording coupon usage:', couponError);
        
        // Check if it's a duplicate key error (user already used this coupon)
        if (couponError.code === 11000) {
          console.log(`⚠️ User ${order.userId} has already used coupon ${couponCode}`);
          // This shouldn't happen if validation is working correctly, but log it for debugging
        } else {
          // Log the full error for debugging
          console.error('Coupon usage error details:', {
            error: couponError,
            couponId,
            userId: order.userId,
            orderId: order._id
          });
        }
        
        // Don't fail order creation if coupon tracking fails
      }
    } else {
      console.log(`No coupon usage to record - couponId: ${couponId}, couponCode: ${couponCode}`);
    }

    // Debug: Log saved order to verify college information
    const savedOrder = await Order.findById(order._id);

    // Notify drivers about new normal order
    if (type !== 'gkk') { // Don't notify for subscription orders
      try {
        const { notifyDriversAboutNormalOrder } = require('../utils/driverNotificationService');
        await notifyDriversAboutNormalOrder(order);
        console.log(`Driver notifications sent for order ${order.orderNumber}`);
      } catch (notificationError) {
        console.error('Error sending driver notifications:', notificationError);
        // Don't fail order creation if notification fails
      }
    }

    // Emit new order notification to sellers
    if (global.io) {
      // Get unique seller IDs from order items
      const sellerIds = [...new Set(order.items.map(item => item.seller?.toString()).filter(Boolean))];
      
      sellerIds.forEach(sellerId => {
        console.log('Emitting new order to seller:', sellerId);
        global.io.to(`seller-orders-${sellerId}`).emit('newOrderReceived', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          items: order.items.filter(item => item.seller?.toString() === sellerId),
          customer: {
            name: customer?.name,
            phone: customer?.phone
          },
          type: order.type,
          deliveryDate: order.deliveryDate,
          deliverySlot: order.deliverySlot,
          createdAt: order.createdAt
        });
      });
    }

    // Create delivery tracking for the order
    try {
      const deliveryTracking = new DeliveryTracking({
        orderId: order._id.toString(),
        status: 'order_placed',
        deliveryAddress: await ensureCoordinates({
          name: shippingAddress?.name || billingAddress?.name || customer?.name,
          phone: shippingAddress?.phone || billingAddress?.phone || customer?.phone,
          street: shippingAddress?.address || shippingAddress?.street || billingAddress?.address,
          city: shippingAddress?.city || billingAddress?.city,
          state: shippingAddress?.state || billingAddress?.state,
          zipCode: shippingAddress?.pincode || billingAddress?.pincode,
          country: 'India',
          coordinates: shippingAddress?.coordinates || null
        }),
        timeline: [{
          status: 'order_placed',
          description: 'Order has been placed successfully',
          timestamp: new Date(),
          completed: true
        }],
        // Set default driver location near the service area
        currentLocation: {
          lat: 22.763813,
          lng: 75.885822
        }
      });

      await deliveryTracking.save();
      console.log('Delivery tracking created for order:', order.orderNumber);

          // Auto-assign driver after a short delay
    // setTimeout(async () => {
    //   const { autoAssignDriver } = require('./deliveryTrackingController');
    //   const assigned = await autoAssignDriver(order._id);
    //   if (assigned) {
    //     console.log(`Auto-assigned driver to order ${order.orderNumber}`);
        
    //     // Emit real-time driver assignment notification
    //     if (global.io) {
    //       global.io.to('admin-orders').emit('driver-assigned', {
    //         orderId: order._id,
    //         orderNumber: order.orderNumber,
    //         assignedAt: new Date()
    //       });
    //     }
    //   } else {
    //     console.log(`No drivers available for order ${order.orderNumber}`);
    //   }
    // }, 2000); // 2 second delay to simulate finding driver

    // Emit new order notification
    if (global.io) {
      global.io.to('admin-orders').emit('new-order-created', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalAmount: finalAmount,
        items: order.items,
        createdAt: new Date()
      });
    }

    } catch (error) {
      console.error('Error creating delivery tracking:', error);
      // Don't fail the order if delivery tracking fails
    }

    // Create subscription if this is a subscription order
    if (order.type === 'subscription' && order.mealPlanId) {
      console.log('🔄 Order is for subscription - subscription should already exist from frontend');
      
      // Find existing pending subscription instead of creating new one
      const existingSubscription = await Subscription.findOne({
        user: order.userId,
        status: 'pending_payment',
        mealPlan: order.mealPlanId
      });

      if (existingSubscription) {
        console.log('✅ Found existing pending subscription:', existingSubscription.subscriptionId);
        order.subscriptionId = existingSubscription._id;
      } else {
        console.log('⚠️ No pending subscription found - this may indicate an issue with the flow');
      }
    }

    // Empty the cart post order
    if (cart) {
      await Cart.findOneAndUpdate(
        { user: req.user.id },
        { items: [], totalAmount: 0, totalDiscount: 0 }
      );
    }

    // Notification to user (already present)
    await createNotification({
      userId: order.userId,
      title: `Order ${order.orderNumber} Confirmed`,
      message: `Your ${order.type === 'gkk' ? 'meal' : 'order'} will be ${order.deliveryDate ? `delivered on ${new Date(order.deliveryDate).toDateString()}` : 'processed shortly'}`,
      type: 'order_confirmed',
      priority: 'normal',
      data: { orderId: order._id, orderNumber: order.orderNumber }
    });

    // Notification to seller(s)
    const io = req.app.get('io');
    const notifiedSellers = new Set();
    for (const item of order.items) {
      if (item.seller && !notifiedSellers.has(item.seller.toString())) {
        const notification = await createNotification({
          userId: item.seller,
          title: 'New Order Received',
          message: `Order #${order.orderNumber} includes your product: ${item.name}`,
          type: 'order_confirmed',
          priority: 'normal',
          data: { orderId: order._id, productId: item.product || null, orderNumber: order.orderNumber }
        });
        if (io) io.to(`user-${item.seller}`).emit('notification', notification);
        notifiedSellers.add(item.seller.toString());
      }
    }

    // If any item has customizations, notify seller about customization
    for (const item of order.items) {
      if (item.seller && item.customizations && item.customizations.length > 0) {
        const notification = await createNotification({
          userId: item.seller,
          title: 'Order Customization',
          message: `Order #${order.orderNumber} for ${item.name} has customizations: ${item.customizations.join(', ')}`,
          type: 'order_confirmed',
          priority: 'normal',
          data: { orderId: order._id, productId: item.product || null }
        });
        if (io) io.to(`user-${item.seller}`).emit('notification', notification);
      }
    }
    console.log(order);
    // Send Email
    if (req.user?.email) {
      await sendOrderConfirmation(req.user.email, order);
      await sendOrderConfirmation("order@tastyaana.com", order);
    }

    // Send response
    res.status(201).json({
      success: true,
      order: await Order.findById(order._id)
        .populate('userId', 'name email')
        .populate('items.product'),
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
},

  // ====== Get Single Order Details ======
  getOrderDetails: async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const orderId = req.params.orderId || orderNumber;
   
      // Try to find by orderNumber first, then by _id
      let order = await Order.findOne({ orderNumber: orderId })
        .populate('userId', 'name email phone')
        .populate('deliveryPartner', 'name phone email isOnline');
        
      if (!order) {
        order = await Order.findById(orderId)
          .populate('userId', 'name email phone')
          .populate('deliveryPartner', 'name phone email isOnline');
      }

      if (!order) {
        console.log("order id ",req.params)
        return res.status(404).json({
          success: false,
          message: 'Orders not found'
        });
      }

      // Check if user owns the order or is admin/delivery partner
      const userCanAccess = 
        order.userId._id.toString() === req.user.id ||
        req.user.role === 'admin' ||
        req.user.role === 'super-admin' ||
        (order.deliveryPartner && order.deliveryPartner._id.toString() === req.user.id);

      if (!userCanAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        order
      });

    } catch (error) {
      console.error('Error fetching order details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order details',
        error: error.message
      });
    }
  },

  // ====== Order Details ======
  getOrderDetails: async (req, res) => {
    try {
      const { orderId:id } = req.params;
      console.log(req.params)
      const order = await Order.findOne({ 
        _id: id,
        $or: [
          { userId: req.user?._id },
          { userId: req.user?.id }
        ]
      })
      .populate('userId', 'name email phone')
      .populate('items.product')
      .populate('deliveryPartner', 'name phone');

      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: 'Order not found' 
        });
      }

      // Track delivery status
      let estimatedDelivery = null;
      if (['confirmed', 'preparing'].includes(order.status)) {
        estimatedDelivery = new Date(order.createdAt);
        estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 45);
      } else if (order.status === 'out-for-delivery') {
        estimatedDelivery = new Date();
        estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 15);
      }

      res.json({
        success: true,
        order,
        tracking: {
          estimatedDelivery,
          statusHistory: [
            { status: 'pending', timestamp: order.createdAt, completed: true },
            { status: 'confirmed', timestamp: order.updatedAt, completed: !['pending'].includes(order.status) },
            { status: 'preparing', completed: ['preparing', 'ready', 'out-for-delivery', 'delivered'].includes(order.status) },
            { status: 'out-for-delivery', completed: ['out-for-delivery', 'delivered'].includes(order.status) },
            { status: 'delivered', timestamp: order.deliveredAt, completed: order.status === 'delivered' }
          ]
        }
      });

    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  },
  getOrders: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        type,
        startDate, 
        endDate,
        search 
      } = req.query;

      const filter = {
        ...(req.user?.id ? { userId: req.user.id } : {}),
        ...(req.userId ? { userId: req.userId } : {})
      };

      if (status) filter.status = status;
      if (type) filter.type = type;
      if (search) {
        filter.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'items.name': { $regex: search, $options: 'i' } }
        ];
      }
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      console.log(filter);
      const orders = await Order.find(filter)
        .populate('userId', 'name email phone')
        .populate('deliveryPartner', 'name phone email isOnline')
        .populate('items.product')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const enrichedOrders = orders.map(order => ({
        ...order.toObject(),
        canCancel: new Date() < order.cancelBefore && ['pending', 'confirmed'].includes(order.status),
        isDelivered: order.status === 'delivered',
        canRate: order.status === 'delivered' && !order.rating
      }));

      const total = await Order.countDocuments(filter);

      res.json({
        success: true,
        orders: enrichedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.log(error);
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  },

  // ====== Order Cancellation ======
  cancelOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await Order.findOne({
        _id: id,
        $or: [
          { userId: req.user?.id },
          { userId: req.userId }
        ]
      });

      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: 'Order not found' 
        });
      }

      // Validate cancellation
      if (new Date() >= order.cancelBefore) {
        return res.status(400).json({ 
          success: false,
          message: 'Cancellation deadline passed' 
        });
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ 
          success: false,
          message: 'Order cannot be cancelled now' 
        });
      }

      // Process refund
      if (order.paymentStatus === 'paid') {
        const user = await User.findById(order.userId);
        user.wallet.balance += order.totalAmount;
        user.wallet.transactions.push({
          amount: order.totalAmount,
          type: 'credit',
          note: `Refund for ${order.orderNumber}`,
          referenceId: `REF-${order.orderNumber}`
        });
        order.refundAmount = order.totalAmount;
        order.paymentStatus = 'refunded';
        await user.save();
      }

      // Update order
      order.status = 'cancelled';
      order.cancellationReason = reason;
      order.cancelledAt = new Date();
      await order.save();

      // Notify user
      await createNotification({
        userId: order.userId,
        title: 'Order Cancelled',
        message: `Your order #${order.orderNumber} has been cancelled${order.refundAmount ? ` and ₹${order.refundAmount} refunded` : ''}`,
        type: 'general',
        priority: 'normal',
        data: { orderId: order._id, orderNumber: order.orderNumber }
      });

      res.json({ 
        success: true,
        message: 'Order cancelled successfully' 
      });

    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  },

  // ====== Admin Order Management ======
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, trackingNumber } = req.body;

      const order = await Order.findByIdAndUpdate(
        id,
        { 
          status,
          trackingNumber,
          ...(status === 'delivered' && { deliveredAt: new Date() })
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: 'Order not found' 
        });
      }

      // Notify user on status change
      if (['out-for-delivery', 'delivered'].includes(status)) {
        const notificationType = status === 'delivered' ? 'order_delivered' : 'order_shipped';
        await createNotification({
          userId: order.userId,
          title: `Order ${status === 'delivered' ? 'Delivered' : 'On the Way'}`,
          message: `Your order #${order.orderNumber} has been ${status === 'delivered' ? 'delivered' : 'dispatched'}`,
          type: notificationType,
          priority: 'normal',
          data: { orderId: order._id, orderNumber: order.orderNumber }
        });
      }

      res.json({ 
        success: true,
        order 
      });

    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
  }
,

/**
 * Track order status
 */
trackOrder :async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      userId: req.userId
    })
    .populate('deliveryPartner', 'name phone')
    .populate('restaurantId', 'name phone address')
    .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Calculate estimated delivery time based on status
    let estimatedDelivery = null;
    if (['confirmed', 'preparing'].includes(order.status)) {
      estimatedDelivery = new Date(order.createdAt);
      estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 45);
    } else if (order.status === 'out-for-delivery') {
      estimatedDelivery = new Date();
      estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 15);
    }

    res.json({
      success: true,
      data: {
        order,
        estimatedDelivery,
        statusHistory: [
          { status: 'pending', timestamp: order.createdAt, completed: true },
          { status: 'confirmed', timestamp: order.updatedAt, completed: ['confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered'].includes(order.status) },
          { status: 'preparing', timestamp: null, completed: ['preparing', 'ready', 'out-for-delivery', 'delivered'].includes(order.status) },
          { status: 'out-for-delivery', timestamp: null, completed: ['out-for-delivery', 'delivered'].includes(order.status) },
          { status: 'delivered', timestamp: order.deliveredAt, completed: order.status === 'delivered' }
        ]
      }
    });

  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track order',
      error: error.message
    });
  }
  }
};

// Customize today's meal for a GKK order
orderController.customizeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items } = req.body; // [{ name, quantity, price }]
    const order = await Order.findById(orderId).populate('subscriptionId');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ message: 'Order cannot be customized now' });
    if (!order.isPartOfSubscription) return res.status(400).json({ message: 'Not a subscription order' });

    // Get base meal plan price
    const subscription = order.subscriptionId;
    const mealPlan = await MealPlan.findById(subscription.planId);
    let perDayPrice = 0;
    if (subscription.totalDays >= 30 && mealPlan.pricing.thirtyDays) {
      perDayPrice = mealPlan.pricing.thirtyDays / 30;
    } else if (subscription.totalDays >= 10 && mealPlan.pricing.tenDays) {
      perDayPrice = mealPlan.pricing.tenDays / 10;
    } else {
      perDayPrice = mealPlan.pricing.oneDay;
    }

    // Calculate customization total
    let customizationTotal = 0;
    if (Array.isArray(items)) {
      customizationTotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    }
    const extraAmount = Math.max(0, customizationTotal - perDayPrice);
    order.customizationCharges = {
      items: items || [],
      total: customizationTotal
    };
    order.isCustomized = true;
    // If extra payment required, set paymentStatus to pending
    if (extraAmount > 0) {
      order.paymentStatus = 'pending';
    } else {
      order.paymentStatus = 'paid';
    }
    await order.save();
    return res.json({
      success: true,
      paymentRequired: extraAmount > 0,
      extraAmount,
      order
    });
  } catch (error) {
    console.error('Customize order error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Handle payment for customization charges (placeholder)
orderController.payCustomizationCharges = async (req, res) => {
  try {
    const { orderId } = req.params;
    // In real implementation, verify payment with Razorpay/Stripe webhook
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus === 'paid') return res.json({ success: true, message: 'Already paid' });
    order.paymentStatus = 'paid';
    order.isCustomized = true;
    await order.save();
    return res.json({ success: true, message: 'Customization payment successful', order });
  } catch (error) {
    console.error('Customization payment error:', error);
    res.status(500).json({ message: error.message });
  }
};

orderController.updatePaymentStatus = async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const { paymentStatus, description } = req.body;
      const userId = req.user.id;

      console.log(`💰 Updating payment status for order: ${orderNumber} -> ${paymentStatus}`);

      // Find the order by order number
      const order = await Order.findOne({ _id:orderNumber });
      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: 'Order not found' 
        });
      }

      // Check if user is authorized (admin or assigned driver)
      const tracking = await DeliveryTracking.findOne({ orderId: order._id.toString() });
      const isAuthorized = req.user.role === 'admin' || req.user.role === 'delivery'|| req.user.role === 'driver'
                          (tracking?.driverId && tracking.driverId.toString() === userId);
      
      if (!isAuthorized) {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Only admin or assigned driver can update payment status.' 
        });
      }

      // Validate payment status
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'completed'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`
        });
      }

      // Update order payment status
      const oldPaymentStatus = order.paymentStatus;
      order.paymentStatus = paymentStatus;
      
      // Add specific timestamps based on payment status
      if (paymentStatus === 'paid' || paymentStatus === 'completed') {
        order.paidAt = new Date();
        
        // If order status is still pending, update to confirmed
        if (order.status === 'pending') {
          order.status = 'confirmed';
        }
      }

      // Add to status history
      order.statusHistory.push({
        status: order.status,
        timestamp: new Date(),
        note: `Payment status updated to ${paymentStatus} by ${req.user.role}${description ? `: ${description}` : ''}`,
        updatedBy: userId
      });

      await order.save();

      // Update delivery tracking if exists
      if (tracking) {
        tracking.timeline.push({
          status: 'payment_confirmed',
          timestamp: new Date(),
          description: `Payment status updated to ${paymentStatus}${description ? `: ${description}` : ''}`,
          completed: true
        });
        await tracking.save();
      }

      // Emit real-time update to connected clients
      try {
        const io = global.io;
        if (io) {
          io.to(`tracking-${order._id}`).emit('payment-status-update', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentStatus,
            previousPaymentStatus: oldPaymentStatus,
            timestamp: new Date(),
            updatedBy: {
              name: req.user.name,
              role: req.user.role
            }
          });
          console.log(`✅ Payment status update emitted for order ${orderNumber}`);
        }
      } catch (socketError) {
        console.error('Socket emission error:', socketError);
      }

      // Send notification to customer for payment confirmation
      if (paymentStatus === 'paid' || paymentStatus === 'completed') {
        try {
          await order.populate('userId', 'name email phone');
          if (order?.userId) {
            // Send email notification for payment confirmation
            const emailData = {
              orderNumber: order.orderNumber,
              paymentStatus,
              amount: order.totalAmount,
              customerName: order.userId.name,
              paymentMethod: order.paymentMethod
            };
            
            console.log(`📧 Payment confirmation sent to customer for order ${order.orderNumber}`);
          }
        } catch (notificationError) {
          console.error('Error sending payment notification:', notificationError);
        }
      }

      res.json({ 
        success: true,
        message: 'Payment status updated successfully',
        data: {
          orderNumber: order.orderNumber,
          orderId: order._id,
          paymentStatus,
          previousPaymentStatus: oldPaymentStatus,
          orderStatus: order.status,
          paidAt: order.paidAt,
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }}

// Auto-assign delivery partner to order based on item category
const autoAssignDeliveryPartnerToOrder = async (orderId, items) => {
  try {
    console.log('Auto-assigning delivery partner for order:', orderId);
    
    // Determine order category based on items
    const orderCategory = determineOrderCategory(items);
    console.log('Determined order category:', orderCategory);

    // Find or create delivery tracking record
    let tracking = await DeliveryTracking.findOne({ orderId });
    if (!tracking) {
      console.log('No tracking record found for order:', orderId);
      return;
    }

    // Get order for delivery address coordinates
    const order = await Order.findById(orderId);
    if (!order) {
      console.log('Order not found:', orderId);
      return;
    }

    // Find best available driver for this category
    const bestDriver = await findBestDriverForOrderCategory(order, orderCategory);
    
    if (!bestDriver) {
      console.log('No available delivery partners found for category:', orderCategory);
      return;
    }

    // Assign driver to tracking
    tracking.driverId = bestDriver._id;
    tracking.status = 'assigned';
    tracking.assignedCategory = orderCategory;
    
    // Add timeline entry
    tracking.timeline.push({
      status: 'assigned',
      timestamp: new Date(),
      description: `${getCategoryDisplayName(orderCategory)} delivery partner ${bestDriver.name} has been assigned`,
      completed: true
    });

    await tracking.save();

    // Update order status
    order.status = 'confirmed';
    order.deliveryPartner = bestDriver._id;
    await order.save();

    console.log(`Order ${orderId} assigned to ${orderCategory} delivery partner: ${bestDriver.name}`);
    
    return {
      success: true,
      driver: bestDriver,
      category: orderCategory
    };

  } catch (error) {
    console.error('Error in auto-assignment:', error);
    throw error;
  }
};

// Helper function to determine order category based on items
const determineOrderCategory = (items) => {
  const categoryPriority = {
    'food': 1,
    'foodzone': 1,
    'sweets': 2,
    'vegetable': 3,
    'grocery': 3,
    'stationery': 4,
    'stationary': 4,
    'general': 5,
    'product': 5
  };

  let bestCategory = 'general';
  let highestPriority = 5;

  items.forEach(item => {
    const category = item.category?.toLowerCase() || 'general';
    const priority = categoryPriority[category] || 5;
    
    if (priority < highestPriority) {
      highestPriority = priority;
      bestCategory = category === 'foodzone' ? 'food' : category;
    }
  });

  return bestCategory;
};

// Helper function to find best driver for order category
const findBestDriverForOrderCategory = async (order, category) => {
  try {
    const deliveryLat = order.deliveryAddress?.coordinates?.lat;
    const deliveryLng = order.deliveryAddress?.coordinates?.lng;

    let query = {
      isActive: true,
      isOnline: true,
      emailVerified: true
    };

    // Add category specialization filter
    if (category !== 'general') {
      query.$or = [
        { 'specialization.categories': { $in: [category] } },
        { 'specialization.categories': { $in: ['general'] } },
        { specialization: { $exists: false } } // Include drivers without specialization for backward compatibility
      ];
    }

    const drivers = await Driver.find(query);
    
    if (drivers.length === 0) {
      return null;
    }

    // Calculate distance and score for each driver
    const scoredDrivers = drivers.map(driver => {
      let score = 0;
      
      // Rating score (0-40 points)
      score += (driver.rating / 5) * 40;
      
      // Experience score (0-30 points)
      score += Math.min(driver.deliveries / 100, 1) * 30;
      
      // Distance score (0-30 points) - closer is better
      let distanceScore = 30;
      if (deliveryLat && deliveryLng && driver.currentLocation?.lat && driver.currentLocation?.lng) {
        const distance = calculateDistanceInKm(
          deliveryLat,
          deliveryLng,
          driver.currentLocation.lat,
          driver.currentLocation.lng
        );
        driver.distance = distance;
        distanceScore = Math.max(0, 30 - (distance * 2)); // Reduce score by 2 points per km
      }
      score += distanceScore;

      // Category specialization bonus (0-10 points)
      if (driver.specialization?.categories?.includes(category)) {
        score += 10;
      }

      driver.score = score;
      return driver;
    });

    // Sort by score (highest first)
    scoredDrivers.sort((a, b) => b.score - a.score);
    
    return scoredDrivers[0];
  } catch (error) {
    console.error('Error finding best driver:', error);
    return null;
  }
};

// Helper function to calculate distance between coordinates
const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

// Helper function to get category display name
const getCategoryDisplayName = (category) => {
  const categoryNames = {
    'food': 'Food Zone',
    'vegetable': 'Grocery & Vegetables',
    'grocery': 'Grocery & Vegetables',
    'sweets': 'Sweets & Desserts',
    'stationery': 'Stationery & Books',
    'stationary': 'Stationery & Books',
    'general': 'General Items'
  };
  
  return categoryNames[category] || 'General Items';
};

module.exports = orderController;

// const Order = require('../models/Order');
// const Cart = require('../models/Cart');
// const { generateOrderNumber } = require('../utils/orderUtils');
// const { sendOrderConfirmation } = require('../utils/emailService');

// const orderController = {
//   // Create order
//   createOrder: async (req, res) => {
//     try {
//       const { shippingAddress, payment, notes, giftMessage, isGift } = req.body;
//       // console.log("Payment method is", paymentMethod);
//       console.log(req.body);
//       // Get user's cart
//       const paymentMethod = payment.method;
//       const cart = await Cart.findOne({ user: req.user.id })
//         .populate('items.product');

//       if (!cart || cart.items.length === 0) {
//         return res.status(400).json({ message: 'Cart is empty' });
//       }

//       // Generate order number
//       const orderNumber = await generateOrderNumber();

//       // Calculate shipping
//       const shippingCharges = cart.totalAmount >= 500 ? 0 : 50;

//       // Create order
//       const order = new Order({
//         orderNumber,
//         user: req.user.id,
//         items: cart.items.map(item => ({
//           product: item.product._id,
//           name: item.product.name,
//           weight: item.weight,
//           quantity: item.quantity,
//           price: item.price,
//           originalPrice: item.originalPrice,
//           discount: item.originalPrice - item.price,
//           image: item.product.images[0]?.url
//         })),
//         subtotal: payment.amount,
//         discount: cart.totalDiscount||0,
//         shippingCharges,
//         tax: 0,
//         total: payment.amount+ shippingCharges,
//         shippingAddress,
//         paymentMethod,
//         notes,
//         giftMessage,
//         isGift,
//         paymentStatus:payment.status
//       });

//       await order.save();

//       // Clear cart
//       await Cart.findOneAndUpdate(
//         { user: req.user.id },
//         { items: [], totalAmount: 0, totalDiscount: 0 }
//       );

//       // Send confirmation email
//       await sendOrderConfirmation(req.user.email, order);

//       res.status(201).json({
//         message: 'Order created successfully',
//         order: await Order.findById(order._id).populate('user', 'name email')
//       });
//     } catch (error) {
//       console.log(error);
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get user's orders
//   getUserOrders: async (req, res) => {
//     try {
//       const { page = 1, limit = 10, status } = req.query;
//       const skip = (page - 1) * limit;
//       const query = { customer: req.user.id };
//       // console.log("user id is : ", req.user);
//       if (status) query.status = status;

//       const orders = await Order.find(query)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit));

//       const total = await Order.countDocuments(query);
//       // console.log(orders);
//       res.json({
//         orders,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get single order
//   getOrder: async (req, res) => {
//     try {
//       const { orderNumber } = req.params;
//       const order = await Order.findOne({ orderNumber })
//         .populate('userId', 'name email phone');

//       if (!order) {
//         return res.status(404).json({ message: 'Order not found' });
//       }

//       // Check if user owns the order or is admin
//       if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//         return res.status(403).json({ message: 'Access denied' });
//       }

//       res.json({ order });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Update order status (Admin only)
//   updateOrderStatus: async (req, res) => {
//     try {
//       const { orderNumber } = req.params;
//       const { status, trackingNumber } = req.body;

//       const order = await Order.findOneAndUpdate(
//         { orderNumber },
//         { 
//           status, 
//           trackingNumber,
//           ...(status === 'delivered' && { deliveredAt: new Date() }),
//           updatedAt: new Date()
//         },
//         { new: true }
//       );

//       if (!order) {
//         return res.status(404).json({ message: 'Order not found' });
//       }

//       res.json({
//         message: 'Order status updated successfully',
//         order
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get all orders (Admin only)
//   getAllOrders: async (req, res) => {
//     try {
//       const { 
//         page = 1, 
//         limit = 10, 
//         status, 
//         startDate, 
//         endDate,
//         search
//       } = req.query;
//       const skip = (page - 1) * limit;
//       const query = {};

//       if (status) query.status = status;

//       if (startDate || endDate) {
//         query.createdAt = {};
//         if (startDate) query.createdAt.$gte = new Date(startDate);
//         if (endDate) query.createdAt.$lte = new Date(endDate);
//       }

//       if (search) {
//         query.$or = [
//           { orderNumber: { $regex: search, $options: 'i' } },
//           { 'shippingAddress.name': { $regex: search, $options: 'i' } },
//           { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
//         ];
//       }

//       const orders = await Order.find(query)
//         .populate('userId', 'name email phone')
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit));

//       const total = await Order.countDocuments(query);

//       res.json({
//         orders,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// };

// // controllers/orderController.js
// const Order = require('../models/Order');
// const Subscription = require('../models/Subscription');
// const DailyMeal = require('../models/DailyMeal');
// const { generateOTP } = require('../utils/otpService');

// /**
//  * Create manual order (not from subscription)
//  */
// exports.createOrder = async (req, res) => {
//   try {
//     const {
//       type = 'addon',
//       items,
//       deliveryDate,
//       deliverySlot,
//       deliveryAddress,
//       paymentMethod,
//       specialInstructions
//     } = req.body;

//     // Validate delivery date (not in past)
//     const selectedDate = new Date(deliveryDate);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (selectedDate < today) {
//       return res.status(400).json({
//         success: false,
//         message: 'Delivery date cannot be in the past'
//       });
//     }

//     // Calculate total amount
//     let totalAmount = 0;
//     const orderItems = [];

//     for (const item of items) {
//       totalAmount += item.price * item.quantity;
//       orderItems.push({
//         name: item.name,
//         quantity: item.quantity,
//         price: item.price,
//         category: item.category || 'addon',
//         customizations: item.customizations || []
//       });
//     }

//     // Calculate taxes
//     const gst = totalAmount * 0.05; // 5% GST
//     const deliveryCharges = totalAmount < 200 ? 30 : 0;
//     const packagingCharges = 10;
//     const finalAmount = totalAmount + gst + deliveryCharges + packagingCharges;

//     // Set cancel deadline (6 AM on delivery date)
//     const cancelBefore = new Date(selectedDate);
//     cancelBefore.setHours(6, 0, 0, 0);

//     // Generate delivery OTP
//     const otp = generateOTP(4);

//     // Create order
//     const order = new Order({
//       userId: req.userId,
//       type,
//       items: orderItems,
//       deliveryDate: selectedDate,
//       deliverySlot,
//       totalAmount,
//       taxes: {
//         gst,
//         deliveryCharges,
//         packagingCharges
//       },
//       finalAmount,
//       paymentMethod,
//       deliveryAddress,
//       cancelBefore,
//       specialInstructions,
//       otp,
//       status: 'pending'
//     });

//     // Process payment
//     if (paymentMethod === 'wallet') {
//       const user = await User.findById(req.userId);
//       if (user.wallet.balance < finalAmount) {
//         return res.status(400).json({
//           success: false,
//           message: 'Insufficient wallet balance'
//         });
//       }

//       user.wallet.balance -= finalAmount;
//       user.wallet.transactions.push({
//         amount: finalAmount,
//         type: 'debit',
//         note: `Order payment: ${order.orderNumber}`,
//         referenceId: order.orderNumber
//       });

//       order.paymentStatus = 'paid';
//       await user.save();
//     } else {
//       // Handle other payment methods
//       const paymentResult = await processPayment({
//         amount: finalAmount,
//         currency: 'INR',
//         method: paymentMethod,
//         userId: req.userId,
//         orderId: order._id
//       });

//       if (!paymentResult.success) {
//         return res.status(400).json({
//           success: false,
//           message: 'Payment failed',
//           error: paymentResult.error
//         });
//       }

//       order.paymentStatus = 'paid';
//       order.transactionId = paymentResult.transactionId;
//     }

//     await order.save();

//     // Send notification
//     await createNotification({
//       userId: req.userId,
//       title: 'Order Placed Successfully!',
//       message: `Your order #${order.orderNumber} has been placed and will be delivered on ${selectedDate.toDateString()}.`,
//       type: 'order',
//       data: { orderId: order._id }
//     });

//     // Emit real-time notification
//     const io = req.app.get('io');
//     io.to(`user-${req.userId}`).emit('order-placed', { order });

//     res.status(201).json({
//       success: true,
//       message: 'Order placed successfully',
//       data: order
//     });

//   } catch (error) {
//     console.error('Create order error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create order',
//       error: error.message
//     });
//   }
// };

// /**
//  * Get user's orders with filtering and pagination
//  */
// exports.getUserOrders = async (req, res) => {
//   try {
//     const {
//       status,
//       type,
//       page = 1,
//       limit = 10,
//       startDate,
//       endDate
//     } = req.query;

//     const filter = { userId: req.userId };

//     if (status) filter.status = status;
//     if (type) filter.type = type;

//     if (startDate || endDate) {
//       filter.deliveryDate = {};
//       if (startDate) filter.deliveryDate.$gte = new Date(startDate);
//       if (endDate) filter.deliveryDate.$lte = new Date(endDate);
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const orders = await Order.find(filter)
//       .populate('subscriptionId', 'planId')
//       .populate('customRequestId', 'dishName')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .lean();

//     const total = await Order.countDocuments(filter);

//     // Add additional info to orders
//     const enrichedOrders = orders.map(order => ({
//       ...order,
//       canCancel: new Date() < order.cancelBefore && ['pending', 'confirmed'].includes(order.status),
//       isDelivered: order.status === 'delivered',
//       canRate: order.status === 'delivered' && !order.rating
//     }));

//     res.json({
//       success: true,
//       data: {
//         orders: enrichedOrders,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(total / parseInt(limit)),
//           total,
//           hasNext: skip + parseInt(limit) < total,
//           hasPrev: parseInt(page) > 1
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get user orders error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch orders',
//       error: error.message
//     });
//   }
// };

// /**
//  * Cancel order
//  */
// exports.cancelOrder = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { reason } = req.body;

//     const order = await Order.findOne({
//       _id: id,
//       userId: req.userId
//     });

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Check if order can be cancelled
//     if (new Date() >= order.cancelBefore) {
//       return res.status(400).json({
//         success: false,
//         message: 'Order cannot be cancelled after 6 AM on delivery date'
//       });
//     }

//     if (!['pending', 'confirmed'].includes(order.status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Order cannot be cancelled in current status'
//       });
//     }

//     // Process refund
//     if (order.paymentStatus === 'paid') {
//       const user = await User.findById(req.userId);
      
//       // Refund to wallet
//       user.wallet.balance += order.finalAmount;
//       user.wallet.transactions.push({
//         amount: order.finalAmount,
//         type: 'credit',
//         note: `Refund for cancelled order: ${order.orderNumber}`,
//         referenceId: `REFUND_${order.orderNumber}`
//       });

//       order.refundAmount = order.finalAmount;
//       order.paymentStatus = 'refunded';
      
//       await user.save();
//     }

//     order.status = 'cancelled';
//     order.cancellationReason = reason;
//     order.cancelledAt = new Date();
    
//     await order.save();

//     // Send notification
//     await createNotification({
//       userId: req.userId,
//       title: 'Order Cancelled',
//       message: `Your order #${order.orderNumber} has been cancelled and refund processed.`,
//       type: 'order',
//       data: { orderId: order._id }
//     });

//     res.json({
//       success: true,
//       message: 'Order cancelled successfully',
//       data: order
//     });

//   } catch (error) {
//     console.error('Cancel order error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to cancel order',
//       error: error.message
//     });
//   }
// };

// Helper function to auto-assign driver to order
const assignDriverToOrder = async (orderId, deliveryCoordinates) => {
  try {
    // Find nearby available drivers
    const nearbyDrivers = await Driver.findNearbyDrivers(
      deliveryCoordinates.lat, 
      deliveryCoordinates.lng, 
      10 // 10km radius
    );

    if (nearbyDrivers.length === 0) {
      console.log('No nearby drivers available for order:', orderId);
      return;
    }

    // Select the best driver (highest rating, then most deliveries)
    const selectedDriver = nearbyDrivers[0];

    // Update delivery tracking with driver assignment
    const deliveryTracking = await DeliveryTracking.findOne({ orderId });
    if (deliveryTracking) {
      deliveryTracking.driverId = selectedDriver._id;
      deliveryTracking.status = 'assigned';
      deliveryTracking.addTimelineEntry(
        'assigned',
        `Order assigned to driver ${selectedDriver.name}`,
        'Auto-assigned',
        '30-45 minutes'
      );
      await deliveryTracking.save();

      console.log(`Order ${orderId} assigned to driver ${selectedDriver.name}`);
    }

  } catch (error) {
    console.error('Error auto-assigning driver:', error);
  }
};

// module.exports = orderController;
