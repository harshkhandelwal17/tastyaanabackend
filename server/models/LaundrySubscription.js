const mongoose = require('mongoose');

const laundrySubscriptionSchema = new mongoose.Schema({
  // References
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LaundryVendor', 
    required: true 
  },
  
  // Plan Details
  plan: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    maxWeight: { type: Number }, // null = unlimited
    features: {
      unlimitedPickups: { type: Boolean, default: true },
      services: [{ type: String }],
      freeDryClean: { type: Number, default: 0 },
      freeExpressService: { type: Number, default: 0 },
      quickServiceQuota: { type: Number, default: 0 }, // Free quick services per month
      quickServiceDiscount: { type: Number, default: 0 }, // Discount % on quick orders
      shoeCleaningFree: { type: Number, default: 0 },
      turnaroundTime: { type: String },
      priority: { type: Boolean, default: false },
      vipSupport: { type: Boolean, default: false }
    }
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'paused', 'cancelled', 'expired'], 
    default: 'active' 
  },
  
  // Period
  period: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    nextRenewalDate: { type: Date }
  },
  
  // Usage Tracking
  usage: {
    currentMonth: {
      weightUsed: { type: Number, default: 0 },
      weightRemaining: { type: Number },
      pickupsCompleted: { type: Number, default: 0 },
      itemsCleaned: { type: Number, default: 0 },
      dryCleanUsed: { type: Number, default: 0 },
      dryCleanRemaining: { type: Number },
      expressServiceUsed: { type: Number, default: 0 },
      expressServiceRemaining: { type: Number },
      quickServicesUsed: { type: Number, default: 0 }, // NEW
      quickServicesRemaining: { type: Number }, // NEW
      orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LaundryOrder' }]
    },
    history: [{
      month: { type: String }, // "2025-10"
      weightUsed: { type: Number },
      pickupsCompleted: { type: Number },
      itemsCleaned: { type: Number },
      quickServicesUsed: { type: Number }, // NEW
      orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LaundryOrder' }]
    }]
  },
  
  // Preferences
  preferences: {
    defaultPickupAddress: {
      street: String,
      area: String,
      city: String,
      pincode: String,
      coordinates: [Number],
      landmark: String,
      contactName: String,
      contactPhone: String
    },
    preferredTimeSlot: { 
      type: String, 
      enum: ['morning', 'afternoon', 'evening'] 
    },
    preferredDeliverySpeed: {
      type: String,
      enum: ['quick', 'scheduled'],
      default: 'scheduled'
    },
    specialInstructions: { type: String, maxlength: 500 },
    notifications: {
      pickup: { type: Boolean, default: true },
      delivery: { type: Boolean, default: true },
      renewalReminder: { type: Boolean, default: true },
      usageAlert: { type: Boolean, default: true }
    }
  },
  
  // Billing
  billing: {
    autoRenewal: { type: Boolean, default: true },
    paymentMethod: { 
      type: String, 
      enum: ['wallet', 'upi', 'card'] 
    },
    lastPayment: {
      amount: { type: Number },
      date: { type: Date },
      transactionId: { type: String },
      status: { 
        type: String, 
        enum: ['success', 'failed', 'pending'] 
      }
    },
    nextPayment: {
      amount: { type: Number },
      dueDate: { type: Date }
    }
  },
  
  // Pause History
  pauseHistory: [{
    pausedAt: { type: Date },
    resumedAt: { type: Date },
    reason: { type: String },
    daysExtended: { type: Number }
  }],
  
  // Cancellation
  cancellation: {
    reason: { type: String },
    cancelledAt: { type: Date },
    refundAmount: { type: Number },
    refundStatus: { 
      type: String, 
      enum: ['pending', 'processed', 'failed'] 
    }
  },
  
}, { timestamps: true });

// Indexes
laundrySubscriptionSchema.index({ user: 1, status: 1 });
laundrySubscriptionSchema.index({ vendor: 1, status: 1 });
laundrySubscriptionSchema.index({ status: 1 });
laundrySubscriptionSchema.index({ 'period.nextRenewalDate': 1 });

// Calculate remaining weight/services
laundrySubscriptionSchema.methods.calculateRemaining = function() {
  const usage = this.usage.currentMonth;
  
  if (this.plan.maxWeight) {
    usage.weightRemaining = this.plan.maxWeight - usage.weightUsed;
  }
  
  if (this.plan.features.freeDryClean) {
    usage.dryCleanRemaining = this.plan.features.freeDryClean - usage.dryCleanUsed;
  }
  
  if (this.plan.features.freeExpressService) {
    usage.expressServiceRemaining = this.plan.features.freeExpressService - usage.expressServiceUsed;
  }
  
  if (this.plan.features.quickServiceQuota) {
    usage.quickServicesRemaining = this.plan.features.quickServiceQuota - usage.quickServicesUsed;
  }
  
  return this;
};

// Reset monthly usage
laundrySubscriptionSchema.methods.resetMonthlyUsage = function() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Save to history
  this.usage.history.push({
    month: currentMonth,
    weightUsed: this.usage.currentMonth.weightUsed,
    pickupsCompleted: this.usage.currentMonth.pickupsCompleted,
    itemsCleaned: this.usage.currentMonth.itemsCleaned,
    quickServicesUsed: this.usage.currentMonth.quickServicesUsed,
    orders: this.usage.currentMonth.orders
  });
  
  // Reset current month
  this.usage.currentMonth = {
    weightUsed: 0,
    weightRemaining: this.plan.maxWeight,
    pickupsCompleted: 0,
    itemsCleaned: 0,
    dryCleanUsed: 0,
    dryCleanRemaining: this.plan.features.freeDryClean,
    expressServiceUsed: 0,
    expressServiceRemaining: this.plan.features.freeExpressService,
    quickServicesUsed: 0,
    quickServicesRemaining: this.plan.features.quickServiceQuota,
    orders: []
  };
  
  return this;
};

module.exports = mongoose.model('LaundrySubscription', laundrySubscriptionSchema);