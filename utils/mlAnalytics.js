
// utils/mlAnalytics.js - Machine Learning Analytics
const tf = require('@tensorflow/tfjs-node');

const predictSalesTrend = async (historicalData) => {
  try {
    // Simple linear regression for sales prediction
    if (historicalData.length < 7) {
      return { prediction: 'Insufficient data', confidence: 0 };
    }

    const values = historicalData.map(d => d.sales);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Calculate trend using linear regression
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next 7 days
    const predictions = [];
    for (let i = n; i < n + 7; i++) {
      predictions.push({
        day: i + 1,
        predictedSales: Math.max(0, slope * i + intercept),
        confidence: Math.min(95, Math.max(60, 85 - (i - n) * 5))
      });
    }

    return {
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      predictions,
      accuracy: calculateAccuracy(values, slope, intercept)
    };
  } catch (error) {
    console.error('Sales prediction error:', error);
    return { prediction: 'Error in calculation', confidence: 0 };
  }
};

const predictDemandByProduct = async (sellerId, historicalData) => {
  try {
    const productDemand = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: {
            product: '$items.product',
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            }
          },
          dailySales: { $sum: '$items.quantity' }
        }
      },
      {
        $group: {
          _id: '$_id.product',
          salesHistory: {
            $push: {
              date: '$_id.date',
              sales: '$dailySales'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    const predictions = productDemand.map(item => {
      const sales = item.salesHistory.map(h => h.sales);
      const avgSales = sales.reduce((a, b) => a + b, 0) / sales.length;
      const trend = calculateTrend(sales);
      
      return {
        productId: item._id,
        productName: item.product.title,
        currentStock: item.product.stock,
        avgDailySales: avgSales,
        predictedDemand: avgSales * 7, // Weekly prediction
        reorderPoint: avgSales * 14, // 2 weeks safety stock
        trend,
        stockoutRisk: item.product.stock < (avgSales * 7) ? 'high' : 'low'
      };
    });

    return predictions;
  } catch (error) {
    console.error('Demand prediction error:', error);
    return [];
  }
};

const generateReorderAlerts = async (sellerId) => {
  const products = await Product.find({ seller: sellerId, isActive: true });
  const alerts = [];

  for (const product of products) {
    const salesData = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 
        'items.product': product._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }},
      {
        $group: {
          _id: null,
          totalSold: { $sum: '$items.quantity' },
          avgDailySales: { $avg: '$items.quantity' }
        }
      }
    ]);

    if (salesData.length > 0) {
      const { totalSold, avgDailySales } = salesData[0];
      const daysOfStock = product.stock / (avgDailySales || 1);
      
      if (daysOfStock < 7) {
        alerts.push({
          productId: product._id,
          productName: product.title,
          currentStock: product.stock,
          daysRemaining: Math.floor(daysOfStock),
          suggestedReorderQuantity: Math.ceil(avgDailySales * 30),
          priority: daysOfStock < 3 ? 'critical' : 'warning'
        });
      }
    }
  }

  return alerts;
};
