const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true
  },
  
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 10,
    unique: true
  },

  // Geographic Information
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'India'
  },

  // Coordinates for mapping
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },

  // Administrative details
  zipCodes: [{
    type: String,
    trim: true
  }],

  cities: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Delivery settings
  deliverySettings: {
    isDeliveryAvailable: {
      type: Boolean,
      default: true
    },
    deliveryCharge: {
      type: Number,
      min: 0,
      default: 0
    },
    freeDeliveryThreshold: {
      type: Number,
      min: 0,
      default: 500
    },
    estimatedDeliveryDays: {
      min: {
        type: Number,
        default: 1
      },
      max: {
        type: Number,
        default: 3
      }
    }
  },

  // Status and metadata
  isActive: {
    type: Boolean,
    default: true
  },

  priority: {
    type: Number,
    default: 0,
    comment: 'Higher values appear first in listings'
  },

  description: {
    type: String,
    maxlength: 500
  },

  // SEO
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },

  metaData: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },

  // Statistics
  totalProducts: {
    type: Number,
    default: 0
  },

  totalSellers: {
    type: Number,
    default: 0
  },

  // Administrative
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true
});

// Indexes for performance
regionSchema.index({ name: 1, isActive: 1 });
regionSchema.index({ code: 1 });
regionSchema.index({ state: 1, isActive: 1 });
regionSchema.index({ slug: 1 });
regionSchema.index({ priority: -1, name: 1 });
regionSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

// Virtual for formatted display name
regionSchema.virtual('displayName').get(function() {
  return `${this.name}, ${this.state}`;
});

// Pre-save middleware to generate slug
regionSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Instance method to check if delivery is available
regionSchema.methods.isDeliveryAvailable = function() {
  return this.isActive && this.deliverySettings.isDeliveryAvailable;
};

// Instance method to calculate delivery charge
regionSchema.methods.calculateDeliveryCharge = function(orderAmount) {
  if (!this.isDeliveryAvailable()) {
    return null;
  }
  
  if (orderAmount >= this.deliverySettings.freeDeliveryThreshold) {
    return 0;
  }
  
  return this.deliverySettings.deliveryCharge;
};

// Static method to find regions by state
regionSchema.statics.findByState = function(state) {
  return this.find({ 
    state: new RegExp(state, 'i'), 
    isActive: true 
  }).sort({ priority: -1, name: 1 });
};

// Static method to find nearby regions (if coordinates are available)
regionSchema.statics.findNearby = function(latitude, longitude, maxDistance = 100) {
  return this.find({
    isActive: true,
    'coordinates.latitude': { $exists: true },
    'coordinates.longitude': { $exists: true },
    $expr: {
      $lte: [
        {
          $sqrt: {
            $add: [
              { $pow: [{ $subtract: ['$coordinates.latitude', latitude] }, 2] },
              { $pow: [{ $subtract: ['$coordinates.longitude', longitude] }, 2] }
            ]
          }
        },
        maxDistance / 111.32 // Convert km to degrees (approximate)
      ]
    }
  }).sort({ priority: -1, name: 1 });
};

module.exports = mongoose.model('Region', regionSchema);