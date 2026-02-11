const mongoose = require('mongoose');   
const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  subtitle: String,
  description: String,
  
  // Images
  image: {
    desktop: String,
    mobile: String,
    tablet: String
  },
  
  // Link & Action
  linkType: {
    type: String,
    enum: ['product', 'category', 'page', 'external'],
    required: true
  },
  linkUrl: String,
  buttonText: String,
  
  // Display Settings
  position: {
    type: String,
    enum: ['hero', 'featured', 'sidebar', 'footer'],
    default: 'hero'
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: Date,
  endDate: Date,
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Banner', bannerSchema);