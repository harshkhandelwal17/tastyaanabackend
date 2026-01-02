/**
 * Seed script to add sample coupon codes to the database
 * Run this script to populate the database with test coupons
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Coupon = require('./models/Coupon');
const User = require('./models/User');

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Sample coupon data
const sampleCoupons = [
  {
    code: 'TASTYAANA2026',
    description: 'TastyAana 2026 - Special New Year Deal! 20% off on all orders',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 500,
    minOrderAmount: 100,
    maxUsagePerUser: 1000,        // Max 1000 times per user
    maxUsagePerUserPerDay: 1,     // One time per day
    totalUsageLimit: null,        // Unlimited total usage
    startDate: new Date('2025-12-26'),
    endDate: new Date('2026-12-31'),
    isActive: true
  },
  {
    code: 'TASTYAANA25',
    description: 'TastyAana 25% Off - Limited to 100 total uses!',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscount: 1000,
    minOrderAmount: 200,
    maxUsagePerUser: 5,           // Max 5 times per user
    maxUsagePerUserPerDay: null,  // No daily limit
    totalUsageLimit: 100,         // Only 100 total uses
    startDate: new Date('2025-12-26'),
    endDate: new Date('2026-06-30'),
    isActive: true
  },
  {
    code: 'WELCOME2026',
    description: 'Welcome to 2026! ₹150 off your first order',
    discountType: 'fixed',
    discountValue: 150,
    maxDiscount: null,
    minOrderAmount: 300,
    maxUsagePerUser: 1,           // One time per user only
    maxUsagePerUserPerDay: 1,     // One time per day
    totalUsageLimit: 5000,        // Limited to first 5000 users
    startDate: new Date('2025-12-26'),
    endDate: new Date('2026-03-31'),
    isActive: true
  },
  {
    code: 'DAILYTREAT',
    description: 'Daily Treat - ₹50 off every day!',
    discountType: 'fixed',
    discountValue: 50,
    maxDiscount: null,
    minOrderAmount: 150,
    maxUsagePerUser: 365,         // Can use daily for a year
    maxUsagePerUserPerDay: 1,     // Once per day
    totalUsageLimit: null,        // Unlimited total usage
    startDate: new Date('2025-12-26'),
    endDate: new Date('2026-12-25'),
    isActive: true
  },
  {
    code: 'MEGASALE2026',
    description: 'Mega Sale 2026 - 30% off with high usage limits',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscount: 2000,
    minOrderAmount: 500,
    maxUsagePerUser: 50,          // 50 uses per user
    maxUsagePerUserPerDay: 3,     // 3 times per day
    totalUsageLimit: 10000,       // 10,000 total uses
    startDate: new Date('2025-12-26'),
    endDate: new Date('2026-12-31'),
    isActive: true
  },
  {
    code: 'FLASHDEAL',
    description: 'Flash Deal - 40% off! Limited time and usage',
    discountType: 'percentage',
    discountValue: 40,
    maxDiscount: 800,
    minOrderAmount: 250,
    maxUsagePerUser: 1,           // One use per user
    maxUsagePerUserPerDay: 1,     // One use per day
    totalUsageLimit: 500,         // Only 500 total uses
    startDate: new Date('2025-12-26'),
    endDate: new Date('2026-01-31'),
    isActive: true
  },
  {
    code: 'LOYALCUSTOMER',
    description: 'Loyal Customer Reward - 15% off with generous limits',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 600,
    minOrderAmount: 100,
    maxUsagePerUser: 500,         // 500 uses per loyal customer
    maxUsagePerUserPerDay: 5,     // 5 times per day
    totalUsageLimit: null,        // Unlimited total usage
    startDate: new Date('2025-12-26'),
    endDate: new Date('2026-12-31'),
    isActive: true
  },
  {
    code: 'WEEKEND10',
    description: 'Weekend Special - ₹10 off on small orders',
    discountType: 'fixed',
    discountValue: 10,
    maxDiscount: null,
    minOrderAmount: 50,
    maxUsagePerUser: 100,         // 100 uses per user
    maxUsagePerUserPerDay: 2,     // 2 times per day
    totalUsageLimit: null,        // Unlimited total usage
    startDate: new Date('2025-12-26'),
    endDate: new Date('2026-12-31'),
    isActive: true
  }
];

async function seedCoupons() {
  try {
    await connectDB();

    // Create a default admin user if doesn't exist
    let adminUser = await User.findOne({ email: 'admin@tastyaana.com' });
    if (!adminUser) {
      adminUser = new User({
        name: 'TastyAana Admin',
        email: 'admin@tastyaana.com',
        password: 'hashedpassword123', // In real app, this should be properly hashed
        phone: '9999999999',
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Created admin user');
    }

    console.log('🌱 Starting coupon seeding process...');
    console.log('');

    let createdCount = 0;
    let skippedCount = 0;

    for (const couponData of sampleCoupons) {
      try {
        // Check if coupon already exists
        const existingCoupon = await Coupon.findOne({ code: couponData.code });
        
        if (existingCoupon) {
          console.log(`⚠️  Coupon ${couponData.code} already exists - skipping`);
          skippedCount++;
          continue;
        }

        // Add createdBy field
        const coupon = new Coupon({
          ...couponData,
          createdBy: adminUser._id
        });

        await coupon.save();
        console.log(`✅ Created coupon: ${coupon.code} - ${coupon.description}`);
        console.log(`   Discount: ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : '₹'} off`);
        console.log(`   Per User Limit: ${coupon.maxUsagePerUser} uses`);
        console.log(`   Daily Limit: ${coupon.maxUsagePerUserPerDay || 'Unlimited'} uses per day`);
        console.log(`   Total Limit: ${coupon.totalUsageLimit || 'Unlimited'} total uses`);
        console.log('');
        
        createdCount++;
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error creating coupon ${couponData.code}:`, error.message);
      }
    }

    console.log('🎉 Coupon seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   Created: ${createdCount} coupons`);
    console.log(`   Skipped: ${skippedCount} coupons (already existed)`);
    console.log(`   Total: ${createdCount + skippedCount} coupons processed`);
    console.log('');
    
    // Display all coupons for verification
    console.log('📋 Current coupons in database:');
    const allCoupons = await Coupon.find({ isActive: true })
      .select('code description discountType discountValue maxUsagePerUser maxUsagePerUserPerDay totalUsageLimit')
      .sort({ createdAt: -1 });
    
    allCoupons.forEach((coupon, index) => {
      console.log(`${index + 1}. ${coupon.code}`);
      console.log(`   Description: ${coupon.description}`);
      console.log(`   Discount: ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : '₹'}`);
      console.log(`   Limits: ${coupon.maxUsagePerUser} per user, ${coupon.maxUsagePerUserPerDay || '∞'} per day, ${coupon.totalUsageLimit || '∞'} total`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error seeding coupons:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Function to clean up all test coupons (for development)
async function cleanupTestCoupons() {
  try {
    await connectDB();
    
    const testCouponCodes = sampleCoupons.map(c => c.code);
    const result = await Coupon.deleteMany({ code: { $in: testCouponCodes } });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} test coupons`);
    
  } catch (error) {
    console.error('❌ Error cleaning up test coupons:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'clean') {
  console.log('🧹 Cleaning up test coupons...');
  cleanupTestCoupons();
} else if (command === 'seed' || !command) {
  console.log('🌱 Seeding test coupons...');
  seedCoupons();
} else {
  console.log('Usage:');
  console.log('  node seed-coupons.js          - Seed test coupons');
  console.log('  node seed-coupons.js seed     - Seed test coupons');
  console.log('  node seed-coupons.js clean    - Clean up test coupons');
}

module.exports = {
  seedCoupons,
  cleanupTestCoupons,
  sampleCoupons
};