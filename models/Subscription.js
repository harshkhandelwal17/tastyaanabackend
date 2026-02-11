const { object } = require('joi');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

/**
 * SUBSCRIPTION EXPIRY POLICY - MEAL COUNT ONLY
 * ============================================
 * 
 * IMPORTANT: Subscriptions expire ONLY when mealsRemaining reaches 0 or less.
 * NO date-based expiry logic is used anymore.
 * 
 * Expiry Formula: mealsRemaining = totalMeals - mealsDelivered - mealsSkipped
 * 
 * When mealsRemaining <= 0:
 *   - subscription.status = 'expired'
 *   - subscription.isActive = false
 * 
 * This ensures customers get exactly what they paid for - no meals lost due to dates.
 */

const subscriptionSchema = new mongoose.Schema({
  // ===== Core Identification =====
  subscriptionId: {
    type: String,
    default: () => `SUB_${Date.now()}_${uuidv4().replace(/-/g, '').substr(0, 12).toUpperCase()}`,
    unique: true
  },
  startShift: {
    type: String,
    enum: ['morning', 'evening'],
    required: true,
    default: 'morning'
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mealPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan',
    required: true
  },

  // ===== Today's Meal Information =====
  todayMeal: {
    items: [{
      name: { type: String },
      description: { type: String },
      quantity: { type: String }
    }],
    mealType: {
      type: String,
      enum: ['lunch', 'dinner', 'both'],
      default: 'lunch'
    },
    date: { type: Date, default: Date.now },
    isAvailable: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
    // Seller-specific meal information
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tier: {
      type: String,
      default: 'basic',
      validate: {
        validator: function (v) {
          return v && v.trim().length > 0;
        },
        message: 'Tier must be a non-empty string'
      }
    },
    shift: {
      type: String,
      enum: ['morning', 'evening'],
      default: 'morning'
    }
  },

  // ===== Meal Delivery Settings =====
  deliverySettings: {
    startDate: {
      type: Date,
      // required: true
    },
    startShift: {
      type: String,
      enum: ['morning', 'evening'],
      // required: true,
      default: 'morning'
    },

    // Enhanced delivery days with individual addresses and shifts
    deliveryDays: [{
      day: {
        type: String,
        enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        required: true
      },
      isActive: { type: Boolean, default: true },

      // Morning shift configuration for this day
      morningShift: {
        enabled: { type: Boolean, default: false },
        deliveryTime: { type: String, default: '08:00' }, // Preferred delivery time
        address: {
          type: {
            type: String,
            enum: ['home', 'office', 'custom'],
            default: 'home'
          },
          street: String,
          area: String,
          city: String,
          state: String,
          pincode: String,
          landmark: String,
          coordinates: {
            lat: Number,
            lng: Number
          },
          contactPerson: {
            name: String,
            phone: String
          },
          instructions: String, // Special delivery instructions
          floor: String,
          building: String
        }
      },

      // Evening shift configuration for this day  
      eveningShift: {
        enabled: { type: Boolean, default: false },
        deliveryTime: { type: String, default: '19:00' },
        address: {
          type: {
            type: String,
            enum: ['home', 'office', 'custom'],
            default: 'home'
          },
          street: String,
          area: String,
          city: String,
          state: String,
          pincode: String,
          landmark: String,
          coordinates: {
            lat: Number,
            lng: Number
          },
          contactPerson: {
            name: String,
            phone: String
          },
          instructions: String,
          floor: String,
          building: String
        }
      }
    }],

    // Default addresses that can be reused
    savedAddresses: {
      home: {
        name: { type: String, default: 'Home' },
        street: String,
        area: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String,
        coordinates: { lat: Number, lng: Number },
        contactPerson: {
          name: String,
          phone: String
        },
        instructions: String,
        floor: String,
        building: String,
        isDefault: { type: Boolean, default: true }
      },
      office: {
        name: { type: String, default: 'Office' },
        street: String,
        area: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String,
        coordinates: { lat: Number, lng: Number },
        contactPerson: {
          name: String,
          phone: String
        },
        instructions: String,
        floor: String,
        building: String,
        isDefault: { type: Boolean, default: false }
      }
    },

    // Address preference settings
    addressSettings: {
      useDefaultForAll: { type: Boolean, default: true }, // Use same address for all deliveries
      allowDifferentAddresses: { type: Boolean, default: false }, // Enable day-wise addresses
      defaultAddressType: {
        type: String,
        enum: ['home', 'office'],
        default: 'home'
      }
    },

    // NEW: Advanced Delivery Rules
    deliveryPreferences: {
      mode: { type: String, enum: ['single', 'split'], default: 'single' },
      primaryAddress: { type: Object },
      secondaryAddress: { type: Object },
      routingRules: {
        lunchDestination: { type: String, enum: ['primary', 'secondary'], default: 'primary' },
        dinnerDestination: { type: String, enum: ['primary', 'secondary'], default: 'primary' },
        weekendOverride: { type: Boolean, default: true }
      }
    },

    // Automatically calculated dates
    firstDeliveryDate: Date,
    lastDeliveryDate: Date
  },

  // ===== Meal Counts =====
  mealCounts: {
    totalMeals: { type: Number, default: 56 }, // 56 thalis total (8 weeks * 7 days)
    mealsDelivered: { type: Number, default: 0 },
    mealsSkipped: { type: Number, default: 0 },
    mealsRemaining: {
      type: Number,
      default: function () {
        return this.mealCounts?.totalMeals || 0;
      }
    },
    // Track Sunday vs regular meals
    regularMealsDelivered: { type: Number, default: 0 },
    sundayMealsDelivered: { type: Number, default: 0 }
  },
  planType: {
    type: String,
    // enum: ['oneDay', 'tenDays', 'monthly','thirtyDays','tendays','thirtydays','one'],
    required: true
  },

  // ===== Subscription Details =====
  duration: {
    type: Number, // in days
    required: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening', 'both'],
    required: true
  },
  thaliCount: {
    type: Number,
    required: true,
    default: 1
  },
  thalisDelivered: {
    type: Number,
    default: 0
  },
  remainingMeals: {
    type: Number,
    default: function () {
      return this.mealCounts?.totalMeals || 0;
    }
  },
  // Track subscription validity
  isActive: {
    type: Boolean,
    default: true
  },
  // Track last order date for delivery validation
  lastOrderDate: Date,

  // ===== Meal Timing Configuration =====
  deliveryTiming: {
    morning: {
      enabled: { type: Boolean, default: false },
      time: { type: String, default: '08:00' }
    },
    evening: {
      enabled: { type: Boolean, default: false },
      time: { type: String, default: '19:00' }
    }
  },

  // ===== Pricing & Payment =====
  pricing: {
    basePricePerMeal: { type: Number, default: 0 },
    totalDays: { type: Number, default: 30 },
    mealsPerDay: { type: Number, default: 1, min: 1, max: 2 },
    totalMeals: { type: Number, default: 0 },
    totalThali: { type: Number, default: 0 }, // Total tiffins accounting for Sundays
    totalAmount: { type: Number, default: 0 },
    planPrice: { type: Number, default: 0 },
    // Add-ons pricing
    addOnsPrice: { type: Number, default: 0 },
    customizationPrice: { type: Number, default: 0 },
    sellerBasePrice: { type: Number, default: 0 },
    // Coupon information
    couponCode: { type: String, default: null },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    discount: { type: Number, default: 0 },
    // Final calculation
    finalAmount: { type: Number, default: 0 }
  },

  // ===== Subscription Configuration =====
  packaging: {
    name: String,
    price: Number,
    type: { type: String, enum: ['free', 'deposit', 'one-time'], default: 'free' },
    isRefundable: { type: Boolean, default: false }
  },

  selectedAddOns: [{
    type: Object,
  }],

  // Default meal settings
  defaultMeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan',
    required: true
  },

  // Customization tracking
  customizationHistory: [{
    customizationId: {
      type: String,
      required: true
    },
    date: { type: Date, required: true },
    shift: {
      type: String,
      enum: ['morning', 'evening'],
      required: true
    },
    type: {
      type: String,
      enum: ['permanent', 'temporary', 'one-time'],
      required: true
    },
    appliedAt: { type: Date, default: Date.now }
  }],

  // Permanent customization settings
  permanentCustomization: {
    isActive: { type: Boolean, default: false },
    mealPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan' },
    addons: [{
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' },
      quantity: { type: Number, default: 1 }
    }],
    extraItems: [{
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'ExtraItem' },
      quantity: { type: Number, default: 1 }
    }],
    specialInstructions: String,
    appliedAt: Date
  },

  // Individual meal customizations (ObjectIds to MealCustomization documents)
  customizations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealCustomization'
  }],

  // Customization preferences (for storing user preferences)
  customizationPreferences: [{
    dietaryPreference: {
      type: String,
      enum: ['vegetarian', 'vegan', 'non-vegetarian', 'jain'],
      default: 'vegetarian'
    },
    customOptions: [String],
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'hot', 'extra-hot'],
      default: 'medium'
    },
    specialInstructions: String,
    noOnion: { type: Boolean, default: false },
    noGarlic: { type: Boolean, default: false }
  }],

  dietaryPreference: {
    type: String,
    // enum: ['vegetarian', 'vegan', 'non-vegetarian', 'jain'],
    default: 'vegetarian'
  },

  // Default meal preferences for customization
  defaultMealPreferences: {
    morning: {
      spiceLevel: { type: String, enum: ['mild', 'medium', 'hot', 'extra-hot'], default: 'medium' },
      dietaryPreference: { type: String, enum: ['vegetarian', 'vegan', 'non-vegetarian', 'jain'], default: 'vegetarian' },
      preferences: {
        noOnion: { type: Boolean, default: false },
        noGarlic: { type: Boolean, default: false },
        specialInstructions: String
      },
      customizations: [String],
      quantity: { type: Number, default: 1, min: 1 },
      timing: { type: String, enum: ['morning', 'evening', 'office', 'evening-thali'], default: 'morning' },
      isCustomized: { type: Boolean, default: false },
      lastUpdated: { type: Date, default: Date.now }
    },
    evening: {
      spiceLevel: { type: String, enum: ['mild', 'medium', 'hot', 'extra-hot'], default: 'medium' },
      dietaryPreference: { type: String, enum: ['vegetarian', 'vegan', 'non-vegetarian', 'jain'], default: 'vegetarian' },
      preferences: {
        noOnion: { type: Boolean, default: false },
        noGarlic: { type: Boolean, default: false },
        specialInstructions: String
      },
      customizations: [String],
      quantity: { type: Number, default: 1, min: 1 },
      timing: { type: String, enum: ['morning', 'evening', 'office', 'evening-thali'], default: 'evening' },
      isCustomized: { type: Boolean, default: false },
      lastUpdated: { type: Date, default: Date.now }
    }
  },

  // Track which days have customizations
  customizedDays: [{
    date: { type: Date, required: true },
    shifts: [{
      type: String,
      enum: ['morning', 'evening']
    }],
    customizationId: {
      type: String,
      required: true
    }
  }],

  // ===== Zone Configuration =====
  morningZone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryZone',
    // required: true,
    default: "6918da566b72021c1e70c5d9",

    index: true
  },
  eveningZone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryZone',
    // required: true,
    default: "6918da566b72021c1e70c5d9",
    index: true
  },

  // ===== Delivery Information =====
  deliveryTracking: {
    type: [{
      date: {
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
      status: {
        type: String,
        enum: ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'skipped', 'replaced'],
        default: 'pending',
        index: true
      },
      isActive: {
        type: Boolean,
        default: true
      },
      deliveredAt: {
        type: Date,
        index: true
      },
      // Enhanced driver tracking
      driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      deliveredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
      },
      // Delivery tracking enhancements
      deliveryNo: {
        type: String,
        unique: true,
        sparse: true // Only create index for non-null values
      },
      checkpoints: [{
        type: {
          type: String,
          enum: ['picked_up', 'in_transit', 'reached_area', 'delivered', 'route_sequenced'],
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        location: {
          lat: Number,
          lng: Number
        },
        notes: String
      }],
      ETA: {
        estimated: Date,
        actual: Date,
        updated: Date
      },
      notes: String,
      thaliCount: {
        type: Number,
        default: 1
      },
      // Route sequencing for drivers
      sequencePosition: {
        type: Number,
        index: true,
        min: 1
      },
      customizations: [{
        type: String
      }],
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: { lat: Number, lng: Number },
    instructions: String
  },

  // ===== Status Management =====
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired', 'pending_payment', 'pending'],
    default: 'pending'
  },

  // ===== Meal Skip & Replacement Settings =====
  skipSettings: {
    maxSkipsPerMonth: { type: Number, default: 8 }, // 4 days * 2 meals
    skipsUsedThisMonth: { type: Number, default: 0 },
    lastSkipReset: { type: Date, default: Date.now }
  },

  // Thali replacement settings
  thaliReplacement: {
    originalMealPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan' },
    replacementThali: { type: mongoose.Schema.Types.ObjectId },
    priceDifference: { type: Number, default: 0 },
    appliedAt: { type: Date },
    isDefault: { type: Boolean, default: false }
  },

  // Track individual thali replacements
  thaliReplacements: [{
    date: { type: Date, required: true },
    shift: {
      type: String,
      enum: ['morning', 'evening'],
      required: true
    }, // Add shift field to specify which shift the replacement is for
    originalMealPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan' },
    replacementThali: { type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan' },
    priceDifference: { type: Number, default: 0 },
    replacedAt: { type: Date, default: Date.now },
    isDefault: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'not_required'],
      default: function () {
        return this.priceDifference > 0 ? 'pending' : 'not_required';
      }
    },
    paymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
  }],

  // ===== Subscription Lifecycle =====
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
  },
  nextDeliveryDate: Date,

  // ===== Payment Tracking =====
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'completed'],
    default: 'pending'
  },

  razorpaySubscriptionId: String,
  razorpayPaymentId: String,

  // Wallet Integration
  walletTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WalletTransaction'
  },

  // ===== Daily Deduction Tracking =====
  dailyDeductions: [{
    date: { type: Date, required: true },
    mealType: { type: String, enum: ['morning', 'evening'], required: true },
    amount: { type: Number, required: true },
    addOnsAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'deducted', 'failed', 'skipped'],
      default: 'pending'
    },
    walletTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WalletTransaction'
    },
    createdAt: { type: Date, default: Date.now }
  }],

  // ===== Subscription Management =====
  pausedDates: [{
    startDate: Date,
    endDate: Date,
    reason: String
  }],

  // ===== Skipped Meals =====
  skippedMeals: [{
    date: { type: Date, required: true },
    shift: {
      type: String,
      enum: ['morning', 'evening'],
      required: true
    },
    isSunday: { type: Boolean, default: false },
    reason: {
      type: String,
      enum: ['user_skipped', 'vendor_holiday', 'delivery_issue', 'other'],
      required: true
    },
    description: String,
    creditIssued: { type: Boolean, default: false },
    creditAmount: { type: Number, default: 0 },
    rescheduledTo: Date, // If rescheduled to another date
    createdAt: { type: Date, default: Date.now },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // ===== Meal Customizations =====
  mealCustomizations: [{
    date: { type: Date, required: true },
    shift: {
      type: String,
      enum: ['morning', 'evening'],
      required: true
    },
    isSunday: { type: Boolean, default: false },
    basePrice: { type: Number, default: 75 }, // Base price per thali
    addons: [{
      name: { type: String, required: true },
      price: { type: Number, required: true },
      appliesToAll: { type: Boolean, default: true } // If true, applies to all 56 meals
    }],
    extraItems: [{
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true },
      totalPrice: { type: Number } // quantity * price
    }],
    specialInstructions: String,
    status: {
      type: String,
      enum: ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'skipped'],
      default: 'pending',
      index: true
    },
    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deliveredAt: {
      type: Date,
      index: true
    },
    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    notes: String,
    thaliCount: {
      type: Number,
      default: 1
    },
    customizations: [{
      type: String
    }],
    // For audit trail
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
  ,

  // ===== Auto-renewal =====
  autoRenewal: {
    enabled: { type: Boolean, default: false },
    renewalType: {
      type: String,
      enum: ['same_duration', 'monthly', 'weekly'],
      default: 'same_duration'
    }
  },


  // ===== Feedback & Notes =====
  notes: String,
  cancellationReason: String,
  cancelledAt: Date,

  // ===== Metadata =====
  metadata: {
    createdVia: { type: String, default: 'web' },
    deviceInfo: String,
    promoCode: String,
    discountApplied: { type: Number, default: 0 }
  }
},
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

// ===== Indexes =====
// Only keep essential indexes for now

// ===== Virtuals =====
subscriptionSchema.virtual('remainingDays').get(function () {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

subscriptionSchema.virtual('totalMealsRemaining').get(function () {
  return this.remainingDays * this.pricing.mealsPerDay;
});

subscriptionSchema.virtual('progressPercentage').get(function () {
  const totalDuration = this.endDate - this.startDate;
  const elapsed = Date.now() - this.startDate;
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
});

// ===== Methods =====

// Get the effective meal for a specific date and shift
subscriptionSchema.methods.getMealForDelivery = async function (date, shift) {
  // Check for specific customization for this date and shift
  const dayCustomization = this.customizedDays.find(
    cd => cd.date.toDateString() === date.toDateString() &&
      cd.shifts.includes(shift)
  );

  if (dayCustomization && dayCustomization.customizationId) {
    const customization = await this.model('MealCustomization').findById(dayCustomization.customizationId);
    if (customization) {
      return {
        isCustomized: true,
        mealPlan: customization.replacementMeal || this.defaultMeal,
        customization: customization
      };
    }
  }

  // Check for permanent customization
  if (this.permanentCustomization?.isActive) {
    return {
      isCustomized: true,
      mealPlan: this.permanentCustomization.mealPlan || this.defaultMeal,
      customization: this.permanentCustomization
    };
  }

  // Return default meal with preferences
  return {
    isCustomized: false,
    mealPlan: this.defaultMeal,
    preferences: this.defaultMealPreferences[shift] || {}
  };
};

// Add a new customization
subscriptionSchema.methods.addCustomization = async function (customizationData) {
  const MealCustomization = this.model('MealCustomization');

  let customization;

  // If customizationId is provided, this is an existing customization
  if (customizationData.customizationId) {
    // Find the existing customization
    customization = await MealCustomization.findOne({
      customizationId: customizationData.customizationId
    });

    if (!customization) {
      throw new Error('Customization not found');
    }
  } else {
    // Create a new customization
    customization = new MealCustomization({
      ...customizationData,
      subscription: this._id,
      user: this.user
    });

    await customization.save();
  }

  // If it's a permanent customization
  if (customization.isPermanent) {
    this.permanentCustomization = {
      isActive: true,
      mealPlan: customization.replacementMeal || this.defaultMeal,
      addons: customization.addons,
      extraItems: customization.extraItems,
      specialInstructions: customization.specialInstructions,
      appliedAt: new Date()
    };
  }
  // If it's for specific dates
  else if (customization.dates && customization.dates.length > 0) {
    for (const date of customization.dates) {
      // Simplified date parsing
      const dateObj = new Date(date.date);

      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date in dates array: ${date.date}`);
      }

      const existingDay = this.customizedDays.find(
        cd => cd.date.toDateString() === dateObj.toDateString()
      );

      if (existingDay) {
        // Add shift if not already present
        if (!existingDay.shifts.includes(date.shift)) {
          existingDay.shifts.push(date.shift);
        }
        existingDay.customizationId = customization._id;
      } else {
        this.customizedDays.push({
          date: dateObj,
          shifts: [date.shift],
          customizationId: customization._id
        });
      }
    }
  }
  // If it's for a single date (one-time customization)
  else if (customizationData.date) {
    console.log('Debug - Processing single date customization:', {
      date: customizationData.date,
      dateType: typeof customizationData.date,
      shift: customizationData.shift
    });

    // Simplified date parsing
    console.log('Debug - Date parsing input:', {
      input: customizationData.date,
      inputType: typeof customizationData.date,
      isString: typeof customizationData.date === 'string'
    });

    // Always use standard Date constructor - it should handle ISO date strings correctly
    const dateObj = new Date(customizationData.date);
    console.log('Debug - Parsed date result:', dateObj);

    console.log('Debug - Created Date object:', dateObj);
    console.log('Debug - Date object valid:', !isNaN(dateObj.getTime()));

    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${customizationData.date}`);
    }

    // Double-check the date is valid before proceeding
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      throw new Error(`Date validation failed: ${dateObj} (type: ${typeof dateObj})`);
    }

    const existingDay = this.customizedDays.find(
      cd => cd.date.toDateString() === dateObj.toDateString()
    );

    if (existingDay) {
      // Add shift if not already present
      if (!existingDay.shifts.includes(customizationData.shift)) {
        existingDay.shifts.push(customizationData.shift);
      }
      existingDay.customizationId = customization._id;
    } else {
      const newCustomizedDay = {
        date: dateObj,
        shifts: [customizationData.shift],
        customizationId: customization._id
      };

      console.log('Debug - Adding new customized day:', {
        newDay: newCustomizedDay,
        dateValue: newCustomizedDay.date,
        dateType: typeof newCustomizedDay.date,
        dateValid: !isNaN(newCustomizedDay.date.getTime()),
        dateInstanceOf: newCustomizedDay.date instanceof Date
      });

      // Final validation before pushing
      if (!(newCustomizedDay.date instanceof Date) || isNaN(newCustomizedDay.date.getTime())) {
        throw new Error(`Final date validation failed: ${newCustomizedDay.date}`);
      }

      this.customizedDays.push(newCustomizedDay);
    }
  }

  // Add to customizations array if not already there
  if (!this.customizations.includes(customization._id)) {
    this.customizations.push(customization._id);
  }

  // Debug: Log the state before saving
  console.log('Debug - Before saving subscription:', {
    customizedDaysCount: this.customizedDays.length,
    customizedDays: this.customizedDays.map(cd => ({
      date: cd.date,
      dateType: typeof cd.date,
      dateValid: !isNaN(cd.date.getTime()),
      shifts: cd.shifts,
      customizationId: cd.customizationId
    }))
  });

  // Use findOneAndUpdate to avoid validation issues with existing data
  await mongoose.model('Subscription').findOneAndUpdate(
    { _id: this._id },
    {
      $set: {
        customizedDays: this.customizedDays,
        ...(this.permanentCustomization && { permanentCustomization: this.permanentCustomization })
      }
    },
    { runValidators: false } // Skip validation to avoid issues with existing invalid data
  );

  return customization;
};

// Remove a customization
subscriptionSchema.methods.removeCustomization = async function (customizationId) {
  const index = this.customizations.indexOf(customizationId);
  if (index > -1) {
    this.customizations.splice(index, 1);

    // If it was a permanent customization, deactivate it
    if (this.permanentCustomization?.customizationId?.equals(customizationId)) {
      this.permanentCustomization.isActive = false;
    }

    // Remove from customizedDays
    this.customizedDays = this.customizedDays.filter(cd =>
      !cd.customizationId || !cd.customizationId.equals(customizationId)
    );

    // Use findOneAndUpdate to avoid validation issues with existing data
    await mongoose.model('Subscription').findOneAndUpdate(
      { _id: this._id },
      {
        $set: {
          customizations: this.customizations,
          customizedDays: this.customizedDays,
          ...(this.permanentCustomization && { permanentCustomization: this.permanentCustomization })
        }
      },
      { runValidators: false }
    );
    return true;
  }
  return false;
};

// ===== Delivery Tracking Methods =====

// Initialize delivery tracking for a date range
subscriptionSchema.methods.initializeDeliveryTracking = function (startDate, endDate) {
  const tracking = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isDeliveryDay = this.deliverySettings.deliveryDays.some(dd => dd.day.toLowerCase() === dayOfWeek && dd.active);

    if (isDeliveryDay) {
      // Add morning shift if enabled
      if (this.shift === 'morning' || this.shift === 'both') {
        tracking.push({
          date: new Date(currentDate),
          shift: 'morning',
          status: 'pending',
          isActive: true,
          thaliCount: this.thaliCount,
          customizations: this.defaultMealPreferences.morning?.customizations || []
        });
      }

      // Add evening shift if enabled
      if (this.shift === 'evening' || this.shift === 'both') {
        tracking.push({
          date: new Date(currentDate),
          shift: 'evening',
          status: 'pending',
          isActive: true,
          thaliCount: this.thaliCount,
          customizations: this.defaultMealPreferences.evening?.customizations || []
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  this.deliveryTracking = tracking;
  return this.save();
};

// Update delivery status for a specific date and shift
subscriptionSchema.methods.updateDeliveryStatus = async function (date, shift, status, options = {}) {
  const { deliveredBy, notes } = options;
  const deliveryDate = new Date(date);

  console.log('=== Delivery Status Update ===');
  console.log('Subscription ID:', this._id);
  console.log('Date:', deliveryDate.toISOString());
  console.log('Shift:', shift);
  console.log('New Status:', status);
  console.log('Delivered By:', deliveredBy);
  console.log('Notes:', notes);

  // Initialize deliveryTracking array if it doesn't exist
  if (!this.deliveryTracking) {
    console.log('Initializing deliveryTracking array');
    this.deliveryTracking = [];
  }

  // Find existing tracking record
  let tracking = this.deliveryTracking.find(
    t => t && t.date && t.date.toDateString() === deliveryDate.toDateString() &&
      t.shift === shift
  );

  if (!tracking) {
    console.log('Creating new tracking record');
    // Create new tracking record if none exists
    tracking = {
      date: deliveryDate,
      shift,
      status: 'pending',
      isActive: true,
      thaliCount: this.thaliCount || 1,
      customizations: this.defaultMealPreferences?.[shift]?.customizations || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.deliveryTracking.push(tracking);
  } else {
    console.log('Found existing tracking record:', {
      previousStatus: tracking.status,
      deliveredAt: tracking.deliveredAt,
      updatedAt: tracking.updatedAt
    });
  }

  // Update status and timestamps
  const previousStatus = tracking.status;
  tracking.status = status;
  tracking.updatedAt = new Date();

  console.log(`Status changed from '${previousStatus}' to '${status}'`);

  if (status === 'delivered') {
    tracking.deliveredAt = tracking.deliveredAt || new Date();
    tracking.deliveredBy = deliveredBy || tracking.deliveredBy;
    console.log('Delivery marked at:', tracking.deliveredAt);
  }

  if (notes) {
    tracking.notes = notes;
  }

  // Update meal counts if needed
  if (status === 'delivered' && previousStatus !== 'delivered') {
    this.mealCounts.mealsDelivered = (this.mealCounts.mealsDelivered || 0) + (tracking.thaliCount || 1);
    this.mealCounts.mealsRemaining = Math.max(0, (this.mealCounts.totalMeals || 0) - (this.mealCounts.mealsDelivered || 0) - (this.mealCounts.mealsSkipped || 0));
    console.log('Updated meal counts after delivery:', {
      delivered: this.mealCounts.mealsDelivered,
      skipped: this.mealCounts.mealsSkipped,
      remaining: this.mealCounts.mealsRemaining
    });

    // Check if subscription should be expired due to no remaining meals
    if (this.mealCounts.mealsRemaining <= 0) {
      console.log(`All meals completed for subscription ${this.subscriptionId} - will be marked as expired on save`);
    }
  }

  // Update meal counts for skipped status
  if (status === 'skipped' && previousStatus !== 'skipped') {
    this.mealCounts.mealsSkipped = (this.mealCounts.mealsSkipped || 0) + (tracking.thaliCount || 1);
    this.mealCounts.mealsRemaining = Math.max(0, (this.mealCounts.totalMeals || 0) - (this.mealCounts.mealsDelivered || 0) - (this.mealCounts.mealsSkipped || 0));
    console.log('Updated meal counts after skip:', {
      delivered: this.mealCounts.mealsDelivered,
      skipped: this.mealCounts.mealsSkipped,
      remaining: this.mealCounts.mealsRemaining
    });

    // Check if subscription should be expired due to no remaining meals
    if (this.mealCounts.mealsRemaining <= 0) {
      console.log(`All meals completed for subscription ${this.subscriptionId} - will be marked as expired on save`);
    }
  }

  try {
    await this.save();
    console.log('Delivery status updated successfully');
    console.log('Current deliveryTracking:', this.deliveryTracking);
    return this;
  } catch (error) {
    console.error('Error updating delivery status:', error);
    throw error;
  }
};

// Get delivery tracking for a date range
subscriptionSchema.methods.getDeliveryTracking = function (startDate, endDate) {
  return this.deliveryTracking.filter(tracking => {
    const trackingDate = new Date(tracking.date);
    return (!startDate || trackingDate >= startDate) &&
      (!endDate || trackingDate <= endDate);
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Skip a delivery for a specific date and shift
subscriptionSchema.methods.skipDelivery = async function (date, shift, reason) {
  const deliveryDate = new Date(date);

  // Find and update existing tracking
  const tracking = this.deliveryTracking.find(
    t => t.date.toDateString() === deliveryDate.toDateString() &&
      t.shift === shift
  );

  if (tracking) {
    tracking.status = 'skipped';
    tracking.notes = reason;
    tracking.updatedAt = new Date();
  } else {
    this.deliveryTracking.push({
      date: deliveryDate,
      shift,
      status: 'skipped',
      isActive: false,
      notes: reason,
      updatedAt: new Date()
    });
  }

  // Update skip counts and recalculate remaining meals
  this.mealCounts.mealsSkipped = (this.mealCounts.mealsSkipped || 0) + 1;
  this.mealCounts.mealsRemaining = Math.max(0, (this.mealCounts.totalMeals || 0) - (this.mealCounts.mealsDelivered || 0) - (this.mealCounts.mealsSkipped || 0));

  console.log('Meal skipped - Updated counts:', {
    delivered: this.mealCounts.mealsDelivered,
    skipped: this.mealCounts.mealsSkipped,
    remaining: this.mealCounts.mealsRemaining
  });

  // Check if subscription should be expired due to no remaining meals
  if (this.mealCounts.mealsRemaining <= 0) {
    console.log(`All meals completed for subscription ${this.subscriptionId} - will be marked as expired on save`);
  }

  return this.save();
};

subscriptionSchema.methods.calculateDailyAmount = function () {
  const baseDailyAmount = this.pricing.basePricePerMeal * this.pricing.mealsPerDay;
  const addOnsDaily = this.selectedAddOns.reduce((sum, addOn) => {
    return sum + (addOn.price || 0);
  }, 0);
  return baseDailyAmount + addOnsDaily;
};

subscriptionSchema.methods.canDeductForDate = function (date, mealType) {
  // Check if subscription is active
  if (this.status !== 'active') return false;

  // Check if date is within subscription period
  if (date < this.startDate || date > this.endDate) return false;

  // Check if meal type is enabled
  if (!this.deliveryTiming[mealType]?.enabled) return false;

  // Check if date is paused
  const isPaused = this.pausedDates.some(pause =>
    date >= pause.startDate && date <= pause.endDate
  );
  if (isPaused) return false;

  // Check if meal is already skipped
  const isSkipped = this.skippedMeals.some(skip =>
    skip.date.toDateString() === date.toDateString() && skip.shift === mealType
  );
  if (isSkipped) return false;

  // Check if already deducted
  const alreadyDeducted = this.dailyDeductions.some(deduction =>
    deduction.date.toDateString() === date.toDateString() &&
    deduction.mealType === mealType &&
    deduction.status === 'deducted'
  );
  if (alreadyDeducted) return false;

  return true;
};

subscriptionSchema.methods.addDailyDeduction = async function (date, mealType, amount, addOnsAmount = 0) {
  const totalAmount = amount + addOnsAmount;

  this.dailyDeductions.push({
    date,
    mealType,
    amount,
    addOnsAmount,
    totalAmount,
    status: 'pending'
  });

  return this.save();
};

subscriptionSchema.methods.pauseSubscription = function (startDate, endDate, reason) {
  this.pausedDates.push({ startDate, endDate, reason });
  if (this.status === 'active') {
    this.status = 'paused';
  }
  return this.save();
};

subscriptionSchema.methods.resumeSubscription = function () {
  if (this.status === 'paused') {
    this.status = 'active';
  }
  return this.save();
};

subscriptionSchema.methods.calculateTotalThalis = function () {
  // For non-30 day plans, total thalis = total meals
  if (this.planType !== '30days_2' || this.planType !== 'thirtyDays') {
    return this.pricing.totalMeals;
  }

  // For 30-day plan, calculate number of Sundays
  const startDate = this.startDate || new Date();
  const endDate = this.endDate || new Date(startDate);
  endDate.setDate(startDate.getDate() + 29); // 30 days total (including start date)

  let sundays = 0;
  let weekdays = 0;
  const currentDate = new Date(startDate);

  // Count weekdays and Sundays
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0) { // Sunday
      sundays++;
    } else { // Weekday (Monday to Saturday)
      weekdays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate total thalis: (weekdays * 2) + (sundays * 1)
  // This ensures 2 tiffins on weekdays and 1 on Sundays
  const totalThalis = (weekdays * 2) + sundays;

  // Ensure we have exactly 30 days (in case of any calculation errors)
  const expectedDays = 30;
  const calculatedDays = weekdays + sundays;

  if (calculatedDays !== expectedDays) {
    console.warn(`Warning: Calculated ${calculatedDays} days instead of ${expectedDays} for 30-day plan`);
  }

  return totalThalis;
};

// Helper function to validate order timing
subscriptionSchema.methods.isValidOrderTime = function (shift) {
  const now = moment().tz('Asia/Kolkata');
  const cutoffMorning = moment().tz('Asia/Kolkata').hour(10).minute(0).second(0);
  const cutoffEvening = moment().tz('Asia/Kolkata').hour(21).minute(0).second(0);

  if (shift === 'morning' && now.isAfter(cutoffMorning)) {
    return { valid: false, message: 'Orders for morning meals must be placed before 10:00 AM' };
  }

  if (shift === 'evening' && now.isAfter(cutoffEvening)) {
    return { valid: false, message: 'Orders for evening meals must be placed before 9:00 PM' };
  }

  return { valid: true };
};

// Method to check if a meal can be skipped
subscriptionSchema.methods.canSkipMeal = function (date, shift) {
  const today = moment().tz('Asia/Kolkata').startOf('day');
  const mealDate = moment(date).tz('Asia/Kolkata').startOf('day');

  // Can't skip past meals
  if (mealDate.isBefore(today, 'day')) {
    return { canSkip: false, message: 'Cannot skip past meals' };
  }

  // Check if already skipped
  const alreadySkipped = this.skippedMeals.some(skip =>
    moment(skip.date).isSame(mealDate, 'day') && skip.shift === shift
  );

  if (alreadySkipped) {
    return { canSkip: false, message: 'Meal already skipped' };
  }

  // Check max skips per month (example: 4)
  const skipsThisMonth = this.skippedMeals.filter(skip =>
    moment(skip.date).isSame(moment(), 'month')
  ).length;

  if (skipsThisMonth >= 4) { // Configurable limit
    return { canSkip: false, message: 'Maximum skips per month reached' };
  }

  return { canSkip: true };
};

// ===== Static Methods =====
subscriptionSchema.statics.findActiveSubscriptions = function (date = new Date()) {
  return this.find({
    status: 'active',
    $expr: { $gt: ['$mealCounts.mealsRemaining', 0] }, // Only subscriptions with remaining meals
    startDate: { $lte: date }
    // Removed endDate check - subscription ends when meals run out, not by date
  }).populate('user mealPlan');
};

// Helper method to check if a user has an active subscription
subscriptionSchema.statics.hasActiveSubscription = async function (userId) {
  const now = new Date();
  const activeSub = await this.findOne({
    user: userId,
    status: 'active',
    $expr: { $gt: ['$mealCounts.mealsRemaining', 0] }, // Only subscriptions with remaining meals
    startDate: { $lte: now }
    // Removed endDate check - subscription ends when meals run out, not by date
  });

  return !!activeSub;
};

subscriptionSchema.statics.findPendingDeductions = function (date, mealType) {
  return this.find({
    status: 'active',
    [`deliveryTiming.${mealType}.enabled`]: true,
    'dailyDeductions': {
      $not: {
        $elemMatch: {
          date: {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999))
          },
          mealType,
          status: { $in: ['deducted', 'pending'] }
        }
      }
    }
  }).populate('user mealPlan');
};

/**
 * Populate today's meal for subscriptions based on seller and meal plan tier
 * @returns {Array} Subscriptions with today's meal populated
 */
subscriptionSchema.statics.populateTodayMeals = async function () {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Populating today\'s meals for date:', today);

    // Get active subscriptions with populated meal plans and seller info
    const subscriptions = await this.find({
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate('mealPlan', 'tier title')
      .populate('sellerId', 'name businessName');

    console.log(`Found ${subscriptions.length} active subscriptions`);

    const SellerMealPlan = mongoose.model('SellerMealPlan');

    // Update each subscription with today's meal from SellerMealPlan
    for (const subscription of subscriptions) {
      try {
        const mealPlanTier = subscription.mealPlan?.tier || 'basic';
        const currentShift = subscription.shift === 'both' ? subscription.startShift : subscription.shift;
        const mealType = currentShift === 'morning' ? 'lunch' : 'dinner';

        // Get seller-specific meal plan
        const sellerMealPlan = await SellerMealPlan.findOne({
          sellerId: subscription.sellerId?._id,
          tier: mealPlanTier
        });

        if (sellerMealPlan && sellerMealPlan.shiftMeals && sellerMealPlan.shiftMeals[currentShift]) {
          const shiftMealData = sellerMealPlan.shiftMeals[currentShift];

          subscription.todayMeal = {
            items: shiftMealData.items || [],
            mealType: shiftMealData.mealType || mealType,
            date: today,
            isAvailable: shiftMealData.isAvailable !== false,
            lastUpdated: new Date(),
            sellerId: subscription.sellerId?._id,
            tier: mealPlanTier,
            shift: currentShift
          };

          console.log(`Updated meal for subscription ${subscription._id} from seller ${subscription.sellerId?.businessName || subscription.sellerId?.name}`);
        } else {
          // Fallback to DailyMeal model
          const DailyMeal = mongoose.model('DailyMeal');
          const todaysMeal = await DailyMeal.findOne({ date: today });

          if (todaysMeal && todaysMeal.meals && todaysMeal.meals[mealPlanTier] && todaysMeal.meals[mealPlanTier][mealType]) {
            const mealData = todaysMeal.meals[mealPlanTier][mealType];

            subscription.todayMeal = {
              items: mealData.items || [],
              mealType: mealType,
              date: today,
              isAvailable: true,
              lastUpdated: new Date(),
              sellerId: subscription.sellerId?._id,
              tier: mealPlanTier,
              shift: currentShift
            };

            console.log(`Used fallback DailyMeal for subscription ${subscription._id}`);
          } else {
            subscription.todayMeal = {
              items: [],
              mealType: mealType,
              date: today,
              isAvailable: false,
              lastUpdated: new Date(),
              sellerId: subscription.sellerId?._id,
              tier: mealPlanTier,
              shift: currentShift
            };

            console.log(`No meal data found for subscription ${subscription._id}`);
          }
        }

        await subscription.save();
      } catch (subError) {
        console.error(`Error updating subscription ${subscription._id}:`, subError);
        // Continue with next subscription
      }
    }

    return subscriptions;
  } catch (error) {
    console.error('Error populating today\'s meals:', error);
    return [];
  }
};

// ===== Pre-save Hooks =====
subscriptionSchema.pre('save', function (next) {
  // Fix delivery timing alignment with shift selection
  if (this.isModified('shift') || this.isNew) {
    // Reset delivery timing based on shift
    this.deliveryTiming.morning.enabled = false;
    this.deliveryTiming.evening.enabled = false;

    if (this.shift === 'morning') {
      this.deliveryTiming.morning.enabled = true;
      this.pricing.mealsPerDay = 1;
    } else if (this.shift === 'evening') {
      this.deliveryTiming.evening.enabled = true;
      this.pricing.mealsPerDay = 1;
    } else if (this.shift === 'both') {
      this.deliveryTiming.morning.enabled = true;
      this.deliveryTiming.evening.enabled = true;
      this.pricing.mealsPerDay = 2;
    }

    // Align all shift-related fields
    this.startShift = this.shift === 'both' ? 'morning' : this.shift;
    if (this.deliverySettings) {
      this.deliverySettings.startShift = this.startShift;
    }
  }

  // Recalculate meal counts based on plan type and shift
  if (this.isModified('planType') || this.isModified('shift') || this.isModified('duration') || this.isNew) {
    const mealsPerDay = this.pricing.mealsPerDay || 1;

    if (this.planType === '30days_2' || this.planType === 'thirtyDays') {
      // For 30-day plans: exclude Sundays for evening meals, include for morning/both
      const totalDays = 30;
      const sundays = Math.floor(totalDays / 7); // Approximately 4 Sundays in 30 days

      if (this.shift === 'evening') {
        // Evening only: Skip Sundays (26 days * 1 meal = 26 meals)
        this.mealCounts.totalMeals = (totalDays - sundays) * 1;
        this.pricing.totalMeals = this.mealCounts.totalMeals;
      } else if (this.shift === 'morning') {
        // Morning only: Include all days (30 days * 1 meal = 30 meals)
        this.mealCounts.totalMeals = totalDays * 1;
        this.pricing.totalMeals = this.mealCounts.totalMeals;
      } else if (this.shift === 'both') {
        // Both shifts: (26 weekdays * 2 meals) + (4 Sundays * 1 meal) = 56 meals
        this.mealCounts.totalMeals = ((totalDays - sundays) * 2) + (sundays * 1);
        this.pricing.totalMeals = this.mealCounts.totalMeals;
      }
    } else {
      // For other plans: simple calculation
      this.mealCounts.totalMeals = this.duration * mealsPerDay;
      this.pricing.totalMeals = this.mealCounts.totalMeals;
    }
  }

  // Update remaining meals calculation whenever meal counts change
  if (this.isModified('mealCounts.mealsDelivered') || this.isModified('mealCounts.mealsSkipped') || this.isModified('mealCounts.totalMeals') || this.isNew) {
    this.mealCounts.mealsRemaining = Math.max(0, (this.mealCounts.totalMeals || 0) - (this.mealCounts.mealsDelivered || 0) - (this.mealCounts.mealsSkipped || 0));
    this.remainingMeals = this.mealCounts.mealsRemaining;

    console.log(`Subscription ${this.subscriptionId} - Meal counts update:`, {
      totalMeals: this.mealCounts.totalMeals,
      mealsDelivered: this.mealCounts.mealsDelivered,
      mealsSkipped: this.mealCounts.mealsSkipped,
      mealsRemaining: this.mealCounts.mealsRemaining
    });
  }

  // Primary check: End subscription ONLY when no meals remaining (NO DATE-BASED EXPIRY)
  if (this.mealCounts.mealsRemaining <= 0 && this.status === 'active') {
    this.status = 'expired';
    this.isActive = false;
    console.log(`Marking subscription ${this.subscriptionId} as expired - no meals remaining (${this.mealCounts.mealsRemaining})`);
  }

  // REMOVED: Date-based expiry logic - subscriptions only expire when meals run out
  // No more checking endDate for expiration - meal count is the only factor

  // Calculate total thalis if not already set
  if (this.isNew || this.isModified('planType') || this.isModified('startDate') || this.isModified('endDate')) {
    this.pricing.totalThali = this.calculateTotalThalis();
  }

  // Initialize arrays if they don't exist
  if (!this.customizations) {
    this.customizations = [];
  }
  if (!this.pausedDates) {
    this.pausedDates = [];
  }
  if (!this.skippedDates) {
    this.skippedDates = [];
  }
  if (!this.dailyDeductions) {
    this.dailyDeductions = [];
  }
  if (!this.selectedAddOns) {
    this.selectedAddOns = [];
  }

  // Validate duration matches planType
  const expectedDuration = {
    'oneDay': 1,
    'tenDays': 10,
    'thirtyDays': 30,
    '30days_2': 30,
    'monthly': 30
  };

  if (this.planType && expectedDuration[this.planType]) {
    const expected = expectedDuration[this.planType];
    if (this.duration !== expected) {
      console.warn(`Duration validation: planType=${this.planType}, duration=${this.duration}, expected=${expected}. Correcting...`);
      this.duration = expected;
    }
  }

  // Calculate end date based on start date and duration
  if (this.isModified('startDate') || this.isModified('duration')) {
    const endDate = new Date(this.startDate);
    const duration = this.duration || 30;
    console.log('Calculating endDate - StartDate:', this.startDate, 'Duration:', duration, 'PlanType:', this.planType);
    endDate.setDate(endDate.getDate() + duration - 1); // Subtract 1 because start date is day 1
    this.endDate = endDate;
    console.log('Calculated endDate:', this.endDate);
  }

  // Set next delivery date
  if (this.status === 'active' && !this.nextDeliveryDate) {
    this.nextDeliveryDate = new Date();
    this.nextDeliveryDate.setDate(this.nextDeliveryDate.getDate() + 1);
  }

  next();
});

// ===== Post-save Hooks =====
subscriptionSchema.post('save', async function (doc) {
  // Update user subscription status
  if (doc.status === 'active') {
    await mongoose.model('User').findByIdAndUpdate(doc.user, {
      $set: { 'subscription.isActive': true, 'subscription.currentPlan': doc._id }
    });
  }
});

// ===== Helper Methods =====

// Calculate delivery schedule based on start date and shift
subscriptionSchema.methods.calculateDeliverySchedule = function () {
  const startDate = new Date(this.deliverySettings.startDate);
  const startShift = this.deliverySettings.startShift;
  const isSunday = startDate.getDay() === 0; // 0 = Sunday

  // If starting on Sunday and evening shift, start from next day morning
  if (isSunday && startShift === 'evening') {
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);
    this.deliverySettings.startShift = 'morning';
  }

  this.deliverySettings.firstDeliveryDate = new Date(startDate);

  // Calculate last delivery date
  let remainingMeals = this.mealCounts.totalMeals;
  let currentDate = new Date(startDate);

  while (remainingMeals > 0) {
    const dayOfWeek = currentDate.getDay();
    const isSunday = dayOfWeek === 0;

    // Skip if not a delivery day
    if (!this.deliverySettings.deliveryDays.some(d => d.day === ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek])) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // For the first day, check if starting from morning or evening
    if (currentDate.getTime() === startDate.getTime()) {
      if (startShift === 'morning') {
        // Count as 2 meals (lunch + dinner) if not Sunday
        remainingMeals -= isSunday ? 1 : 2;
      } else {
        // Evening shift counts as 1 meal (dinner only)
        remainingMeals--;
      }
    } else {
      // Normal day counting
      remainingMeals -= isSunday ? 1 : 2;
    }

    // Move to next day if we still have meals remaining
    if (remainingMeals > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  this.deliverySettings.lastDeliveryDate = currentDate;
  this.mealCounts.mealsRemaining = this.mealCounts.totalMeals - this.mealCounts.mealsDelivered - this.mealCounts.mealsSkipped;
};

// Check if a meal can be skipped
subscriptionSchema.methods.canSkipMeal = function (date, shift) {
  const mealDate = new Date(date);
  const now = new Date();

  // Can't skip past meals
  if (mealDate < now) {
    return { allowed: false, reason: 'Cannot skip past meals' };
  }

  // Check if we've already delivered/skipped all meals
  if (this.mealCounts.mealsDelivered + this.mealCounts.mealsSkipped >= this.mealCounts.totalMeals) {
    return { allowed: false, reason: 'All meals have already been delivered or skipped' };
  }

  // Check if this specific meal was already delivered/skipped
  const existingDelivery = this.mealCustomizations.find(m =>
    m.date.getTime() === mealDate.getTime() &&
    m.shift === shift &&
    ['delivered', 'skipped'].includes(m.status)
  );

  if (existingDelivery) {
    return {
      allowed: false,
      reason: `Meal already marked as ${existingDelivery.status}`
    };
  }

  return { allowed: true };
};

// Skip a meal
subscriptionSchema.methods.skipMeal = async function (date, shift, reason, userId) {
  const canSkip = this.canSkipMeal(date, shift);
  if (!canSkip.allowed) {
    throw new Error(canSkip.reason);
  }

  const isSunday = new Date(date).getDay() === 0;

  // Add to skipped meals
  this.skippedMeals.push({
    date,
    shift,
    isSunday,
    reason: 'user_skipped',
    description: reason,
    createdBy: userId
  });

  // Update meal counts and recalculate remaining meals
  this.mealCounts.mealsSkipped = (this.mealCounts.mealsSkipped || 0) + 1;
  this.mealCounts.mealsRemaining = Math.max(0, (this.mealCounts.totalMeals || 0) - (this.mealCounts.mealsDelivered || 0) - (this.mealCounts.mealsSkipped || 0));

  console.log('Meal skipped via skipMeal method - Updated counts:', {
    delivered: this.mealCounts.mealsDelivered,
    skipped: this.mealCounts.mealsSkipped,
    remaining: this.mealCounts.mealsRemaining
  });

  // Add to meal customizations as skipped
  this.mealCustomizations.push({
    date,
    shift,
    isSunday,
    status: 'skipped',
    specialInstructions: `Meal skipped: ${reason}`
  });

  // Check if subscription should be expired due to no remaining meals
  if (this.mealCounts.mealsRemaining <= 0) {
    console.log(`All meals completed for subscription ${this.subscriptionId} - will be marked as expired on save`);
  }

  await this.save();
  return this;
};

/**
 * Get today's meal information from SellerMealPlan model without saving to subscription
 * @returns {Object} Today's meal data
 */
subscriptionSchema.methods.getTodayMeal = async function () {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get meal plan tier from populated mealPlan
    await this.populate('mealPlan', 'tier title');
    const mealPlanTier = this.mealPlan?.tier || 'basic';

    // Determine meal type and shift based on subscription settings
    const currentShift = this.shift === 'both' ? this.startShift : this.shift;
    const mealType = currentShift === 'morning' ? 'lunch' : 'dinner';

    // Get seller meal plan for this tier and shift
    const SellerMealPlan = mongoose.model('SellerMealPlan');
    const sellerMealPlan = await SellerMealPlan.findOne({
      sellerId: this.sellerId,
      tier: mealPlanTier
    });

    if (sellerMealPlan && sellerMealPlan.shiftMeals && sellerMealPlan.shiftMeals[currentShift]) {
      const shiftMealData = sellerMealPlan.shiftMeals[currentShift];

      return {
        items: shiftMealData.items || [],
        mealType: shiftMealData.mealType || mealType,
        date: today,
        isAvailable: shiftMealData.isAvailable !== false,
        lastUpdated: shiftMealData.lastUpdated || new Date(),
        // Additional seller-specific info
        sellerId: this.sellerId,
        tier: mealPlanTier,
        shift: currentShift,
        sellerName: this.sellerId ? (await mongoose.model('User').findById(this.sellerId).select('name businessName')) : null
      };
    } else {
      // Fallback to legacy DailyMeal model if SellerMealPlan not found
      const DailyMeal = mongoose.model('DailyMeal');
      const todaysMeal = await DailyMeal.findOne({ date: today });

      if (todaysMeal && todaysMeal.meals && todaysMeal.meals[mealPlanTier] && todaysMeal.meals[mealPlanTier][mealType]) {
        const mealData = todaysMeal.meals[mealPlanTier][mealType];

        return {
          items: mealData.items || [],
          mealType: mealType,
          date: today,
          isAvailable: true,
          lastUpdated: new Date(),
          sellerId: this.sellerId,
          tier: mealPlanTier,
          shift: currentShift,
          sellerName: this.sellerId ? (await mongoose.model('User').findById(this.sellerId).select('name businessName')) : null
        };
      } else {
        // Set default/fallback meal info
        return {
          items: [],
          mealType: mealType,
          date: today,
          isAvailable: false,
          lastUpdated: new Date(),
          sellerId: this.sellerId,
          tier: mealPlanTier,
          shift: currentShift,
          sellerName: this.sellerId ? (await mongoose.model('User').findById(this.sellerId).select('name businessName')) : null
        };
      }
    }
  } catch (error) {
    console.error('Error getting today\'s meal:', error);
    return {
      items: [],
      mealType: 'lunch',
      date: new Date(),
      isAvailable: false,
      lastUpdated: new Date(),
      sellerId: this.sellerId,
      tier: 'basic',
      shift: this.shift,
      error: 'Failed to load meal data'
    };
  }
};

/**
 * Update today's meal information from SellerMealPlan model based on subscription details
 * @returns {Object} Updated subscription with today's meal
 */
subscriptionSchema.methods.updateTodayMeal = async function () {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get meal plan tier from populated mealPlan
    await this.populate('mealPlan', 'tier title');
    const mealPlanTier = this.mealPlan?.tier || 'basic';

    // Determine meal type and shift based on subscription settings
    const currentShift = this.shift === 'both' ? this.startShift : this.shift;
    const mealType = currentShift === 'morning' ? 'lunch' : 'dinner';

    // Get seller meal plan for this tier and shift
    const SellerMealPlan = mongoose.model('SellerMealPlan');
    const sellerMealPlan = await SellerMealPlan.findOne({
      sellerId: this.sellerId,
      tier: mealPlanTier
    });

    if (sellerMealPlan && sellerMealPlan.shiftMeals && sellerMealPlan.shiftMeals[currentShift]) {
      const shiftMealData = sellerMealPlan.shiftMeals[currentShift];

      this.todayMeal = {
        items: shiftMealData.items || [],
        mealType: shiftMealData.mealType || mealType,
        date: today,
        isAvailable: shiftMealData.isAvailable !== false,
        lastUpdated: new Date(),
        // Additional seller-specific info
        sellerId: this.sellerId,
        tier: mealPlanTier,
        shift: currentShift
      };
    } else {
      // Fallback to legacy DailyMeal model if SellerMealPlan not found
      const DailyMeal = mongoose.model('DailyMeal');
      const todaysMeal = await DailyMeal.findOne({ date: today });

      if (todaysMeal && todaysMeal.meals && todaysMeal.meals[mealPlanTier] && todaysMeal.meals[mealPlanTier][mealType]) {
        const mealData = todaysMeal.meals[mealPlanTier][mealType];

        this.todayMeal = {
          items: mealData.items || [],
          mealType: mealType,
          date: today,
          isAvailable: true,
          lastUpdated: new Date(),
          sellerId: this.sellerId,
          tier: mealPlanTier,
          shift: currentShift
        };
      } else {
        // Set default/fallback meal info
        this.todayMeal = {
          items: [],
          mealType: mealType,
          date: today,
          isAvailable: false,
          lastUpdated: new Date(),
          sellerId: this.sellerId,
          tier: mealPlanTier,
          shift: currentShift
        };
      }
    }

    await this.save();
    return this;
  } catch (error) {
    console.error('Error updating today\'s meal:', error);
    // Set fallback data on error
    this.todayMeal = {
      items: [],
      mealType: 'lunch',
      date: new Date(),
      isAvailable: false,
      lastUpdated: new Date(),
      sellerId: this.sellerId,
      tier: 'basic',
      shift: this.shift
    };
    return this;
  }
};

/**
 * Calculate total price including base price, add-ons, extra items, and replacements
 * @returns {Object} Object containing price breakdown and total
 */
subscriptionSchema.methods.calculateTotalPrice = async function () {
  try {
    // Get the populated meal plan if not already populated
    let mealPlan = this.mealPlan;
    if (!mealPlan || (typeof mealPlan === 'object' && !mealPlan.pricing)) {
      mealPlan = await mongoose.model('MealPlan').findById(this.mealPlan)
        .populate('addOns', 'name price appliesToAll')
        .populate('extraItems', 'name price');
    }

    // Get base price per meal from meal plan or use default
    const basePricePerMeal = mealPlan?.pricing?.oneDay || 75;
    const totalMeals = this.mealCounts?.totalMeals || 0;
    const totalBasePrice = basePricePerMeal * totalMeals;

    // Process add-ons that apply to all meals
    const addOns = this.mealCustomizations.flatMap(m =>
      (m.addons || []).filter(a => a.appliesToAll).map(a => ({
        ...a,
        totalPrice: (a.price || 0) * totalMeals
      }))
    );

    // Process one-time add-ons
    const oneTimeAddOns = this.mealCustomizations.flatMap(m =>
      (m.addons || []).filter(a => !a.appliesToAll).map(a => ({
        ...a,
        totalPrice: a.price || 0
      }))
    );

    // Process extra items
    const extraItems = this.mealCustomizations.flatMap(m =>
      (m.extraItems || []).map(item => ({
        ...item,
        totalPrice: (item.price || 0) * (item.quantity || 1)
      }))
    );

    // Calculate totals
    const addOnsTotal = addOns.reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    const oneTimeAddOnsTotal = oneTimeAddOns.reduce((sum, a) => sum + (a.totalPrice || 0), 0);
    const extraItemsTotal = extraItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0);

    // Calculate final total
    const total = totalBasePrice + addOnsTotal + oneTimeAddOnsTotal + extraItemsTotal;

    // Return detailed breakdown
    return {
      basePrice: totalBasePrice,
      basePricePerMeal,
      addOns: addOnsTotal,
      oneTimeAddOns: oneTimeAddOnsTotal,
      extraItems: extraItemsTotal,
      total,
      currency: 'INR',
      currencySymbol: '₹',
      addOnsList: [...addOns, ...oneTimeAddOns],
      extraItemsList: extraItems
    };
  } catch (error) {
    console.error('Error calculating total price:', error);
    throw error;
  }
};

/**
 * Get meal details for a specific date and shift
 * @param {Date} date - The date for the meal
 * @param {String} shift - The shift (morning/evening)
 * @returns {Object} Meal details with customization information
 */
subscriptionSchema.methods.getMealDetails = function (date, shift) {
  const mealDate = new Date(date);
  mealDate.setHours(0, 0, 0, 0);

  // Check for permanent customization first
  if (this.permanentCustomization?.isActive) {
    return {
      mealPlan: this.permanentCustomization.mealPlan || this.defaultMeal,
      isCustomized: true,
      type: 'permanent',
      addons: this.permanentCustomization.addons || [],
      extraItems: this.permanentCustomization.extraItems || [],
      specialInstructions: this.permanentCustomization.specialInstructions,
      basePrice: this.pricing?.basePricePerMeal || 75
    };
  }

  // Check for specific date customization
  const customization = this.customizationHistory.find(c =>
    c.date.getTime() === mealDate.getTime() &&
    c.shift === shift
  );

  if (customization) {
    // This will be populated when we fetch the customization details
    return {
      customizationId: customization.customizationId,
      isCustomized: true,
      type: customization.type,
      date: customization.date,
      shift: customization.shift
    };
  }

  // Return default meal
  return {
    mealPlan: this.defaultMeal,
    isCustomized: false,
    type: 'default',
    addons: [],
    extraItems: [],
    basePrice: this.pricing?.basePricePerMeal || 75
  };
};

/**
 * Add customization to subscription
 * @param {Object} customizationData - Customization data
 * @returns {Object} Updated subscription
 */
// REMOVING DUPLICATE METHOD - This was causing conflicts with the main addCustomization method above
// subscriptionSchema.methods.addCustomization = async function(customizationData) {
//   const { date, shift, type, customizationId } = customizationData;
//   
//   // Add to customization history
//   this.customizationHistory.push({
//     customizationId,
//     date: new Date(date),
//     shift,
//     type,
//     appliedAt: new Date()
//   });
//   
//   // If permanent, update permanent customization settings
//   if (type === 'permanent') {
//     this.permanentCustomization = {
//       isActive: true,
//       mealPlan: customizationData.replacementMeal || this.defaultMeal,
//       addons: customizationData.addons || [],
//       extraItems: customizationData.customizationData.extraItems || [],
//       specialInstructions: customizationData.specialInstructions,
//       appliedAt: new Date()
//     };
//   }
//   
//   await this.save();
//   return this;
// };

/**
 * Generate a guaranteed unique subscription ID
 * @returns {String} Unique subscription ID
 */
subscriptionSchema.statics.generateUniqueSubscriptionId = async function () {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    const subscriptionId = `SUB_${Date.now()}_${uuidv4().replace(/-/g, '').substr(0, 12).toUpperCase()}`;

    // Check if this ID already exists
    const existing = await this.findOne({ subscriptionId });
    if (!existing) {
      return subscriptionId;
    }

    attempts++;
    // Add a small delay to ensure timestamp uniqueness
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  throw new Error('Failed to generate unique subscription ID after multiple attempts');
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// ===== Database Indexes =====
// Only keep essential indexes for now
subscriptionSchema.index({ subscriptionId: 1 }, { unique: true }); // Only subscriptionId is unique

// ===== Pre-save Middleware =====
subscriptionSchema.pre('save', function (next) {
  // For new subscriptions, ensure subscriptionId is set
  if (this.isNew && !this.subscriptionId) {
    this.subscriptionId = `SUB_${Date.now()}_${uuidv4().replace(/-/g, '').substr(0, 12).toUpperCase()}`;
  }
  next();
});

// ===== Day-wise Address Management Methods =====

/**
 * Set address for a specific day and shift
 * @param {String} day - Day of the week (monday, tuesday, etc.)
 * @param {String} shift - Shift (morning/evening)
 * @param {Object} addressData - Address information
 * @returns {Object} Updated subscription
 */
subscriptionSchema.methods.setDayShiftAddress = async function (day, shift, addressData) {
  // Find or create the delivery day configuration
  let dayConfig = this.deliverySettings.deliveryDays.find(d => d.day.toLowerCase() === day.toLowerCase());

  if (!dayConfig) {
    dayConfig = {
      day: day.toLowerCase(),
      isActive: true,
      morningShift: { enabled: false, address: {} },
      eveningShift: { enabled: false, address: {} }
    };
    this.deliverySettings.deliveryDays.push(dayConfig);
  }

  // Update the specific shift address
  const shiftKey = shift.toLowerCase() === 'morning' ? 'morningShift' : 'eveningShift';
  dayConfig[shiftKey].enabled = true;
  dayConfig[shiftKey].address = {
    ...dayConfig[shiftKey].address,
    ...addressData
  };

  // If delivery time is provided, set it
  if (addressData.deliveryTime) {
    dayConfig[shiftKey].deliveryTime = addressData.deliveryTime;
  }

  // Mark that custom addresses are being used
  this.deliverySettings.addressSettings.allowDifferentAddresses = true;
  this.deliverySettings.addressSettings.useDefaultForAll = false;

  await this.save();
  return this;
};

/**
 * Get address for a specific day and shift
 * @param {String} day - Day of the week
 * @param {String} shift - Shift (morning/evening)
 * @returns {Object} Address information
 */
subscriptionSchema.methods.getDayShiftAddress = function (day, shift) {
  const dayConfig = this.deliverySettings.deliveryDays.find(d =>
    d.day.toLowerCase() === day.toLowerCase()
  );

  if (!dayConfig) {
    // Return default address if no specific day config
    return this.getDefaultAddress();
  }

  const shiftKey = shift.toLowerCase() === 'morning' ? 'morningShift' : 'eveningShift';
  const shiftConfig = dayConfig[shiftKey];

  if (!shiftConfig.enabled || !shiftConfig.address) {
    // Return default address if shift not configured
    return this.getDefaultAddress();
  }

  return {
    ...shiftConfig.address,
    deliveryTime: shiftConfig.deliveryTime,
    day: day,
    shift: shift
  };
};

/**
 * Get default address based on user preferences
 * @returns {Object} Default address
 */
subscriptionSchema.methods.getDefaultAddress = function () {
  const defaultType = this.deliverySettings.addressSettings.defaultAddressType;
  const defaultAddress = this.deliverySettings.savedAddresses[defaultType];

  if (defaultAddress && defaultAddress.street) {
    return {
      ...defaultAddress,
      type: defaultType
    };
  }

  // Fallback to legacy deliveryAddress
  return this.deliveryAddress || {};
};

/**
 * Set default addresses (home/office)
 * @param {String} type - 'home' or 'office'
 * @param {Object} addressData - Address information
 * @returns {Object} Updated subscription
 */
subscriptionSchema.methods.setSavedAddress = async function (type, addressData) {
  if (!['home', 'office'].includes(type)) {
    throw new Error('Address type must be "home" or "office"');
  }

  this.deliverySettings.savedAddresses[type] = {
    name: addressData.name || (type === 'home' ? 'Home' : 'Office'),
    street: addressData.street,
    area: addressData.area,
    city: addressData.city,
    state: addressData.state,
    pincode: addressData.pincode,
    landmark: addressData.landmark,
    coordinates: addressData.coordinates,
    contactPerson: addressData.contactPerson,
    instructions: addressData.instructions,
    floor: addressData.floor,
    building: addressData.building,
    isDefault: addressData.isDefault || (type === 'home')
  };


  await this.save();
  return this;
};

/**
 * Apply same address to all days and shifts
 * @param {Object} addressData - Address to apply
 * @returns {Object} Updated subscription
 */
subscriptionSchema.methods.setUniformAddress = async function (addressData) {
  // Set as default home address
  await this.setSavedAddress('home', addressData);

  // Configure settings to use same address for all
  this.deliverySettings.addressSettings.useDefaultForAll = true;
  this.deliverySettings.addressSettings.allowDifferentAddresses = false;
  this.deliverySettings.addressSettings.defaultAddressType = 'home';

  // Clear individual day configurations to use default
  this.deliverySettings.deliveryDays.forEach(day => {
    if (day.morningShift) day.morningShift.address = {};
    if (day.eveningShift) day.eveningShift.address = {};
  });

  await this.save();
  return this;
};

/**
 * Get complete delivery schedule with addresses
 * @returns {Array} Array of delivery schedule with addresses
 */
subscriptionSchema.methods.getDeliveryScheduleWithAddresses = function () {
  const schedule = [];
  const startDate = new Date(this.deliverySettings.startDate);
  const endDate = new Date(this.deliverySettings.lastDeliveryDate || this.endDate);
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayConfig = this.deliverySettings.deliveryDays.find(d => d.day === dayName);

    if (dayConfig && dayConfig.isActive) {
      // Morning shift
      if ((this.shift === 'morning' || this.shift === 'both') && dayConfig.morningShift?.enabled) {
        schedule.push({
          date: new Date(currentDate),
          day: dayName,
          shift: 'morning',
          deliveryTime: dayConfig.morningShift.deliveryTime,
          address: this.deliverySettings.addressSettings.useDefaultForAll
            ? this.getDefaultAddress()
            : (dayConfig.morningShift.address.street
              ? dayConfig.morningShift.address
              : this.getDefaultAddress())
        });
      }

      // Evening shift (skip Sunday evenings for 30-day plans)
      if ((this.shift === 'evening' || this.shift === 'both') && dayConfig.eveningShift?.enabled) {
        const isSunday = currentDate.getDay() === 0;
        const isThirtyDayPlan = this.planType === '30days_2' || this.planType === 'thirtyDays';

        if (!isSunday || !isThirtyDayPlan) {
          schedule.push({
            date: new Date(currentDate),
            day: dayName,
            shift: 'evening',
            deliveryTime: dayConfig.eveningShift.deliveryTime,
            address: this.deliverySettings.addressSettings.useDefaultForAll
              ? this.getDefaultAddress()
              : (dayConfig.eveningShift.address.street
                ? dayConfig.eveningShift.address
                : this.getDefaultAddress())
          });
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedule;
};

/**
 * Validate all addresses have required fields
 * @returns {Object} Validation result
 */
subscriptionSchema.methods.validateAddresses = function () {
  const errors = [];
  const requiredFields = ['street', 'city', 'state', 'pincode'];

  // If using uniform address, validate default address
  if (this.deliverySettings.addressSettings.useDefaultForAll) {
    const defaultAddress = this.getDefaultAddress();
    const missingFields = requiredFields.filter(field => !defaultAddress[field]);

    if (missingFields.length > 0) {
      errors.push(`Default address missing: ${missingFields.join(', ')}`);
    }
  } else {
    // Validate individual day addresses
    this.deliverySettings.deliveryDays.forEach(day => {
      if (day.isActive) {
        if (day.morningShift?.enabled && day.morningShift.address.street) {
          const missingFields = requiredFields.filter(field => !day.morningShift.address[field]);
          if (missingFields.length > 0) {
            errors.push(`${day.day} morning address missing: ${missingFields.join(', ')}`);
          }
        }

        if (day.eveningShift?.enabled && day.eveningShift.address.street) {
          const missingFields = requiredFields.filter(field => !day.eveningShift.address[field]);
          if (missingFields.length > 0) {
            errors.push(`${day.day} evening address missing: ${missingFields.join(', ')}`);
          }
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};



module.exports = Subscription;