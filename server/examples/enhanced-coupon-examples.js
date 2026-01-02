/**
 * Example usage of Enhanced Coupon Validation System
 * This file demonstrates how to implement and use the new coupon features
 */

// Note: This would be imported from frontend API in a real app
// const { validateCoupon, getEnhancedUsageStatistics } = require('./api/couponApi');

// For server-side examples, we'll import the models directly
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const Order = require('../models/Order');

// Example 1: Creating a coupon with enhanced limits
const exampleEnhancedCoupon = {
  code: 'MEGA_SALE_2025',
  description: 'Mega Sale - 25% off with smart limits',
  discountType: 'percentage',
  discountValue: 25,
  maxDiscount: 1000,
  minOrderAmount: 200,
  
  // Enhanced limits
  maxUsagePerUser: 1000,        // Each user can use 1000 times total
  maxUsagePerUserPerDay: 5,     // But only 5 times per day
  totalUsageLimit: 50000,       // Maximum 50,000 total uses across all users
  
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  isActive: true
};

// Example 2: Real-world use cases for different coupon types

const couponExamples = {
  // Loyalty Program Coupon
  loyaltyReward: {
    code: 'VIP_MEMBER_2025',
    description: 'VIP Member Exclusive - 15% off',
    discountType: 'percentage',
    discountValue: 15,
    maxUsagePerUser: 100,         // VIP members get 100 uses
    maxUsagePerUserPerDay: 5,     // Up to 5 times per day
    totalUsageLimit: null,        // Unlimited total uses
    minOrderAmount: 50
  },

  // Flash Sale Coupon
  flashSale: {
    code: 'FLASH_24H',
    description: '24 Hour Flash Sale - 50% off',
    discountType: 'percentage',
    discountValue: 50,
    maxUsagePerUser: 1,           // One use per customer
    maxUsagePerUserPerDay: 1,     // One use per day
    totalUsageLimit: 1000,        // Limited to first 1000 customers
    minOrderAmount: 100
  },

  // Daily Deal Coupon
  dailyDeal: {
    code: 'DAILY_SPECIAL',
    description: 'Daily Special - ₹100 off',
    discountType: 'fixed',
    discountValue: 100,
    maxUsagePerUser: 365,         // Can use daily for a year
    maxUsagePerUserPerDay: 1,     // Once per day only
    totalUsageLimit: null,        // Unlimited total uses
    minOrderAmount: 300
  },

  // Bulk Purchase Reward
  bulkReward: {
    code: 'BULK_BUYER',
    description: 'Bulk Buyer Reward - 10% off',
    discountType: 'percentage',
    discountValue: 10,
    maxUsagePerUser: 50,          // Frequent buyers get 50 uses
    maxUsagePerUserPerDay: 10,    // Multiple orders per day allowed
    totalUsageLimit: 25000,       // Large but finite limit
    minOrderAmount: 1000
  }
};

// Example 3: Frontend implementation example
const CouponValidationExample = {
  // Validate coupon before applying
  async validateCouponCode(code, orderData) {
    try {
      const response = await validateCoupon({
        code: code,
        orderAmount: orderData.total,
        orderItems: orderData.items,
        orderType: orderData.type
      });

      if (response.data.success) {
        const { coupon, discount, finalAmount } = response.data.data;
        
        return {
          valid: true,
          discount: discount,
          finalAmount: finalAmount,
          message: `Coupon applied! You saved ₹${discount}`,
          couponDetails: {
            code: coupon.code,
            description: coupon.description,
            maxUsagePerUser: coupon.maxUsagePerUser,
            maxUsagePerUserPerDay: coupon.maxUsagePerUserPerDay,
            totalUsageLimit: coupon.totalUsageLimit
          }
        };
      } else {
        return {
          valid: false,
          message: response.data.message,
          errorType: this.categorizeError(response.data.message)
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: 'Error validating coupon. Please try again.',
        errorType: 'network_error'
      };
    }
  },

  // Categorize errors for better UX
  categorizeError(message) {
    if (message.includes('Daily usage limit')) return 'daily_limit_reached';
    if (message.includes('Maximum usage limit')) return 'user_limit_reached';
    if (message.includes('Total coupon usage limit')) return 'global_limit_reached';
    if (message.includes('expired')) return 'expired';
    if (message.includes('not yet active')) return 'not_active';
    if (message.includes('minimum order')) return 'min_order_not_met';
    return 'other';
  },

  // Get and display usage statistics
  async displayUsageStats(couponId) {
    try {
      const response = await getEnhancedUsageStatistics(couponId);
      
      if (response.data.success) {
        const { coupon, statistics } = response.data.data;
        
        console.log('\n📊 Coupon Usage Statistics');
        console.log('==========================');
        console.log(`Code: ${coupon.code}`);
        console.log(`Description: ${coupon.description}`);
        console.log('');
        
        // Total usage stats
        console.log('📈 Total Usage:');
        console.log(`  Used: ${statistics.totalUsage}`);
        if (statistics.remainingTotalUsage !== null) {
          console.log(`  Remaining: ${statistics.remainingTotalUsage}`);
          console.log(`  Progress: ${statistics.usagePercentage}%`);
        }
        console.log('');
        
        // User-specific stats
        if (statistics.userStats) {
          console.log('👤 Your Usage:');
          console.log(`  Total Uses: ${statistics.userStats.totalUsage}`);
          console.log(`  Remaining: ${statistics.userStats.remainingUsage}`);
          console.log(`  Today's Uses: ${statistics.userStats.todayUsage}`);
          if (statistics.userStats.remainingTodayUsage !== null) {
            console.log(`  Remaining Today: ${statistics.userStats.remainingTodayUsage}`);
          }
        }
        
        return statistics;
      }
    } catch (error) {
      console.error('Error fetching usage statistics:', error.message);
      return null;
    }
  }
};

// Example 4: Backend order processing with enhanced validation
const OrderProcessingExample = {
  async processOrderWithCoupon(userId, orderData, couponCode) {
    try {
      // Step 1: Validate coupon
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(), 
        isActive: true 
      });
      
      if (!coupon) {
        throw new Error('Invalid coupon code');
      }

      // Step 2: Check all validation rules
      const canUse = await coupon.canUserUse(userId, orderData);
      if (!canUse.canUse) {
        throw new Error(canUse.reason);
      }

      // Step 3: Calculate discount
      const discountResult = coupon.calculateDiscount(orderData.subtotal, orderData.items);
      if (discountResult.reason) {
        throw new Error(discountResult.reason);
      }

      // Step 4: Process the order
      const order = new Order({
        userId: userId,
        items: orderData.items,
        subtotal: orderData.subtotal,
        discount: discountResult.discount,
        total: orderData.subtotal - discountResult.discount,
        couponCode: coupon.code,
        status: 'pending'
      });

      await order.save();

      // Step 5: Record coupon usage
      const usage = new CouponUsage({
        couponId: coupon._id,
        userId: userId,
        orderId: order._id,
        usageType: 'order',
        discountAmount: discountResult.discount,
        orderTotal: order.total,
        couponCode: coupon.code,
        referenceNumber: order.orderNumber
      });

      await usage.save();

      // Step 6: Update coupon usage count
      await Coupon.updateOne(
        { _id: coupon._id },
        { $inc: { usedCount: 1 }, lastUsedAt: new Date() }
      );

      return {
        success: true,
        order: order,
        discount: discountResult.discount,
        message: 'Order processed successfully with coupon'
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
};

// Example 5: Usage scenarios and expected behaviors
const UsageScenarios = {
  scenario1: {
    description: 'User tries to use a coupon for the 6th time today (daily limit is 5)',
    expected: 'Should fail with "Daily usage limit (5) reached for today"'
  },
  
  scenario2: {
    description: 'User has used coupon 999 times, tries to use for 1000th time (limit is 1000)',
    expected: 'Should succeed - last allowed use for this user'
  },
  
  scenario3: {
    description: 'User tries to use coupon for 1001st time (limit is 1000)',
    expected: 'Should fail with "Maximum usage limit (1000) reached for this user"'
  },
  
  scenario4: {
    description: 'Coupon has been used 9999 times globally, tries for 10000th use (limit is 10000)',
    expected: 'Should succeed - last allowed use globally'
  },
  
  scenario5: {
    description: 'Coupon has been used 10000 times globally, tries for 10001st use',
    expected: 'Should fail with "Total coupon usage limit exceeded"'
  },
  
  scenario6: {
    description: 'User waits until next day after hitting daily limit',
    expected: 'Should succeed - daily limit resets at midnight'
  }
};

console.log('📚 Enhanced Coupon Validation Examples');
console.log('=====================================');
console.log('');
console.log('🎯 Coupon Types:');
Object.entries(couponExamples).forEach(([type, coupon]) => {
  console.log(`  ${type}: ${coupon.code} - ${coupon.description}`);
});
console.log('');
console.log('🔄 Usage Scenarios:');
Object.entries(UsageScenarios).forEach(([scenario, info]) => {
  console.log(`  ${scenario}: ${info.description}`);
  console.log(`    Expected: ${info.expected}`);
});
console.log('');
console.log('✅ Implementation complete! Check the documentation for more details.');

module.exports = {
  exampleEnhancedCoupon,
  couponExamples,
  CouponValidationExample,
  OrderProcessingExample,
  UsageScenarios
};