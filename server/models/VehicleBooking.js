const mongoose = require('mongoose');

const vehicleBookingSchema = new mongoose.Schema({
  // ===== Basic Booking Information =====
  bookingId: {
    type: String,
    unique: true,
    required: true,
    default: function () {
      return 'VB' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },

  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin/Employee who created booking
    required: false // Can be self-booking by user
  },

  // ===== Booking Source & Cash Flow Tracking =====
  bookingSource: {
    type: String,
    enum: ['online', 'offline', 'seller-portal', 'worker-portal', 'admin'],
    default: 'online',
    index: true,
    description: 'Source of the booking to track where it originated'
  },
  
  // Cash flow management for seller bookings
  cashFlowDetails: {
    isOfflineBooking: {
      type: Boolean,
      default: false,
      description: 'True if booking was created offline by seller/worker'
    },
    cashPaymentDetails: {
      totalCashReceived: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Total cash amount received from customer'
      },
      onlinePaymentAmount: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Amount paid through online payment methods'
      },
      pendingCashAmount: {
        type: Number,
        default: 0,
        min: 0,
        description: 'Remaining cash amount to be collected'
      },
      cashReceivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        description: 'Seller/Worker who received the cash payment'
      },
      cashReceivedAt: {
        type: Date,
        description: 'When the cash payment was received'
      },
      notes: {
        type: String,
        maxlength: 500,
        description: 'Additional notes about cash payment'
      }
    },
    
    // For tracking seller cash handling
    sellerCashFlow: {
      dailyCashCollected: {
        type: Number,
        default: 0,
        description: 'Total cash collected by seller for this booking'
      },
      isHandedOverToAdmin: {
        type: Boolean,
        default: false,
        description: 'Whether cash has been handed over to admin/accounts'
      },
      handoverDate: {
        type: Date,
        description: 'Date when cash was handed over'
      },
      handoverReceiptNo: {
        type: String,
        description: 'Receipt number for cash handover'
      }
    }
  },

  // ===== Booking Timeline =====
  bookingDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  startDateTime: {
    type: Date,
    required: true,
    index: true
  },
  endDateTime: {
    type: Date,
    required: true,
    index: true
  },
  actualStartTime: Date,
  actualEndTime: Date,

  // ===== Location Information =====
  zone: {
    type: String,
    required: true,
    index: true
  },
  zoneId: {
    type: String,
    required: true,
    index: true,
    description: 'Unique identifier for the zone this booking belongs to'
  },
  centerId: {
    type: String,
    required: true
  },
  centerName: String,
  centerAddress: String,

  pickupLocation: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    type: {
      type: String,
      enum: ['center', 'doorstep'],
      default: 'center'
    }
  },

  dropLocation: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    type: {
      type: String,
      enum: ['center', 'doorstep', 'different'],
      default: 'center'
    }
  },

  // ===== Booking Status =====
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled', 'no-show', 'awaiting_approval'],
    default: 'pending',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially-paid', 'paid', 'refunded', 'refund-pending'],
    default: 'unpaid',
    index: true
  },
  refundStatus: {
    type: String,
    enum: ['not-applicable', 'pending', 'approved', 'rejected', 'completed'],
    default: 'not-applicable'
  },

  // ===== Verification Codes for Pickup/Drop =====
  verificationCodes: {
    pickup: {
      code: {
        type: String,
        default: function () {
          return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
        }
      },
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    drop: {
      code: {
        type: String,
        default: function () {
          return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
        }
      },
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },

  // ===== Vehicle Handover & Return Tracking =====
  vehicleHandover: {
    // Start of trip details
    startMeterReading: {
      type: Number,
      required: false,
      min: 0,
      description: 'Odometer reading when vehicle is handed over to customer'
    },
    fuelLevel: {
      type: String,
      enum: ['full', 'three-quarter', 'half', 'quarter', 'empty', 'unknown'],
      default: 'unknown'
    },
    vehicleCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'damaged'],
      default: 'good'
    },
    handoverTime: {
      type: Date,
      description: 'Actual time when vehicle was handed over'
    },
    handoverNotes: {
      type: String,
      maxlength: 500,
      description: 'Any notes about vehicle condition at handover'
    },
    handoverImages: [String], // Photos at handover
    handoverBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'Staff member who handed over the vehicle'
    }
  },

  vehicleReturn: {
    // End of trip details
    submitted: { type: Boolean, default: false },
    submittedAt: Date,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    endMeterReading: {
      type: Number,
      min: 0,
      description: 'Odometer reading when vehicle is returned by customer'
    },
    returnFuelLevel: {
      type: String,
      enum: ['full', 'three-quarter', 'half', 'quarter', 'empty', 'unknown'],
      default: 'unknown'
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'damaged'],
      default: 'good'
    },
    damageNotes: String,
    returnImages: [String], // Photos at return
    vehicleAvailableAgain: { type: Boolean, default: false },
    madeAvailableAt: Date
  },

  // ===== Calculated Trip Metrics =====
  tripMetrics: {
    totalKmTraveled: {
      type: Number,
      min: 0,
      description: 'Calculated as endMeterReading - startMeterReading'
    },
    calculatedAt: {
      type: Date,
      description: 'When the trip metrics were last calculated'
    },
    manualOverride: {
      kmReading: Number,
      reason: String,
      overriddenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      overriddenAt: Date
    }
  },

  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled', 'no-show', 'awaiting_approval'],
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],

  // ===== Rate & Billing Information =====
  rateType: {
    type: String,
    enum: ['hourly', 'hourly12', 'hourly24', 'daily', '12hr', '24hr', 'hourly_plan'],
    required: true
  },
  ratePlanUsed: {
    baseRate: Number,
    ratePerHour: Number,
    kmLimit: Number,
    extraChargePerKm: Number,
    extraChargePerHour: Number,
    gracePeriodMinutes: Number,
    kmFreePerHour: Number, // For Hourly plan
    extraBlockRate: Number, // For 24h plan
    includesFuel: {
      type: Boolean,
      default: false
    }
  },

  // ===== Add-ons / Extras =====
  addons: [{
    name: { type: String, required: true },
    count: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],

  // ===== Billing Breakdown =====
  billing: {
    baseAmount: {
      type: Number,
      required: true,
      min: 0
    },
    extraKmCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    extraHourCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    fuelCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    damageCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    cleaningCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    tollCharges: {
      type: Number,
      default: 0,
      min: 0
    },
    lateFees: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      amount: {
        type: Number,
        default: 0,
        min: 0
      },
      couponCode: String,
      discountType: String // percentage, fixed - renamed from 'type' to avoid conflicts
    },
    taxes: {
      gst: {
        type: Number,
        default: 0
      },
      serviceTax: {
        type: Number,
        default: 0
      }
    },
    totalBill: {
      type: Number,
      required: true,
      min: 0
    }
  },

  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },

  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  // ===== Payment Information =====
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    paymentType: {
      type: String,
      enum: ['UPI', 'Cash', 'Card', 'Wallet', 'Bank Transfer', 'Cheque'],
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['Razorpay', 'Cash', 'Manual'],
      default: 'Razorpay'
    },
    paymentReference: {
      transactionId: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      bankReference: String
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending'
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin/Employee who collected cash
    }
  }],

  // ===== Account & Reference =====
  accountId: {
    type: String,
    index: true // For internal accounting
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  // ===== Customer Information =====
  customerDetails: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    drivingLicense: {
      number: String,
      expiryDate: Date,
      verified: {
        type: Boolean,
        default: false
      }
    }
  },

  // ===== Documents =====
  documents: [{
    type: {
      type: String,
      enum: ['rental-agreement', 'id-proof', 'driving-license', 'address-proof', 'security-deposit-receipt', 'other', 'document', 'documents'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // ===== Accessories Checklist =====
  accessoriesChecklist: {
    helmet: { type: Number, default: 0, min: 0, max: 5 }, // Number of helmets (0-5)
    toolkit: { type: Boolean, default: false },
    spareTyre: { type: Boolean, default: false },
    firstAidKit: { type: Boolean, default: false },
    verifiedAt: Date
  },

  // ===== Vehicle Tracking =====
  rideTracking: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    kmReading: {
      type: Number,
      required: true
    },
    fuelLevel: Number,
    location: {
      lat: Number,
      lng: Number
    },
    status: {
      type: String,
      enum: ['picked-up', 'in-use', 'returned', 'inspection'],
      required: true
    },
    notes: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    images: [String] // Photos of vehicle condition
  }],

  // ===== Refund Processing =====
  refundDetails: {
    reason: {
      type: String,
      enum: ['cancellation', 'early-return', 'overbilling', 'damage-dispute', 'service-issue', 'other']
    },
    requestedAmount: Number,
    approvedAmount: Number,
    refundMethod: {
      type: String,
      enum: ['bank-transfer', 'wallet', 'cash', 'adjustment']
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      holderName: String,
      bankName: String
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processedDate: Date,
    refundReference: String,
    notes: String
  },

  // ===== Ratings & Feedback =====
  rating: {
    vehicleCondition: {
      type: Number,
      min: 1,
      max: 5
    },
    serviceQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  },

  // ===== Additional Information =====
  specialRequests: String,
  adminNotes: String,
  cancellationReason: String,
  cancellationCharges: {
    type: Number,
    default: 0
  },

  // ===== Extension Requests =====
  extensionRequests: [{
    requestId: {
      type: String,
      default: function () {
        return 'EXT' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
      }
    },
    requestedEndDateTime: {
      type: Date,
      required: true
    },
    additionalHours: {
      type: Number,
      required: true
    },
    additionalAmount: {
      type: Number,
      required: true
    },
    additionalGst: {
      type: Number,
      default: 0
    },
    additionalKmLimit: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid', 'expired'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String,
    paymentReference: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      transactionId: String
    },
    paidAt: Date
  }],

  // Track original booking times (before any extensions)
  originalEndDateTime: Date,
  totalExtensionHours: {
    type: Number,
    default: 0
  },
  totalExtensionAmount: {
    type: Number,
    default: 0
  },
  currentKmLimit: {
    type: Number,
    default: 0
  },

  // ===== Dispute Management =====
  disputes: [{
    type: {
      type: String,
      enum: ['damage', 'billing', 'service', 'refund', 'other']
    },
    description: String,
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    raisedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'escalated'],
      default: 'pending'
    },
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    evidence: [String] // Image/document URLs
  }],

  // ===== Timestamps =====
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ===== Indexes for Performance =====
vehicleBookingSchema.index({ vehicleId: 1, startDateTime: 1 });
vehicleBookingSchema.index({ userId: 1, bookingDate: -1 });
vehicleBookingSchema.index({ bookingStatus: 1, startDateTime: 1 });
vehicleBookingSchema.index({ paymentStatus: 1 });
vehicleBookingSchema.index({ zone: 1, bookingDate: -1 });
vehicleBookingSchema.index({ zoneId: 1, bookingDate: -1 }); // For zone-based booking queries
vehicleBookingSchema.index({ bookingSource: 1, bookingDate: -1 }); // For booking source tracking
vehicleBookingSchema.index({ 'cashFlowDetails.isOfflineBooking': 1 }); // For offline booking queries
vehicleBookingSchema.index({ bookedBy: 1, bookingDate: -1 }); // For seller/worker booking queries
vehicleBookingSchema.index({ bookingId: 1 });

// ===== Pre-save Hooks =====
vehicleBookingSchema.pre('save', function (next) {
  this.updatedAt = new Date();

  // Auto-calculate total hours
  if (this.startDateTime && this.endDateTime) {
    this.totalHours = Math.ceil((this.endDateTime - this.startDateTime) / (1000 * 60 * 60));
  }

  // Auto-update payment status based on paid amount
  if (this.paidAmount >= this.billing.totalBill) {
    this.paymentStatus = 'paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partially-paid';
  }

  next();
});

// ===== Methods =====
vehicleBookingSchema.methods.calculateDuration = function () {
  const start = this.actualStartTime || this.startDateTime;
  const end = this.actualEndTime || this.endDateTime;
  return Math.ceil((end - start) / (1000 * 60 * 60)); // in hours
};

vehicleBookingSchema.methods.calculateExtraCharges = function (actualKm, actualHours) {
  let extraKmCharge = 0;
  let extraHourCharge = 0;

  if (actualKm > this.ratePlanUsed.kmLimit) {
    extraKmCharge = (actualKm - this.ratePlanUsed.kmLimit) * this.ratePlanUsed.extraChargePerKm;
  }

  const plannedHours = Math.ceil((this.endDateTime - this.startDateTime) / (1000 * 60 * 60));
  if (actualHours > plannedHours) {
    extraHourCharge = (actualHours - plannedHours) * this.ratePlanUsed.extraChargePerHour;
  }

  return { extraKmCharge, extraHourCharge };
};

// ===== Meter Reading Calculation Methods =====

vehicleBookingSchema.methods.calculateTripMetrics = function () {
  const startReading = this.vehicleHandover?.startMeterReading;
  const endReading = this.vehicleReturn?.endMeterReading;
  
  if (!startReading || !endReading) {
    return {
      success: false,
      message: 'Both start and end meter readings are required',
      totalKmTraveled: null
    };
  }
  
  if (endReading < startReading) {
    return {
      success: false,
      message: 'End meter reading cannot be less than start meter reading',
      totalKmTraveled: null
    };
  }
  
  const totalKmTraveled = endReading - startReading;
  
  // Update the tripMetrics
  this.tripMetrics = {
    totalKmTraveled: totalKmTraveled,
    calculatedAt: new Date()
  };
  
  return {
    success: true,
    totalKmTraveled: totalKmTraveled,
    startReading: startReading,
    endReading: endReading
  };
};

vehicleBookingSchema.methods.updateMeterReading = function (type, reading, updatedBy = null) {
  if (type === 'start') {
    this.vehicleHandover = this.vehicleHandover || {};
    this.vehicleHandover.startMeterReading = reading;
    this.vehicleHandover.handoverTime = new Date();
    if (updatedBy) {
      this.vehicleHandover.handoverBy = updatedBy;
    }
  } else if (type === 'end') {
    this.vehicleReturn = this.vehicleReturn || {};
    this.vehicleReturn.endMeterReading = reading;
    this.vehicleReturn.submittedAt = new Date();
    this.vehicleReturn.submitted = true;
    if (updatedBy) {
      this.vehicleReturn.submittedBy = updatedBy;
    }
  }
  
  // Automatically calculate trip metrics if both readings are available
  const metrics = this.calculateTripMetrics();
  return metrics;
};

vehicleBookingSchema.methods.calculateExtraKmCharges = function () {
  const metrics = this.calculateTripMetrics();
  
  if (!metrics.success || !this.ratePlanUsed?.kmLimit) {
    return {
      success: false,
      message: 'Cannot calculate extra km charges: ' + (metrics.message || 'Rate plan km limit not found'),
      extraKmCharge: 0
    };
  }
  
  const totalKm = metrics.totalKmTraveled;
  const kmLimit = this.ratePlanUsed.kmLimit;
  const extraChargePerKm = this.ratePlanUsed.extraChargePerKm || 0;
  
  let extraKm = 0;
  let extraKmCharge = 0;
  
  if (totalKm > kmLimit) {
    extraKm = totalKm - kmLimit;
    extraKmCharge = extraKm * extraChargePerKm;
  }
  
  return {
    success: true,
    totalKm: totalKm,
    kmLimit: kmLimit,
    extraKm: extraKm,
    extraChargePerKm: extraChargePerKm,
    extraKmCharge: extraKmCharge
  };
};

vehicleBookingSchema.methods.finalizeBookingBilling = function () {
  const tripMetrics = this.calculateTripMetrics();
  const extraKmCharges = this.calculateExtraKmCharges();
  
  if (!tripMetrics.success) {
    return {
      success: false,
      message: 'Cannot finalize billing: ' + tripMetrics.message
    };
  }
  
  // Update billing with extra km charges
  if (extraKmCharges.success) {
    this.billing.extraKmCharge = extraKmCharges.extraKmCharge;
    
    // Recalculate total bill
    const baseAmount = this.billing.baseAmount || 0;
    const extraKmCharge = this.billing.extraKmCharge || 0;
    const extraHourCharge = this.billing.extraHourCharge || 0;
    const fuelCharges = this.billing.fuelCharges || 0;
    const damageCharges = this.billing.damageCharges || 0;
    const cleaningCharges = this.billing.cleaningCharges || 0;
    const tollCharges = this.billing.tollCharges || 0;
    const lateFees = this.billing.lateFees || 0;
    
    this.billing.totalBill = baseAmount + extraKmCharge + extraHourCharge + 
                            fuelCharges + damageCharges + cleaningCharges + 
                            tollCharges + lateFees;
  }
  
  return {
    success: true,
    tripMetrics: tripMetrics,
    extraCharges: extraKmCharges,
    finalBilling: this.billing
  };
};

vehicleBookingSchema.methods.canBeCancelled = function () {
  const now = new Date();
  const bookingStart = new Date(this.startDateTime);
  const hoursDifference = (bookingStart - now) / (1000 * 60 * 60);

  return this.bookingStatus === 'confirmed' && hoursDifference >= 2;
};

vehicleBookingSchema.methods.calculateCancellationCharges = function () {
  const now = new Date();
  const bookingStart = new Date(this.startDateTime);
  const hoursDifference = (bookingStart - now) / (1000 * 60 * 60);

  if (hoursDifference >= 24) return 0; // Free cancellation
  if (hoursDifference >= 12) return this.billing.totalBill * 0.25; // 25%
  if (hoursDifference >= 2) return this.billing.totalBill * 0.50; // 50%

  return this.billing.totalBill; // 100% if less than 2 hours
};

vehicleBookingSchema.methods.isRefundEligible = function () {
  return ['completed', 'cancelled'].includes(this.bookingStatus) &&
    ['paid', 'partially-paid'].includes(this.paymentStatus);
};

// ===== Static Methods =====
vehicleBookingSchema.statics.findActiveBookings = function (vehicleId = null) {
  let query = { bookingStatus: { $in: ['confirmed', 'ongoing'] } };
  if (vehicleId) query.vehicleId = vehicleId;
  return this.find(query);
};

vehicleBookingSchema.statics.findUserBookings = function (userId, status = null) {
  let query = { userId };
  if (status) query.bookingStatus = status;
  return this.find(query).sort({ bookingDate: -1 });
};

vehicleBookingSchema.statics.findZoneBookings = function (zone, startDate, endDate) {
  return this.find({
    zone,
    bookingDate: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

vehicleBookingSchema.statics.getBookingStats = function (sellerId, startDate, endDate) {
  return this.aggregate([
    {
      $lookup: {
        from: 'vehicles',
        localField: 'vehicleId',
        foreignField: '_id',
        as: 'vehicle'
      }
    },
    {
      $match: {
        'vehicle.sellerId': sellerId,
        bookingDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$billing.totalBill' },
        totalPaid: { $sum: '$paidAmount' },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
};

// ===== VIRTUAL PROPERTIES =====

// Calculate correct total bill to prevent double-counting
vehicleBookingSchema.virtual('correctTotalBill').get(function () {
  const billing = this.billing;
  const rentalCost = (billing.baseAmount || 0) +
    (billing.extraHourCharge || 0) +
    (billing.fuelCharges || 0);
  const additionalCharges = (billing.extraKmCharge || 0) +
    (billing.damageCharges || 0) +
    (billing.cleaningCharges || 0) +
    (billing.tollCharges || 0) +
    (billing.lateFees || 0);
  // Calculate addons total from the addons array
  const addonsTotal = (this.addons || []).reduce((sum, addon) => sum + (addon.price * (addon.count || 1)), 0);
  const subtotal = rentalCost + additionalCharges + addonsTotal - (billing.discount?.amount || 0);
  const taxes = (billing.taxes?.gst || 0) + (billing.taxes?.serviceTax || 0);
  const deposit = this.depositAmount || 0;

  return subtotal + taxes + deposit;
});

// Calculate rental subtotal (before taxes and deposit)
vehicleBookingSchema.virtual('rentalSubtotal').get(function () {
  const billing = this.billing;
  const addonsTotal = (this.addons || []).reduce((sum, addon) => sum + (addon.price * (addon.count || 1)), 0);
  return (billing.baseAmount || 0) +
    (billing.extraHourCharge || 0) +
    (billing.fuelCharges || 0) +
    (billing.extraKmCharge || 0) +
    (billing.damageCharges || 0) +
    (billing.cleaningCharges || 0) +
    (billing.tollCharges || 0) +
    (billing.lateFees || 0) +
    addonsTotal -
    (billing.discount?.amount || 0);
});

// ===== MIDDLEWARE =====

// Pre-save hook to validate and correct total bill calculation
vehicleBookingSchema.pre('save', function (next) {
  const correctTotal = this.correctTotalBill;

  // If total bill is incorrect, log the discrepancy
  if (Math.abs(this.billing.totalBill - correctTotal) > 1) { // Allow for 1 rupee rounding difference
    console.warn(`Booking ${this.bookingId}: Total bill discrepancy detected`);
    console.warn(`Stored: ${this.billing.totalBill}, Calculated: ${correctTotal}`);

    // Auto-correct the total bill
    this.billing.totalBill = correctTotal;
  }

  next();
});

// ===== STATIC METHODS FOR BOOKING TYPE IDENTIFICATION =====

vehicleBookingSchema.statics.isOnlineBooking = function(booking) {
  return booking.bookingSource === 'online';
};

vehicleBookingSchema.statics.isOfflineBooking = function(booking) {
  return ['seller-portal', 'worker-portal', 'offline'].includes(booking.bookingSource) || 
         booking.cashFlowDetails?.isOfflineBooking === true;
};

vehicleBookingSchema.statics.getBookingsByType = function(type = 'all', filters = {}) {
  let query = { ...filters };
  
  if (type === 'online') {
    query.bookingSource = 'online';
  } else if (type === 'offline') {
    query.bookingSource = { $in: ['seller-portal', 'worker-portal', 'offline'] };
  }
  
  return this.find(query);
};

vehicleBookingSchema.statics.getBookingStats = function(dateRange = {}) {
  const matchStage = {};
  if (dateRange.startDate) matchStage.bookingDate = { $gte: new Date(dateRange.startDate) };
  if (dateRange.endDate) {
    matchStage.bookingDate = { 
      ...matchStage.bookingDate, 
      $lte: new Date(dateRange.endDate) 
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$bookingSource',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$billing.finalAmount' },
        totalCashReceived: { $sum: '$cashFlowDetails.cashPaymentDetails.totalCashReceived' },
        averageBookingValue: { $avg: '$billing.finalAmount' }
      }
    }
  ]);
};

// ===== INSTANCE METHODS =====

vehicleBookingSchema.methods.getBookingTypeInfo = function() {
  return {
    source: this.bookingSource,
    type: this.bookingSource === 'online' ? 'online' : 'offline',
    isOfflineBooking: this.cashFlowDetails?.isOfflineBooking || false,
    createdBy: this.getCreatedBy(),
    paymentMethod: this.paymentMethod,
    cashReceived: this.cashFlowDetails?.cashPaymentDetails?.totalCashReceived || 0
  };
};

vehicleBookingSchema.methods.getCreatedBy = function() {
  switch(this.bookingSource) {
    case 'online': return 'Customer (Online)';
    case 'seller-portal': return 'Seller (Offline)';
    case 'worker-portal': return 'Worker (Offline)';
    case 'admin': return 'Admin';
    default: return 'Unknown';
  }
};

module.exports = mongoose.model('VehicleBooking', vehicleBookingSchema);