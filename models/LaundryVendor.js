const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  maxWeight: { type: Number }, // kg per period, null = unlimited
  
  // Subscription Schedule Configuration
  schedule: {
    // Frequency type: 'weekly' or 'monthly'
    frequencyType: { 
      type: String, 
      enum: ['weekly', 'monthly'], 
      default: 'weekly',
      required: true 
    },
    // Number of pickups per period (e.g., 2 per week, 4 per month)
    pickupsPerPeriod: { 
      type: Number, 
      required: true,
      min: 1,
      max: 31
    },
    // Days of week for pickup (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Only used if frequencyType is 'weekly'
    pickupDays: [{ 
      type: Number, 
      min: 0, 
      max: 6 
    }],
    // Time slots for pickup (e.g., ['morning', 'afternoon'])
    pickupTimeSlots: [{ 
      type: String, 
      enum: ['morning', 'afternoon', 'evening'] 
    }],
    // Return schedule: 'same_day', 'next_day', 'after_days' (number of days)
    returnSchedule: {
      type: { 
        type: String, 
        enum: ['same_day', 'next_day', 'after_days'], 
        default: 'next_day' 
      },
      days: { 
        type: Number, 
        default: 1,
        min: 0,
        max: 7
      }
    }
  },
  
  features: {
    unlimitedPickups: { type: Boolean, default: false }, // Deprecated, use pickupsPerPeriod instead
    services: [{ type: String }], // ['wash_fold', 'wash_iron']
    freeDryClean: { type: Number, default: 0 },
    freeExpressService: { type: Number, default: 0 },
    shoeCleaningFree: { type: Number, default: 0 },
    turnaroundTime: { type: String }, // "24 hours" - for display only
    priority: { type: Boolean, default: false },
    vipSupport: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true }
});

const laundryVendorSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true },
  slug: { type: String,  lowercase: true },
  description: { type: String, required: true },
  logo: { type: String },
  photos: [{ type: String }],
  
  // Contact
  phone: { type: String, required: true },
  email: { type: String },
  
  // Address
  address: {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined } // [longitude, latitude] - optional
    }
  },
  
  // Service Areas (pincodes)
  serviceAreas: [{ type: String }],
  
  // Services Offered
  services: [{
    type: String,
    enum: ['wash_fold', 'wash_iron', 'dry_clean', 'iron_only', 'express', 'premium', 'shoe_cleaning', 'folding_only']
  }],
  
  specializations: [{ type: String }], // ['delicate_fabrics', 'wedding_attire', 'leather']
  
  // Pricing Configuration
  pricingConfig: {
    // Pricing model: 'per_piece', 'weight_based', or 'hybrid' (both)
    model: { 
      type: String, 
      enum: ['per_piece', 'weight_based', 'hybrid'], 
      default: 'per_piece' 
    },
    // Minimum weight for weight-based pricing (kg)
    minWeight: { type: Number, default: 1 },
    // Weight-based pricing per kg
    weightBasedPricing: {
      wash_fold: { type: Number, default: 50 }, // per kg
      wash_iron: { type: Number, default: 60 },
      dry_clean: { type: Number, default: 150 },
      iron_only: { type: Number, default: 30 },
      shoe_cleaning: { type: Number, default: 200 }
    }
  },
  
  // Pricing (per item type per service) - for per-piece model
  // Base pricing (used for scheduled service)
  pricing: {
    // Top Wear
    shirt: {
      wash_fold: { type: Number, default: 20 },
      wash_iron: { type: Number, default: 25 },
      dry_clean: { type: Number, default: 80 },
      iron_only: { type: Number, default: 12 }
    },
    tshirt: {
      wash_fold: { type: Number, default: 15 },
      wash_iron: { type: Number, default: 20 },
      dry_clean: { type: Number, default: 60 },
      iron_only: { type: Number, default: 10 }
    },
    sweater: {
      wash_fold: { type: Number, default: 40 },
      wash_iron: { type: Number, default: 50 },
      dry_clean: { type: Number, default: 150 }
    },
    jacket: {
      wash_fold: { type: Number, default: 60 },
      wash_iron: { type: Number, default: 80 },
      dry_clean: { type: Number, default: 200 }
    },
    
    // Bottom Wear
    jeans: {
      wash_fold: { type: Number, default: 40 },
      wash_iron: { type: Number, default: 50 },
      dry_clean: { type: Number, default: 100 },
      iron_only: { type: Number, default: 20 }
    },
    trousers: {
      wash_fold: { type: Number, default: 30 },
      wash_iron: { type: Number, default: 40 },
      dry_clean: { type: Number, default: 80 },
      iron_only: { type: Number, default: 15 }
    },
    shorts: {
      wash_fold: { type: Number, default: 20 },
      wash_iron: { type: Number, default: 25 },
      dry_clean: { type: Number, default: 60 },
      iron_only: { type: Number, default: 12 }
    },
    
    // Home Textiles
    bedsheet: {
      wash_fold: { type: Number, default: 60 },
      wash_iron: { type: Number, default: 80 },
      dry_clean: { type: Number, default: 150 }
    },
    blanket: {
      wash_fold: { type: Number, default: 100 },
      wash_iron: { type: Number, default: 150 },
      dry_clean: { type: Number, default: 300 }
    },
    curtain: {
      wash_fold: { type: Number, default: 80 },
      wash_iron: { type: Number, default: 120 },
      dry_clean: { type: Number, default: 200 }
    },
    
    // Others
    towel: {
      wash_fold: { type: Number, default: 20 },
      wash_iron: { type: Number, default: 30 }
    },
    saree: {
      wash_fold: { type: Number, default: 50 },
      wash_iron: { type: Number, default: 80 },
      dry_clean: { type: Number, default: 150 }
    },
    suit: {
      dry_clean: { type: Number, default: 250 }
    },
    shoe: {
      cleaning: { type: Number, default: 150 }
    }
  },
  
  // Quick Service Pricing (higher than scheduled for express service)
  // If not set, will use base pricing with surcharge
  quickPricing: {
    // Same structure as pricing, but for quick service
    // If item not found here, will use base pricing + surcharge
    shirt: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number },
      iron_only: { type: Number }
    },
    tshirt: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number },
      iron_only: { type: Number }
    },
    sweater: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number }
    },
    jacket: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number }
    },
    jeans: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number },
      iron_only: { type: Number }
    },
    trousers: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number },
      iron_only: { type: Number }
    },
    shorts: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number },
      iron_only: { type: Number }
    },
    bedsheet: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number }
    },
    blanket: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number }
    },
    curtain: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number }
    },
    towel: {
      wash_fold: { type: Number },
      wash_iron: { type: Number }
    },
    saree: {
      wash_fold: { type: Number },
      wash_iron: { type: Number },
      dry_clean: { type: Number }
    },
    suit: {
      dry_clean: { type: Number }
    },
    shoe: {
      cleaning: { type: Number }
    }
  },
  
  // Quick Service Weight-Based Pricing (if different from base)
  quickWeightBasedPricing: {
    wash_fold: { type: Number },
    wash_iron: { type: Number },
    dry_clean: { type: Number },
    iron_only: { type: Number },
    shoe_cleaning: { type: Number }
  },
  
  // Additional Charges - Different for Quick vs Scheduled
  charges: {
    // Quick Service Charges
    quick: {
      pickup: { type: Number, default: 50 },
      delivery: { type: Number, default: 50 },
      surcharge: { type: Number, default: 20 }, // percentage on base price
      freeDeliveryAbove: { type: Number, default: 1000 }
    },
    // Scheduled Service Charges
    scheduled: {
      pickup: { type: Number, default: 30 },
      delivery: { type: Number, default: 30 },
      surcharge: { type: Number, default: 0 },
      freeDeliveryAbove: { type: Number, default: 500 }
    },
    // Subscription Service Charges (usually free or discounted)
    subscription: {
      pickup: { type: Number, default: 0 },
      delivery: { type: Number, default: 0 },
      surcharge: { type: Number, default: 0 },
      freeDeliveryAbove: { type: Number, default: 0 }
    }
  },
  
  // Quick Service Configuration
  quickServiceConfig: {
    enabled: { type: Boolean, default: false },
    minOrderValue: { type: Number, default: 200 },
    maxWeight: { type: Number, default: 10 }, // kg
    operatingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '19:00' }
    },
    availableDays: [{ 
      type: String, 
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    }],
    turnaroundTime: { 
      min: { type: Number, default: 4 }, // hours
      max: { type: Number, default: 8 }
    }
  },
  
  // Scheduled Service Configuration
  scheduledServiceConfig: {
    enabled: { type: Boolean, default: true },
    advanceBookingDays: { type: Number, default: 7 },
    timeSlots: [{
      timeSlot: { 
        type: String, 
        enum: ['morning', 'afternoon', 'evening'] 
      },
      available: { type: Boolean, default: true },
      maxCapacity: { type: Number, default: 10 }
    }]
  },
  
  // Turnaround Time
  turnaroundTime: {
    standard: { type: Number, default: 48 }, // hours
    express: { type: Number, default: 12 },
    premium: { type: Number, default: 72 }
  },
  
  // Operational Hours
  operationalHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
  },
  
  // Subscription Plans
  subscriptionPlans: [subscriptionPlanSchema],
  
  // Stats
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalOrders: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  activeSubscriptions: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  // Meta
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
}, { timestamps: true });

// Indexes
// Make geospatial index sparse so it only indexes documents with coordinates
laundryVendorSchema.index({ 'address.coordinates': '2dsphere' }, { sparse: true });
laundryVendorSchema.index({ slug: 1 });
laundryVendorSchema.index({ serviceAreas: 1 });
laundryVendorSchema.index({ rating: -1 });
laundryVendorSchema.index({ isActive: 1 });

// Generate slug before saving
laundryVendorSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Clean up coordinates if they're not properly formatted
  if (this.address && this.address.coordinates) {
    // If coordinates array is missing or invalid, remove the coordinates object
    if (!this.address.coordinates.coordinates || 
        !Array.isArray(this.address.coordinates.coordinates) ||
        this.address.coordinates.coordinates.length !== 2 ||
        !this.address.coordinates.coordinates.every(c => typeof c === 'number')) {
      // Remove invalid coordinates
      this.address.coordinates = undefined;
    }
  }
  
  next();
});

module.exports = mongoose.model('LaundryVendor', laundryVendorSchema);