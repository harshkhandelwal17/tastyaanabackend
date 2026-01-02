// models/CustomMealRequest.js
const mongoose = require('mongoose');

const customMealRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dishName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  category: {
    type: String,
    enum: ['north-indian', 'south-indian', 'chinese', 'continental', 'street-food', 'dessert', 'beverage', 'other'],
    required: true
  },
  budget: {
    min: Number,
    max: Number,
    preferred: Number
  },
  dietaryRestrictions: [{
    type: String,
    enum: ['vegetarian', 'non-vegetarian', 'vegan', 'jain', 'gluten-free', 'no-onion', 'no-garlic']
  }],
  spiceLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  deliverySlot: {
    type: String,
    enum: ['lunch', 'dinner', 'anytime'],
    required: true
  },
  specificRestaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  broadcastRadius: {
    type: Number,
    default: 5, // in kilometers
    max: 25
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    instructions: String
  },
  autoAcceptLowerBid: {
    type: Boolean,
    default: false
  },
  bidDeadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'bidding', 'accepted', 'preparing', 'delivered', 'cancelled', 'expired'],
    default: 'open'
  },
  totalBids: {
    type: Number,
    default: 0
  },
  acceptedBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantBid'
  },
  finalOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  images: [String], // Reference images uploaded by user
  specialInstructions: String,
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Check if request is expired
customMealRequestSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Auto-expire requests after bidDeadline
customMealRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('CustomMealRequest', customMealRequestSchema);

