// models/MenuChange.js
const mongoose = require('mongoose');

const menuChangeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  changeDate: {
    type: Date,
    required: true
  },
  deliverySlot: {
    type: String,
    enum: ['lunch', 'dinner'],
    required: true
  },
  originalMeal: {
    planTier: {
      type: String,
      enum: ['low', 'basic', 'premium']
    },
    items: [{
      name: String,
      description: String,
      price: Number
    }],
    totalPrice: Number
  },
  newMeal: {
    planTier: {
      type: String,
      enum: ['low', 'basic', 'premium']
    },
    items: [{
      name: String,
      description: String,
      price: Number
    }],
    totalPrice: Number,
    customItems: [{
      name: String,
      description: String,
      price: Number,
      quantity: Number
    }]
  },
  priceAdjustment: {
    type: Number,
    default: 0 // Positive for extra charge, negative for discount
  },
  reason: {
    type: String,
    enum: ['upgrade', 'downgrade', 'dietary_preference', 'custom_request', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  paymentRequired: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['not_required', 'pending', 'paid', 'failed'],
    default: 'not_required'
  },
  transactionId: String,
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  cutoffTime: {
    type: Date,
    required: true
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  notes: String
}, {
  timestamps: true
});

// Check if change request is within cutoff time
menuChangeSchema.methods.isWithinCutoff = function() {
  return new Date() < this.cutoffTime;
};

// Calculate price adjustment based on plan changes
menuChangeSchema.methods.calculatePriceAdjustment = function() {
  const priceDifference = this.newMeal.totalPrice - this.originalMeal.totalPrice;
  this.priceAdjustment = priceDifference;
  this.paymentRequired = priceDifference > 0;
  
  if (this.paymentRequired) {
    this.paymentStatus = 'pending';
  } else {
    this.paymentStatus = 'not_required';
  }
  
  return this.priceAdjustment;
};

// Auto-expire old change requests
menuChangeSchema.index({ cutoffTime: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('MenuChange', menuChangeSchema);
