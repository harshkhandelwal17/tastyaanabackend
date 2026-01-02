const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const mealCustomizationSchema = new mongoose.Schema({
  // Core fields - using MongoDB ObjectId instead of custom string
  customizationId: {
    type: String,
    default: () => `CUST_${uuidv4().slice(0, 8).toUpperCase()}`,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  
  // Customization type
  type: {
    type: String,
    enum: ['permanent', 'temporary', 'one-time'],
    required: true
  },
  
  // For one-time customizations
  date: Date,
  shift: {
    type: String,
    enum: ['morning', 'evening']
  },
  
  // For temporary customizations (multiple dates)
  dates: [{
    date: Date,
    shift: {
      type: String,
      enum: ['morning', 'evening']
    }
  }],
  
  // Meal details
  baseMeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan',
    required: true
  },
  
  replacementMeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReplaceableItem'
  },
  
  // Customization details
  dietaryPreference: {
    type: String,
    enum: ['vegetarian', 'vegan', 'non-vegetarian', 'jain','regular'],
    default: 'vegetarian'
  },
  
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot', 'extra-hot'],
    default: 'medium'
  },
  
  preferences: {
    noOnion: { type: Boolean, default: false },
    noGarlic: { type: Boolean, default: false },
    noDairy: { type: Boolean, default: false },
    noNuts: { type: Boolean, default: false },
    specialInstructions: String
  },
  
  // Add-ons and extra items
  addons: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AddOn'
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  
  extraItems: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExtraItem'
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  
  // Pricing
  basePrice: {
    type: Number,
    required: true
  },
  
  addonPrice: {
    type: Number,
    default: 0
  },
  
  extraItemPrice: {
    type: Number,
    default: 0
  },
  replacementPrice: {
    type: Number,
    default:0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  totalpayablePrice: {
    type: Number,
    required: true,
    default:0
  },

  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  
  razorpayOrderId: String,
  razorpayPaymentId: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
    default: 'confirmed'
  },
  
  // Timestamps
  startsAt: Date,
  endsAt: Date,
  
  // Metadata
  notes: String,
  reasonForRejection: String,
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
mealCustomizationSchema.index({ user: 1, status: 1 });
mealCustomizationSchema.index({ subscription: 1, status: 1 });
mealCustomizationSchema.index({ date: 1, shift: 1 });
mealCustomizationSchema.index({ 'dates.date': 1, 'dates.shift': 1 });

// Virtuals
mealCustomizationSchema.virtual('isPermanent').get(function() {
  return this.type === 'permanent';
});

mealCustomizationSchema.virtual('isTemporary').get(function() {
  return this.type === 'temporary';
});

mealCustomizationSchema.virtual('isOneTime').get(function() {
  return this.type === 'one-time';
});

// Methods
mealCustomizationSchema.methods.getMealDetails = function() {
  return {
    mealPlan: this.replacementMeal || this.baseMeal,
    isCustomized: !!this.replacementMeal,
    customizations: {
      dietaryPreference: this.dietaryPreference,
      spiceLevel: this.spiceLevel,
      preferences: this.preferences,
      addons: this.addons,
      extraItems: this.extraItems
    },
    pricing: {
      basePrice: this.basePrice,
      addonPrice: this.addonPrice,
      extraItemPrice: this.extraItemPrice,
      totalPrice: this.totalPrice
    }
  };
};

// Static methods
mealCustomizationSchema.statics.findBySubscription = function(subscriptionId, options = {}) {
  const query = {
    subscription: subscriptionId,
    isActive: true
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.date) {
    query.$or = [
      { date: options.date },
      { 'dates.date': options.date },
      { 
        type: 'permanent',
        $or: [
          { startsAt: { $lte: options.date } },
          { startsAt: { $exists: false } }
        ],
        $or: [
          { endsAt: { $gte: options.date } },
          { endsAt: { $exists: false } }
        ]
      }
    ];
  }
  
  if (options.shift) {
    if (!query.$or) query.$or = [];
    query.$or.push(
      { shift: options.shift },
      { 'dates.shift': options.shift }
    );
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

const MealCustomization = mongoose.model('MealCustomization', mealCustomizationSchema);

module.exports = MealCustomization;
