
// utils/analytics.js
const Analytics = require('../models/Analytics');
const Order = require('../models/Order');
const Product = require('../models/Product');

const generateDailyAnalytics = async (sellerId, date) => {
  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Calculate daily metrics
    const orderStats = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 
        'items.seller': sellerId,
        createdAt: { $gte: startDate, $lte: endDate }
      }},
      { $group: {
        _id: null,
        revenue: { $sum: '$items.price' },
        orders: { $sum: 1 },
        customers: { $addToSet: '$customer' }
      }}
    ]);

    const productCount = await Product.countDocuments({ 
      seller: sellerId,
      createdAt: { $lte: endDate }
    });

    // Top products for the day
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 
        'items.seller': sellerId,
        createdAt: { $gte: startDate, $lte: endDate }
      }},
      { $group: {
        _id: '$items.product',
        sales: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.price' }
      }},
      { $sort: { sales: -1 } },
      { $limit: 5 }
    ]);

    const analytics = await Analytics.findOneAndUpdate(
      { seller: sellerId, date: startDate },
      {
        seller: sellerId,
        date: startDate,
        metrics: {
          revenue: orderStats[0]?.revenue || 0,
          orders: orderStats[0]?.orders || 0,
          products: productCount,
          customers: orderStats[0]?.customers?.length || 0,
          views: 0, // This would be updated from product view events
          conversions: 0
        },
        topProducts
      },
      { upsert: true, new: true }
    );

    return analytics;
  } catch (error) {
    console.error('Error generating analytics:', error);
  }
};

module.exports = { generateDailyAnalytics };
