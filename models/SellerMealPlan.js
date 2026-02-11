const mongoose = require('mongoose');

const sellerMealPlanSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tier: {
    type: String,
    required: true,
    // Remove enum restriction to support dynamic tiers
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'Tier must be a non-empty string'
    }
  },
  // Shift-based meal management
  shiftMeals: {
    morning: {
      items: [{
        name: { 
          type: String, 
          required: true 
        },
        description: { 
          type: String,
          default: ''
        },
        quantity: { 
          type: String,
          default: '1 serving'
        }
      }],
      mealType: { 
        type: String, 
        enum: ['lunch', 'dinner', 'both'],
        default: 'lunch'
      },
      isAvailable: { 
        type: Boolean, 
        default: true 
      },
      lastUpdated: { 
        type: Date, 
        default: Date.now 
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who updated
      }
    },
    evening: {
      items: [{
        name: { 
          type: String, 
          required: true 
        },
        description: { 
          type: String,
          default: ''
        },
        quantity: { 
          type: String,
          default: '1 serving'
        }
      }],
      mealType: { 
        type: String, 
        enum: ['lunch', 'dinner', 'both'],
        default: 'dinner'
      },
      isAvailable: { 
        type: Boolean, 
        default: true 
      },
      lastUpdated: { 
        type: Date, 
        default: Date.now 
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who updated
      }
    }
  },
  
  // Backward compatibility - keep todayMeal for existing functionality
  todayMeal: {
    items: [{
      name: { 
        type: String, 
        required: true 
      },
      description: { 
        type: String,
        default: ''
      },
      quantity: { 
        type: String,
        default: '1 serving'
      }
    }],
    mealType: { 
      type: String, 
      enum: ['lunch', 'dinner', 'both'],
      default: 'lunch'
    },
    isAvailable: { 
      type: Boolean, 
      default: true 
    },
    lastUpdated: { 
      type: Date, 
      default: Date.now 
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin who updated
    }
  },
  // Template meals for quick loading - organized by shift and meal type
  mealTemplates: {
    morning: {
      lunch: [{
        name: String,
        description: String,
        quantity: String
      }],
      dinner: [{
        name: String,
        description: String,
        quantity: String
      }],
      both: [{
        name: String,
        description: String,
        quantity: String
      }]
    },
    evening: {
      lunch: [{
        name: String,
        description: String,
        quantity: String
      }],
      dinner: [{
        name: String,
        description: String,
        quantity: String
      }],
      both: [{
        name: String,
        description: String,
        quantity: String
      }]
    }
  },
  // Analytics and tracking
  stats: {
    totalSubscriptions: { type: Number, default: 0 },
    activeSubscriptions: { type: Number, default: 0 },
    lastMealUpdate: { type: Date, default: Date.now },
    mealUpdateCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Create compound index for efficient querying
sellerMealPlanSchema.index({ sellerId: 1, tier: 1 }, { unique: true });

// Static method to get or create seller meal plan
sellerMealPlanSchema.statics.getOrCreateSellerMealPlan = async function(sellerId, tier) {
  let sellerMealPlan = await this.findOne({ sellerId, tier });
  
  if (!sellerMealPlan) {
    // Create default meal plan for this seller-tier combination
    const defaultMeals = {
      low: {
        lunch: [
          { name: 'Dal Rice', description: 'Simple dal with steamed rice', quantity: '1 plate' },
          { name: 'Pickle', description: 'Homemade pickle', quantity: '1 serving' }
        ]
      },
      basic: {
        lunch: [
          { name: 'Dal Rice', description: 'Lentil curry with rice', quantity: '1 plate' },
          { name: 'Vegetable Curry', description: 'Seasonal vegetable curry', quantity: '1 bowl' },
          { name: 'Roti', description: 'Fresh wheat bread', quantity: '2 pieces' },
          { name: 'Pickle', description: 'Homemade pickle', quantity: '1 serving' }
        ]
      },
      premium: {
        lunch: [
          { name: 'Dal Rice', description: 'Premium lentil curry with basmati rice', quantity: '1 plate' },
          { name: 'Paneer Curry', description: 'Rich paneer curry', quantity: '1 bowl' },
          { name: 'Roti', description: 'Fresh wheat bread', quantity: '3 pieces' },
          { name: 'Salad', description: 'Fresh mixed salad', quantity: '1 bowl' },
          { name: 'Sweet', description: 'Traditional Indian sweet', quantity: '1 piece' },
          { name: 'Pickle', description: 'Homemade pickle', quantity: '1 serving' }
        ]
      }
    };

    sellerMealPlan = new this({
      sellerId,
      tier,
      // Initialize shift-based meals
      shiftMeals: {
        morning: {
          items: defaultMeals[tier]?.lunch || [],
          mealType: 'lunch',
          isAvailable: true
        },
        evening: {
          items: defaultMeals[tier]?.lunch || [],
          mealType: 'dinner',
          isAvailable: true
        }
      },
      // Backward compatibility
      todayMeal: {
        items: defaultMeals[tier]?.lunch || [],
        mealType: 'lunch',
        isAvailable: true
      },
      // Updated template structure for shifts
      mealTemplates: {
        morning: {
          lunch: defaultMeals[tier]?.lunch || [],
          dinner: defaultMeals[tier]?.lunch || [],
          both: defaultMeals[tier]?.lunch || []
        },
        evening: {
          lunch: defaultMeals[tier]?.lunch || [],
          dinner: defaultMeals[tier]?.lunch || [],
          both: defaultMeals[tier]?.lunch || []
        }
      }
    });

    await sellerMealPlan.save();
  }

  return sellerMealPlan;
};

// Instance method to update today's meal
sellerMealPlanSchema.methods.updateTodayMeal = async function(mealData, adminId) {
  this.todayMeal = {
    ...this.todayMeal.toObject(),
    ...mealData,
    lastUpdated: new Date(),
    updatedBy: adminId
  };
  
  this.stats.lastMealUpdate = new Date();
  this.stats.mealUpdateCount += 1;
  
  await this.save();
  
  // Update all subscriptions of this seller-tier combination
  const Subscription = mongoose.model('Subscription');
  const MealPlan = mongoose.model('MealPlan');
  
  // Find all meal plans of this tier for this seller
  const mealPlans = await MealPlan.find({ 
    seller: this.sellerId, 
    tier: this.tier 
  });
  
  const mealPlanIds = mealPlans.map(plan => plan._id);
  
  // Update all active subscriptions
  await Subscription.updateMany(
    {
      sellerId: this.sellerId,
      mealPlan: { $in: mealPlanIds },
      status: 'active'
    },
    {
      $set: {
        'todayMeal.items': this.todayMeal.items,
        'todayMeal.mealType': this.todayMeal.mealType,
        'todayMeal.isAvailable': this.todayMeal.isAvailable,
        'todayMeal.lastUpdated': this.todayMeal.lastUpdated
      }
    }
  );
  
  return this;
};

// Instance method to update shift-based meal
sellerMealPlanSchema.methods.updateShiftMeal = async function(shift, mealData, adminId) {
  if (!['morning', 'evening'].includes(shift)) {
    throw new Error('Invalid shift. Must be morning or evening');
  }

  this.shiftMeals[shift] = {
    ...this.shiftMeals[shift].toObject(),
    ...mealData,
    lastUpdated: new Date(),
    updatedBy: adminId
  };
  
  this.stats.lastMealUpdate = new Date();
  this.stats.mealUpdateCount += 1;
  
  await this.save();
  
  // Update all subscriptions of this seller-tier-shift combination
  const Subscription = mongoose.model('Subscription');
  const MealPlan = mongoose.model('MealPlan');
  
  // Find all meal plans of this tier for this seller
  const mealPlans = await MealPlan.find({ 
    seller: this.sellerId, 
    tier: this.tier 
  });
  
  const mealPlanIds = mealPlans.map(plan => plan._id);
  
  // Update all active subscriptions with matching shift
  await Subscription.updateMany(
    {
      sellerId: this.sellerId,
      mealPlan: { $in: mealPlanIds },
      status: 'active',
      startShift: shift // Match the shift
    },
    {
      $set: {
        'todayMeal.items': this.shiftMeals[shift].items,
        'todayMeal.mealType': this.shiftMeals[shift].mealType,
        'todayMeal.isAvailable': this.shiftMeals[shift].isAvailable,
        'todayMeal.lastUpdated': this.shiftMeals[shift].lastUpdated
      }
    }
  );
  
  return this;
};

// Static method to update subscription counts
sellerMealPlanSchema.statics.updateSubscriptionCounts = async function(sellerId, tier) {
  const Subscription = mongoose.model('Subscription');
  const MealPlan = mongoose.model('MealPlan');
  
  const mealPlans = await MealPlan.find({ seller: sellerId, tier });
  const mealPlanIds = mealPlans.map(plan => plan._id);
  
  const totalSubscriptions = await Subscription.countDocuments({
    sellerId,
    mealPlan: { $in: mealPlanIds }
  });
  
  const activeSubscriptions = await Subscription.countDocuments({
    sellerId,
    mealPlan: { $in: mealPlanIds },
    status: 'active'
  });
  
  await this.findOneAndUpdate(
    { sellerId, tier },
    {
      $set: {
        'stats.totalSubscriptions': totalSubscriptions,
        'stats.activeSubscriptions': activeSubscriptions
      }
    },
    { upsert: true }
  );
};

/**
 * Get available tiers for a seller based on their MealPlan configurations
 * @param {String} sellerId - The seller ID
 * @returns {Array} Array of available tiers
 */
sellerMealPlanSchema.statics.getAvailableTiers = async function(sellerId) {
  const MealPlan = mongoose.model('MealPlan');
  
  const mealPlans = await MealPlan.find({ seller: sellerId }).distinct('tier');
  return mealPlans.filter(tier => tier && tier.trim()); // Filter out empty/null tiers
};

/**
 * Get all meal plans for a seller grouped by tier
 * @param {String} sellerId - The seller ID
 * @returns {Object} Object with tiers as keys and meal plan arrays as values
 */
sellerMealPlanSchema.statics.getMealPlansByTier = async function(sellerId) {
  const MealPlan = mongoose.model('MealPlan');
  
  const mealPlans = await MealPlan.find({ seller: sellerId })
    .select('title tier pricing description imageUrls includes')
    .sort({ tier: 1, createdAt: -1 });
  
  const groupedPlans = {};
  mealPlans.forEach(plan => {
    if (!groupedPlans[plan.tier]) {
      groupedPlans[plan.tier] = [];
    }
    groupedPlans[plan.tier].push(plan);
  });
  
  return groupedPlans;
};

/**
 * Validate if a tier exists for a seller
 * @param {String} sellerId - The seller ID
 * @param {String} tier - The tier to validate
 * @returns {Boolean} True if tier exists for seller
 */
sellerMealPlanSchema.statics.validateTierForSeller = async function(sellerId, tier) {
  const MealPlan = mongoose.model('MealPlan');
  
  const count = await MealPlan.countDocuments({ seller: sellerId, tier });
  return count > 0;
};

module.exports = mongoose.model('SellerMealPlan', sellerMealPlanSchema);
