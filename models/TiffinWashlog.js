// models/TiffinWashLog.js
const mongoose = require('mongoose');

const tiffinWashLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  date: {
    type: Date,
    required: true
  },
  tiffinDetails: {
    type: {
      type: String,
      enum: ['steel', 'glass', 'ceramic', 'disposable'],
      default: 'steel'
    },
    count: {
      type: Number,
      required: true
    },
    condition: {
      type: String,
      enum: ['good', 'stained', 'damaged', 'needs-deep-clean'],
      default: 'good'
    }
  },
  pickupDetails: {
    scheduledTime: Date,
    actualTime: Date,
    pickupBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pickupNotes: String,
    pickupImage: String
  },
  washingDetails: {
    startTime: Date,
    endTime: Date,
    washType: {
      type: String,
      enum: ['regular', 'deep-clean', 'sanitize'],
      default: 'regular'
    },
    washingAgent: String,
    washingNotes: String,
    washedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  deliveryDetails: {
    scheduledTime: Date,
    actualTime: Date,
    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveryNotes: String,
    deliveryImage: String,
    customerSignature: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'picked', 'washing', 'washed', 'out-for-delivery', 'delivered', 'delayed', 'lost'],
    default: 'scheduled'
  },
  charges: {
    washingFee: {
      type: Number,
      default: 0
    },
    pickupFee: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    totalFee: {
      type: Number,
      default: 0
    }
  },
  qualityCheck: {
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    hygiene: {
      type: Number,
      min: 1,
      max: 5
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkTime: Date,
    notes: String,
    passedQC: {
      type: Boolean,
      default: true
    }
  },
  feedback: {
    customerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    customerComment: String,
    ratedAt: Date
  },
  issues: [{
    type: {
      type: String,
      enum: ['damage', 'stain', 'smell', 'missing', 'other']
    },
    description: String,
    reportedBy: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolution: String
  }],
  nextScheduledPickup: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('TiffinWashLog', tiffinWashLogSchema);