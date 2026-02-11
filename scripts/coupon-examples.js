const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');

// Connect to MongoDB (adjust connection string as needed)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample admin user ID (replace with actual admin user ID)
const ADMIN_USER_ID = '507f1f77bcf86cd799439011'; // Replace with actual admin user ID

const couponExamples = [
  // ====== PERCENTAGE DISCOUNT COUPONS ======
  {
    code: 'SAVE20',
    description: '20% off on your order',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 100,
    minOrderAmount: 200,
    maxUsage: 1000,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    priority: 50,
    campaign: {
      name: 'Summer Sale 2024',
      description: 'Summer discount campaign',
      tags: ['summer', 'sale', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'WELCOME15',
    description: '15% off for new users',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 50,
    minOrderAmount: 100,
    maxUsage: 500,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    targeting: {
      userTargeting: {
        userSegments: ['new_users'],
        userBehavior: {
          maxOrderCount: 0 // Only for users with 0 orders
        }
      }
    },
    priority: 60,
    campaign: {
      name: 'New User Welcome',
      description: 'Welcome offer for new customers',
      tags: ['welcome', 'new-users', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'VIP25',
    description: '25% off for VIP customers',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscount: 200,
    minOrderAmount: 500,
    maxUsage: 100,
    maxUsagePerUser: 2,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    targeting: {
      userTargeting: {
        userSegments: ['vip_customers', 'high_value_customers'],
        userBehavior: {
          minTotalSpent: 5000,
          minOrderCount: 10
        }
      }
    },
    priority: 80,
    campaign: {
      name: 'VIP Exclusive',
      description: 'Exclusive offer for VIP customers',
      tags: ['vip', 'exclusive', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== FIXED AMOUNT DISCOUNT COUPONS ======
  {
    code: 'FLAT50',
    description: 'Flat ₹50 off on your order',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 200,
    maxUsage: 1000,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    priority: 40,
    campaign: {
      name: 'Flat Discount Campaign',
      description: 'Fixed amount discount campaign',
      tags: ['flat', 'fixed', 'discount']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'FIRST100',
    description: '₹100 off on first order',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 300,
    maxUsage: 500,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    targeting: {
      userTargeting: {
        userBehavior: {
          maxOrderCount: 0 // First order only
        }
      }
    },
    priority: 70,
    campaign: {
      name: 'First Order Bonus',
      description: 'Special discount for first-time customers',
      tags: ['first-order', 'bonus', 'fixed']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== FREE SHIPPING COUPONS ======
  {
    code: 'FREESHIP',
    description: 'Free delivery on your order',
    discountType: 'free_shipping',
    discountValue: 0,
    minOrderAmount: 200,
    maxUsage: 2000,
    maxUsagePerUser: 3,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    priority: 30,
    campaign: {
      name: 'Free Shipping Campaign',
      description: 'Free delivery promotion',
      tags: ['free-shipping', 'delivery', 'promotion']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'SHIPFREE500',
    description: 'Free delivery on orders above ₹500',
    discountType: 'free_shipping',
    discountValue: 0,
    minOrderAmount: 500,
    maxUsage: 1000,
    maxUsagePerUser: 2,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    targeting: {
      orderTargeting: {
        minOrderValue: 500
      }
    },
    priority: 35,
    campaign: {
      name: 'High Value Free Shipping',
      description: 'Free shipping for high-value orders',
      tags: ['free-shipping', 'high-value', 'delivery']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== BUY ONE GET ONE (BOGO) COUPONS ======
  {
    code: 'BOGO100',
    description: 'Buy 1 Get 1 Free',
    discountType: 'buy_one_get_one',
    discountValue: 0,
    minOrderAmount: 100,
    maxUsage: 500,
    maxUsagePerUser: 2,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    specialDiscount: {
      bogoConfig: {
        buyQuantity: 1,
        getQuantity: 1,
        getDiscount: 100 // 100% off on the free item
      }
    },
    priority: 60,
    campaign: {
      name: 'BOGO Campaign',
      description: 'Buy One Get One Free promotion',
      tags: ['bogo', 'free', 'promotion']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'BOGO50',
    description: 'Buy 1 Get 1 at 50% off',
    discountType: 'buy_one_get_one',
    discountValue: 0,
    minOrderAmount: 150,
    maxUsage: 300,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    specialDiscount: {
      bogoConfig: {
        buyQuantity: 1,
        getQuantity: 1,
        getDiscount: 50 // 50% off on the second item
      }
    },
    priority: 55,
    campaign: {
      name: 'BOGO 50% Campaign',
      description: 'Buy One Get One at 50% off',
      tags: ['bogo', '50-percent', 'promotion']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== BUY X GET Y COUPONS ======
  {
    code: 'BUY3GET2',
    description: 'Buy 3 Get 2 Free',
    discountType: 'buy_x_get_y',
    discountValue: 0,
    minOrderAmount: 300,
    maxUsage: 200,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    specialDiscount: {
      buyXGetYConfig: {
        buyQuantity: 3,
        getQuantity: 2,
        getDiscount: 100 // 100% off on the free items
      }
    },
    priority: 65,
    campaign: {
      name: 'Buy 3 Get 2 Campaign',
      description: 'Buy 3 Get 2 Free promotion',
      tags: ['bulk', 'free', 'promotion']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'BUY2GET1',
    description: 'Buy 2 Get 1 at 30% off',
    discountType: 'buy_x_get_y',
    discountValue: 0,
    minOrderAmount: 200,
    maxUsage: 400,
    maxUsagePerUser: 2,
    startDate: new Date(),
    endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    specialDiscount: {
      buyXGetYConfig: {
        buyQuantity: 2,
        getQuantity: 1,
        getDiscount: 30 // 30% off on the third item
      }
    },
    priority: 50,
    campaign: {
      name: 'Buy 2 Get 1 Campaign',
      description: 'Buy 2 Get 1 at 30% off',
      tags: ['bulk', '30-percent', 'promotion']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== CASHBACK COUPONS ======
  {
    code: 'CASHBACK25',
    description: '₹25 cashback to wallet',
    discountType: 'cashback',
    discountValue: 0,
    minOrderAmount: 250,
    maxUsage: 1000,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    specialDiscount: {
      cashbackConfig: {
        cashbackAmount: 25,
        cashbackType: 'wallet'
      }
    },
    priority: 45,
    campaign: {
      name: 'Cashback Campaign',
      description: 'Cashback to wallet promotion',
      tags: ['cashback', 'wallet', 'promotion']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'CASHBACK50',
    description: '₹50 cashback to wallet',
    discountType: 'cashback',
    discountValue: 0,
    minOrderAmount: 500,
    maxUsage: 500,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    targeting: {
      userTargeting: {
        userBehavior: {
          minTotalSpent: 1000 // Only for customers who have spent ₹1000+
        }
      }
    },
    specialDiscount: {
      cashbackConfig: {
        cashbackAmount: 50,
        cashbackType: 'wallet'
      }
    },
    priority: 55,
    campaign: {
      name: 'High Value Cashback',
      description: 'Cashback for high-value customers',
      tags: ['cashback', 'wallet', 'high-value']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== POINTS MULTIPLIER COUPONS ======
  {
    code: 'POINTS2X',
    description: '2x loyalty points on this order',
    discountType: 'points_multiplier',
    discountValue: 0,
    minOrderAmount: 200,
    maxUsage: 1000,
    maxUsagePerUser: 3,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    specialDiscount: {
      pointsConfig: {
        multiplier: 2,
        maxPoints: 100 // Maximum 100 points can be earned
      }
    },
    priority: 25,
    campaign: {
      name: 'Points Multiplier Campaign',
      description: 'Double loyalty points promotion',
      tags: ['points', 'loyalty', 'multiplier']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'POINTS3X',
    description: '3x loyalty points on this order',
    discountType: 'points_multiplier',
    discountValue: 0,
    minOrderAmount: 400,
    maxUsage: 500,
    maxUsagePerUser: 2,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    targeting: {
      userTargeting: {
        userSegments: ['vip_customers']
      }
    },
    specialDiscount: {
      pointsConfig: {
        multiplier: 3,
        maxPoints: 200 // Maximum 200 points can be earned
      }
    },
    priority: 40,
    campaign: {
      name: 'VIP Points Multiplier',
      description: 'Triple loyalty points for VIP customers',
      tags: ['points', 'loyalty', 'vip', 'multiplier']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== GEOGRAPHIC TARGETING COUPONS ======
  {
    code: 'DELHI20',
    description: '20% off for Delhi customers',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 100,
    minOrderAmount: 200,
    maxUsage: 1000,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    targeting: {
      geographicTargeting: {
        applicableCities: ['Delhi', 'New Delhi'],
        applicableStates: ['Delhi']
      }
    },
    priority: 50,
    campaign: {
      name: 'Delhi Special',
      description: 'Special offer for Delhi customers',
      tags: ['delhi', 'geographic', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'MUMBAI15',
    description: '15% off for Mumbai customers',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 75,
    minOrderAmount: 300,
    maxUsage: 800,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    targeting: {
      geographicTargeting: {
        applicableCities: ['Mumbai'],
        applicableStates: ['Maharashtra']
      }
    },
    priority: 45,
    campaign: {
      name: 'Mumbai Special',
      description: 'Special offer for Mumbai customers',
      tags: ['mumbai', 'geographic', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== TIME-BASED TARGETING COUPONS ======
  {
    code: 'MORNING15',
    description: '15% off on morning orders',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 50,
    minOrderAmount: 150,
    maxUsage: 1000,
    maxUsagePerUser: 2,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    targeting: {
      timeTargeting: {
        applicableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        applicableTimeSlots: [
          { start: '09:00', end: '12:00' }
        ]
      }
    },
    priority: 35,
    campaign: {
      name: 'Morning Special',
      description: 'Special discount for morning orders',
      tags: ['morning', 'time-based', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'WEEKEND20',
    description: '20% off on weekends',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 100,
    minOrderAmount: 200,
    maxUsage: 500,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    targeting: {
      timeTargeting: {
        applicableDays: ['saturday', 'sunday']
      }
    },
    priority: 40,
    campaign: {
      name: 'Weekend Special',
      description: 'Special discount for weekend orders',
      tags: ['weekend', 'time-based', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== ORDER TYPE TARGETING COUPONS ======
  {
    code: 'GKK10',
    description: '10% off on GKK orders',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 50,
    minOrderAmount: 100,
    maxUsage: 1000,
    maxUsagePerUser: 3,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    targeting: {
      orderTargeting: {
        applicableOrderTypes: ['gkk']
      }
    },
    priority: 30,
    campaign: {
      name: 'GKK Special',
      description: 'Special discount for GKK orders',
      tags: ['gkk', 'order-type', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'SUBSCRIPTION25',
    description: '25% off on subscription orders',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscount: 200,
    minOrderAmount: 500,
    maxUsage: 200,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    targeting: {
      orderTargeting: {
        applicableOrderTypes: ['subscription']
      }
    },
    priority: 70,
    campaign: {
      name: 'Subscription Special',
      description: 'Special discount for subscription orders',
      tags: ['subscription', 'order-type', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== PAYMENT METHOD TARGETING COUPONS ======
  {
    code: 'UPI20',
    description: '20% off on UPI payments',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 100,
    minOrderAmount: 200,
    maxUsage: 1000,
    maxUsagePerUser: 2,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    targeting: {
      orderTargeting: {
        applicablePaymentMethods: ['upi']
      }
    },
    priority: 45,
    campaign: {
      name: 'UPI Special',
      description: 'Special discount for UPI payments',
      tags: ['upi', 'payment-method', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'WALLET15',
    description: '15% off on wallet payments',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 75,
    minOrderAmount: 150,
    maxUsage: 800,
    maxUsagePerUser: 2,
    startDate: new Date(),
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    targeting: {
      orderTargeting: {
        applicablePaymentMethods: ['wallet']
      }
    },
    priority: 40,
    campaign: {
      name: 'Wallet Special',
      description: 'Special discount for wallet payments',
      tags: ['wallet', 'payment-method', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== CATEGORY-SPECIFIC COUPONS ======
  {
    code: 'FOOD20',
    description: '20% off on food items',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 100,
    minOrderAmount: 200,
    maxUsage: 1000,
    maxUsagePerUser: 2,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    applicableCategories: ['507f1f77bcf86cd799439012'], // Replace with actual food category ID
    priority: 50,
    campaign: {
      name: 'Food Special',
      description: 'Special discount for food items',
      tags: ['food', 'category', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'GROCERY15',
    description: '15% off on grocery items',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 75,
    minOrderAmount: 300,
    maxUsage: 800,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    applicableCategories: ['507f1f77bcf86cd799439013'], // Replace with actual grocery category ID
    priority: 45,
    campaign: {
      name: 'Grocery Special',
      description: 'Special discount for grocery items',
      tags: ['grocery', 'category', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== STACKING COUPONS ======
  {
    code: 'STACK10',
    description: '10% off (can be stacked with other coupons)',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 50,
    minOrderAmount: 100,
    maxUsage: 1000,
    maxUsagePerUser: 3,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    priority: 20, // Lower priority so it can be stacked
    campaign: {
      name: 'Stackable Coupon',
      description: 'Coupon that can be stacked with others',
      tags: ['stackable', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'STACK5',
    description: '5% off (can be stacked with other coupons)',
    discountType: 'percentage',
    discountValue: 5,
    maxDiscount: 25,
    minOrderAmount: 100,
    maxUsage: 1000,
    maxUsagePerUser: 5,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    priority: 10, // Lowest priority so it can be stacked
    campaign: {
      name: 'Stackable Small Coupon',
      description: 'Small stackable coupon',
      tags: ['stackable', 'small', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },

  // ====== MEAL PLAN SPECIFIC COUPONS ======
  {
    code: 'MEALPLAN20',
    description: '20% off on all meal plan subscriptions',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 200,
    minOrderAmount: 500,
    maxUsage: 500,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    targeting: {
      orderTargeting: {
        applicableOrderTypes: ['subscription']
      }
    },
    priority: 70,
    campaign: {
      name: 'Meal Plan Launch',
      description: 'Special discount for meal plan subscriptions',
      tags: ['meal-plan', 'subscription', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'FIRSTMEAL30',
    description: '30% off on your first meal plan subscription',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscount: 300,
    minOrderAmount: 300,
    maxUsage: 300,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    targeting: {
      userTargeting: {
        userBehavior: {
          maxOrderCount: 0
        }
      },
      orderTargeting: {
        applicableOrderTypes: ['subscription']
      }
    },
    priority: 80,
    campaign: {
      name: 'First Meal Plan',
      description: 'Welcome discount for new meal plan users',
      tags: ['meal-plan', 'new-user', 'welcome']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'MONTHLY100',
    description: '₹100 off on monthly meal plans',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 800,
    maxUsage: 200,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    targeting: {
      orderTargeting: {
        applicableOrderTypes: ['subscription'],
        minOrderValue: 800
      }
    },
    priority: 60,
    campaign: {
      name: 'Monthly Meal Plans',
      description: 'Fixed discount for monthly subscriptions',
      tags: ['meal-plan', 'monthly', 'fixed']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'THALI50',
    description: '₹50 off on thali subscriptions',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 200,
    maxUsage: 400,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    priority: 50,
    campaign: {
      name: 'Thali Special',
      description: 'Discount on thali subscriptions',
      tags: ['meal-plan', 'thali', 'fixed']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'WEEKLY25',
    description: '25% off on weekly meal plans',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscount: 150,
    minOrderAmount: 200,
    maxUsage: 300,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    targeting: {
      orderTargeting: {
        applicableOrderTypes: ['subscription']
      }
    },
    priority: 65,
    campaign: {
      name: 'Weekly Plans',
      description: 'Special discount for weekly meal plans',
      tags: ['meal-plan', 'weekly', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'DAILY15',
    description: '15% off on daily meal plans',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 100,
    minOrderAmount: 100,
    maxUsage: 500,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    targeting: {
      orderTargeting: {
        applicableOrderTypes: ['subscription']
      }
    },
    priority: 55,
    campaign: {
      name: 'Daily Plans',
      description: 'Discount for daily meal plans',
      tags: ['meal-plan', 'daily', 'percentage']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'MEALBOGO',
    description: 'Buy 1 month get 1 week free',
    discountType: 'buy_x_get_y',
    discountValue: 0,
    minOrderAmount: 1000,
    maxUsage: 100,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    specialDiscount: {
      buyXGetYConfig: {
        buyQuantity: 1,
        getQuantity: 1,
        getDiscount: 25
      }
    },
    targeting: {
      orderTargeting: {
        applicableOrderTypes: ['subscription']
      }
    },
    priority: 75,
    campaign: {
      name: 'BOGO Meal Plans',
      description: 'Buy one get one offer for meal plans',
      tags: ['meal-plan', 'bogo', 'special']
    },
    createdBy: ADMIN_USER_ID
  },
  {
    code: 'MEALCASHBACK',
    description: '₹200 cashback on meal plan subscriptions',
    discountType: 'cashback',
    discountValue: 0,
    minOrderAmount: 1000,
    maxUsage: 150,
    maxUsagePerUser: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    specialDiscount: {
      cashbackConfig: {
        cashbackAmount: 200,
        cashbackType: 'wallet'
      }
    },
    targeting: {
      orderTargeting: {
        applicableOrderTypes: ['subscription']
      }
    },
    priority: 60,
    campaign: {
      name: 'Meal Plan Cashback',
      description: 'Cashback offer for meal plan subscriptions',
      tags: ['meal-plan', 'cashback', 'wallet']
    },
    createdBy: ADMIN_USER_ID
  }
];

// Function to create all coupon examples
const createCouponExamples = async () => {
  try {
    console.log('Creating coupon examples...');
    
    for (const couponData of couponExamples) {
      try {
        // Check if coupon already exists
        const existingCoupon = await Coupon.findOne({ code: couponData.code });
        if (existingCoupon) {
          console.log(`Coupon ${couponData.code} already exists, skipping...`);
          continue;
        }
        
        // Create new coupon
        const coupon = new Coupon(couponData);
        await coupon.save();
        console.log(`✅ Created coupon: ${couponData.code} - ${couponData.description}`);
      } catch (error) {
        console.error(`❌ Error creating coupon ${couponData.code}:`, error.message);
      }
    }
    
    console.log('✅ Coupon examples creation completed!');
  } catch (error) {
    console.error('❌ Error creating coupon examples:', error);
  }
};

// Function to display all coupon examples as JSON
const displayCouponExamples = () => {
  console.log('\n📋 Raw Coupon Code Examples:');
  console.log('=====================================\n');
  
  couponExamples.forEach((coupon, index) => {
    console.log(`${index + 1}. ${coupon.code} - ${coupon.description}`);
    console.log(`   Type: ${coupon.discountType}`);
    console.log(`   Value: ${coupon.discountValue}`);
    console.log(`   Min Order: ₹${coupon.minOrderAmount}`);
    console.log(`   Max Usage: ${coupon.maxUsage}`);
    console.log(`   Priority: ${coupon.priority}`);
    if (coupon.targeting) {
      console.log(`   Targeting: ${JSON.stringify(coupon.targeting, null, 2)}`);
    }
    if (coupon.specialDiscount) {
      console.log(`   Special Discount: ${JSON.stringify(coupon.specialDiscount, null, 2)}`);
    }
    console.log('   ---');
  });
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--display')) {
    displayCouponExamples();
    return;
  }
  
  if (args.includes('--create')) {
    await connectDB();
    await createCouponExamples();
    await mongoose.connection.close();
    return;
  }
  
  console.log('Usage:');
  console.log('  node coupon-examples.js --display  # Display all coupon examples');
  console.log('  node coupon-examples.js --create   # Create all coupon examples in database');
};

// Export for use in other files
module.exports = {
  couponExamples,
  createCouponExamples,
  displayCouponExamples
};

// Run if called directly
if (require.main === module) {
  main();
}
