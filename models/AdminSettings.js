const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  // Maximum number of days that can be skipped in a month
  maxSkipDays: { 
    type: Number, 
    default: 4,
    min: 1,
    max: 8 // Absolute maximum limit for safety
  },
  // Maximum number of meals that can be skipped in a month
  maxSkipMeals: {
    type: Number,
    default: 8, // 4 days * 2 meals per day
    min: 1
  },
  // Type of the last update (system or user)
  updatedByType: {
    type: String,
    enum: ['system', 'user'],
    default: 'system'
  },
  // Admin who last updated the settings (optional for system updates)
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.updatedByType === 'user';
    }
  }
}, { timestamps: true });

// Update maxSkipMeals when maxSkipDays changes
adminSettingsSchema.pre('save', function(next) {
  this.maxSkipMeals = this.maxSkipDays * 2; // 2 meals per day
  next();
});

// Static method to get current settings
adminSettingsSchema.statics.getCurrentSettings = async function() {
  let settings = await this.findOne({}).sort({ updatedAt: -1 });
  
  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({
      updatedByType: 'system',
      updatedBy: null
    });
  }
  
  return settings;
};

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
