/**
 * Test script for enhanced coupon validation logic
 * This script demonstrates the new coupon features:
 * 1. Per-user limit (e.g., 1000 times per user)
 * 2. Per-user per-day limit
 * 3. Total coupon usage limit
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Coupon = require('./models/Coupon');
const CouponUsage = require('./models/CouponUsage');
const User = require('./models/User');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Test data
const testUser1 = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test User 1',
  email: 'testuser1@example.com'
};

const testUser2 = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test User 2',
  email: 'testuser2@example.com'
};

const testCoupon = {
  code: 'ENHANCED2024',
  description: 'Enhanced coupon with new validation rules',
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 100,
  maxUsagePerUser: 5, // Each user can use this coupon 5 times
  maxUsagePerUserPerDay: 2, // Each user can use this coupon max 2 times per day
  totalUsageLimit: 20, // Total coupon can be used max 20 times across all users
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  isActive: true,
  createdBy: testUser1._id
};

// Create test coupon
async function createTestCoupon() {
  try {
    // Clean up existing test data
    await Coupon.deleteOne({ code: testCoupon.code });
    await CouponUsage.deleteMany({ couponCode: testCoupon.code });

    const coupon = new Coupon(testCoupon);
    await coupon.save();
    console.log('✅ Test coupon created:', coupon.code);
    return coupon;
  } catch (error) {
    console.error('❌ Error creating test coupon:', error);
    throw error;
  }
}

// Simulate coupon usage
async function simulateUsage(coupon, userId, usageCount = 1) {
  const results = [];
  
  for (let i = 0; i < usageCount; i++) {
    try {
      // Check if user can use coupon
      const canUse = await coupon.canUserUse(userId);
      
      if (canUse.canUse) {
        // Create usage record
        const usage = new CouponUsage({
          couponId: coupon._id,
          userId: userId,
          usageType: 'order',
          discountAmount: 50,
          orderTotal: 500,
          couponCode: coupon.code,
          referenceNumber: `ORDER-${Date.now()}-${i}`
        });
        
        await usage.save();
        
        // Update coupon used count
        await Coupon.findByIdAndUpdate(coupon._id, {
          $inc: { usedCount: 1 }
        });
        
        results.push(`✅ Usage ${i + 1}: Success`);
      } else {
        results.push(`❌ Usage ${i + 1}: ${canUse.reason}`);
      }
      
      // Reload coupon to get updated usedCount
      coupon = await Coupon.findById(coupon._id);
      
    } catch (error) {
      results.push(`❌ Usage ${i + 1}: Error - ${error.message}`);
    }
  }
  
  return results;
}

// Main test function
async function runTests() {
  try {
    await connectDB();
    
    console.log('\n🚀 Starting Enhanced Coupon Validation Tests');
    console.log('================================================\n');
    
    // Create test coupon
    let coupon = await createTestCoupon();
    console.log('Coupon limits:');
    console.log(`- Max usage per user: ${coupon.maxUsagePerUser}`);
    console.log(`- Max usage per user per day: ${coupon.maxUsagePerUserPerDay}`);
    console.log(`- Total usage limit: ${coupon.totalUsageLimit}\n`);
    
    // Test 1: User 1 uses coupon within daily limit
    console.log('📝 Test 1: User 1 - Within daily limit (2 uses)');
    console.log('-----------------------------------------------');
    let results = await simulateUsage(coupon, testUser1._id, 2);
    results.forEach(result => console.log(result));
    
    // Test 2: User 1 tries to exceed daily limit
    console.log('\n📝 Test 2: User 1 - Exceeding daily limit (1 more use)');
    console.log('--------------------------------------------------------');
    results = await simulateUsage(coupon, testUser1._id, 1);
    results.forEach(result => console.log(result));
    
    // Test 3: User 2 uses coupon (should work)
    console.log('\n📝 Test 3: User 2 - Fresh user (2 uses)');
    console.log('----------------------------------------');
    results = await simulateUsage(coupon, testUser2._id, 2);
    results.forEach(result => console.log(result));
    
    // Simulate next day by updating usage timestamps (for testing purposes)
    console.log('\n⏰ Simulating next day...');
    await CouponUsage.updateMany(
      { couponCode: coupon.code },
      { $set: { usedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    );
    
    // Test 4: User 1 uses coupon next day (should work again)
    console.log('\n📝 Test 4: User 1 - Next day (3 more uses to reach user limit)');
    console.log('---------------------------------------------------------------');
    results = await simulateUsage(coupon, testUser1._id, 3);
    results.forEach(result => console.log(result));
    
    // Test 5: User 1 tries to exceed user limit
    console.log('\n📝 Test 5: User 1 - Exceeding user limit');
    console.log('----------------------------------------');
    results = await simulateUsage(coupon, testUser1._id, 1);
    results.forEach(result => console.log(result));
    
    // Test 6: Continue with other users until total limit is reached
    console.log('\n📝 Test 6: Fill remaining slots to reach total limit');
    console.log('----------------------------------------------------');
    
    // Get current statistics
    const stats = await coupon.getUsageStatistics();
    console.log(`Current total usage: ${stats.totalUsage}`);
    console.log(`Remaining slots: ${stats.remainingTotalUsage}`);
    
    // Fill remaining slots with User 2
    if (stats.remainingTotalUsage > 0) {
      results = await simulateUsage(coupon, testUser2._id, stats.remainingTotalUsage);
      results.forEach(result => console.log(result));
    }
    
    // Test 7: Try to use coupon after total limit is reached
    console.log('\n📝 Test 7: Attempting usage after total limit reached');
    console.log('-----------------------------------------------------');
    const testUser3 = new mongoose.Types.ObjectId();
    results = await simulateUsage(coupon, testUser3, 1);
    results.forEach(result => console.log(result));
    
    // Final statistics
    console.log('\n📊 Final Statistics:');
    console.log('====================');
    const finalStats = await coupon.getUsageStatistics(testUser1._id);
    console.log('Overall:');
    console.log(`- Total usage: ${finalStats.totalUsage}`);
    console.log(`- Remaining total: ${finalStats.remainingTotalUsage}`);
    console.log(`- Usage percentage: ${finalStats.usagePercentage}%`);
    
    if (finalStats.userStats) {
      console.log('\nUser 1 stats:');
      console.log(`- Total usage: ${finalStats.userStats.totalUsage}`);
      console.log(`- Remaining usage: ${finalStats.userStats.remainingUsage}`);
      console.log(`- Today's usage: ${finalStats.userStats.todayUsage}`);
      console.log(`- Remaining today: ${finalStats.userStats.remainingTodayUsage}`);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    await Coupon.deleteOne({ code: testCoupon.code });
    await CouponUsage.deleteMany({ couponCode: testCoupon.code });
    await mongoose.connection.close();
    console.log('\n🧹 Cleanup completed. Database connection closed.');
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };