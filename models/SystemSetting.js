// models/SystemSettings.js
const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['payment', 'shipping', 'tax', 'general', 'security', 'features']
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: mongoose.Schema.Types.Mixed,
  description: String,
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    default: 'string'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

systemSettingsSchema.index({ category: 1, key: 1 });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);