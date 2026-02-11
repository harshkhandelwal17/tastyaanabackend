// models/FeatureFlag.js
const mongoose = require("mongoose");

const featureFlagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  isEnabled: {
    type: Boolean,
    default: false
  },
  rolloutPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  targetRoles: [{
    type: String,
    enum: ['customer', 'seller', 'admin', 'superadmin']
  }],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startDate: Date,
  endDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);