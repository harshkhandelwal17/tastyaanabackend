// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // === Core References ===
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  mealPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan'
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // === Review Type ===
  type: {
    type: String,
    enum: ['meal-plan', 'custom-order', 'delivery', 'tiffin-service', 'product'],
    required: true
  },

  // === Simple Rating (for backward compatibility) ===
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },

  // === Detailed Ratings ===
  ratings: {
    // Food-Specific Ratings (For Meal Plans/Tiffins)
    food: {
      taste: { type: Number, min: 1, max: 5 },
      quality: { type: Number, min: 1, max: 5 },
      quantity: { type: Number, min: 1, max: 5 },
      presentation: { type: Number, min: 1, max: 5 },
      freshness: { type: Number, min: 1, max: 5 }
    },
    // Delivery-Specific Ratings
    delivery: {
      timeliness: { type: Number, min: 1, max: 5 },
      packaging: { type: Number, min: 1, max: 5 },
      temperature: { type: Number, min: 1, max: 5 },
      friendliness: { type: Number, min: 1, max: 5 }
    },
    // Overall Rating
    overall: {
      type: Number,
      min: 1,
      max: 5
    }
  },

  // === Review Content ===
  title: {
    type: String,
    maxlength: 100
  },
  comment: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  images: [String], // Food/delivery photos
  pros: [String],   // e.g., ["Fresh ingredients", "Quick delivery"]
  cons: [String],   // e.g., ["Too spicy", "Late by 10 mins"]
  tags: [String],   // e.g., ["spicy", "homely", "healthy"]

  // === Metadata ===
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  reportedCount: {
    type: Number,
    default: 0
  },

  // === Moderation ===
  visibility: {
    type: String,
    enum: ['public', 'private', 'hidden'],
    default: 'public'
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  adminResponse: {
    message: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date
  },
  editHistory: [{
    editedAt: Date,
    reason: String,
    oldComment: String
  }]
}, {
  timestamps: true
});

// === Virtuals ===
// Calculate average rating (weighted for GKK)
reviewSchema.virtual('averageRating').get(function() {
  // If we have detailed ratings, use them
  if (this.ratings && this.ratings.food && this.ratings.delivery) {
    const food = this.ratings.food;
    const delivery = this.ratings.delivery;
    
    let total = 0, count = 0;
    
    // Food ratings (60% weight)
    if (food.taste) { total += food.taste * 0.6; count += 0.6; }
    if (food.quality) { total += food.quality * 0.6; count += 0.6; }
    if (food.freshness) { total += food.freshness * 0.6; count += 0.6; }

    // Delivery ratings (40% weight)
    if (delivery.timeliness) { total += delivery.timeliness * 0.4; count += 0.4; }
    if (delivery.temperature) { total += delivery.temperature * 0.4; count += 0.4; }

    return count > 0 ? parseFloat((total / count).toFixed(1)) : this.rating;
  }
  
  // Fallback to simple rating
  return this.rating || 0;
});

// Pre-save middleware to ensure rating is set
reviewSchema.pre('save', function(next) {
  if (!this.rating && this.ratings && this.ratings.overall) {
    this.rating = this.ratings.overall;
  }
  next();
});

module.exports = mongoose.model('Review', reviewSchema);