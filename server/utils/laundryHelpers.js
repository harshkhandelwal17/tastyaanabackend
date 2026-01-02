const moment = require('moment');


// ==================== PRICE CALCULATION ====================

/**
 * Calculate order price based on items, vendor pricing, and delivery speed
 * Supports both per-piece and weight-based pricing models
 */
exports.calculateOrderPrice = (items, vendor, deliverySpeed = 'scheduled', subscription = null) => {
  // Validate inputs
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Items array is required and must not be empty');
  }
  
  if (!vendor || typeof vendor !== 'object') {
    throw new Error('Vendor object is required');
  }
  
  if (!['quick', 'scheduled', 'subscription'].includes(deliverySpeed)) {
    throw new Error('Invalid delivery speed. Must be quick, scheduled, or subscription');
  }
  
  let perPieceTotal = 0;
  let weightBasedTotal = 0;
  const pricingModel = vendor.pricingConfig?.model || 'per_piece';
  
  // Determine which pricing to use based on delivery speed
  const useQuickPricing = deliverySpeed === 'quick';
  const basePricing = useQuickPricing ? (vendor.quickPricing || vendor.pricing || {}) : (vendor.pricing || {});
  const baseWeightPricing = useQuickPricing 
    ? (vendor.quickWeightBasedPricing || vendor.pricingConfig?.weightBasedPricing || {})
    : (vendor.pricingConfig?.weightBasedPricing || {});
  
  // Calculate item prices based on pricing model
  items.forEach((item, index) => {
    // Validate item structure
    if (!item || typeof item !== 'object') {
      throw new Error(`Item at index ${index} is invalid`);
    }
    
    if (!item.type || !item.serviceType) {
      throw new Error(`Item at index ${index} must have type and serviceType`);
    }
    
    const quantity = Math.max(1, Math.min(100, parseInt(item.quantity) || 1));
    const weight = Math.max(0, parseFloat(item.weight) || 0);
    const itemPricingModel = item.pricingModel || pricingModel;
    
    if (itemPricingModel === 'weight_based' && weight > 0) {
      // Weight-based pricing
      if (weight < 0.1 || weight > 50) {
        throw new Error(`Item "${item.type}" weight must be between 0.1 and 50 kg`);
      }
      
      let pricePerKg = parseFloat(item.pricePerKg) || 0;
      
      // Use quick pricing if available, otherwise fallback to base
      if (!pricePerKg || pricePerKg <= 0) {
        if (useQuickPricing && baseWeightPricing?.[item.serviceType] && baseWeightPricing[item.serviceType] > 0) {
          pricePerKg = parseFloat(baseWeightPricing[item.serviceType]) || 0;
        } else if (vendor.pricingConfig?.weightBasedPricing?.[item.serviceType] && vendor.pricingConfig.weightBasedPricing[item.serviceType] > 0) {
          pricePerKg = parseFloat(vendor.pricingConfig.weightBasedPricing[item.serviceType]) || 0;
        } else {
          pricePerKg = 50; // Default fallback
        }
      }
      
      if (pricePerKg <= 0) {
        throw new Error(`Price per kg for "${item.type}" - "${item.serviceType}" is invalid or not set`);
      }
      
      const itemWeight = weight * quantity;
      const itemTotal = Math.round(pricePerKg * itemWeight * 100) / 100; // Round to 2 decimal places
      weightBasedTotal += itemTotal;
      
      // Store pricing details in item
      item.pricePerKg = pricePerKg;
      item.totalPrice = itemTotal;
    } else {
      // Per-piece pricing
      let pricePerItem = parseFloat(item.pricePerItem) || 0;
      
      // Use quick pricing if available, otherwise fallback to base pricing
      if (!pricePerItem || pricePerItem <= 0) {
        if (useQuickPricing && basePricing[item.type]?.[item.serviceType] && basePricing[item.type][item.serviceType] > 0) {
          // Use quick service specific pricing
          pricePerItem = parseFloat(basePricing[item.type][item.serviceType]) || 0;
        } else if (vendor.pricing?.[item.type]?.[item.serviceType] && vendor.pricing[item.type][item.serviceType] > 0) {
          // Use base pricing
          pricePerItem = parseFloat(vendor.pricing[item.type][item.serviceType]) || 0;
        } else {
          pricePerItem = 0;
        }
      }
      
      if (pricePerItem < 0) {
        throw new Error(`Price per item for "${item.type}" - "${item.serviceType}" cannot be negative`);
      }
      
      const itemTotal = Math.round(pricePerItem * quantity * 100) / 100; // Round to 2 decimal places
      perPieceTotal += itemTotal;
      
      // Store pricing details in item
      item.pricePerItem = pricePerItem;
      item.totalPrice = itemTotal;
    }
  });

  const subtotal = Math.round((perPieceTotal + weightBasedTotal) * 100) / 100;

  // Validate subtotal
  if (subtotal < 0) {
    throw new Error('Subtotal cannot be negative');
  }

  // Get charges based on delivery speed
  const chargesConfig = vendor.charges?.[deliverySpeed] || vendor.charges?.scheduled || {};
  const pickupCharges = Math.max(0, parseFloat(chargesConfig.pickup) || 30);
  const deliveryCharges = Math.max(0, parseFloat(chargesConfig.delivery) || 30);
  const speedSurchargePercent = Math.max(0, Math.min(100, parseFloat(chargesConfig.surcharge) || 0));
  const freeDeliveryAbove = Math.max(0, parseFloat(chargesConfig.freeDeliveryAbove) || 500);

  // Calculate speed surcharge (for quick service)
  // Only apply surcharge if quick pricing is not explicitly set
  // If quick pricing is set, it's already included in the subtotal
  let speedSurcharge = 0;
  if (deliverySpeed === 'quick') {
    const hasQuickPricing = vendor.quickPricing && typeof vendor.quickPricing === 'object' && Object.keys(vendor.quickPricing).length > 0;
    const hasQuickWeightPricing = vendor.quickWeightBasedPricing && typeof vendor.quickWeightBasedPricing === 'object' && Object.keys(vendor.quickWeightBasedPricing).length > 0;
    
    // Only apply surcharge if quick pricing is not set (fallback to base pricing + surcharge)
    if (!hasQuickPricing && !hasQuickWeightPricing && speedSurchargePercent > 0 && subtotal > 0) {
      speedSurcharge = Math.round((subtotal * speedSurchargePercent / 100) * 100) / 100;
    }
  }

  // Free delivery above threshold
  let finalDeliveryCharges = deliveryCharges;
  if (subtotal >= freeDeliveryAbove) {
    finalDeliveryCharges = 0;
  }

  // Express surcharge (if applicable)
  const hasExpressService = items.some(item => 
    item && (item.serviceType === 'express' || item.urgency === 'express')
  );
  const expressSurcharge = hasExpressService && subtotal > 0
    ? Math.round((subtotal * 0.5) * 100) / 100 // 50% surcharge for express
    : 0;

  // Subscription discount
  let subscriptionDiscount = 0;
  if (subscription && deliverySpeed === 'subscription' && subtotal > 0) {
    // Apply subscription benefits
    subscriptionDiscount = Math.round((subtotal * 0.1) * 100) / 100; // 10% discount example
  }

  // Discount (can be applied from coupons, etc.)
  const discount = Math.max(0, parseFloat(subscription?.discount || 0) || 0);

  // Total calculation with proper rounding
  const total = Math.round((subtotal + pickupCharges + finalDeliveryCharges + speedSurcharge + expressSurcharge - discount - subscriptionDiscount) * 100) / 100;

  return {
    subtotal,
    pickupCharges,
    deliveryCharges: finalDeliveryCharges,
    speedSurcharge,
    expressSurcharge,
    discount,
    subscriptionDiscount,
    total: Math.max(0, total), // Ensure non-negative
    breakdown: {
      perPieceTotal,
      weightBasedTotal
    }
  };
};

// ==================== DATE & TIME HELPERS ====================

/**
 * Calculate estimated delivery date based on pickup date and turnaround time
 */
exports.estimateDeliveryDate = (pickupDate, turnaroundHours) => {
  const pickup = moment(pickupDate);
  const delivery = pickup.add(turnaroundHours, 'hours');
  
  // If delivery falls on Sunday, push to Monday
  if (delivery.day() === 0) {
    delivery.add(1, 'day');
  }
  
  return delivery.toDate();
};

/**
 * Get time range for a time slot
 */
exports.getTimeRange = (timeSlot) => {
  const ranges = {
    morning: '9 AM - 12 PM',
    afternoon: '12 PM - 4 PM',
    evening: '4 PM - 7 PM'
  };
  return ranges[timeSlot] || ranges.afternoon;
};

/**
 * Check if a date is valid for pickup (not in past, within booking window)
 */
exports.isValidPickupDate = (date, maxAdvanceDays = 7) => {
  const pickupDate = moment(date);
  const today = moment().startOf('day');
  const maxDate = moment().add(maxAdvanceDays, 'days');

  if (pickupDate.isBefore(today)) {
    return { valid: false, message: 'Pickup date cannot be in the past' };
  }

  if (pickupDate.isAfter(maxDate)) {
    return { valid: false, message: `Pickup can be scheduled max ${maxAdvanceDays} days in advance` };
  }

  return { valid: true };
};

/**
 * Get available time slots for a date (considering vendor operational hours)
 */
exports.getAvailableTimeSlots = (date, vendor) => {
  const dayOfWeek = moment(date).format('dddd').toLowerCase();
  const operationalHours = vendor.operationalHours[dayOfWeek];

  if (!operationalHours || !operationalHours.isOpen) {
    return [];
  }

  // Default time slots
  const allSlots = [
    { id: 'morning', label: 'Morning (9 AM - 12 PM)', available: true },
    { id: 'afternoon', label: 'Afternoon (12 PM - 4 PM)', available: true },
    { id: 'evening', label: 'Evening (4 PM - 7 PM)', available: true }
  ];

  // TODO: In production, check vendor's booked slots and filter
  // For now, returning all slots as available

  return allSlots;
};

/**
 * Calculate business days between two dates (excluding Sundays)
 */
exports.calculateBusinessDays = (startDate, endDate) => {
  let count = 0;
  const start = moment(startDate);
  const end = moment(endDate);

  while (start.isSameOrBefore(end)) {
    if (start.day() !== 0) { // Not Sunday
      count++;
    }
    start.add(1, 'day');
  }

  return count;
};

// ==================== WEIGHT & QUANTITY HELPERS ====================

/**
 * Estimate weight based on item types and quantities
 */
exports.estimateWeight = (items) => {
  const weightMap = {
    // Top wear (kg)
    shirt: 0.3,
    tshirt: 0.25,
    sweater: 0.6,
    jacket: 0.8,
    
    // Bottom wear
    jeans: 0.6,
    trousers: 0.4,
    shorts: 0.3,
    
    // Home textiles
    bedsheet: 1.0,
    blanket: 2.0,
    curtain: 1.5,
    
    // Others
    towel: 0.4,
    saree: 0.5,
    suit: 1.2,
    shoe: 0.8
  };

  let totalWeight = 0;

  items.forEach(item => {
    const itemWeight = weightMap[item.type] || 0.5; // Default 0.5kg
    totalWeight += itemWeight * item.quantity;
  });

  return parseFloat(totalWeight.toFixed(2));
};

/**
 * Check if subscription has enough quota for order
 */
exports.checkSubscriptionQuota = (subscription, items) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedWeight = exports.estimateWeight(items);

  const checks = {
    weight: { sufficient: true, message: '' },
    dryClean: { sufficient: true, message: '' },
    expressService: { sufficient: true, message: '' }
  };

  // Check weight limit
  if (subscription.plan.maxWeight) {
    subscription.calculateRemaining();
    if (subscription.usage.currentMonth.weightRemaining < estimatedWeight) {
      checks.weight = {
        sufficient: false,
        message: `Insufficient weight quota. Required: ${estimatedWeight}kg, Available: ${subscription.usage.currentMonth.weightRemaining}kg`
      };
    }
  }

  // Check dry clean quota
  const dryCleanItems = items.filter(item => item.serviceType === 'dry_clean')
    .reduce((sum, item) => sum + item.quantity, 0);

  if (dryCleanItems > 0 && subscription.plan.features.freeDryClean) {
    if (dryCleanItems > subscription.usage.currentMonth.dryCleanRemaining) {
      checks.dryClean = {
        sufficient: false,
        message: `Insufficient dry clean quota. Required: ${dryCleanItems}, Available: ${subscription.usage.currentMonth.dryCleanRemaining}`
      };
    }
  }

  // Check express service quota
  const hasExpressService = items.some(item => item.urgency === 'express');
  if (hasExpressService && subscription.plan.features.freeExpressService) {
    if (subscription.usage.currentMonth.expressServiceRemaining <= 0) {
      checks.expressService = {
        sufficient: false,
        message: 'Express service quota exhausted for this month'
      };
    }
  }

  const allSufficient = Object.values(checks).every(check => check.sufficient);

  return {
    sufficient: allSufficient,
    checks
  };
};

// ==================== NOTIFICATION HELPERS ====================

/**
 * Generate order status message for notifications
 */
exports.getStatusMessage = (status, orderNumber) => {
  const messages = {
    scheduled: `Your laundry order ${orderNumber} has been scheduled for pickup.`,
    picked_up: `Your laundry order ${orderNumber} has been picked up successfully.`,
    processing: `Your laundry order ${orderNumber} is being processed.`,
    quality_check: `Your laundry order ${orderNumber} is undergoing quality check.`,
    ready: `Your laundry order ${orderNumber} is ready for delivery.`,
    out_for_delivery: `Your laundry order ${orderNumber} is out for delivery.`,
    delivered: `Your laundry order ${orderNumber} has been delivered. Please rate your experience.`,
    cancelled: `Your laundry order ${orderNumber} has been cancelled.`
  };

  return messages[status] || `Order ${orderNumber} status: ${status}`;
};

/**
 * Generate subscription reminder messages
 */
exports.getSubscriptionReminder = (subscription, type) => {
  const messages = {
    renewal: `Your ${subscription.plan.name} with ${subscription.vendor.name} will renew on ${moment(subscription.period.nextRenewalDate).format('DD MMM YYYY')}.`,
    weightAlert: `You have used ${subscription.usage.currentMonth.weightUsed}kg of ${subscription.plan.maxWeight}kg quota. ${subscription.usage.currentMonth.weightRemaining}kg remaining.`,
    dryCleanAlert: `You have ${subscription.usage.currentMonth.dryCleanRemaining} free dry clean items remaining this month.`,
    expiring: `Your subscription with ${subscription.vendor.name} will expire on ${moment(subscription.period.endDate).format('DD MMM YYYY')}.`
  };

  return messages[type] || '';
};

// ==================== PRICING HELPERS ====================

/**
 * Calculate subscription savings vs pay-per-use
 */
exports.calculateSubscriptionSavings = (subscription, orders) => {
  const subscriptionCost = subscription.plan.price;
  
  let payPerUseCost = 0;

  orders.forEach(order => {
    payPerUseCost += order.pricing.total;
  });

  const savings = payPerUseCost - subscriptionCost;
  const percentage = payPerUseCost > 0 
    ? Math.round((savings / payPerUseCost) * 100) 
    : 0;

  return {
    subscriptionCost,
    payPerUseCost,
    savings: Math.max(0, savings),
    percentage: Math.max(0, percentage)
  };
};

/**
 * Calculate pro-rated refund for cancelled subscription
 */
exports.calculateProRatedRefund = (subscription) => {
  const totalDays = moment(subscription.period.endDate)
    .diff(moment(subscription.period.startDate), 'days');
  
  const daysRemaining = moment(subscription.period.endDate)
    .diff(moment(), 'days');

  if (daysRemaining <= 0) {
    return 0;
  }

  const dailyRate = subscription.plan.price / totalDays;
  const refund = dailyRate * daysRemaining;

  return Math.round(refund);
};

// ==================== VALIDATION HELPERS ====================

/**
 * Validate Indian pincode
 */
exports.isValidPincode = (pincode) => {
  return /^[0-9]{6}$/.test(pincode);
};

/**
 * Validate Indian phone number
 */
exports.isValidPhoneNumber = (phone) => {
  return /^[6-9]\d{9}$/.test(phone);
};

/**
 * Check if coordinates are within service area
 */
exports.isWithinServiceArea = (userCoords, vendorCoords, radiusKm = 10) => {
  const [userLng, userLat] = userCoords;
  const [vendorLng, vendorLat] = vendorCoords;

  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (vendorLat - userLat) * Math.PI / 180;
  const dLng = (vendorLng - userLng) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(vendorLat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusKm;
};

// ==================== STATISTICS HELPERS ====================

/**
 * Calculate vendor performance metrics
 */
exports.calculateVendorMetrics = async (vendorId) => {
  const LaundryOrder = require('../models/LaundryOrder');
  
  const orders = await LaundryOrder.find({ vendor: vendorId });

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  const completionRate = totalOrders > 0 
    ? ((completedOrders / totalOrders) * 100).toFixed(2)
    : 0;

  const cancellationRate = totalOrders > 0
    ? ((cancelledOrders / totalOrders) * 100).toFixed(2)
    : 0;

  // Calculate average rating
  const ratedOrders = orders.filter(o => o.feedback?.rating);
  const avgRating = ratedOrders.length > 0
    ? (ratedOrders.reduce((sum, o) => sum + o.feedback.rating, 0) / ratedOrders.length).toFixed(1)
    : 0;

  // Calculate average turnaround time
  const deliveredOrders = orders.filter(o => 
    o.status === 'delivered' && 
    o.schedule.pickup.actualTime && 
    o.schedule.delivery.actualTime
  );

  let avgTurnaroundHours = 0;
  if (deliveredOrders.length > 0) {
    const totalHours = deliveredOrders.reduce((sum, o) => {
      const hours = moment(o.schedule.delivery.actualTime)
        .diff(moment(o.schedule.pickup.actualTime), 'hours');
      return sum + hours;
    }, 0);
    avgTurnaroundHours = (totalHours / deliveredOrders.length).toFixed(1);
  }

  return {
    totalOrders,
    completedOrders,
    cancelledOrders,
    completionRate: parseFloat(completionRate),
    cancellationRate: parseFloat(cancellationRate),
    avgRating: parseFloat(avgRating),
    avgTurnaroundHours: parseFloat(avgTurnaroundHours)
  };
};

/**
 * Calculate user laundry statistics
 */
exports.calculateUserStats = async (userId) => {
  const LaundryOrder = require('../models/LaundryOrder');
  const LaundrySubscription = require('../models/LaundrySubscription');

  const orders = await LaundryOrder.find({ user: userId });
  const subscriptions = await LaundrySubscription.find({ user: userId });

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + o.pricing.total, 0);
  const totalItemsCleaned = orders.reduce((sum, o) => sum + o.totalItems, 0);
  const totalWeight = orders.reduce((sum, o) => sum + (o.actualWeight || o.estimatedWeight || 0), 0);

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const totalSubscriptionSpent = subscriptions.reduce((sum, s) => 
    sum + s.billing.lastPayment.amount, 0
  );

  // Calculate savings from subscriptions
  let totalSavings = 0;
  subscriptions.forEach(sub => {
    const monthlyOrders = orders.filter(o => 
      o.subscription?.toString() === sub._id.toString()
    );
    const savings = exports.calculateSubscriptionSavings(sub, monthlyOrders);
    totalSavings += savings.savings;
  });

  return {
    totalOrders,
    totalSpent: Math.round(totalSpent),
    totalItemsCleaned,
    totalWeight: parseFloat(totalWeight.toFixed(2)),
    activeSubscriptions,
    totalSubscriptionSpent: Math.round(totalSubscriptionSpent),
    totalSavings: Math.round(totalSavings),
    avgOrderValue: totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0
  };
};

// ==================== RECOMMENDATION HELPERS ====================

/**
 * Recommend subscription plan based on user's usage
 */
exports.recommendPlan = (userStats) => {
  const { totalOrders, totalItemsCleaned, totalWeight } = userStats;

  // Calculate monthly averages (assuming 3 months data)
  const avgMonthlyOrders = totalOrders / 3;
  const avgMonthlyWeight = totalWeight / 3;

  if (avgMonthlyOrders < 2 || avgMonthlyWeight < 10) {
    return {
      recommended: 'pay_per_use',
      reason: 'Your usage is low. Pay-per-use is more economical.'
    };
  } else if (avgMonthlyWeight >= 10 && avgMonthlyWeight < 20) {
    return {
      recommended: 'basic',
      reason: 'Basic plan suits your usage pattern and saves ₹200-300/month.'
    };
  } else if (avgMonthlyWeight >= 20 && avgMonthlyWeight < 30) {
    return {
      recommended: 'standard',
      reason: 'Standard plan offers best value with free dry clean items.'
    };
  } else {
    return {
      recommended: 'premium',
      reason: 'Premium plan with unlimited weight is perfect for your heavy usage.'
    };
  }
};

// ==================== EXPORT ALL ====================

module.exports = exports;