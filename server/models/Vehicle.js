const mongoose = require('mongoose');

// Enhanced Vehicle Schema based on existing vehicleRentaldata.json structure
const vehicleSchema = new mongoose.Schema({
  // ===== Basic Vehicle Information =====
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    enum: ['bike', 'car', 'scooty', 'bus', 'truck'],
    required: true,
    index: true,
    default: 'bike' // Most entries appear to be bikes/scooters
  },
  requireConfirmation: {
    type: Boolean,
    default: false,
    description: 'If true, seller must approve booking request before confirmation. If false, booking is auto-confirmed after payment.'
  },
  type: {
    type: String,
    enum: ['EV', 'Diesel', 'Petrol', 'CNG', 'Hydrogen'],
    required: true,
    default: 'Petrol' // Default for most 2-wheelers
  },
  vehicleNo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    validate: {
      validator: function (v) {
        return /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(v);
      },
      message: 'Invalid vehicle number format (e.g., MH12AB1234)'
    }
  },
  companyName: {
    type: String,
    required: true,
    enum: ['Bajaj', 'Honda', 'Hero', 'Suzuki', 'Yamaha', 'TVS', 'Maruti', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Kia', 'Jawa', 'Other']
  },

  // ===== Location & Zone Information =====
  zoneId: {
    type: String,
    required: true,
    index: true,
    description: 'Unique identifier for the zone this vehicle belongs to'
  },
  zoneCenterName: {
    type: String,
    required: true,
    index: true
  },
  zoneCenterAddress: {
    type: String,
    required: true
  },
  zoneCode: {
    type: String,
    required: true,
    index: true
  },
  locationGeo: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },

  // ===== Booking Constraints =====
  minBufferTime: {
    type: Number,
    default: 30, // minutes
    min: 0,
    description: 'Minimum time gap required between two bookings'
  },
  requiresApproval: {
    type: Boolean,
    default: false,
    description: 'If true, seller must approve booking request before confirmation'
  },

  // ===== Status & Availability =====
  status: {
    type: String,
    enum: ['active', 'inactive', 'in-maintenance', 'booked', 'out-of-service'],
    default: 'active',
    index: true
  },
  availability: {
    type: String,
    enum: ['available', 'not-available', 'reserved'],
    default: 'available',
    index: true
  },

  // ===== Vehicle Details =====
  vehicleImages: [{
    type: String,
    required: true
  }],
  seatingCapacity: {
    type: Number,
    required: true,
    min: 1,
    default: 2 // Default for most bikes/scooters
  },
  meterReading: {
    type: Number,
    required: true,
    min: 0
  },
  color: {
    type: String,
    default: 'Black'
  },
  fuelCapacity: {
    type: Number, // in liters
    min: 0,
    default: 5 // Default for 2-wheelers
  },
  mileage: {
    type: Number, // km per liter or km per charge
    min: 0,
    default: 40 // Default for 2-wheelers
  },

  // ===== Vehicle Features =====
  vehicleFeatures: [{
    type: String,
    enum: ['ABS', 'Disk Brake', 'Gearless', 'AC', 'Airbags', 'Power Steering', 'Central Lock', 'Music System', 'GPS', 'Bluetooth']
  }],

  // ===== Rate Lists =====
  rate12hr: {
    baseRate: { // Fixed price for the 12hr package - mapped from rateTw
      type: Number,
      required: true,
      default: 500,
      min: 0
    },
    ratePerHour: { 
      type: Number,
      required: true,
      min: 0,
      default: 40
    },
    kmLimit: { // mapped from limitTw
      type: Number,
      required: true,
      min: 0,
      default: 120
    },
    extraChargePerKm: { // mapped from extraTw
      type: Number,
      required: true,
      min: 0,
      default: 3
    },
    extraChargePerHour: { // mapped from extraHrCharge or availTw
      type: Number,
      required: true,
      min: 0,
      default: 50
    },
    gracePeriodMinutes: {
      type: Number,
      default: 15,
      min: 0
    },
    withFuelPerHour: { // mapped from rateWf
      type: Number,
      required: true,
      min: 0,
      default: 50
    },
    withoutFuelPerHour: { // mapped from rateWtf
      type: Number,
      required: true,
      min: 0,
      default: 40
    }
  },

  rateHourly: {
    ratePerHour: { // mapped from rateWf or rateWtf
      type: Number,
      required: true,
      min: 0,
      default: 50
    },
    kmFreePerHour: { // mapped from limitWtf
      type: Number,
      default: 10, // Default 10km free per hour
      min: 0
    },
    extraChargePerKm: { // mapped from rsprkmWf or extraWtf
      type: Number,
      required: true,
      min: 0,
      default: 6
    },
    withFuelPerHour: { // mapped from rateWf
      type: Number,
      default: 50
    },
    withoutFuelPerHour: { // mapped from rateWtf
      type: Number,
      default: 40
    }
  },

  rate24hr: {
    baseRate: { // mapped from rateTf
      type: Number,
      required: true,
      default: 750,
      min: 0
    },
    extraBlockRate: { // Cost for extra 12hr blocks
      type: Number,
      default: 500,
      min: 0
    },
    ratePerHour: {
      type: Number,
      required: true,
      min: 0,
      default: 30
    },
    kmLimit: { // mapped from limitTf
      type: Number,
      required: true,
      min: 0,
      default: 150
    },
    extraChargePerKm: { // mapped from extraTf
      type: Number,
      required: true,
      min: 0,
      default: 3
    },
    extraChargePerHour: { // mapped from availTf
      type: Number,
      required: true,
      min: 0,
      default: 3
    },
    gracePeriodMinutes: {
      type: Number,
      default: 30,
      min: 0
    },
    withFuelPerHour: {
      type: Number,
      required: true,
      min: 0,
      default: 40
    },
    withoutFuelPerHour: {
      type: Number,
      required: true,
      min: 0,
      default: 30
    }
  },

  rateDaily: [{
    dayName: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Weekend', 'Festival-day'],
      required: true
    },
    rate: { // mapped from rateDw
      type: Number,
      required: true,
      min: 0
    },
    kmLimit: { // mapped from limitDw
      type: Number,
      required: true,
      min: 0
    },
    extraChargePerKm: { // mapped from extraDw
      type: Number,
      required: true,
      min: 0
    },
    withFuel: {
      type: Number,
      required: true,
      min: 0
    },
    withoutFuel: {
      type: Number,
      required: true,
      min: 0
    },
    gracePeriodMinutes: {
      type: Number,
      default: 60,
      min: 0
    }
  }],

  // ===== Financial Details =====
  depositAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 2000
  },
  requiredPaymentPercentage: {
    type: Number,
    required: true,
    min: 10,
    max: 100,
    default: 50
  },

  // ===== Maintenance Records =====
  maintenance: [{
    lastServicingDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    nextDueDate: {
      type: Date,
      required: true,
      default: function() {
        return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
      }
    },
    serviceType: {
      type: String,
      enum: ['oil-change', 'tyre-check', 'brake-service', 'general-service', 'battery-check', 'engine-tune', 'full-service'],
      required: true,
      default: 'general-service'
    },
    serviceCost: {
      type: Number,
      min: 0,
      default: 0
    },
    serviceCenter: {
      type: String,
      default: 'Local Service Center'
    },
    notes: {
      type: String,
      default: ''
    },
    isCompleted: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ===== Documents =====
  documents: {
    rcBook: {
      type: String,
      required: true,
      default: 'pending'
    },
    insurance: {
      type: String,
      required: true,
      default: 'pending'
    },
    pollutionCert: {
      type: String,
      required: true,
      default: 'pending'
    },
    puc: {
      type: String,
      default: 'pending'
    } // Pollution Under Control
  },

  // ===== Damage Reports =====
  damageReports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    reportImages: [String],
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical'],
      default: 'minor'
    },
    estimatedCost: {
      type: Number,
      min: 0
    },
    actualCost: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'in-repair', 'resolved', 'disputed'],
      default: 'pending'
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // ===== Analytics =====
  analytics: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalKmDriven: {
      type: Number,
      default: 0
    },
    totalHoursRented: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    lastBookingDate: Date,
    popularTimeslots: [{
      hour: Number,
      count: Number
    }]
  },

  // ===== Seller Information =====
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // ===== Legacy Fields for Migration =====
  // These fields help in mapping from the old structure
  isDeleted: {
    type: Number,
    default: 0
  },

  // ===== Timestamps =====
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ===== Indexes for Performance =====
vehicleSchema.index({ sellerId: 1, status: 1 });
vehicleSchema.index({ sellerId: 1, zoneId: 1 }); // For zone-based vehicle queries by seller
vehicleSchema.index({ zoneId: 1, availability: 1 }); // For zone-based availability queries
vehicleSchema.index({ category: 1, availability: 1 });
vehicleSchema.index({ zoneCode: 1, availability: 1 });
vehicleSchema.index({ locationGeo: '2dsphere' });
vehicleSchema.index({ 'maintenance.nextDueDate': 1 });

// ===== Pre-save Hooks =====
vehicleSchema.pre('save', function (next) {
  this.updatedAt = new Date();

  // Auto-update status based on maintenance due date
  if (this.maintenance && this.maintenance.length > 0) {
    const nextDue = this.maintenance.find(m => !m.isCompleted && m.nextDueDate < new Date());
    if (nextDue && this.status === 'active') {
      this.status = 'in-maintenance';
    }
  }

  next();
});

// ===== Methods =====
vehicleSchema.methods.calculateRate = function (duration, rateType, includesFuel = false) {
  let baseRate = 0;
  let extraCharges = 0;
  let fuelCharges = 0;

  // Rate configuration to return (for booking storage)
  let rateConfig = {
    baseRate: 0,
    ratePerHour: 0,
    kmLimit: 0,
    extraChargePerKm: 0,
    extraChargePerHour: 0,
    gracePeriodMinutes: 0,
    kmFreePerHour: 0, // specific to hourly
    extraBlockRate: 0 // specific to 24h
  };

  // 1. Determine Plan and Logic
  if (['hourly', 'hourly_plan'].includes(rateType)) {
    // 🚗 HOURLY PLAN
    // Time Charge = Total Hours * Hourly Rate
    const hourly = this.rateHourly || {};
    const rate = hourly.ratePerHour || 0;
    const kmFreePerHour = hourly.kmFreePerHour || 10;

    baseRate = duration * rate;

    rateConfig = {
      baseRate: 0, // No fixed base, it's all per hour
      ratePerHour: rate,
      kmLimit: duration * kmFreePerHour, // Dynamic limit
      extraChargePerKm: hourly.extraChargePerKm || 0,
      extraChargePerHour: rate, // Use normal rate for extra hours effectively
      kmFreePerHour: kmFreePerHour,
      gracePeriodMinutes: 0
    };

  } else if (['12hr', 'hourly12', '12_hour'].includes(rateType)) {
    // ⏱ 12-HOUR PLAN
    // Time Charge = Base Rate + (Extra Time * 50)
    const r12 = this.rate12hr || {};
    const baseDuration = 12;

    rateConfig = {
      baseRate: r12.baseRate || 500,
      ratePerHour: r12.ratePerHour || 0,
      kmLimit: r12.kmLimit || 120,
      extraChargePerKm: r12.extraChargePerKm || 0,
      extraChargePerHour: r12.extraChargePerHour || 50,
      gracePeriodMinutes: r12.gracePeriodMinutes || 15
    };

    baseRate = rateConfig.baseRate;

    if (duration > baseDuration) {
      const extraTime = duration - baseDuration;
      extraCharges = extraTime * rateConfig.extraChargePerHour;
    }

  } else if (['24hr', 'hourly24', '24_hour'].includes(rateType)) {
    // ⏱ 24-HOUR PLAN
    // Time Charge = Base 24Hr Rate + (Extra 12Hr Blocks * 500) + (Remaining Hours * 3)
    const r24 = this.rate24hr || {};
    const baseDuration = 24;

    rateConfig = {
      baseRate: r24.baseRate || 750,
      ratePerHour: r24.ratePerHour || 0,
      kmLimit: r24.kmLimit || 150,
      extraChargePerKm: r24.extraChargePerKm || 0,
      extraChargePerHour: r24.extraChargePerHour || 3,
      extraBlockRate: r24.extraBlockRate || 500,
      gracePeriodMinutes: r24.gracePeriodMinutes || 30
    };

    baseRate = rateConfig.baseRate;

    if (duration > baseDuration) {
      const extraTime = duration - baseDuration;

      // Block logic
      const extraBlocks = Math.floor(extraTime / 12);
      const remainingHours = extraTime % 12;

      const blockCharges = extraBlocks * rateConfig.extraBlockRate;
      const hourlyCharges = remainingHours * rateConfig.extraChargePerHour;

      extraCharges = blockCharges + hourlyCharges;
    }

  } else {
    // Default fallback (treat as simple hourly using rate12hr pointer)
    const r = this.rate12hr || {};
    baseRate = duration * (r.ratePerHour || 0);
  }

  // Fuel Logic
  if (includesFuel) {
    // Check if current plan has fuel rates
    let rObj = this.rate12hr;
    if (['hourly', 'hourly_plan'].includes(rateType)) rObj = this.rateHourly;
    if (['24hr', 'hourly24'].includes(rateType)) rObj = this.rate24hr;

    if (rObj && rObj.withFuelPerHour && rObj.withoutFuelPerHour) {
      const diff = rObj.withFuelPerHour - rObj.withoutFuelPerHour;
      fuelCharges = diff * duration;
    }
  }

  return {
    baseRate,
    extraCharges,
    fuelCharges,
    total: baseRate + extraCharges + fuelCharges,
    // Return breakdown and rate config for storage
    breakdown: {
      baseAmount: baseRate,
      extraCharges: extraCharges,
      fuelCharges: fuelCharges,
      total: baseRate + extraCharges + fuelCharges
    },
    rateConfig: rateConfig
  };
};

vehicleSchema.methods.isAvailableForBooking = function () {
  return this.status === 'active' && this.availability === 'available';
};

vehicleSchema.methods.needsMaintenanceSoon = function () {
  if (!this.maintenance || this.maintenance.length === 0) return false;

  const upcomingDue = this.maintenance.find(m => {
    const daysUntilDue = (m.nextDueDate - new Date()) / (1000 * 60 * 60 * 24);
    return !m.isCompleted && daysUntilDue <= 7;
  });

  return !!upcomingDue;
};

// ===== Static Methods =====
vehicleSchema.statics.findByZone = function (zoneCode) {
  return this.find({ zoneCode, status: 'active' });
};

vehicleSchema.statics.findAvailableVehicles = function (category = null, zoneCode = null) {
  let query = { status: 'active', availability: 'available' };

  if (category) query.category = category;
  if (zoneCode) query.zoneCode = zoneCode;

  return this.find(query);
};

vehicleSchema.statics.findNearby = function (longitude, latitude, maxDistance = 10000) {
  return this.find({
    locationGeo: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'active',
    availability: 'available'
  });
};

module.exports = mongoose.model('Vehicle', vehicleSchema);