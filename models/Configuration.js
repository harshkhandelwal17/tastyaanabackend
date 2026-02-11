// models/Configuration.js
const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'payment', 'delivery', 'notification', 'business', 'feature'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validationRules: {
    min: Number,
    max: Number,
    required: Boolean,
    pattern: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Configuration', configurationSchema);