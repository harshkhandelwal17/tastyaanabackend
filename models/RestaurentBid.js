// models/RestaurantBid.js
const mongoose = require('mongoose');

const restaurantBidSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomMealRequest',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryTime: {
    type: String,
    required: true // e.g., "30 mins", "1 hour"
  },
  estimatedPreparationTime: {
    type: Number,
    required: true // in minutes
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  items: [{
    name: String,
    quantity: String,
    specialNote: String
  }],
  additionalCharges: {
    deliveryFee: {
      type: Number,
      default: 0
    },
    packagingFee: {
      type: Number,
      default: 0
    },
    taxes: {
      type: Number,
      default: 0
    }
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'expired'],
    default: 'pending'
  },
  validUntil: {
    type: Date,
    required: true
  },
  restaurantRating: {
    type: Number,
    min: 0,
    max: 5
  },
  previousOrders: {
    type: Number,
    default: 0
  },
  specialOffers: [{
    type: String,
    description: String
  }],
  paymentTerms: {
    type: String,
    enum: ['prepaid', 'cod', 'both'],
    default: 'both'
  },
  cancellationPolicy: String,
  images: [String], // Sample images of the dish
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  withdrawnAt: Date,
  withdrawalReason: String
}, {
  timestamps: true
});

// Auto-expire bids after validUntil
restaurantBidSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

// Calculate final amount including all charges
restaurantBidSchema.pre('save', function(next) {
  this.totalAmount = this.price + 
    (this.additionalCharges.deliveryFee || 0) + 
    (this.additionalCharges.packagingFee || 0) + 
    (this.additionalCharges.taxes || 0);
  next();
});

module.exports = mongoose.model('RestaurantBid', restaurantBidSchema);