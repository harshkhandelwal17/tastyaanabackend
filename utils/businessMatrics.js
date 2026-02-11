
// utils/businessMetrics.js - Business Intelligence
const calculateCLV = async (sellerId, dateRange) => {
    const clvData = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: '$customer',
          totalRevenue: { $sum: '$items.price' },
          orderCount: { $sum: 1 },
          firstOrder: { $min: '$createdAt' },
          lastOrder: { $max: '$createdAt' },
          avgOrderValue: { $avg: '$items.price' }
        }
      },
      {
        $addFields: {
          customerLifespan: {
            $divide: [
              { $subtract: ['$lastOrder', '$firstOrder'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $addFields: {
          purchaseFrequency: {
            $cond: [
              { $gt: ['$customerLifespan', 0] },
              { $divide: ['$orderCount', { $add: ['$customerLifespan', 1] }] },
              '$orderCount'
            ]
          }
        }
      },
      {
        $addFields: {
          predictedCLV: {
            $multiply: [
              '$avgOrderValue',
              '$purchaseFrequency',
              365 // Annualized
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgCLV: { $avg: '$predictedCLV' },
          totalCustomers: { $sum: 1 },
          highValueCustomers: {
            $sum: {
              $cond: [{ $gt: ['$predictedCLV', 10000] }, 1, 0]
            }
          }
        }
      }
    ]);
  
    return clvData[0] || { avgCLV: 0, totalCustomers: 0, highValueCustomers: 0 };
  };
  
  const performRFMAnalysis = async (sellerId, dateRange) => {
    const rfmData = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: '$customer',
          recency: { $max: '$createdAt' },
          frequency: { $sum: 1 },
          monetary: { $sum: '$items.price' }
        }
      },
      {
        $addFields: {
          recencyDays: {
            $divide: [
              { $subtract: [new Date(), '$recency'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      }
    ]);
  
    // Calculate quintiles for RFM scoring
    const recencyValues = rfmData.map(d => d.recencyDays).sort((a, b) => a - b);
    const frequencyValues = rfmData.map(d => d.frequency).sort((a, b) => b - a);
    const monetaryValues = rfmData.map(d => d.monetary).sort((a, b) => b - a);
  
    const getQuintile = (value, values) => {
      const quintileSize = Math.floor(values.length / 5);
      for (let i = 1; i <= 5; i++) {
        if (value <= values[quintileSize * i - 1]) return i;
      }
      return 5;
    };
  
    const segmentedCustomers = rfmData.map(customer => {
      const rScore = 6 - getQuintile(customer.recencyDays, recencyValues); // Reverse for recency
      const fScore = getQuintile(customer.frequency, frequencyValues);
      const mScore = getQuintile(customer.monetary, monetaryValues);
      
      let segment = 'Regular';
      if (rScore >= 4 && fScore >= 4 && mScore >= 4) segment = 'Champions';
      else if (rScore >= 3 && fScore >= 3 && mScore >= 3) segment = 'Loyal Customers';
      else if (rScore >= 3 && fScore <= 2) segment = 'Potential Loyalists';
      else if (rScore <= 2 && fScore >= 3) segment = 'At Risk';
      else if (rScore <= 2 && fScore <= 2) segment = 'Hibernating';
  
      return {
        customerId: customer._id,
        recencyScore: rScore,
        frequencyScore: fScore,
        monetaryScore: mScore,
        segment,
        totalValue: customer.monetary
      };
    });
  
    // Group by segments
    const segments = segmentedCustomers.reduce((acc, customer) => {
      if (!acc[customer.segment]) {
        acc[customer.segment] = { count: 0, totalValue: 0 };
      }
      acc[customer.segment].count++;
      acc[customer.segment].totalValue += customer.totalValue;
      return acc;
    }, {});
  
    return { segments, totalCustomers: rfmData.length };
  };
  