// controllers/advancedAnalyticsController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const { generateMLPredictions } = require('../utils/mlAnalytics');
const { calculateBusinessMetrics } = require('../utils/businessMetrics');

// Advanced Dashboard Analytics
exports.getAdvancedDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { period = '30d', timezone = 'Asia/Kolkata' } = req.query;
    
    const dateRange = getDateRange(period);
    
    // Parallel execution of analytics queries
    const [
      revenueMetrics,
      orderMetrics,
      customerMetrics,
      productMetrics,
      conversionMetrics,
      trendAnalysis,
      predictiveMetrics
    ] = await Promise.all([
      calculateRevenueMetrics(sellerId, dateRange),
      calculateOrderMetrics(sellerId, dateRange),
      calculateCustomerMetrics(sellerId, dateRange),
      calculateProductMetrics(sellerId, dateRange),
      calculateConversionMetrics(sellerId, dateRange),
      calculateTrendAnalysis(sellerId, dateRange),
      generateMLPredictions(sellerId, dateRange)
    ]);

    res.json({
      summary: {
        revenue: revenueMetrics,
        orders: orderMetrics,
        customers: customerMetrics,
        products: productMetrics,
        conversion: conversionMetrics
      },
      trends: trendAnalysis,
      predictions: predictiveMetrics,
      generatedAt: new Date(),
      period,
      timezone
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Revenue Analytics with Advanced Metrics
const calculateRevenueMetrics = async (sellerId, dateRange) => {
  const pipeline = [
    { $unwind: '$items' },
    { $match: { 
      'items.seller': sellerId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    }},
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$items.price' },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$items.price' },
        maxOrderValue: { $max: '$items.price' },
        minOrderValue: { $min: '$items.price' },
        totalTax: { $sum: '$taxAmount' },
        totalShipping: { $sum: '$shippingAmount' },
        totalDiscount: { $sum: '$discountAmount' }
      }
    }
  ];

  const [current, previous] = await Promise.all([
    Order.aggregate(pipeline),
    Order.aggregate([
      ...pipeline.slice(0, 2),
      { $match: { 
        'items.seller': sellerId,
        createdAt: { 
          $gte: new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime())),
          $lt: dateRange.start
        }
      }},
      ...pipeline.slice(3)
    ])
  ]);

  const currentData = current[0] || {};
  const previousData = previous[0] || {};

  return {
    current: {
      total: currentData.totalRevenue || 0,
      orders: currentData.totalOrders || 0,
      avgOrderValue: currentData.avgOrderValue || 0,
      maxOrder: currentData.maxOrderValue || 0,
      minOrder: currentData.minOrderValue || 0,
      tax: currentData.totalTax || 0,
      shipping: currentData.totalShipping || 0,
      discount: currentData.totalDiscount || 0
    },
    growth: {
      revenue: calculateGrowthRate(currentData.totalRevenue, previousData.totalRevenue),
      orders: calculateGrowthRate(currentData.totalOrders, previousData.totalOrders),
      avgOrderValue: calculateGrowthRate(currentData.avgOrderValue, previousData.avgOrderValue)
    },
    breakdown: await getRevenueBreakdown(sellerId, dateRange)
  };
};

// Customer Analytics with Segmentation
const calculateCustomerMetrics = async (sellerId, dateRange) => {
  const customerAnalysis = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 
      'items.seller': sellerId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    }},
    {
      $group: {
        _id: '$customer',
        totalSpent: { $sum: '$items.price' },
        orderCount: { $sum: 1 },
        firstOrder: { $min: '$createdAt' },
        lastOrder: { $max: '$createdAt' },
        avgOrderValue: { $avg: '$items.price' }
      }
    },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        newCustomers: {
          $sum: {
            $cond: [
              { $gte: ['$firstOrder', dateRange.start] },
              1,
              0
            ]
          }
        },
        returningCustomers: {
          $sum: {
            $cond: [
              { $gt: ['$orderCount', 1] },
              1,
              0
            ]
          }
        },
        avgCustomerValue: { $avg: '$totalSpent' },
        avgOrdersPerCustomer: { $avg: '$orderCount' }
      }
    }
  ]);

  const customerData = customerAnalysis[0] || {};

  // Customer Lifetime Value (CLV) Analysis
  const clvAnalysis = await calculateCLV(sellerId, dateRange);
  
  // Customer Segmentation using RFM Analysis
  const segmentation = await performRFMAnalysis(sellerId, dateRange);

  return {
    overview: {
      total: customerData.totalCustomers || 0,
      new: customerData.newCustomers || 0,
      returning: customerData.returningCustomers || 0,
      avgValue: customerData.avgCustomerValue || 0,
      avgOrders: customerData.avgOrdersPerCustomer || 0
    },
    clv: clvAnalysis,
    segmentation,
    retention: await calculateRetentionRate(sellerId, dateRange)
  };
};

// Product Performance Analytics
const calculateProductMetrics = async (sellerId, dateRange) => {
  const productPerformance = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 
      'items.seller': sellerId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    }},
    {
      $group: {
        _id: '$items.product',
        totalSales: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.price' },
        orderCount: { $sum: 1 },
        avgPrice: { $avg: '$items.price' }
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $project: {
        title: '$productInfo.title',
        category: '$productInfo.category',
        currentStock: '$productInfo.stock',
        totalSales: 1,
        totalRevenue: 1,
        orderCount: 1,
        avgPrice: 1,
        stockTurnover: {
          $divide: ['$totalSales', { $add: ['$productInfo.stock', '$totalSales'] }]
        }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // Category performance
  const categoryPerformance = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 
      'items.seller': sellerId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    }},
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category._id',
        categoryName: { $first: '$category.name' },
        totalRevenue: { $sum: '$items.price' },
        totalSales: { $sum: '$items.quantity' },
        productCount: { $addToSet: '$items.product' }
      }
    },
    {
      $project: {
        categoryName: 1,
        totalRevenue: 1,
        totalSales: 1,
        productCount: { $size: '$productCount' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  return {
    topProducts: productPerformance.slice(0, 10),
    categoryPerformance,
    inventory: await calculateInventoryMetrics(sellerId),
    lowStock: await getLowStockProducts(sellerId),
    seasonalTrends: await calculateSeasonalTrends(sellerId, dateRange)
  };
};

// Advanced Conversion Analytics
const calculateConversionMetrics = async (sellerId, dateRange) => {
  // This would integrate with product view tracking
  const conversionData = await Analytics.aggregate([
    {
      $match: {
        seller: sellerId,
        date: { $gte: dateRange.start, $lte: dateRange.end }
      }
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$metrics.views' },
        totalConversions: { $sum: '$metrics.conversions' },
        totalRevenue: { $sum: '$metrics.revenue' }
      }
    }
  ]);

  const data = conversionData[0] || {};
  const conversionRate = data.totalViews ? (data.totalConversions / data.totalViews) * 100 : 0;

  return {
    views: data.totalViews || 0,
    conversions: data.totalConversions || 0,
    conversionRate,
    revenuePerVisitor: data.totalViews ? data.totalRevenue / data.totalViews : 0,
    funnel: await calculateSalesFunnel(sellerId, dateRange)
  };
};

// Machine Learning Predictions
const generateMLPredictions = async (sellerId, dateRange) => {
  try {
    // Demand forecasting using historical data
    const historicalData = await getHistoricalSalesData(sellerId, 90); // 90 days
    
    const predictions = {
      salesForecast: await predictSalesTrend(historicalData),
      demandForecast: await predictDemandByProduct(sellerId, historicalData),
      reorderAlerts: await generateReorderAlerts(sellerId),
      priceOptimization: await suggestPriceOptimization(sellerId),
      seasonalPatterns: await identifySeasonalPatterns(historicalData)
    };

    return predictions;
  } catch (error) {
    console.error('ML Predictions error:', error);
    return {
      salesForecast: [],
      demandForecast: [],
      reorderAlerts: [],
      priceOptimization: [],
      seasonalPatterns: {}
    };
  }
};

// Cohort Analysis
exports.getCohortAnalysis = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { months = 12 } = req.query;

    const cohortData = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: '$customer',
          firstOrderDate: { $min: '$createdAt' },
          orders: {
            $push: {
              date: '$createdAt',
              revenue: '$items.price'
            }
          }
        }
      },
      {
        $addFields: {
          cohortMonth: {
            $dateToString: {
              format: '%Y-%m',
              date: '$firstOrderDate'
            }
          }
        }
      },
      {
        $unwind: '$orders'
      },
      {
        $addFields: {
          orderMonth: {
            $dateToString: {
              format: '%Y-%m',
              date: '$orders.date'
            }
          },
          monthsAfterFirst: {
            $divide: [
              { $subtract: ['$orders.date', '$firstOrderDate'] },
              1000 * 60 * 60 * 24 * 30
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            cohort: '$cohortMonth',
            month: { $floor: '$monthsAfterFirst' }
          },
          customers: { $addToSet: '$_id' },
          revenue: { $sum: '$orders.revenue' }
        }
      },
      {
        $group: {
          _id: '$_id.cohort',
          data: {
            $push: {
              month: '$_id.month',
              customers: { $size: '$customers' },
              revenue: '$revenue'
            }
          }
        }
      },
      { $sort: { '_id': -1 } },
      { $limit: parseInt(months) }
    ]);

    res.json({
      cohorts: cohortData,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Real-time Analytics
exports.getRealTimeAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const realTimeData = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 
        'items.seller': sellerId,
        createdAt: { $gte: last24Hours }
      }},
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' }
          },
          sales: { $sum: '$items.price' },
          orders: { $sum: 1 },
          customers: { $addToSet: '$customer' }
        }
      },
      {
        $project: {
          hour: '$_id.hour',
          sales: 1,
          orders: 1,
          customers: { $size: '$customers' }
        }
      },
      { $sort: { hour: 1 } }
    ]);

    // Current active sessions (would integrate with tracking)
    const activeSessions = await getActiveSessionCount(sellerId);
    
    // Recent orders
    const recentOrders = await Order.find({
      'items.seller': sellerId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    })
    .populate('customer', 'name')
    .populate('items.product', 'title')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      hourlyData: realTimeData,
      activeSessions,
      recentOrders,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper Functions
const getDateRange = (period) => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return { start, end };
};

const calculateGrowthRate = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};
