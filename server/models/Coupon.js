const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // Discount Details
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping', 'buy_one_get_one', 'buy_x_get_y', 'cashback', 'points_multiplier'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: {
    type: Number,
    min: 0,
    default: null // Max discount for percentage type
  },
  
  // Special discount configurations
  specialDiscount: {
    // For BOGO (Buy One Get One) coupons
    bogoConfig: {
      buyQuantity: { type: Number, min: 1, default: 1 },
      getQuantity: { type: Number, min: 1, default: 1 },
      getDiscount: { type: Number, min: 0, max: 100, default: 100 } // Percentage discount on free item
    },
    // For Buy X Get Y coupons
    buyXGetYConfig: {
      buyQuantity: { type: Number, min: 1, default: 2 },
      getQuantity: { type: Number, min: 1, default: 1 },
      getDiscount: { type: Number, min: 0, max: 100, default: 100 }
    },
    // For cashback coupons
    cashbackConfig: {
      cashbackAmount: { type: Number, min: 0 },
      cashbackType: { type: String, enum: ['wallet', 'points'], default: 'wallet' }
    },
    // For points multiplier coupons
    pointsConfig: {
      multiplier: { type: Number, min: 1, default: 1 },
      maxPoints: { type: Number, min: 0, default: null }
    }
  },
  
  // Usage Limits
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxUsage: {
    type: Number,
    default: null, // null = unlimited
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxUsagePerUser: {
    type: Number,
    default: 1,
    min: 1
  },
  // New usage limit fields
  maxUsagePerUserPerDay: {
    type: Number,
    default: null, // null = unlimited daily usage
    min: 1
  },
  totalUsageLimit: {
    type: Number,
    default: null, // null = unlimited total usage
    min: 1
  },
  
  // Validity
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Applicable Products/Categories
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Advanced targeting options
  targeting: {
    // User targeting
    userTargeting: {
      applicableUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      excludeUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      // User segment targeting
      userSegments: [{
        type: String,
        enum: ['new_users', 'returning_customers', 'vip_customers', 'high_value_customers', 'inactive_users']
      }],
      // User behavior targeting
      userBehavior: {
        minOrderCount: { type: Number, min: 0, default: 0 },
        maxOrderCount: { type: Number, min: 0, default: null },
        minTotalSpent: { type: Number, min: 0, default: 0 },
        maxTotalSpent: { type: Number, min: 0, default: null },
        lastOrderDays: { type: Number, min: 0, default: null } // Days since last order
      }
    },
    
    // Geographic targeting
    geographicTargeting: {
      applicableCities: [String],
      applicableStates: [String],
      applicablePincodes: [String],
      excludeCities: [String],
      excludeStates: [String],
      excludePincodes: [String]
    },
    
    // Time-based targeting
    timeTargeting: {
      applicableDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }],
      applicableTimeSlots: [{
        start: String, // Format: "HH:MM"
        end: String    // Format: "HH:MM"
      }],
      applicableSeasons: [{
        type: String,
        enum: ['summer', 'monsoon', 'winter', 'spring']
      }]
    },
    
    // Order-based targeting
    orderTargeting: {
      applicableOrderTypes: [{
        type: String,
        enum: ['gkk', 'custom', 'addon', 'sunday-special', 'product', 'subscription']
      }],
      applicablePaymentMethods: [{
        type: String,
        enum: ['razorpay', 'wallet', 'cod', 'subscription', 'card', 'upi', 'COD']
      }],
      minOrderValue: { type: Number, min: 0, default: 0 },
      maxOrderValue: { type: Number, min: 0, default: null }
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Coupon priority and stacking
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  canStackWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  }],
  cannotStackWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  }],
  
  // Marketing and analytics
  campaign: {
    name: String,
    description: String,
    tags: [String]
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUsedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Virtual for checking if coupon is valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (this.maxUsage === null || this.usedCount < this.maxUsage) &&
         (this.totalUsageLimit === null || this.usedCount < this.totalUsageLimit);
});

// Method to check if user can use this coupon
couponSchema.methods.canUserUse = async function(userId, orderData = {}) {
  const CouponUsage = require('./CouponUsage');
  const User = require('./User');
  const Order = require('./Order');
  
  // 1. Check total usage limit across all users
  if (this.totalUsageLimit !== null) {
    const totalUsageCount = await CouponUsage.countDocuments({
      couponId: this._id
    });
    
    if (totalUsageCount >= this.totalUsageLimit) {
      return { canUse: false, reason: 'Total coupon usage limit exceeded' };
    }
  }
  
  // 2. Check if user has exceeded max usage per user
  const userUsageCount = await CouponUsage.countDocuments({
    couponId: this._id,
    userId: userId
  });
  
  if (userUsageCount >= this.maxUsagePerUser) {
    return { canUse: false, reason: `Maximum usage limit (${this.maxUsagePerUser}) reached for this user` };
  }
  
  // 3. Check per-user per-day limit
  if (this.maxUsagePerUserPerDay !== null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayUsageCount = await CouponUsage.countDocuments({
      couponId: this._id,
      userId: userId,
      usedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    if (todayUsageCount >= this.maxUsagePerUserPerDay) {
      return { canUse: false, reason: `Daily usage limit (${this.maxUsagePerUserPerDay}) reached for today` };
    }
  }
  
  // 4. Check targeting restrictions
  if (this.targeting) {
    const targetingResult = await this.checkTargeting(userId, orderData);
    if (!targetingResult.canUse) {
      return targetingResult;
    }
  }
  
  // 5. Legacy checks for backward compatibility
  if (this.excludeUsers && this.excludeUsers.includes(userId)) {
    return { canUse: false, reason: 'User is excluded from using this coupon' };
  }
  
  if (this.applicableUsers && this.applicableUsers.length > 0 && !this.applicableUsers.includes(userId)) {
    return { canUse: false, reason: 'Coupon not applicable to this user' };
  }
  
  return { canUse: true };
};

// Method to check targeting restrictions
couponSchema.methods.checkTargeting = async function(userId, orderData = {}) {
  const User = require('./User');
  const Order = require('./Order');
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { canUse: false, reason: 'User not found' };
    }
    
    // Check user targeting
    if (this.targeting.userTargeting) {
      const userTargeting = this.targeting.userTargeting;
      
      // Check excluded users
      if (userTargeting.excludeUsers && userTargeting.excludeUsers.includes(userId)) {
        return { canUse: false, reason: 'User is excluded from this coupon' };
      }
      
      // Check applicable users
      if (userTargeting.applicableUsers && userTargeting.applicableUsers.length > 0) {
        if (!userTargeting.applicableUsers.includes(userId)) {
          return { canUse: false, reason: 'Coupon not applicable to this user' };
        }
      }
      
      // Check user behavior
      if (userTargeting.userBehavior) {
        const behavior = userTargeting.userBehavior;
        
        // Get user's order statistics
        const userOrders = await Order.find({ userId: userId });
        const orderCount = userOrders.length;
        const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const lastOrder = userOrders.length > 0 ? 
          Math.floor((new Date() - new Date(userOrders[userOrders.length - 1].createdAt)) / (1000 * 60 * 60 * 24)) : null;
        
        if (behavior.minOrderCount && orderCount < behavior.minOrderCount) {
          return { canUse: false, reason: `Minimum ${behavior.minOrderCount} orders required` };
        }
        
        if (behavior.maxOrderCount && orderCount > behavior.maxOrderCount) {
          return { canUse: false, reason: `Maximum ${behavior.maxOrderCount} orders allowed` };
        }
        
        if (behavior.minTotalSpent && totalSpent < behavior.minTotalSpent) {
          return { canUse: false, reason: `Minimum ₹${behavior.minTotalSpent} total spending required` };
        }
        
        if (behavior.maxTotalSpent && totalSpent > behavior.maxTotalSpent) {
          return { canUse: false, reason: `Maximum ₹${behavior.maxTotalSpent} total spending allowed` };
        }
        
        if (behavior.lastOrderDays && lastOrder !== null && lastOrder > behavior.lastOrderDays) {
          return { canUse: false, reason: `Last order must be within ${behavior.lastOrderDays} days` };
        }
      }
    }
    
    // Check geographic targeting
    if (this.targeting.geographicTargeting && orderData.deliveryAddress) {
      const geo = this.targeting.geographicTargeting;
      const address = orderData.deliveryAddress;
      
      if (geo.excludeCities && geo.excludeCities.includes(address.city)) {
        return { canUse: false, reason: 'Coupon not available in this city' };
      }
      
      if (geo.excludeStates && geo.excludeStates.includes(address.state)) {
        return { canUse: false, reason: 'Coupon not available in this state' };
      }
      
      if (geo.excludePincodes && geo.excludePincodes.includes(address.pincode)) {
        return { canUse: false, reason: 'Coupon not available in this area' };
      }
      
      if (geo.applicableCities && geo.applicableCities.length > 0) {
        if (!geo.applicableCities.includes(address.city)) {
          return { canUse: false, reason: 'Coupon only available in specific cities' };
        }
      }
      
      if (geo.applicableStates && geo.applicableStates.length > 0) {
        if (!geo.applicableStates.includes(address.state)) {
          return { canUse: false, reason: 'Coupon only available in specific states' };
        }
      }
      
      if (geo.applicablePincodes && geo.applicablePincodes.length > 0) {
        if (!geo.applicablePincodes.includes(address.pincode)) {
          return { canUse: false, reason: 'Coupon only available in specific areas' };
        }
      }
    }
    
    // Check time-based targeting
    if (this.targeting.timeTargeting) {
      const timeTargeting = this.targeting.timeTargeting;
      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[now.getDay()];
      const currentTime = now.toTimeString().substring(0, 5);
      
      if (timeTargeting.applicableDays && timeTargeting.applicableDays.length > 0) {
        if (!timeTargeting.applicableDays.includes(currentDay)) {
          return { canUse: false, reason: 'Coupon not available on this day' };
        }
      }
      
      if (timeTargeting.applicableTimeSlots && timeTargeting.applicableTimeSlots.length > 0) {
        const isInTimeSlot = timeTargeting.applicableTimeSlots.some(slot => 
          currentTime >= slot.start && currentTime <= slot.end
        );
        if (!isInTimeSlot) {
          return { canUse: false, reason: 'Coupon not available at this time' };
        }
      }
    }
    
    // Check order-based targeting
    if (this.targeting.orderTargeting) {
      const orderTargeting = this.targeting.orderTargeting;
      
      if (orderTargeting.applicableOrderTypes && orderTargeting.applicableOrderTypes.length > 0) {
        if (!orderTargeting.applicableOrderTypes.includes(orderData.type)) {
          return { canUse: false, reason: 'Coupon not applicable to this order type' };
        }
      }
      
      if (orderTargeting.applicablePaymentMethods && orderTargeting.applicablePaymentMethods.length > 0) {
        if (!orderTargeting.applicablePaymentMethods.includes(orderData.paymentMethod)) {
          return { canUse: false, reason: 'Coupon not applicable with this payment method' };
        }
      }
      
      if (orderTargeting.minOrderValue && orderData.subtotal < orderTargeting.minOrderValue) {
        return { canUse: false, reason: `Minimum order value of ₹${orderTargeting.minOrderValue} required` };
      }
      
      if (orderTargeting.maxOrderValue && orderData.subtotal > orderTargeting.maxOrderValue) {
        return { canUse: false, reason: `Maximum order value of ₹${orderTargeting.maxOrderValue} allowed` };
      }
    }
    
    return { canUse: true };
    
  } catch (error) {
    console.error('Error checking targeting:', error);
    return { canUse: false, reason: 'Error validating coupon targeting' };
  }
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount, orderItems = []) {
  if (orderAmount < this.minOrderAmount) {
    return { discount: 0, reason: `Minimum order amount of ₹${this.minOrderAmount} required` };
  }
  
  let discount = 0;
  let details = {};
  
  switch (this.discountType) {
    case 'percentage':
      discount = (orderAmount * this.discountValue) / 100;
      if (this.maxDiscount && discount > this.maxDiscount) {
        discount = this.maxDiscount;
      }
      details = { type: 'percentage', value: this.discountValue, maxDiscount: this.maxDiscount };
      break;
      
    case 'fixed':
      discount = this.discountValue;
      details = { type: 'fixed', value: this.discountValue };
      break;
      
    case 'free_shipping':
      // This would be handled separately in the order processing
      discount = 0;
      details = { type: 'free_shipping', value: 'Free delivery charges' };
      break;
      
    case 'buy_one_get_one':
      if (this.specialDiscount && this.specialDiscount.bogoConfig) {
        const bogo = this.specialDiscount.bogoConfig;
        discount = this.calculateBOGODiscount(orderItems, bogo);
        details = { 
          type: 'bogo', 
          buyQuantity: bogo.buyQuantity, 
          getQuantity: bogo.getQuantity,
          getDiscount: bogo.getDiscount 
        };
      }
      break;
      
    case 'buy_x_get_y':
      if (this.specialDiscount && this.specialDiscount.buyXGetYConfig) {
        const buyXGetY = this.specialDiscount.buyXGetYConfig;
        discount = this.calculateBuyXGetYDiscount(orderItems, buyXGetY);
        details = { 
          type: 'buy_x_get_y', 
          buyQuantity: buyXGetY.buyQuantity, 
          getQuantity: buyXGetY.getQuantity,
          getDiscount: buyXGetY.getDiscount 
        };
      }
      break;
      
    case 'cashback':
      if (this.specialDiscount && this.specialDiscount.cashbackConfig) {
        const cashback = this.specialDiscount.cashbackConfig;
        discount = 0; // Cashback is applied after order completion
        details = { 
          type: 'cashback', 
          amount: cashback.cashbackAmount, 
          cashbackType: cashback.cashbackType 
        };
      }
      break;
      
    case 'points_multiplier':
      if (this.specialDiscount && this.specialDiscount.pointsConfig) {
        const points = this.specialDiscount.pointsConfig;
        discount = 0; // Points are calculated separately
        details = { 
          type: 'points_multiplier', 
          multiplier: points.multiplier, 
          maxPoints: points.maxPoints 
        };
      }
      break;
      
    default:
      discount = 0;
      details = { type: 'unknown' };
  }
  
  // Ensure discount doesn't exceed order amount
  discount = Math.min(discount, orderAmount);
  
  return { 
    discount: Math.round(discount * 100) / 100, 
    details: details 
  };
};

// Helper method to calculate BOGO discount
couponSchema.methods.calculateBOGODiscount = function(orderItems, bogoConfig) {
  let totalDiscount = 0;
  
  // Group items by product/category for BOGO calculation
  const itemGroups = {};
  orderItems.forEach(item => {
    const key = item.product || item.category || item.name;
    if (!itemGroups[key]) {
      itemGroups[key] = [];
    }
    itemGroups[key].push(item);
  });
  
  // Apply BOGO logic to each group
  Object.values(itemGroups).forEach(items => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const eligibleSets = Math.floor(totalQuantity / (bogoConfig.buyQuantity + bogoConfig.getQuantity));
    
    if (eligibleSets > 0) {
      // Calculate discount for free items
      const freeQuantity = eligibleSets * bogoConfig.getQuantity;
      const avgPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0) / totalQuantity;
      const freeItemDiscount = freeQuantity * avgPrice * (bogoConfig.getDiscount / 100);
      totalDiscount += freeItemDiscount;
    }
  });
  
  return totalDiscount;
};

// Helper method to calculate Buy X Get Y discount
couponSchema.methods.calculateBuyXGetYDiscount = function(orderItems, buyXGetYConfig) {
  let totalDiscount = 0;
  
  // Similar to BOGO but with different quantities
  const itemGroups = {};
  orderItems.forEach(item => {
    const key = item.product || item.category || item.name;
    if (!itemGroups[key]) {
      itemGroups[key] = [];
    }
    itemGroups[key].push(item);
  });
  
  Object.values(itemGroups).forEach(items => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const eligibleSets = Math.floor(totalQuantity / (buyXGetYConfig.buyQuantity + buyXGetYConfig.getQuantity));
    
    if (eligibleSets > 0) {
      const freeQuantity = eligibleSets * buyXGetYConfig.getQuantity;
      const avgPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0) / totalQuantity;
      const freeItemDiscount = freeQuantity * avgPrice * (buyXGetYConfig.getDiscount / 100);
      totalDiscount += freeItemDiscount;
    }
  });
  
  return totalDiscount;
};

// Method to get enhanced usage statistics
couponSchema.methods.getUsageStatistics = async function(userId = null) {
  const CouponUsage = require('./CouponUsage');
  
  // Total usage across all users
  const totalUsage = await CouponUsage.countDocuments({ couponId: this._id });
  
  // Usage statistics for specific user if provided
  let userStats = null;
  if (userId) {
    const userTotalUsage = await CouponUsage.countDocuments({
      couponId: this._id,
      userId: userId
    });
    
    // Today's usage for the user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const userTodayUsage = await CouponUsage.countDocuments({
      couponId: this._id,
      userId: userId,
      usedAt: { $gte: today, $lt: tomorrow }
    });
    
    userStats = {
      totalUsage: userTotalUsage,
      todayUsage: userTodayUsage,
      remainingUsage: this.maxUsagePerUser - userTotalUsage,
      remainingTodayUsage: this.maxUsagePerUserPerDay ? this.maxUsagePerUserPerDay - userTodayUsage : null
    };
  }
  
  return {
    totalUsage,
    remainingTotalUsage: this.totalUsageLimit ? this.totalUsageLimit - totalUsage : null,
    usagePercentage: this.totalUsageLimit ? Math.round((totalUsage / this.totalUsageLimit) * 100) : null,
    userStats
  };
};

// Pre-save middleware to validate dates
couponSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    return next(new Error('Start date must be before end date'));
  }
  
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    return next(new Error('Percentage discount cannot exceed 100%'));
  }
  
  next();
});

module.exports = mongoose.model('Coupon', couponSchema);