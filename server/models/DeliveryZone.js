const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
  // ===== Basic Information =====
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },

  // ===== Geographic Information =====
  boundaries: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of LinearRing coordinate arrays
      required: true
    }
  },
  center: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  radius: {
    type: Number, // in kilometers
    default: 5
  },

  // ===== Coverage Areas =====
  areas: [{
    name: String,
    pincode: String,
    locality: String
  }],

  // ===== Service Configuration =====
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  maxCapacity: {
    morning: {
      type: Number,
      default: 50
    },
    evening: {
      type: Number,
      default: 50
    }
  },

  // ===== Timing Configuration =====
  serviceHours: {
    morning: {
      start: {
        type: String,
        default: '08:00'
      },
      end: {
        type: String,
        default: '12:00'
      }
    },
    evening: {
      start: {
        type: String,
        default: '18:00'
      },
      end: {
        type: String,
        default: '22:00'
      }
    }
  },

  // ===== Delivery Configuration =====
  deliveryConfig: {
    estimatedTime: {
      type: Number, // in minutes
      default: 30
    },
    minimumOrders: {
      type: Number,
      default: 5
    },
    deliveryFee: {
      type: Number,
      default: 0
    }
  },

  // ===== Administrative =====
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // ===== Metadata =====
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===== Indexes =====
deliveryZoneSchema.index({ boundaries: '2dsphere' });
deliveryZoneSchema.index({ center: '2dsphere' });
deliveryZoneSchema.index({ 'areas.pincode': 1 });
deliveryZoneSchema.index({ isActive: 1, priority: -1 });

// ===== Virtuals =====
deliveryZoneSchema.virtual('currentCapacity', function() {
  // This would be calculated based on current subscriptions
  return {
    morning: 0,
    evening: 0
  };
});

deliveryZoneSchema.virtual('drivers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'driverProfile.zones',
  match: { role: 'delivery' }
});

// ===== Methods =====
deliveryZoneSchema.methods.isPointInZone = function(lat, lng) {
  // Simple radius-based check (can be enhanced with polygon check)
  const distance = this.calculateDistance(lat, lng, this.center.lat, this.center.lng);
  return distance <= this.radius;
};

deliveryZoneSchema.methods.calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = this.toRad(lat2 - lat1);
  const dLng = this.toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

deliveryZoneSchema.methods.toRad = function(deg) {
  return deg * (Math.PI / 180);
};

// ===== Statics =====
deliveryZoneSchema.statics.findByPoint = function(lat, lng) {
  return this.find({
    isActive: true,
    $and: [
      { 'center.lat': { $exists: true } },
      { 'center.lng': { $exists: true } }
    ]
  }).then(zones => {
    return zones.filter(zone => zone.isPointInZone(lat, lng));
  });
};

deliveryZoneSchema.statics.findByPincode = function(pincode) {
  return this.find({
    isActive: true,
    'areas.pincode': pincode
  });
};

// ===== Middleware =====
deliveryZoneSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);