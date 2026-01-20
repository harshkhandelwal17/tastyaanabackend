// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//   // === Core Identification ===
//   orderNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   restaurantId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },

//   // === Order Type ===
//   type: {
//     type: String,
//     enum: ['gkk', 'custom', 'addon', 'sunday-special', 'product'],
//     required: true
//   },
//   subscriptionId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Subscription'
//   },
//   customRequestId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'CustomMealRequest'
//   },

//   // === Items (Combined Structure) ===
//   items: [{
//     // GKK Fields
//     name: { type: String, required: true },
//     quantity: { type: Number, required: true },
//     price: { type: Number, required: true },
//     category: { 
//       type: String, 
//       enum: ['main', 'addon', 'sweets', 'beverage', 'tiffin', 'vegetable', 'fastfood', 'product'] 
//     },
//     customizations: [String],

//     // E-commerce Fields
//     product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
//     seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     originalPrice: Number,
//     discount: Number,
//     image: String,
//     variant: {
//       size: String,
//       color: String
//     },
//     status: {
//       type: String,
//       enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
//       default: 'pending'
//     },
//     trackingNumber: String,
//     courier: String
//   }],

//   // === Delivery Details ===
//   deliveryDate: { type: Date },
//   deliverySlot: { 
//     type: String,
//     enum: ['breakfast', 'lunch', 'dinner', 'anytime','morning'] 
//   },
//   deliveryAddress: {
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: String,
//     coordinates: { lat: Number, lng: Number },
//     instructions: String
//   },
//   deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   estimatedDelivery: Date,
//   actualDelivery: Date,
//   preparationTime: String,
//   deliveryTime: String,
//   otp: String,

//   // === Pricing ===
//   subtotal: { type: Number, required: true },
//   discountAmount: { type: Number, default: 0 },
//   taxes: {
//     gst: Number,
//     deliveryCharges: Number,
//     packagingCharges: Number
//   },
//   totalAmount: { type: Number, required: true },
//   refundAmount: Number,

//   // === Payment ===
//   paymentMethod: {
//     type: String,
//     enum: ['razorpay', 'wallet', 'COD',"cod", 'subscription', 'card', 'online'],
//     required: true
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'failed', 'refunded', 'completed'],
//     default: 'pending'
//   },
//   transactionId: String,

//   // === Status Tracking ===
//   status: {
//     type: String,
//     enum: [
//       'pending', 'confirmed', 'preparing', 'ready', 
//       'out-for-delivery', 'delivered', 'cancelled',
//       'processing', 'shipped', 'returned'
//     ],
//     default: 'pending'
//   },
//   statusHistory: [{
//     status: String,
//     timestamp: { type: Date, default: Date.now },
//     note: String
//   }],

//   // === GKK Specifics ===
//   cancelBefore: Date,
//   isAutoOrder: { type: Boolean, default: false },
//   isPartOfSubscription: { type: Boolean, default: false },
//   subscriptionId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Subscription'
//   },
//   orderDate: { type: Date },
//   customizationCharges: {
//     items: [
//       {
//         name: String,
//         quantity: Number,
//         price: Number
//       }
//     ],
//     total: { type: Number, default: 0 }
//   },
//   isCustomized: { type: Boolean, default: false },
//   specialSunday: { type: Boolean, default: false },
//   specialInstructions: String,
//   cancelledAt: Date,
//   cancellationReason: String,

//   // === E-commerce Fields ===
//   billingAddress: {
//     name: String,
//     phone: String,
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: String
//   },
//   couponCode: String,
//   notes: String,
//   isGift: { type: Boolean, default: false },

//   // === Feedback ===
//   rating: {
//     food: Number,
//     delivery: Number,
//     overall: Number,
//     comment: String,
//     ratedAt: Date
//   },
//   paymentDetails: {
//   razorpayOrderId: String,
//   razorpayPaymentId: String,
//   razorpaySignature: String,
//   paymentMethod: String,
//   bank: String,
//   cardId: String,
//   amount: Number,
//   currency: String,
//   status: String,
//   createdAt: Date
// }
// }, {
//   timestamps: true
// });

// // Smart Order Number Generation
// orderSchema.pre('save', async function(next) {
//   if (!this.orderNumber) {
//     const prefix = this.type === 'gkk' ? 'GKK' : 'ORD';
//     const count = await this.constructor.countDocuments();
//     this.orderNumber = `${prefix}${String(count + 1).padStart(6, '0')}`;
//   }
//   next();
// });

// module.exports = mongoose.model('Order', orderSchema);

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // === Core Identification ===
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // === Order Type ===

  type: {
    type: String,
    enum: ['gkk', 'custom', 'addon', 'sunday-special', 'product'],
    required: true,
    index: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  customRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomMealRequest'
  },

  // === Items (Combined Structure) ===
  items: [{
    // GKK Fields
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    category: {
      // type: mongoose.Schema.Types.ObjectId, 
      // ref: 'Category',
      // required: false // Make optional for backward compatibility
      type: String,
      required: true
    },
    customizations: [String],

    // E-commerce Fields
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    image: String,
    variant: {
      size: String,
      color: String,
      weight: String,
      material: String
    },
    collegeName: {
      type: String,
      trim: true // For college-branded items
    },
    isCollegeBranded: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending'
    },
    trackingNumber: String,
    courier: String,
    trackingNumber: String,
    courier: String,
    shippedAt: Date,
    deliveredAt: Date,
    // --- Group Order Fields ---
    participantName: String,
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participantAvatar: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    }
  }],

  // === Delivery Details ===
  deliveryDate: {
    type: Date,
    validate: {
      validator: function (v) {
        return !v || v >= new Date();
      },
      message: 'Delivery date cannot be in the past'
    }
  },

  deliverySlot: {
    type: String,
    // enum: ['breakfast', 'lunch', 'dinner', 'anytime', 'morning','evening','night','afternoon'],
    default: 'anytime'
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{6}$/.test(v);
        },
        message: 'Pincode must be 6 digits'
      }
    },
    country: { type: String, default: 'India' },
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    },
    instructions: String
  },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  estimatedDelivery: Date,
  actualDelivery: Date,
  preparationTime: String,
  deliveryTime: String,
  otp: {
    type: String,
    length: 4
  },

  // === Order Preparation Countdown ===
  preparationStartTime: {
    type: Date,
    index: true
  },
  preparationDeadline: {
    type: Date,
    index: true
  },
  preparationDurationMinutes: {
    type: Number,
    default: 20,
    min: 5,
    max: 120
  },
  isDelayed: {
    type: Boolean,
    default: false,
    index: true
  },
  delayReason: String,
  delayedAt: Date,

  // === Handover Tracking ===
  handoverDetails: {
    restaurantMarkedReady: {
      markedAt: Date,
      markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    deliveryPartnerPickup: {
      pickedUpAt: Date,
      pickedUpBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      otp: String
    },
    handoverStatus: {
      type: String,
      enum: ['pending', 'ready-waiting-pickup', 'pickup-validated', 'flagged-mismatch'],
      default: 'pending',
      index: true
    },
    handoverValidatedAt: Date,
    flaggedAt: Date,
    flagReason: String
  },

  // === Pricing ===
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxes: {
    type: Object
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  // === T-Coins Loyalty ===
  coinsRedeemed: { type: Number, default: 0 },
  coinDiscount: { type: Number, default: 0 },
  coinsEarned: { type: Number, default: 0 },

  // === Payment ===
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'wallet', 'COD', 'subscription', 'card', 'online'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'completed'],
    default: 'pending',
    index: true
  },
  transactionId: {
    type: String,
    index: true
  },
  paidAt: Date,
  userContactNo: {
    type: Number,
    required: true
  },
  // === Enhanced Payment Details ===
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paymentMethod: String,
    bank: String,
    cardId: String,
    amount: Number,
    currency: { type: String, default: 'INR' },
    status: String,
    createdAt: Date,
    fee: Number,
    tax: Number
  },

  // === Group Order Details ===
  splitMethod: {
    type: String,
    enum: ['ITEMS', 'EQUAL'],
    default: 'ITEMS'
  },

  // === Refund Details ===
  refunds: [{
    refundId: String,
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    },
    processedAt: Date,
    refundedAt: Date
  }],

  // === Status Tracking ===
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'preparing', 'ready',
      'out-for-delivery', 'delivered', 'cancelled',
      'processing', 'shipped', 'returned', 'assigned'
    ],
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // === GKK Specifics ===
  cancelBefore: Date,
  isAutoOrder: {
    type: Boolean,
    default: false
  },
  isPartOfSubscription: {
    type: Boolean,
    default: false
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  customizationCharges: {
    items: [{
      name: String,
      quantity: Number,
      price: Number
    }],
    total: { type: Number, default: 0 }
  },
  isCustomized: {
    type: Boolean,
    default: false
  },
  specialSunday: {
    type: Boolean,
    default: false
  },
  specialInstructions: {
    type: String,
    maxlength: 500
  },
  cancelledAt: Date,
  cancellationReason: String,

  // === E-commerce Fields ===
  billingAddress: {
    name: String,
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^\+?[\d\s\-\(\)]{10,15}$/.test(v);
        },
        message: 'Invalid phone number format'
      }
    },
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  couponCode: {
    type: String,
    uppercase: true
  },
  deliveryInstructions: {
    type: String,
    maxlength: 1000
  },
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: String,

  // === Feedback ===
  rating: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    ratedAt: Date
  },

  // === Delay Tracking ===
  isDelayed: {
    type: Boolean,
    default: false
  },
  delayedAt: Date,
  delayReason: String,
  penaltyAmount: {
    type: Number,
    default: 0
  },
  priceForSeller: {
    type: Number,
    default: function () {
      return this.totalAmount * 0.8; // 80% for seller, 20% for app
    }
  },
  preparationStartTime: Date,
  preparationDeadline: Date,
  preparationDurationMinutes: {
    type: Number,
    default: 25 // 25 minutes for normal orders
  },

  // === Timestamps ===
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === INDEXES ===
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ 'deliveryAddress.pincode': 1 });
orderSchema.index({ deliveryDate: 1, deliverySlot: 1 });
orderSchema.index({ transactionId: 1 });

// === VIRTUALS ===
orderSchema.virtual('canBeCancelled').get(function () {
  const cancellableStatuses = ['pending', 'confirmed'];
  if (!this.createdAt) return false;
  const timeLimit = this.cancelBefore || new Date(this.createdAt.getTime() + 30 * 60 * 1000); // 30 minutes default
  return cancellableStatuses.includes(this.status) && new Date() < timeLimit;
});

orderSchema.virtual('isDelivered').get(function () {
  return this.status === 'delivered';
});

orderSchema.virtual('formattedTotal').get(function () {
  return `₹${this.totalAmount?.toFixed(2)}`;
});

orderSchema.virtual('timeRemaining').get(function () {
  if (!this.preparationDeadline || this.status === 'delivered' || this.status === 'cancelled') {
    return null;
  }
  const now = new Date();
  const timeLeft = this.preparationDeadline - now;
  return timeLeft > 0 ? Math.ceil(timeLeft / (1000 * 60)) : 0; // minutes remaining
});

orderSchema.virtual('isOverdue').get(function () {
  if (!this.preparationDeadline || this.status === 'delivered' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.preparationDeadline;
});

orderSchema.virtual('handoverFlag').get(function () {
  const handover = this.handoverDetails;
  if (!handover) return null;

  const restaurantReady = handover.restaurantMarkedReady?.markedAt;
  const deliveryPickup = handover.deliveryPartnerPickup?.pickedUpAt;

  if (restaurantReady && !deliveryPickup) {
    const waitTime = (new Date() - new Date(restaurantReady)) / (1000 * 60); // minutes
    if (waitTime > 10) { // Flag if waiting more than 10 minutes
      return {
        type: 'pending-pickup',
        message: 'Restaurant marked ready but delivery partner has not confirmed pickup',
        waitTime: Math.floor(waitTime)
      };
    }
  }

  return null;
});

// === PRE-SAVE MIDDLEWARE ===
orderSchema.pre('save', async function (next) {
  // Generate order number if not exists
  if (!this.orderNumber) {
    const prefix = this.type === 'gkk' ? 'GKK' : 'ORD';
    const count = await this.constructor.countDocuments();
    this.orderNumber = `${prefix}${String(count + 1).padStart(6, '0')}`;
  }

  // Update timestamps
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }

  // Auto-add status history and start countdown when confirmed
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: ` Status changed to ${this.status}`
    });

    // Start countdown timer when order is confirmed
    if (this.status === 'confirmed' && !this.preparationStartTime) {
      this.preparationStartTime = new Date();
      this.preparationDeadline = new Date(Date.now() + this.preparationDurationMinutes * 60 * 1000);
    }

    // Check for delays when status changes
    if (this.preparationDeadline && new Date() > this.preparationDeadline &&
      !['delivered', 'cancelled'].includes(this.status) && !this.isDelayed) {
      this.isDelayed = true;
      this.delayedAt = new Date();
      this.delayReason = 'Order preparation exceeded 25-minute limit';
      this.penaltyAmount = this.totalAmount; // 100% penalty
    }
  }

  // Validate total amount calculation
  const calculatedTotal = this.subtotal - this.discountAmount + this.taxes.total

  // Debug logging for Order model validation
  console.log('Order Model Validation Debug:', {
    subtotal: this.subtotal,
    discountAmount: this.discountAmount,
    taxes: this.taxes,
    totalAmount: this.totalAmount,
    calculatedTotal,
    difference: Math.abs(calculatedTotal - this.totalAmount),
    calculationBreakdown: {
      subtotal: this.subtotal,
      discountAmount: this.discountAmount,
      gst: this.taxes.gst || 0,
      deliveryCharges: this.taxes.deliveryCharges || 0,
      packagingCharges: this.taxes.packagingCharges || 0,
      rainCharges: this.taxes.rainCharges || 0,
      serviceCharges: this.taxes.serviceCharges || 0,
      calculatedTotal
    }
  });

  if (Math.abs(calculatedTotal - this.totalAmount) > 0.01) {
    const error = new Error(`Total amount calculation mismatch. Expected: ${calculatedTotal}, Got: ${this.totalAmount}`);
    error.name = 'ValidationError';
    return next(error);
  }

  next();
});

// === STATIC METHODS ===
orderSchema.statics.findByOrderNumber = function (orderNumber) {
  return this.findOne({ orderNumber });
};

orderSchema.statics.findPendingPayments = function () {
  return this.find({ paymentStatus: 'pending', status: { $ne: 'cancelled' } });
};

orderSchema.statics.getOrderStats = function (userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
};

// === INSTANCE METHODS ===
orderSchema.methods.cancel = function (reason) {
  if (!this.canBeCancelled) {
    throw new Error('Order cannot be cancelled at this time');
  }

  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: `Order cancelled: ${reason}`
  });

  return this.save();
};

orderSchema.methods.updateStatus = function (newStatus, note, updatedBy) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note,
    updatedBy: updatedBy
  });

  return this.save();
};

orderSchema.methods.markRestaurantReady = function (userId) {
  if (!this.handoverDetails) {
    this.handoverDetails = {};
  }

  this.handoverDetails.restaurantMarkedReady = {
    markedAt: new Date(),
    markedBy: userId
  };
  this.handoverDetails.handoverStatus = 'ready-waiting-pickup';
  this.status = 'ready';

  return this.save();
};

orderSchema.methods.markDeliveryPickup = function (deliveryPartnerId, otp) {
  if (!this.handoverDetails) {
    this.handoverDetails = {};
  }

  this.handoverDetails.deliveryPartnerPickup = {
    pickedUpAt: new Date(),
    pickedUpBy: deliveryPartnerId,
    otp: otp
  };

  // Validate handover
  const restaurantReady = this.handoverDetails.restaurantMarkedReady?.markedAt;
  const deliveryPickup = this.handoverDetails.deliveryPartnerPickup?.pickedUpAt;

  if (restaurantReady && deliveryPickup) {
    // Check if timestamps are reasonable (within 2 hours)
    const timeDiff = Math.abs(new Date(deliveryPickup) - new Date(restaurantReady)) / (1000 * 60 * 60);
    if (timeDiff <= 2) {
      this.handoverDetails.handoverStatus = 'pickup-validated';
      this.handoverDetails.handoverValidatedAt = new Date();
      this.status = 'out-for-delivery';
    } else {
      this.handoverDetails.handoverStatus = 'flagged-mismatch';
      this.handoverDetails.flaggedAt = new Date();
      this.handoverDetails.flagReason = 'Time mismatch between ready and pickup';
    }
  }

  return this.save();
};

// Get countdown information
orderSchema.methods.getCountdownInfo = function () {
  if (!this.preparationDeadline) {
    return null;
  }

  const now = new Date();
  const timeRemaining = this.preparationDeadline - now;
  const isOverdue = timeRemaining < 0;

  return {
    preparationDeadline: this.preparationDeadline,
    timeRemaining: Math.max(0, timeRemaining),
    minutesRemaining: Math.max(0, Math.ceil(timeRemaining / (1000 * 60))),
    isOverdue,
    isDelayed: this.isDelayed,
    delayReason: this.delayReason,
    penaltyAmount: this.penaltyAmount
  };
};

orderSchema.methods.getDelayInfo = function () {
  if (!this.isDelayed || !this.preparationDeadline) {
    return null;
  }

  const delayMinutes = Math.floor((new Date() - this.preparationDeadline) / (1000 * 60));

  return {
    isDelayed: true,
    delayMinutes,
    delayReason: this.delayReason,
    delayedAt: this.delayedAt,
    penaltyAmount: this.penaltyAmount
  };
};

module.exports = mongoose.model('Order', orderSchema);