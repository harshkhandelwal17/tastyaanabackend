const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  name: { // Alias for title
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  shortDescription: {
    type: String,
    maxlength: 250
  },

  // Pricing Information
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0
  },
  originalPrice: {
    type: Number
  },
  discount: {
    type: Number,
    default: 0
  },

  // Images
  images: [{
    url: String,
    alt: String,
    isPrimary: { 
      type: Boolean, 
      default: false 
    }
  }],

  // Videos
  videos: [{
    url: String,
    publicId: String,
    title: String,
    thumbnail: String
  }],

  // Category & Classification
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subCategory: {
    type:String
  },
  tags: [String],
  isCollegeBranded: {
    type: Boolean,
    default: false,
    index: true // Add index for efficient querying
  },

  // Seller Information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  manufacturer: {
    name: String,
    address: String,
    license: String
  },

  // Variants & Options
  variants: [{
    size: String,
    color: String,
    stock: { 
      type: Number, 
      default: 0 
    },
    price: Number,
    sku: String
  }],

  availability: {
    days: {
      type: String,
      enum: ['all', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'weekdays', 'weekends'],
      default: 'all'
    },
    startTime: {
      type: String,
      default: '00:00',
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    endTime: {
      type: String,
      default: '23:59',
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'End time must be in HH:MM format'
      }
    }
  },

  weightOptions: [{
    weight: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    originalPrice: {
      type: Number,
      // required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      default: 0
    }
  }],
priceHistory: [{
  date: { type: Date, default: Date.now },
  price: Number
}]
,
  // Stock Information
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },

  // Product Status & Flags
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  badge: {
    type: String,
    enum: ['Premium Royal', 'Master Crafted', 'Gift Special', 'Regional Special', 'Festival Special',"Fresh Harvest"]
  },

  // Product Specifications
  specifications: [{
    name: String,
    value: String
  }],
  ingredients: [String],
  allergens: [String],
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    sugar: Number,
    fiber: Number
  },

  // Physical Attributes
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  shelfLife: {
    type: Number,
    default: 7
  },
  storageInstructions: String,

  // SEO & Marketing
  seoData: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  slug: {
    type: String,
    unique: true
  },
  metaTitle: String,
  metaDescription: String,

  // Ratings & Performance
  ratings: {
    average: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 5
    },
    count: { 
      type: Number, 
      default: 0 
    }
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },

  // Grocery & Essentials Specific
  unitType: {
    type: String,
    enum: ['kg', 'g', 'litre', 'ml', 'dozen', 'piece', 'packet', 'bundle'],
    default: 'piece'
  },
  isPerishable: {
    type: Boolean,
    default: false
  },
  harvestDate: Date,
  origin: {
    type: String,
    trim: true
  },
  returnPolicyDays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for search optimization
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ seller: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ 'ratings.average': -1 });

// Method to check if product is available at current time
productSchema.methods.isAvailableNow = function() {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  // Check if day is available
  const isDayAvailable = this.isDayAvailable(currentDay);
  if (!isDayAvailable) return false;

  // Convert time strings to minutes for comparison
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(this.availability.startTime);
  const endMinutes = timeToMinutes(this.availability.endTime);

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

// Method to check if a specific day is available
productSchema.methods.isDayAvailable = function(day) {
  const availabilityDays = this.availability.days;
  
  if (availabilityDays === 'all') return true;
  if (availabilityDays === day) return true;
  
  if (availabilityDays === 'weekdays') {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day);
  }
  
  if (availabilityDays === 'weekends') {
    return ['saturday', 'sunday'].includes(day);
  }
  
  return false;
};

// Method to get next available time
productSchema.methods.getNextAvailableTime = function() {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5);
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(this.availability.startTime);
  
  // If available today and time hasn't passed
  if (this.isDayAvailable(currentDay) && currentMinutes < startMinutes) {
    return {
      day: currentDay,
      startTime: this.availability.startTime,
      endTime: this.availability.endTime
    };
  }
  
  // Find next available day
  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currentDayIndex = daysOrder.indexOf(currentDay);
  
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7;
    const checkDay = daysOrder[dayIndex];
    
    if (this.isDayAvailable(checkDay)) {
      return {
        day: checkDay,
        startTime: this.availability.startTime,
        endTime: this.availability.endTime
      };
    }
  }
  
  return null;
};

// Helper function to convert time string to minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Pre-save hook to ensure name matches title
productSchema.pre('save', function(next) {
  if (!this.name) {
    this.name = this.title;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);