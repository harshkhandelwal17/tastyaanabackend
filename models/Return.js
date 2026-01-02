// models/Return.js
const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['damaged', 'wrong_item', 'not_as_described', 'size_issue', 'quality_issue', 'other'],
    required: true
  },
  description: String,
  images: [String],
  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'picked_up', 'refunded'],
    default: 'requested'
  },
  refundAmount: Number,
  refundMethod: {
    type: String,
    enum: ['original_payment', 'wallet', 'bank_transfer']
  },
  adminNotes: String,
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Return', returnSchema);