const mongoose = require('mongoose');
// const { Order, Subscription, User, MealPlan } = require('../models');
const Order= require("../models/Order");
const Subscription = require("../models/Subscription");
const User=require("../models/User");
const MealPlan= require("../models/MealPlan");
const moment = require('moment');

const sellerAnalyticsController = {
  // Get comprehensive seller analytics dashboard data
  getSellerAnalytics: async (req, res) => {
    try {
      const sellerId = req.user.id;
      console.log("seller id is : ",sellerId);
      const { startDate, endDate, period = 'today' } = req.query;

      // Date range setup
      let dateFilter = {};
      const now = moment();
      
      switch (period) {
        case 'today':
          dateFilter = {
            createdAt: {
              $gte: now.startOf('day').toDate(),
              $lte: now.endOf('day').toDate()
            }
          };
          break;
        case 'week':
          dateFilter = {
            createdAt: {
              $gte: now.startOf('week').toDate(),
              $lte: now.endOf('week').toDate()
            }
          };
          break;
        case 'month':
          dateFilter = {
            createdAt: {
              $gte: now.startOf('month').toDate(),
              $lte: now.endOf('month').toDate()
            }
          };
          break;
        case 'custom':
          if (startDate && endDate) {
            dateFilter = {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            };
          }
          break;
      }

      // Get seller info with commission rates
      const seller = await User.findById(sellerId).select('name email phone role commissionRate advanceAmount');
      const commissionRate =  0.20; // Default 15%
      // 1. Today's Revenue and Orders
      const todayRevenue = await Order.aggregate([
        {
          $match: {
            'items.seller': new mongoose.Types.ObjectId(sellerId),
            ...dateFilter,
            status: { $nin: ['cancelled', 'returned'] },
            paymentStatus: 'paid'
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.seller': new mongoose.Types.ObjectId(sellerId)
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: '$items.quantity' }
          }
        }
      ]);

      // 2. All-time Revenue
      const allTimeRevenue = await Order.aggregate([
        {
          $match: {
            'items.seller': new mongoose.Types.ObjectId(sellerId),
            status: { $nin: ['cancelled', 'returned'] },
            paymentStatus: 'paid'
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.seller': new mongoose.Types.ObjectId(sellerId)
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            totalOrders: { $sum: 1 }
          }
        }
      ]);

      // 3. Subscription Analytics
      const subscriptionAnalytics = await Subscription.aggregate([
        {
          $match: {
            mealPlan: { $in: await getMealPlansBySeller(sellerId) },
            status: { $in: ['active', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            totalSubscriptions: { $sum: 1 },
            activeSubscriptions: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            totalSubscriptionRevenue: { $sum: '$pricing.finalAmount' },
            totalThalisDelivered: { $sum: '$thalisDelivered' }
          }
        }
      ]);

      // 4. Monthly Subscription Thalis
      const monthlyThalis = await Subscription.aggregate([
        {
          $match: {
            mealPlan: { $in: await getMealPlansBySeller(sellerId) },
            status: { $in: ['active', 'completed'] },
            createdAt: {
              $gte: now.startOf('month').toDate(),
              $lte: now.endOf('month').toDate()
            }
          }
        },
        {
          $group: {
            _id: null,
            monthlyThalis: { $sum: '$pricing.totalThali' },
            monthlySubscriptions: { $sum: 1 }
          }
        }
      ]);

      // 5. Category-wise Sales
      const categoryWiseSales = await Order.aggregate([
        {
          $match: {
            'items.seller':new  mongoose.Types.ObjectId(sellerId),
            status: { $nin: ['cancelled', 'returned'] },
            paymentStatus: 'paid'
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.seller':new mongoose.Types.ObjectId(sellerId)
          }
        },
        {
          $group: {
            _id: '$items.category',
            totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            totalQuantity: { $sum: '$items.quantity' },
            orderCount: { $sum: 1 }
          }
        },
        {
          $sort: { totalRevenue: -1 }
        }
      ]);

      // 6. Revenue by Product Type
      const revenueByType = await Order.aggregate([
        {
          $match: {
            'items.seller':new mongoose.Types.ObjectId(sellerId),
            status: { $nin: ['cancelled', 'returned'] },
            paymentStatus: 'paid'
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.seller':new mongoose.Types.ObjectId(sellerId)
          }
        },
        {
          $group: {
            _id: '$type',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders: { $sum: 1 }
          }
        }
      ]);

      // 7. Daily Revenue Trend (Last 30 days)
      const dailyRevenueTrend = await Order.aggregate([
        {
          $match: {
            'items.seller':new mongoose.Types.ObjectId(sellerId),
            status: { $nin: ['cancelled', 'returned'] },
            paymentStatus: 'paid',
            createdAt: {
              $gte: moment().subtract(30, 'days').startOf('day').toDate(),
              $lte: now.endOf('day').toDate()
            }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.seller':new mongoose.Types.ObjectId(sellerId)
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      // Calculate financial metrics
      const todayData = todayRevenue[0] || { totalRevenue: 0, totalOrders: 0, totalQuantity: 0 };
      const allTimeData = allTimeRevenue[0] || { totalRevenue: 0, totalOrders: 0 };
      const subscriptionData = subscriptionAnalytics[0] || {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalSubscriptionRevenue: 0,
        totalThalisDelivered: 0
      };
      const monthlyData = monthlyThalis[0] || { monthlyThalis: 0, monthlySubscriptions: 0 };

      // Calculate commission and payouts
      const grossRevenue = allTimeData.totalRevenue + subscriptionData.totalSubscriptionRevenue;
      const adminCommission = grossRevenue * commissionRate;
      const netRevenue = grossRevenue - adminCommission;
      const advanceAmount = seller.advanceAmount || 0;
      const remainingPayout = netRevenue - advanceAmount;

      const analytics = {
        // Basic metrics
        todayRevenue: todayData.totalRevenue,
        todayOrders: todayData.totalOrders,
        todayQuantity: todayData.totalQuantity,
        allTimeRevenue: grossRevenue,
        
        // Subscription metrics
        totalSubscriptions: subscriptionData.totalSubscriptions,
        activeSubscriptions: subscriptionData.activeSubscriptions,
        totalThalisDelivered: subscriptionData.totalThalisDelivered,
        monthlyThalis: monthlyData.monthlyThalis,
        monthlySubscriptions: monthlyData.monthlySubscriptions,
        
        // Financial breakdown
        grossRevenue,
        adminCommission,
        netRevenue,
        commissionRate: commissionRate * 100, // Convert to percentage
        advanceAmount,
        remainingPayout: Math.max(0, remainingPayout),
        
        // Analytics data
        categoryWiseSales,
        revenueByType,
        dailyRevenueTrend,
        
        // Seller info
        sellerInfo: {
          name: seller.name,
          email: seller.email,
          phone: seller.phone,
          role: seller.role
        }
      };

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Seller Analytics Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch seller analytics',
        error: error.message
      });
    }
  },

  // Get detailed order analytics
  getOrderAnalytics: async (req, res) => {
    try {
      const sellerId = req.user.id;
      const { period = 'month' } = req.query;

      let dateFilter = {};
      const now = moment();

      switch (period) {
        case 'week':
          dateFilter = {
            createdAt: {
              $gte: now.startOf('week').toDate(),
              $lte: now.endOf('week').toDate()
            }
          };
          break;
        case 'month':
          dateFilter = {
            createdAt: {
              $gte: now.startOf('month').toDate(),
              $lte: now.endOf('month').toDate()
            }
          };
          break;
        case 'year':
          dateFilter = {
            createdAt: {
              $gte: now.startOf('year').toDate(),
              $lte: now.endOf('year').toDate()
            }
          };
          break;
      }

      // Order status breakdown
      const orderStatusBreakdown = await Order.aggregate([
        {
          $match: {
            'items.seller':new mongoose.Types.ObjectId(sellerId),
            ...dateFilter
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        }
      ]);

      // Payment method breakdown
      // const paymentMethodBreakdown = await Order.aggregate([
      //   {
      //     $match: {
      //       'items.seller':new mongoose.Types.ObjectId(sellerId),
      //       ...dateFilter,
      //       paymentStatus: 'paid'
      //     }
      //   },
      //   {
      //     $group: {
      //       _id: '$paymentMethod',
      //       count: { $sum: 1 },
      //       revenue: { $sum: '$totalAmount' }
      //     }
      //   }
      // ]);
        const paymentMethodBreakdown = await Order.aggregate([
  {
    $unwind: "$items"   // flatten items array
  },
  {
    $match: {
      "items.seller": new mongoose.Types.ObjectId(sellerId),
      ...dateFilter,
      paymentStatus: "paid"
    }
  },
  {
    $group: {
      _id: "$paymentMethod",               // group by payment method
      count: { $sum: 1 },                  // total orders
      revenue: { $sum: "$totalAmount" }    // total revenue for that seller
    }
  }
]);

      // Hourly order distribution
      const hourlyDistribution = await Order.aggregate([
        
           {
    $unwind: "$items"   // flatten items array
  },
         { $match: {
            'items.seller': new mongoose.Types.ObjectId(sellerId),
            ...dateFilter
          }
        },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);



      res.json({
        success: true,
        data: {
          orderStatusBreakdown,
          paymentMethodBreakdown,
          hourlyDistribution
        }
      });

    } catch (error) {
      console.error('Order Analytics Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order analytics',
        error: error.message
      });
    }
  },

  // Get subscription analytics
  getSubscriptionAnalytics: async (req, res) => {
    try {
      const sellerId = req.user?.id||req.user?._id ;

      const mealPlanIds = await getMealPlansBySeller(sellerId);

      // Subscription plan type breakdown
      const planTypeBreakdown = await Subscription.aggregate([
        {
          $match: {
            mealPlan: { $in: mealPlanIds }
          }
        },
        {
          $group: {
            _id: '$planType',
            count: { $sum: 1 },
            revenue: { $sum: '$pricing.finalAmount' },
            totalThalis: { $sum: '$pricing.totalThali' }
          }
        }
      ]);

      // Subscription status breakdown
      const statusBreakdown = await Subscription.aggregate([
        {
          $match: {
            mealPlan: { $in: mealPlanIds }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: { $sum: '$pricing.finalAmount' }
          }
        }
      ]);

      // Monthly subscription trends
      const monthlyTrends = await Subscription.aggregate([
        {
          $match: {
            mealPlan: { $in: mealPlanIds },
            createdAt: {
              $gte: moment().subtract(12, 'months').startOf('month').toDate()
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$pricing.finalAmount' },
            thalis: { $sum: '$pricing.totalThali' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          planTypeBreakdown,
          statusBreakdown,
          monthlyTrends
        }
      });

    } catch (error) {
      console.error('Subscription Analytics Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscription analytics',
        error: error.message
      });
    }
  },

  // Get financial summary
  getFinancialSummary: async (req, res) => {
    try {
      const sellerId = req.user.id;
      const { startDate, endDate } = req.query;

      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
      }

      const seller = await User.findById(sellerId).select('commissionRate advanceAmount');
      const commissionRate = seller.commissionRate || 0.15;

      // Calculate total earnings
      const earnings = await Order.aggregate([
        {
          $match: {
            'items.seller':new mongoose.Types.ObjectId(sellerId),
            status: { $nin: ['cancelled', 'returned'] },
            paymentStatus: 'paid',
            ...dateFilter
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.seller':new mongoose.Types.ObjectId(sellerId)
          }
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            totalOrders: { $sum: 1 }
          }
        }
      ]);

      const earningsData = earnings[0] || { totalEarnings: 0, totalOrders: 0 };
      const adminCommission = earningsData.totalEarnings * commissionRate;
      const netEarnings = earningsData.totalEarnings - adminCommission;
      const advanceAmount = seller.advanceAmount || 0;

      res.json({
        success: true,
        data: {
          grossEarnings: earningsData.totalEarnings,
          adminCommission,
          netEarnings,
          commissionRate: commissionRate * 100,
          advanceAmount,
          remainingPayout: Math.max(0, netEarnings - advanceAmount),
          totalOrders: earningsData.totalOrders
        }
      });

    } catch (error) {
      console.error('Financial Summary Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch financial summary',
        error: error.message
      });
    }
  }
};

// Helper function to get meal plans by seller
async function getMealPlansBySeller(sellerId) {
  try {
    const mealPlans = await MealPlan.find({ seller: sellerId }).select('_id');
    return mealPlans.map(plan => plan._id);
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return [];
  }
}

module.exports = sellerAnalyticsController;
