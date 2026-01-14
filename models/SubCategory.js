const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  // Parent category reference
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  // Display and organization
  description: {
    type: String,
    maxlength: 500
  },

  image: {
    url: String,
    alt: String,
    publicId: String
  },

  icon: {
    type: String,
    trim: true
  },

  // SEO and URL
  slug: {
    type: String,
    lowercase: true,
    index: true
  },

  metaData: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },

  // Status and visibility
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  // Ordering and display
  priority: {
    type: Number,
    default: 0,
    comment: 'Higher values appear first in listings'
  },

  displayOrder: {
    type: Number,
    default: 0
  },

  // Product specifications
  allowedSpecifications: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select'],
      default: 'text'
    },
    options: [String], // For select type
    isRequired: {
      type: Boolean,
      default: false
    },
    unit: String // For number type (kg, cm, etc.)
  }],

  // Business settings
  commission: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    comment: 'Commission percentage for this subcategory'
  },

  minOrderAmount: {
    type: Number,
    min: 0,
    default: 0
  },

  maxOrderQuantity: {
    type: Number,
    min: 1,
    default: 100
  },

  // Statistics
  totalProducts: {
    type: Number,
    default: 0
  },

  totalSellers: {
    type: Number,
    default: 0
  },

  totalOrders: {
    type: Number,
    default: 0
  },

  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },

  // Administrative
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Additional attributes
  attributes: [{
    name: String,
    value: String,
    type: {
      type: String,
      enum: ['filter', 'display', 'specification'],
      default: 'filter'
    }
  }],

  // Delivery settings specific to subcategory
  deliverySettings: {
    isDigital: {
      type: Boolean,
      default: false
    },
    isPerishable: {
      type: Boolean,
      default: false
    },
    requiresSpecialHandling: {
      type: Boolean,
      default: false
    },
    estimatedPreparationTime: {
      type: Number,
      default: 0,
      comment: 'Time in hours to prepare the product'
    }
  }

}, {
  timestamps: true
});

// Compound indexes for performance
subCategorySchema.index({ category: 1, isActive: 1 });
subCategorySchema.index({ category: 1, priority: -1, displayOrder: 1 });
subCategorySchema.index({ name: 'text', description: 'text' });
subCategorySchema.index({ slug: 1 }, { unique: true, sparse: true });
subCategorySchema.index({ isFeatured: 1, isActive: 1, priority: -1 });

// Virtual for full category path
subCategorySchema.virtual('fullPath').get(function() {
  if (this.populated('category')) {
    return `${this.category.name} > ${this.name}`;
  }
  return this.name;
});

// Pre-save middleware to generate slug
subCategorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    // Create slug from category + subcategory name for uniqueness
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    this.slug = baseSlug;
  }
  next();
});

// Pre-save middleware to ensure unique slug
subCategorySchema.pre('save', async function(next) {
  if (this.isModified('slug') || this.isNew) {
    const originalSlug = this.slug;
    let counter = 1;
    
    while (true) {
      const existing = await this.constructor.findOne({
        slug: this.slug,
        _id: { $ne: this._id }
      });
      
      if (!existing) break;
      
      this.slug = `${originalSlug}-${counter}`;
      counter++;
    }
  }
  next();
});

// Instance methods
subCategorySchema.methods.getActiveProducts = function() {
  return mongoose.model('Product').find({
    subcategory: this._id,
    isActive: true
  });
};

subCategorySchema.methods.updateStatistics = async function() {
  const Product = mongoose.model('Product');
  
  const stats = await Product.aggregate([
    { $match: { subcategory: this._id } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        averageRating: { $avg: '$ratings.average' },
        uniqueSellers: { $addToSet: '$seller' }
      }
    }
  ]);

  if (stats.length > 0) {
    this.totalProducts = stats[0].totalProducts || 0;
    this.averageRating = Math.round((stats[0].averageRating || 0) * 10) / 10;
    this.totalSellers = stats[0].uniqueSellers ? stats[0].uniqueSellers.length : 0;
    await this.save();
  }
};

// Static methods
subCategorySchema.statics.findByCategory = function(categoryId, includeInactive = false) {
  const query = { category: categoryId };
  if (!includeInactive) {
    query.isActive = true;
  }
  
  return this.find(query)
    .populate('category')
    .sort({ priority: -1, displayOrder: 1, name: 1 });
};

subCategorySchema.statics.getFeatured = function() {
  return this.find({ 
    isFeatured: true, 
    isActive: true 
  })
  .populate('category')
  .sort({ priority: -1, name: 1 });
};

subCategorySchema.statics.search = function(query) {
  return this.find({
    $text: { $search: query },
    isActive: true
  })
  .populate('category')
  .sort({ score: { $meta: 'textScore' } });
};

// Virtual to include category data
subCategorySchema.virtual('categoryData', {
  ref: 'Category',
  localField: 'category',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
subCategorySchema.set('toJSON', { virtuals: true });
subCategorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);