const mongoose = require('mongoose');
const moment = require('moment-timezone');

const mealPlanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  tier: {
    type: String,
    enum: ['low', 'basic', 'premium'],
    required: true
  },
  pricing: [
    { days: Number, price: Number, name: String, totalthali: Number, mealperday: Number }
  ],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  includes: [{
    name: String,
    quantity: Number,
    unit: String
  }],
  nutritionalInfo: {
    calories: Number,
    protein: String,
    carbs: String,
    fat: String,
    fiber: String,
    sodium: String
  },
  imageUrls: [String],
  features: [String], // e.g., ["Homestyle", "Fresh Ingredients", "No Preservatives"]
  preparationTime: String,
  servingSize: String,
  isPopular: {
    type: Boolean,
    default: false
  },
  maxDailyOrders: {
    type: Number,
    default: 1000
  },
  availableDays: {
    type: [String],
    default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'coming-soon'],
    default: 'active'
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [String], // e.g., ["comfort-food", "healthy", "traditional"]

  // ===== Timing & Availability =====
  timingConfig: {
    morning: {
      available: { type: Boolean, default: true },
      orderCutoff: { type: String, default: '10:00' }, // 10 AM cutoff
      deliveryWindow: {
        start: { type: String, default: '07:00' },
        end: { type: String, default: '09:30' }
      },
      maxOrders: { type: Number, default: 100 }
    },
    evening: {
      available: { type: Boolean, default: true },
      orderCutoff: { type: String, default: '21:00' }, // 9 PM cutoff
      deliveryWindow: {
        start: { type: String, default: '19:00' },
        end: { type: String, default: '21:30' }
      },
      maxOrders: { type: Number, default: 100 }
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      enum: ['Asia/Kolkata', 'UTC']
    },
    allowSameDayOrders: { type: Boolean, default: true },
    minLeadTimeHours: { type: Number, default: 2 } // Minimum hours before delivery time to place order
  },

  // ===== Packaging Options =====
  packagingOptions: [{
    name: { type: String, required: true }, // e.g., "Disposable", "Steel Tiffin"
    description: String,
    price: { type: Number, default: 0 },
    type: { type: String, enum: ['free', 'deposit', 'one-time'], default: 'free' },
    isRefundable: { type: Boolean, default: false },
    image: String
  }],

  // ===== Customization Settings =====
  customizationSettings: {
    // Basic Customization
    allowCustomization: { type: Boolean, default: true },
    allowMealReplacement: { type: Boolean, default: true },
    allowExtraItems: { type: Boolean, default: true },
    allowDietaryChanges: { type: Boolean, default: true },

    // Timing Constraints
    customizationDeadline: {
      type: String,
      default: '06:00',
      description: 'Time in 24-hour format (HH:MM) when customization closes'
    },
    maxCustomizationDaysInAdvance: {
      type: Number,
      default: 7,
      description: 'Maximum number of days in advance for customization'
    },

    // Limits
    maxExtraItems: {
      type: Number,
      default: 5,
      description: 'Maximum number of extra items allowed per meal'
    },
    maxReplacementsPerMonth: {
      type: Number,
      default: 56,
      description: 'Maximum number of meal replacements allowed per month'
    },

    // Allowed Customizations
    allowedCustomizations: [{
      type: String,
      enum: ['no-onions', 'less-spicy', 'no-garlic', 'extra-rice', 'extra-spicy', 'no-oil', 'no-curd', 'no-sweets']
    }],

    // Restrictions
    restrictedDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],

    // Replacement Settings
    replacementPolicy: {
      advanceNoticeHours: { type: Number, default: 4 },
      maxPerDay: { type: Number, default: 2 },
      allowPremiumUpgrade: { type: Boolean, default: true },
      requirePaymentForUpgrade: { type: Boolean, default: true }
    },

    // Skip Meal Settings
    skipMealPolicy: {
      maxPerMonth: { type: Number, default: 4 },
      advanceNoticeHours: { type: Number, default: 6 },
      allowSkipToNextDay: { type: Boolean, default: false },
      skipCreditValidityDays: { type: Number, default: 30 }
    }
  },
  allowedReplacements: {
    type: Boolean,
    default: true
  },

  associatedItem:{
    type:mongoose.Types.ObjectId
  },

  // Available meal shifts (morning, evening, or both)
  shifts: {
    type: [String],
    enum: ['morning', 'evening'],
    default: ['morning', 'evening'], // Default to both shifts
    required: true
  },

  replacements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ReplaceableItem' }],
  addons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }],
  extraitems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExtraItem' }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// ===== Methods =====

// Check if ordering is allowed for a specific shift and time
mealPlanSchema.methods.isOrderAllowed = function (shift, orderTime) {
  const now = orderTime ? moment.tz(orderTime, this.timingConfig.timezone) : moment().tz(this.timingConfig.timezone);
  const timing = this.timingConfig[shift];

  if (!timing || !timing.available) {
    return { allowed: false, reason: `No ${shift} delivery available` };
  }

  // Parse cutoff time
  const [cutoffHours, cutoffMinutes] = timing.orderCutoff.split(':').map(Number);
  const cutoffTime = now.clone().hour(cutoffHours).minute(cutoffMinutes).second(0);

  if (now.isAfter(cutoffTime)) {
    return {
      allowed: false,
      reason: `Order time for ${shift} meal has passed (cutoff: ${timing.orderCutoff})`
    };
  }

  // Check if same-day orders are allowed
  if (!this.timingConfig.allowSameDayOrders) {
    const nextAvailableDay = now.clone().add(1, 'day');
    if (now.isSame(nextAvailableDay, 'day')) {
      return {
        allowed: false,
        reason: 'Same-day orders are not allowed'
      };
    }
  }

  // Check minimum lead time
  const minLeadTime = this.timingConfig.minLeadTimeHours || 2;
  const earliestOrderTime = moment().tz(this.timingConfig.timezone).add(minLeadTime, 'hours');

  if (now.isBefore(earliestOrderTime)) {
    return {
      allowed: false,
      reason: `Please order at least ${minLeadTime} hours in advance`
    };
  }

  return { allowed: true };
};

// Check if customization is allowed for a specific date and shift
mealPlanSchema.methods.isCustomizationAllowed = function (date, shift) {
  const now = moment().tz(this.timingConfig.timezone);
  const mealDate = moment.tz(date, this.timingConfig.timezone);

  // Check if customization is enabled
  if (!this.customizationSettings.allowCustomization) {
    return { allowed: false, reason: 'Customization is not allowed for this meal plan' };
  }

  // Check if the date is in the future
  if (mealDate.isBefore(now, 'day')) {
    return { allowed: false, reason: 'Cannot customize past meals' };
  }

  // Check max days in advance
  const maxDaysInAdvance = this.customizationSettings.maxCustomizationDaysInAdvance || 7;
  const maxCustomizationDate = now.clone().add(maxDaysInAdvance, 'days');

  if (mealDate.isAfter(maxCustomizationDate, 'day')) {
    return {
      allowed: false,
      reason: `Customization is only allowed up to ${maxDaysInAdvance} days in advance`
    };
  }

  // Check cutoff time
  const timing = this.timingConfig[shift];
  if (timing) {
    const [cutoffHours, cutoffMinutes] = timing.orderCutoff.split(':').map(Number);
    const cutoffTime = now.clone()
      .hour(cutoffHours)
      .minute(cutoffMinutes)
      .second(0);

    if (now.isAfter(cutoffTime)) {
      return {
        allowed: false,
        reason: `Customization deadline for ${shift} meal has passed (${timing.orderCutoff})`
      };
    }
  }

  // Check restricted days
  const dayOfWeek = mealDate.format('dddd').toLowerCase();
  if (this.customizationSettings.restrictedDays?.includes(dayOfWeek)) {
    return {
      allowed: false,
      reason: `Customization is not allowed on ${dayOfWeek}s`
    };
  }

  return { allowed: true };
};

// Virtual for getting the total number of meals
mealPlanSchema.virtual('totalMeals').get(function () {
  return this.meals?.length || 0;
});

// Virtual for addons (references external AddOn collection)
mealPlanSchema.virtual('addOns', {
  ref: 'AddOn',
  localField: '_id',
  foreignField: 'mealPlan'
});

// Virtual for extra items (references external ExtraItem collection)
mealPlanSchema.virtual('extraItems', {
  ref: 'ExtraItem',
  localField: '_id',
  foreignField: 'mealPlan'
});

// Populate virtuals by default
mealPlanSchema.set('toObject', { virtuals: true });
mealPlanSchema.set('toJSON', { virtuals: true });

// Calculate discount percentages and ensure default settings
mealPlanSchema.pre('save', function (next) {
  // Calculate discount percentages
  if (this.pricing.oneDay && this.pricing.tenDays && this.pricing.thirtyDays) {
    this.pricing.discountPercentage = {
      tenDays: Math.round(((this.pricing.oneDay * 10 - this.pricing.tenDays) / (this.pricing.oneDay * 10)) * 100),
      thirtyDays: Math.round(((this.pricing.oneDay * 30 - this.pricing.thirtyDays) / (this.pricing.oneDay * 30)) * 100)
    };
  }

  // Ensure default timing config is present
  if (!this.timingConfig) {
    this.timingConfig = {};
  }

  // Set default timing configuration
  const defaultTimingConfig = {
    morning: {
      available: true,
      orderCutoff: '10:00',
      deliveryWindow: { start: '07:00', end: '09:30' },
      maxOrders: 100
    },
    evening: {
      available: true,
      orderCutoff: '21:00',
      deliveryWindow: { start: '19:00', end: '21:30' },
      maxOrders: 100
    },
    timezone: 'Asia/Kolkata',
    allowSameDayOrders: true,
    minLeadTimeHours: 2
  };

  // Merge with existing timing config
  this.timingConfig = {
    ...defaultTimingConfig,
    ...this.timingConfig,
    morning: { ...defaultTimingConfig.morning, ...(this.timingConfig.morning || {}) },
    evening: { ...defaultTimingConfig.evening, ...(this.timingConfig.evening || {}) }
  };

  // Ensure default customization settings are present
  if (!this.customizationSettings) {
    this.customizationSettings = {};
  }

  // Set default values for customization settings
  const defaultCustomizationSettings = {
    // Basic Customization
    allowCustomization: true,
    allowMealReplacement: true,
    allowExtraItems: true,
    allowDietaryChanges: true,

    // Timing Constraints
    customizationDeadline: '06:00',
    maxCustomizationDaysInAdvance: 7,

    // Limits
    maxExtraItems: 5,
    maxReplacementsPerMonth: 4,

    // Allowed Customizations
    allowedCustomizations: ['no-onions', 'less-spicy', 'no-garlic', 'extra-rice'],

    // Restrictions
    restrictedDays: [],

    // Replacement Settings
    replacementPolicy: {
      advanceNoticeHours: 4,
      maxPerDay: 1,
      allowPremiumUpgrade: true,
      requirePaymentForUpgrade: true
    },

    // Skip Meal Settings
    skipMealPolicy: {
      maxPerMonth: 4,
      advanceNoticeHours: 6,
      allowSkipToNextDay: false,
      skipCreditValidityDays: 30
    }
  };

  // Deep merge with existing settings
  this.customizationSettings = {
    ...defaultCustomizationSettings,
    ...this.customizationSettings,
    replacementPolicy: {
      ...defaultCustomizationSettings.replacementPolicy,
      ...(this.customizationSettings.replacementPolicy || {})
    },
    skipMealPolicy: {
      ...defaultCustomizationSettings.skipMealPolicy,
      ...(this.customizationSettings.skipMealPolicy || {})
    }
  };

  next();
});

module.exports = mongoose.model('MealPlan', mealPlanSchema);
