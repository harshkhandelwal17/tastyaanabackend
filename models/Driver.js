const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  deliveries: {
    type: Number,
    default: 0
  },
  vehicle: {
    type: {
      type: String,
      enum: ['bike', 'scooter', 'car', 'bicycle'],
      required: true
    },
    number: {
      type: String,
      required: true
    },
    model: {
      type: String
    },
    color: {
      type: String
    }
  },
  documents: {
    license: {
      number: String,
      imageUrl: String,
      verified: {
        type: Boolean,
        default: false
      }
    },
    vehicleRegistration: {
      number: String,
      imageUrl: String,
      verified: {
        type: Boolean,
        default: false
      }
    },
    insurance: {
      number: String,
      imageUrl: String,
      expiryDate: Date,
      verified: {
        type: Boolean,
        default: false
      }
    }
  },
  currentLocation: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    },
    lastUpdated: {
      type: Date
    }
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '22:00'
    }
  },
  serviceAreas: [{
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    radius: {
      type: Number,
      default: 5 // km
    }
  }],
  specialization: {
    categories: [{
      type: String,
      enum: ['food', 'vegetable', 'sweets', 'stationery', 'general','grocery'],
      default: 'general'
    }],
    description: String,
    certifications: [String]
  },
  earnings: {
    today: {
      type: Number,
      default: 0
    },
    thisWeek: {
      type: Number,
      default: 0
    },
    thisMonth: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  fcmToken: {
    type: String // For push notifications
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for location-based queries
driverSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });
driverSchema.index({ isActive: 1, isOnline: 1 });
driverSchema.index({ email: 1 });
driverSchema.index({ phone: 1 });

// Hash password before saving
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
driverSchema.methods.comparePassword = async function(candidatePassword) {
  // return bcrypt.compare(candidatePassword, this.password);
  return candidatePassword==this.password;
};

// Update location method
driverSchema.methods.updateLocation = function(lat, lng) {
  this.currentLocation = {
    lat,
    lng,
    lastUpdated: new Date()
  };
  return this.save();
};

// Toggle online status
driverSchema.methods.toggleOnlineStatus = function() {
  this.isOnline = !this.isOnline;
  if (this.isOnline) {
    this.lastLogin = new Date();
  }
  return this.save();
};

// Update rating
driverSchema.methods.updateRating = function(newRating) {
  const totalScore = this.rating * this.totalRatings;
  this.totalRatings += 1;
  this.rating = (totalScore + newRating) / this.totalRatings;
  return this.save();
};

// Increment delivery count
driverSchema.methods.incrementDeliveries = function() {
  this.deliveries += 1;
  return this.save();
};

// Update earnings
driverSchema.methods.addEarnings = function(amount) {
  this.earnings.today += amount;
  this.earnings.thisWeek += amount;
  this.earnings.thisMonth += amount;
  this.earnings.total += amount;
  return this.save();
};

// Static method to find nearby drivers
driverSchema.statics.findNearbyDrivers = function(lat, lng, radiusInKm = 10) {
  return this.find({
    isActive: true,
    isOnline: true,
    'currentLocation.lat': {
      $gte: lat - (radiusInKm / 111), // Rough conversion: 1 degree ≈ 111 km
      $lte: lat + (radiusInKm / 111)
    },
    'currentLocation.lng': {
      $gte: lng - (radiusInKm / (111 * Math.cos(lat * Math.PI / 180))),
      $lte: lng + (radiusInKm / (111 * Math.cos(lat * Math.PI / 180)))
    }
  }).sort({ rating: -1, deliveries: -1 });
};

// Static method to get available drivers
driverSchema.statics.getAvailableDrivers = function() {
  return this.find({
    isActive: true,
    isOnline: true
  }).sort({ rating: -1, deliveries: -1 });
};

// Virtual for full name
driverSchema.virtual('fullName').get(function() {
  return this.name;
});

// Generate email verification token
driverSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return token;
};

// Transform output
driverSchema.methods.toJSON = function() {
  const driver = this.toObject();
  delete driver.password;
  delete driver.bankDetails;
  delete driver.fcmToken;
  delete driver.emailVerificationToken;
  return driver;
};

module.exports = mongoose.model('Driver', driverSchema);
