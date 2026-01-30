const mongoose = require('mongoose');

const vehicleRefundSchema = new mongoose.Schema({
  // ===== Basic Refund Information =====
  refundId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'REF' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 4).toUpperCase();
    }
  },
  
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleBooking',
    required: true,
    index: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },

  // ===== Refund Amount Details =====
  originalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  requestedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  approvedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  processingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  finalRefundAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // ===== Refund Status & Timeline =====
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  reason: {
    type: String,
    required: true,
    maxLength: 500
  },
  
  adminNotes: {
    type: String,
    maxLength: 1000
  },
  
  customerNotes: {
    type: String,
    maxLength: 500
  },

  // ===== Processing Information =====
  refundMethod: {
    type: String,
    enum: ['bank_transfer', 'wallet', 'cash', 'original_payment_method'],
    default: 'bank_transfer'
  },
  
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  
  paymentGatewayDetails: {
    gatewayRefundId: String,
    razorpayRefundId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    processingFeeCharged: Number
  },

  // ===== Timeline Tracking =====
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  processedAt: {
    type: Date
  },
  
  completedAt: {
    type: Date
  },
  
  estimatedCompletionDate: {
    type: Date
  },
  
  estimatedDays: {
    type: Number,
    default: 5 // Default 5 business days
  },

  // ===== Staff Information =====
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Could be customer or admin who initiated
  },
  
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who processed
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who approved
  },

  // ===== Customer Communication =====
  emailSent: {
    type: Boolean,
    default: false
  },
  
  smsSent: {
    type: Boolean,
    default: false
  },
  
  customerNotified: {
    type: Boolean,
    default: false
  },

  // ===== System Information =====
  metadata: {
    ipAddress: String,
    userAgent: String,
    refundInitiatedFrom: String // 'admin_panel', 'customer_app', 'api'
  },
  
  documents: [{
    type: {
      type: String,
      enum: ['cancellation_form', 'bank_proof', 'damage_assessment', 'other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===== INDEXES =====
vehicleRefundSchema.index({ bookingId: 1, status: 1 });
vehicleRefundSchema.index({ userId: 1, status: 1 });
vehicleRefundSchema.index({ requestedAt: -1 });
vehicleRefundSchema.index({ status: 1, estimatedCompletionDate: 1 });

// ===== VIRTUALS =====
vehicleRefundSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed') return 0;
  if (!this.estimatedCompletionDate) return null;
  
  const now = new Date();
  const diffTime = this.estimatedCompletionDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

vehicleRefundSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed') return false;
  if (!this.estimatedCompletionDate) return false;
  
  return new Date() > this.estimatedCompletionDate;
});

vehicleRefundSchema.virtual('processingTime').get(function() {
  if (!this.processedAt) return null;
  return this.processedAt - this.requestedAt;
});

// ===== METHODS =====
vehicleRefundSchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  this.processedAt = new Date();
  
  // Set estimated completion date
  const estimatedCompletion = new Date();
  estimatedCompletion.setDate(estimatedCompletion.getDate() + this.estimatedDays);
  this.estimatedCompletionDate = estimatedCompletion;
  
  return this.save();
};

vehicleRefundSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

vehicleRefundSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.adminNotes = reason;
  return this.save();
};

vehicleRefundSchema.methods.getStatusDisplay = function() {
  const statusMap = {
    'pending': { text: '⏳ Refund Pending', color: 'yellow' },
    'processing': { text: '🔄 Processing Refund', color: 'blue' },
    'completed': { text: '✅ Refund Completed', color: 'green' },
    'failed': { text: '❌ Refund Failed', color: 'red' },
    'cancelled': { text: '🚫 Refund Cancelled', color: 'gray' }
  };
  
  return statusMap[this.status] || statusMap['pending'];
};

// ===== STATIC METHODS =====
vehicleRefundSchema.statics.getRefundStats = async function(filter = {}) {
  const stats = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$finalRefundAmount' }
      }
    }
  ]);
  
  const result = {
    total: 0,
    totalAmount: 0,
    pending: { count: 0, amount: 0 },
    processing: { count: 0, amount: 0 },
    completed: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 }
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    result.totalAmount += stat.totalAmount;
    if (result[stat._id]) {
      result[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount
      };
    }
  });
  
  return result;
};

vehicleRefundSchema.statics.getPendingRefunds = function() {
  return this.find({
    status: { $in: ['pending', 'processing'] }
  })
  .populate('bookingId', 'bookingId')
  .populate('userId', 'name phone email')
  .populate('vehicleId', 'name vehicleNumber')
  .sort({ requestedAt: -1 });
};

vehicleRefundSchema.statics.getOverdueRefunds = function() {
  return this.find({
    status: { $in: ['pending', 'processing'] },
    estimatedCompletionDate: { $lt: new Date() }
  })
  .populate('bookingId', 'bookingId')
  .populate('userId', 'name phone email')
  .sort({ estimatedCompletionDate: 1 });
};

module.exports = mongoose.model('VehicleRefund', vehicleRefundSchema);