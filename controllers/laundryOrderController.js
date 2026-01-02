const LaundryOrder = require('../models/LaundryOrder');
const LaundryVendor = require('../models/LaundryVendor');
const LaundrySubscription = require('../models/LaundrySubscription');
const { calculateOrderPrice, estimateDeliveryDate } = require('../utils/laundryHelpers');

// @desc    Create new order
// @route   POST /api/laundry/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      vendorId,
      items,
      pickup,
      delivery,
      schedule, // Support schedule object from frontend
      paymentMethod,
      payment, // Support both paymentMethod (legacy) and payment object
      specialInstructions,
      subscriptionId,
      deliverySpeed = 'scheduled' // 'quick', 'scheduled', or 'subscription'
    } = req.body;

    // Normalize pickup and delivery data - support both nested (schedule) and flat (pickup/delivery) structures
    const normalizedPickup = pickup || (schedule ? {
      date: schedule.pickupDate || schedule.date,
      timeSlot: schedule.pickupTime || schedule.timeSlot,
      address: schedule.address
    } : {});
    
    const normalizedDelivery = delivery || (schedule ? {
      date: schedule.deliveryDate,
      timeSlot: schedule.deliveryTime || schedule.deliveryTimeSlot,
      address: schedule.deliveryAddress || schedule.address
    } : {});

    // Extract payment method from payment object or use paymentMethod
    const finalPaymentMethod = payment?.method || paymentMethod || 'upi';

    // Validate vendor
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID is required'
      });
    }

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

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.type || !item.serviceType) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have type and serviceType'
        });
      }

      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have quantity of at least 1'
        });
      }

      if (item.quantity > 100) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity cannot exceed 100'
        });
      }

      // Validate weight-based items
      if (item.pricingModel === 'weight_based') {
        if (!item.weight || item.weight < 0.1) {
          return res.status(400).json({
            success: false,
            message: 'Weight-based items must have weight of at least 0.1 kg'
          });
        }
        if (item.weight > 50) {
          return res.status(400).json({
            success: false,
            message: 'Item weight cannot exceed 50 kg'
          });
        }
      }

      // Validate service availability
      if (!vendor.services || !vendor.services.includes(item.serviceType)) {
        return res.status(400).json({
          success: false,
          message: `Service "${item.serviceType}" is not available for this vendor`
        });
      }
    }

    // Validate delivery speed
    if (!deliverySpeed || !['quick', 'scheduled', 'subscription'].includes(deliverySpeed)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery speed. Must be quick, scheduled, or subscription'
      });
    }

    if (deliverySpeed === 'quick' && !vendor.quickServiceConfig?.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Quick service is not available for this vendor. Please select scheduled service.'
      });
    }

    if (deliverySpeed === 'scheduled' && vendor.scheduledServiceConfig?.enabled === false) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled service is not available for this vendor.'
      });
    }

    // Validate pickup details
    if (!normalizedPickup || !normalizedPickup.address) {
      return res.status(400).json({
        success: false,
        message: 'Pickup address is required'
      });
    }

    if (!normalizedPickup.address.street || !normalizedPickup.address.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Pickup address must include street and pincode'
      });
    }

    if (!normalizedPickup.address.contactName || !normalizedPickup.address.contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Pickup address must include contact name and phone'
      });
    }

    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(normalizedPickup.address.contactPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Contact phone must be a valid 10-digit Indian mobile number'
      });
    }

    // Validate pincode format
    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(normalizedPickup.address.pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Pincode must be exactly 6 digits'
      });
    }

    // Validate pickup date (not in past for scheduled service)
    // For quick service, auto-set to today if not provided
    if (deliverySpeed === 'quick' && !normalizedPickup.date) {
      normalizedPickup.date = new Date().toISOString().split('T')[0];
    }
    
    if (deliverySpeed !== 'quick' && normalizedPickup.date) {
      const pickupDate = new Date(normalizedPickup.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (pickupDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Pickup date cannot be in the past'
        });
      }
    }

    // Get subscription if applicable
    let subscription = null;
    if (subscriptionId) {
      subscription = await LaundrySubscription.findById(subscriptionId);
      if (subscription && subscription.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Invalid subscription - subscription does not belong to you'
        });
      }
    } else if (deliverySpeed === 'subscription') {
      // If deliverySpeed is subscription but no subscriptionId provided, try to find active subscription
      subscription = await LaundrySubscription.findOne({
        user: req.user._id,
        vendor: vendorId,
        status: 'active'
      });
      if (!subscription) {
        return res.status(400).json({
          success: false,
          message: 'No active subscription found for this vendor. Please create a subscription first.'
        });
      }
    }

    // Calculate pricing with delivery speed
    let pricing;
    try {
      pricing = calculateOrderPrice(items, vendor, deliverySpeed, subscription);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Error calculating order price'
      });
    }

    // Validate pricing result
    if (!pricing || typeof pricing !== 'object' || !pricing.total) {
      return res.status(500).json({
        success: false,
        message: 'Invalid pricing calculation result'
      });
    }

    // Calculate total items and weight
    const totalItems = items.reduce((sum, item) => {
      const qty = Math.max(1, Math.min(100, parseInt(item.quantity) || 1));
      return sum + qty;
    }, 0);
    
    const estimatedWeight = items.reduce((sum, item) => {
      const qty = Math.max(1, Math.min(100, parseInt(item.quantity) || 1));
      const itemWeight = item.pricingModel === 'weight_based' 
        ? (Math.max(0.1, Math.min(50, parseFloat(item.weight) || 0.5)))
        : 0.5; // default 0.5kg per item for per-piece
      return sum + (itemWeight * qty);
    }, 0);

    // Determine order type
    const orderType = (subscription || subscriptionId || deliverySpeed === 'subscription') ? 'subscription' : 'one_time';

    // Calculate delivery date based on delivery speed
    let deliveryDate;
    try {
      if (deliverySpeed === 'quick') {
        // Quick service: delivery within vendor's turnaround time
        const turnaroundHours = vendor.quickServiceConfig?.turnaroundTime?.max || 8;
        // Auto-set pickup date to today if not provided
        const quickPickupDate = normalizedPickup.date || new Date().toISOString().split('T')[0];
        deliveryDate = estimateDeliveryDate(quickPickupDate, turnaroundHours);
      } else if (deliverySpeed === 'scheduled') {
        // Scheduled service: use provided delivery date or calculate
        // Auto-set pickup date to today if not provided
        const scheduledPickupDate = normalizedPickup.date || new Date().toISOString().split('T')[0];
        deliveryDate = normalizedDelivery?.date 
          ? new Date(normalizedDelivery.date)
          : estimateDeliveryDate(scheduledPickupDate, vendor.turnaroundTime?.standard || 48);
      } else {
        // Subscription: use standard turnaround
        // Auto-set pickup date to today if not provided
        const subscriptionPickupDate = normalizedPickup.date || new Date().toISOString().split('T')[0];
        deliveryDate = estimateDeliveryDate(subscriptionPickupDate, vendor.turnaroundTime?.standard || 48);
      }
      
      // Validate delivery date
      if (!deliveryDate || isNaN(deliveryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid delivery date calculated'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Error calculating delivery date: ${error.message}`
      });
    }

    // Generate order number with error handling
    let orderNumber;
    try {
      const orderCount = await LaundryOrder.countDocuments();
      orderNumber = `TY-LAU-${String(orderCount + 1).padStart(6, '0')}`;
    } catch (error) {
      // Fallback to timestamp-based order number if count fails
      orderNumber = `TY-LAU-${Date.now().toString().slice(-8)}`;
    }

    // Prepare order data
    const orderData = {
      orderNumber, // Set orderNumber explicitly to avoid validation error
      user: req.user._id,
      vendor: vendorId,
      orderType,
      deliverySpeed,
      subscription: subscriptionId || null,
      items: (() => {
        try {
          return items.map((item, index) => {
            // Validate item structure
            if (!item || typeof item !== 'object') {
              throw new Error(`Invalid item at index ${index}`);
            }
            
            // Determine pricing model for each item
            const pricingModel = item.pricingModel || vendor.pricingConfig?.model || 'per_piece';
            const quantity = Math.max(1, Math.min(100, parseInt(item.quantity) || 1));
            const weight = item.pricingModel === 'weight_based' 
              ? Math.max(0.1, Math.min(50, parseFloat(item.weight) || 0.5))
              : (parseFloat(item.weight) || 0.5);
            
            let pricePerItem = 0, pricePerKg = 0, totalPrice = 0;
            
            if (pricingModel === 'weight_based' && weight > 0) {
              pricePerKg = parseFloat(item.pricePerKg) || parseFloat(vendor.pricingConfig?.weightBasedPricing?.[item.serviceType]) || 50;
              if (pricePerKg <= 0) {
                throw new Error(`Invalid price per kg for item "${item.type}" at index ${index}`);
              }
              totalPrice = Math.round(pricePerKg * weight * quantity * 100) / 100;
            } else {
              pricePerItem = parseFloat(item.pricePerItem) || parseFloat(vendor.pricing?.[item.type]?.[item.serviceType]) || 0;
              if (pricePerItem < 0) {
                throw new Error(`Invalid price per item for item "${item.type}" at index ${index}`);
              }
              totalPrice = Math.round(pricePerItem * quantity * 100) / 100;
            }

            // Determine category if not provided
            let category = item.category;
            if (!category) {
              // Auto-determine category based on item type
              const itemTypeLower = (item.type || '').toLowerCase();
              if (['shirt', 'tshirt', 'sweater', 'jacket', 'kurta'].includes(itemTypeLower)) {
                category = 'topwear';
              } else if (['jeans', 'trousers', 'shorts', 'pants'].includes(itemTypeLower)) {
                category = 'bottomwear';
              } else if (['bedsheet', 'blanket', 'curtain', 'towel', 'pillow'].includes(itemTypeLower)) {
                category = 'home_textiles';
              } else {
                category = 'others';
              }
            }

            return {
              ...item,
              category, // Ensure category is always set
              pricingModel,
              pricePerItem: pricePerItem > 0 ? pricePerItem : undefined,
              pricePerKg: pricePerKg > 0 ? pricePerKg : undefined,
              weight: weight > 0 ? weight : undefined,
              totalPrice: Math.max(0, totalPrice)
            };
          });
        } catch (error) {
          throw new Error(`Error processing items: ${error.message}`);
        }
      })(),
      totalItems,
      estimatedWeight,
      pricing,
      schedule: {
        pickup: {
          date: new Date(normalizedPickup.date || (deliverySpeed === 'quick' ? new Date() : new Date())),
          timeSlot: deliverySpeed === 'quick' ? 'immediate' : (normalizedPickup.timeSlot || 'morning'),
          timeRange: deliverySpeed === 'quick' ? 'Within 30 minutes' : getTimeRange(normalizedPickup.timeSlot || 'morning'),
          address: normalizedPickup.address
        },
        delivery: {
          date: deliveryDate,
          timeSlot: normalizedDelivery?.timeSlot || 'evening',
          timeRange: getTimeRange(normalizedDelivery?.timeSlot || 'evening'),
          address: normalizedDelivery?.address || normalizedPickup.address
        }
      },
      payment: {
        method: finalPaymentMethod, // Valid: 'cash', 'wallet', 'upi', 'card', 'subscription'
        status: (finalPaymentMethod === 'cash') ? 'pending' : (payment?.status || 'pending')
      },
      specialInstructions
    };

    // Validate order data before creating
    if (!orderData.orderNumber || !orderData.user || !orderData.vendor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order data: missing required fields'
      });
    }

    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item'
      });
    }

    if (!orderData.pricing || !orderData.pricing.total || orderData.pricing.total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order total. Please recalculate pricing.'
      });
    }

    let order;
    try {
      order = await LaundryOrder.create(orderData);
    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create order',
        error: error.name === 'ValidationError' ? error.errors : undefined
      });
    }

    // Update vendor stats
    try {
      vendor.totalOrders = (vendor.totalOrders || 0) + 1;
      await vendor.save();
    } catch (error) {
      console.error('Error updating vendor stats:', error);
      // Don't fail the order creation if stats update fails
    }

    // If subscription order, update subscription usage
    if (subscription) {
      subscription.usage.currentMonth.pickupsCompleted += 1;
      subscription.usage.currentMonth.itemsCleaned += totalItems;
      subscription.usage.currentMonth.weightUsed += estimatedWeight;
      subscription.usage.currentMonth.orders.push(order._id);
      
      // Track quick services if applicable
      if (deliverySpeed === 'quick') {
        subscription.usage.currentMonth.quickServicesUsed += 1;
      }
      
      subscription.calculateRemaining();
      await subscription.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Helper function
function getTimeRange(timeSlot) {
  const ranges = {
    morning: '9 AM - 12 PM',
    afternoon: '12 PM - 4 PM',
    evening: '4 PM - 7 PM'
  };
  return ranges[timeSlot] || ranges.afternoon;
}

// @desc    Get user orders (or vendor orders if vendor role)
// @route   GET /api/laundry/orders
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
    const {
      status,
      limit = 10,
      page = 1,
      sortBy = '-createdAt',
      vendorId // For vendor to get their orders
    } = req.query;

    let query = {};
    
    // Check if user is a vendor/seller or requesting vendor orders
    const isVendor = req.user.role === 'vendor' || req.user.role === 'seller';
    
    if (vendorId || isVendor) {
      // Get vendor ID from query or find vendor by user ID
      let vendor;
      if (vendorId) {
        vendor = await LaundryVendor.findById(vendorId);
      } else {
        // Try to find vendor by user ID (createdBy field)
        vendor = await LaundryVendor.findOne({ createdBy: req.user._id });
        
        // If not found, try to find by user email or phone
        if (!vendor) {
          vendor = await LaundryVendor.findOne({ 
            $or: [
              { email: req.user.email },
              { phone: req.user.phone }
            ]
          });
        }
      }
      
      if (!vendor) {
        // If vendor not found but user is seller, return empty array instead of error
        if (isVendor) {
          return res.status(200).json({
            success: true,
            count: 0,
            total: 0,
            page: parseInt(page),
            pages: 0,
            data: [],
            orders: [],
            message: 'No vendor profile found. Please create a vendor profile first.'
          });
        }
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
      
      query = { vendor: vendor._id };
    } else {
      // Regular user orders
      query = { user: req.user._id };
    }

    if (status) {
      query.status = status;
    }

    const orders = await LaundryOrder.find(query)
      .populate('vendor', 'name logo rating')
      .populate('user', 'name email phone')
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await LaundryOrder.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: orders,
      orders: orders // For backward compatibility
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/laundry/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await LaundryOrder.findById(req.params.id)
      .populate('vendor', 'name logo phone rating address createdBy')
      .populate('user', 'name email phone')
      .populate('subscription', 'plan');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is admin
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    
    // Check if order belongs to user (customer)
    const isCustomer = order.user && order.user._id.toString() === req.user._id.toString();
    
    // Check if user is the vendor who owns this order
    let isVendor = false;
    if (order.vendor && order.vendor.createdBy) {
      isVendor = order.vendor.createdBy.toString() === req.user._id.toString();
    } else if (order.vendor && order.vendor._id) {
      // Fallback: check if vendor ID matches (for cases where createdBy might not be set)
      // Also check by email/phone if vendor profile exists
      const vendor = await LaundryVendor.findById(order.vendor._id);
      if (vendor) {
        isVendor = vendor.createdBy && vendor.createdBy.toString() === req.user._id.toString();
        // Also check by email/phone as fallback
        if (!isVendor && (vendor.email === req.user.email || vendor.phone === req.user.phone)) {
          isVendor = true;
        }
      }
    }

    // Allow access if user is admin, customer, or vendor
    if (!isAdmin && !isCustomer && !isVendor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PATCH /api/laundry/orders/:id/status
// @access  Private (Vendor/Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note, actualWeight } = req.body;

    const order = await LaundryOrder.findById(req.params.id)
      .populate('vendor', 'createdBy email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is admin
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    
    // Check if user is the vendor who owns this order
    let isVendor = false;
    if (order.vendor) {
      if (order.vendor.createdBy) {
        isVendor = order.vendor.createdBy.toString() === req.user._id.toString();
      }
      // Also check by email/phone as fallback
      if (!isVendor && (order.vendor.email === req.user.email || order.vendor.phone === req.user.phone)) {
        isVendor = true;
      }
    }

    // Only allow vendor or admin to update status
    if (!isAdmin && !isVendor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order status. Only the vendor who owns this order can update it.'
      });
    }

    // Validate status
    const validStatuses = ['scheduled', 'picked_up', 'processing', 'quality_check', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update status
    order.status = status;

    // Add to status history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status changed to ${status}`,
      updatedBy: req.user._id
    });

    // Handle specific status updates
    switch (status) {
      case 'picked_up':
        order.schedule.pickup.actualTime = new Date();
        order.schedule.pickup.status = 'completed';
        if (actualWeight) {
          order.actualWeight = actualWeight;
        }
        break;

      case 'processing':
        order.processing.startTime = new Date();
        break;

      case 'ready':
        order.processing.endTime = new Date();
        break;

      case 'delivered':
        order.schedule.delivery.actualTime = new Date();
        order.schedule.delivery.status = 'completed';
        break;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// @desc    Cancel order
// @route   POST /api/laundry/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await LaundryOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled', 'out_for_delivery'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    // Update order
    order.status = 'cancelled';
    order.cancellation = {
      reason,
      cancelledBy: 'user',
      cancelledAt: new Date()
    };

    // If paid, initiate refund
    if (order.payment.status === 'paid') {
      order.cancellation.refundAmount = order.pricing.total;
      order.cancellation.refundStatus = 'pending';
      // TODO: Integrate with payment gateway for refund
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

// @desc    Submit order feedback
// @route   POST /api/laundry/orders/:id/feedback
// @access  Private
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, review, photos } = req.body;

    const order = await LaundryOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate delivered orders'
      });
    }

    // Update feedback
    order.feedback = {
      rating,
      review,
      photos: photos || [],
      submittedAt: new Date()
    };

    await order.save();

    // Update vendor rating
    const vendor = await LaundryVendor.findById(order.vendor);
    if (vendor) {
      const totalRating = (vendor.rating * vendor.totalReviews) + rating;
      vendor.totalReviews += 1;
      vendor.rating = totalRating / vendor.totalReviews;
      await vendor.save();
    }

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: order.feedback
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
};

// @desc    Get order tracking info
// @route   GET /api/laundry/orders/:id/track
// @access  Private
exports.trackOrder = async (req, res) => {
  try {
    const order = await LaundryOrder.findById(req.params.id)
      .select('orderNumber status statusHistory schedule deliveryPartner')
      .populate('deliveryPartner.pickupBy deliveryPartner.deliveryBy', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization - allow user, vendor, or admin
    const isUser = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    
    // Check if user is the vendor who owns this order
    let isVendor = false;
    if (order.vendor) {
      const vendor = await LaundryVendor.findById(order.vendor);
      if (vendor && vendor.createdBy) {
        isVendor = vendor.createdBy.toString() === req.user._id.toString();
      }
    }
    
    if (!isUser && !isAdmin && !isVendor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to track this order'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        currentStatus: order.status,
        statusHistory: order.statusHistory,
        pickup: order.schedule.pickup,
        delivery: order.schedule.delivery,
        deliveryPartner: order.deliveryPartner
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error tracking order',
      error: error.message
    });
  }
};

// @desc    Calculate order price
// @route   POST /api/laundry/calculate-price
// @access  Public
exports.calculatePrice = async (req, res) => {
  try {
    const { vendorId, items, deliverySpeed = 'scheduled', subscriptionId } = req.body;

    const vendor = await LaundryVendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get subscription if provided
    let subscription = null;
    if (subscriptionId) {
      subscription = await LaundrySubscription.findById(subscriptionId);
    }

    const pricing = calculateOrderPrice(items, vendor, deliverySpeed, subscription);

    res.status(200).json({
      success: true,
      data: pricing
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating price',
      error: error.message
    });
  }
};