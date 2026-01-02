const mongoose = require('mongoose');
const analyticsSchema = new mongoose.Schema({
date: {
    type: Date,
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Sales Metrics
  sales: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    }
  },
  // Product Metrics
  products: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalAddToCart: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  
  // User Metrics
  users: {
    newUsers: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    returningUsers: {
      type: Number,
      default: 0
    }
  },
  
  // Top Products
  topProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    sales: Number,
    revenue: Number
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Analytics', analyticsSchema);

//add conversion rate and high analytics in this during implimentation .. harsh 
