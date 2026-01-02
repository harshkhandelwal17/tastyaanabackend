const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Can be either orderId or subscriptionId
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true,
    sparse: true // Allow null for subscription usages
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    index: true,
    sparse: true // Allow null for order usages
  },
  // Type of usage: 'order' or 'subscription'
  usageType: {
    type: String,
    enum: ['order', 'subscription'],
    required: true,
    index: true
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0
  },
  usedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Additional metadata
  orderTotal: {
    type: Number,
    required: true
  },
  couponCode: {
    type: String,
    required: true,
    uppercase: true
  },
  // Reference to the original order or subscription number
  referenceNumber: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one usage per user per coupon per order/subscription
couponUsageSchema.index(
  { couponId: 1, userId: 1, orderId: 1, subscriptionId: 1 },
  { unique: true, partialFilterExpression: { orderId: { $exists: true } } }
);

// Index for subscription-specific lookups
couponUsageSchema.index({ subscriptionId: 1, couponId: 1 });

// Add a pre-save hook to handle duplicate key errors gracefully
couponUsageSchema.pre('save', function(next) {
  // This will be caught by the unique index, but we can add custom handling here if needed
  next();
});

// Index for efficient queries
couponUsageSchema.index({ userId: 1, usedAt: -1 });
couponUsageSchema.index({ couponId: 1, usedAt: -1 });

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
