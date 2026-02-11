const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: String,
  image: String,
  icon: String,
  slug: {
    type: String,
    unique: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  seoData: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
});
module.exports = mongoose.model('Category', categorySchema);





