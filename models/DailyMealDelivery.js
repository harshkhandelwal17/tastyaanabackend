const mongoose = require('mongoose');

const dailyMealDeliverySchema = new mongoose.Schema({
  // Core identification
  deliveryId: {
    type: String,
    default: () => `MEAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    unique: true
  },
  
  // References
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mealPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan',
    required: true
  },
  
  // Delivery details
  deliveryDate: {
    type: Date,
    required: true,
    index: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening'],
    required: true,
    index: true
  },
  
  // Meal details
  mealDetails: {
    thaliName: String,
    thaliImage: String,
    basePrice: Number,
    addOns: [{
      name: String,
      price: Number,
      quantity: Number
    }],
    customizations: [{
      type: String,
      details: String,
      price: Number
    }],
    totalPrice: Number
  },
  
  // Delivery status tracking
  status: {
    type: String,
    enum: ['scheduled', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'not_delivered', 'cancelled', 'skipped'],
    default: 'scheduled',
    index: true
  },
  
  // Delivery tracking
  deliveryTracking: {
    scheduledTime: String, // e.g., "08:00" or "19:00"
    preparedAt: Date,
    readyAt: Date,
    dispatchedAt: Date,
    deliveredAt: Date,
    deliveryNotes: String,
    deliveryImage: String, // Photo proof of delivery
    customerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    customerFeedback: String
  },
  
  // Seller management
  sellerActions: {
    markedReadyAt: Date,
    markedReadyBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveryConfirmedAt: Date,
    deliveryConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  },
  
  // Payment tracking
  paymentDetails: {
    deductionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyHisaab'
    },
    amount: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  },
  
  // Skip/cancellation tracking
  skipDetails: {
    isSkipped: { type: Boolean, default: false },
    skipReason: String,
    skippedBy: {
      type: String,
      enum: ['user', 'seller', 'system']
    },
    skippedAt: Date,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'completed']
    }
  },
  
  // System tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional metadata
  metadata: {
    orderSource: {
      type: String,
      enum: ['subscription', 'manual'],
      default: 'subscription'
    },
    isWeekend: Boolean,
    isSundayMeal: Boolean,
    deliveryAttempts: { type: Number, default: 0 },
    lastDeliveryAttempt: Date
  }
}, {
  timestamps: true,
  indexes: [
    { deliveryDate: 1, shift: 1, seller: 1 }, // For seller daily view
    { subscription: 1, deliveryDate: 1 }, // For subscription tracking
    { user: 1, deliveryDate: -1 }, // For user history
    { seller: 1, status: 1, deliveryDate: 1 }, // For seller filtering
    { deliveryDate: 1, status: 1 } // For daily reports
  ]
});

// Update timestamp on save
dailyMealDeliverySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for delivery day name
dailyMealDeliverySchema.virtual('deliveryDayName').get(function() {
  return this.deliveryDate.toLocaleDateString('en-US', { weekday: 'long' });
});

// Virtual for formatted delivery date
dailyMealDeliverySchema.virtual('formattedDeliveryDate').get(function() {
  return this.deliveryDate.toLocaleDateString('en-IN');
});

// Static method to get seller's daily deliveries
dailyMealDeliverySchema.statics.getSellerDailyDeliveries = function(sellerId, date, shift, status) {
  const query = { seller: sellerId };
  
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    query.deliveryDate = { $gte: startDate, $lte: endDate };
  }
  
  if (shift) query.shift = shift;
  if (status) query.status = status;
  
  return this.find(query)
    .populate('user', 'name phone address')
    .populate('mealPlan', 'name image price')
    .populate('subscription', 'subscriptionId shift')
    .sort({ deliveryDate: 1, shift: 1 });
};

// Static method to create daily meal records for subscription
dailyMealDeliverySchema.statics.createDailyMealRecord = async function(subscriptionData, deliveryDate, shift) {
  const mealRecord = new this({
    subscription: subscriptionData._id,
    user: subscriptionData.user,
    seller: subscriptionData.mealPlan.createdBy,
    mealPlan: subscriptionData.mealPlan._id,
    deliveryDate: deliveryDate,
    shift: shift,
    mealDetails: {
      thaliName: subscriptionData.mealPlan.name,
      thaliImage: subscriptionData.mealPlan.image,
      basePrice: subscriptionData.pricing.basePricePerMeal,
      addOns: subscriptionData.selectedAddOns || [],
      totalPrice: subscriptionData.pricing.basePricePerMeal + (subscriptionData.pricing.addOnsPrice || 0)
    },
    deliveryTracking: {
      scheduledTime: shift === 'morning' ? '08:00' : '19:00'
    },
    metadata: {
      isWeekend: [0, 6].includes(deliveryDate.getDay()), // Sunday = 0, Saturday = 6
      isSundayMeal: deliveryDate.getDay() === 0
    }
  });
  
  return await mealRecord.save();
};

module.exports = mongoose.model('DailyMealDelivery', dailyMealDeliverySchema);
