const mongoose = require('mongoose');

const grocerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'dairy', 'grains', 'spices']
  },
  subCategory: {
    type: String
  },
  weight: {
    type: String,
    default: '500g'
  },
  unit: {
    type: String,
    default: 'kg',
    enum: ['g', 'kg', 'piece', 'packet', 'dozen']
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  images: [{
    url: String,
    publicId: String
  }],
  ratings: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  tags: [String],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add text index for search
// grocerySchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for getting the discount percentage
// grocerySchema.virtual('discountPercentage').get(function() {
//   if (this.originalPrice && this.originalPrice > this.price) {
//     return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
//   }
//   return 0;
// });

// Update the original price if discount is applied
// grocerySchema.pre('save', function(next) {
//   if (this.isModified('discount') && this.discount > 0 && this.discount <= 100) {
//     this.originalPrice = this.price;
//     this.price = this.price - (this.price * (this.discount / 100));
//   }
//   next();
// });

const Grocery = mongoose.model('Grocery', grocerySchema);

module.exports = Grocery;
