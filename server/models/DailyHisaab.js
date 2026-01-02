const mongoose = require('mongoose');

// Individual product sale schema
const productSaleSchema = new mongoose.Schema({
  count: {
    type: Number,
    required: [true, 'Count is required'],
    min: [1, 'Count must be at least 1']
  },
  type: {
    type: String,
    required: [true, 'Product type is required'],
    enum: ['tiffin', 'other', 'subscription']
  },
  orderType: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline',
    required: [true, 'Order type is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  sellsTo: [{
    type: String,
    trim: true
  }],
  sellsBy: {
    type: String,
    required: [true, 'Seller name is required']
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required']
  },
  subscriptionUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [
      function() { return this.type === 'subscription'; },
      'Subscription user is required for subscription type products'
    ]
  },
  productName: {
    type: String,
    required: [true, 'Product name is required']
  },
  unit: {
    type: String,
    enum: ['kg', 'piece', 'packet', 'dozen', 'litre','plate','gm','thali','ml','bowl', 'plate'],
    required: [true, 'Unit is required']
  },
  collectedPayment: {
    type: Number,
    default: 0,
    required: [true, 'Collected payment is required'],
    min: [0, 'Collected payment cannot be negative']
  },
  entryDate: {
    type: Date,
    required: [true, 'Entry date is required'],
    default: Date.now
  },
  deliveryBoyName: {
    type: String,
    required: [true, 'Delivery boy name is required']
  },
  deliveryBoyPhone: {
    type: String,
    required: [true, 'Delivery boy phone is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  deliveryBoyName: {
    type: String,
    trim: true
  },
  deliveryBoyPhone: {
    type: String,
    trim: true
  }
}, { 
  _id: true,timestamps:true,
  timestamps: true 
});

// Daily hisaab schema
const dailyHisaabSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required']
  },
  sellerName: {
    type: String,
    required: [true, 'Seller name is required']
  },
  products: [productSaleSchema],
  totalSell: {
    type: Number,
    default: 0
  },
  totalTiffin: {
    type: Number,
    default: 0
  },
  totalOther: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
dailyHisaabSchema.index({ seller: 1, date: 1 }, { unique: true });

// Calculate totals before saving
dailyHisaabSchema.pre('save', function(next) {
  this.totalSell = 0;
  this.totalTiffin = 0;
  this.totalOther = 0;

  this.products.forEach(product => {
    const productTotal = product.count * product.price;
    this.totalSell += productTotal;
    
    if (product.type === 'tiffin') {
      this.totalTiffin += product.count;
    } else {
      this.totalOther += product.count;
    }
  });
  
  next();
});

// Prevent duplicate hisaab for the same seller and date
dailyHisaabSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Hisaab already exists for this date'));
  } else {
    next(error);
  }
});

// Virtual for formatted date
dailyHisaabSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Static method to get current day's hisaab
dailyHisaabSchema.statics.getTodaysHisaab = async function(sellerId) {
  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0));
  const end = new Date(today.setHours(23, 59, 59, 999));
  
  return this.findOne({
    seller: sellerId,
    date: { $gte: start, $lte: end }
  });
};

const DailyHisaab = mongoose.model('DailyHisaab', dailyHisaabSchema);

module.exports = DailyHisaab;
