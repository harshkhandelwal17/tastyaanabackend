// models/ABTest.js
const mongoose = require("mongoose");

const abTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed'],
    default: 'draft'
  },
  variants: [{
    name: String,
    description: String,
    config: mongoose.Schema.Types.Mixed,
    trafficAllocation: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  targetAudience: {
    roles: [String],
    locations: [String],
    userSegments: [String]
  },
  metrics: [{
    name: String,
    type: {
      type: String,
      enum: ['conversion', 'engagement', 'revenue']
    },
    goal: String
  }],
  startDate: Date,
  endDate: Date,
  results: mongoose.Schema.Types.Mixed,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ABTest', abTestSchema);