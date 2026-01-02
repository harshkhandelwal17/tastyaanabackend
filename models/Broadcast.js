// models/Broadcast.js
const mongoose = require("mongoose");

const broadcastSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['notification', 'email', 'sms', 'push'],
    required: true
  },
  audience: {
    type: String,
    enum: ['all', 'customers', 'sellers', 'admins', 'custom'],
    required: true
  },
  customAudience: {
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    roles: [String],
    locations: [String],
    segments: [String]
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
    default: 'draft'
  },
  scheduledAt: Date,
  sentAt: Date,
  statistics: {
    totalRecipients: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Broadcast', broadcastSchema);