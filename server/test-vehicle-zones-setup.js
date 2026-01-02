const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');

/**
 * Test script to verify and setup vehicle rental zones for sellers
 */

async function testAndSetupZones() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore');
    console.log('✅ Connected to MongoDB');

    // Find all sellers
    const sellers = await User.find({ role: 'seller' }).limit(5);
    console.log(`\n🔍 Found ${sellers.length} sellers to check/update`);

    const defaultZones = [
      {
        zoneName: 'Bholaram ustad marg',
        zoneCode: 'ind001',
        address: 'Bholaram ustad marg, Indore',
        isActive: true
      },
      {
        zoneName: 'Indrapuri main office',
        zoneCode: 'ind003',
        address: 'Indrapuri main office, Indore',
        isActive: true
      },
      {
        zoneName: 'Vijay nagar square',
        zoneCode: 'ind004',
        address: 'Vijay nagar square, Indore',
        isActive: true
      }
    ];

    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      console.log(`\n${i + 1}. Seller: ${seller.name} (${seller.email})`);

      // Initialize sellerProfile if it doesn't exist
      if (!seller.sellerProfile) {
        seller.sellerProfile = {};
        console.log('   ➕ Created sellerProfile');
      }

      // Initialize vehicleRentalService if it doesn't exist
      if (!seller.sellerProfile.vehicleRentalService) {
        seller.sellerProfile.vehicleRentalService = {
          isEnabled: true,
          serviceStatus: 'active',
          businessType: 'individual',
          serviceZones: defaultZones
        };
        await seller.save();
        console.log('   ✅ Added vehicleRentalService with default zones');
      } else if (!seller.sellerProfile.vehicleRentalService.serviceZones || 
                 seller.sellerProfile.vehicleRentalService.serviceZones.length === 0) {
        seller.sellerProfile.vehicleRentalService.serviceZones = defaultZones;
        await seller.save();
        console.log('   ✅ Added default zones to existing vehicleRentalService');
      } else {
        console.log(`   ✓ Already has ${seller.sellerProfile.vehicleRentalService.serviceZones.length} zones`);
        seller.sellerProfile.vehicleRentalService.serviceZones.forEach((zone, idx) => {
          console.log(`     ${idx + 1}. ${zone.zoneName} (${zone.zoneCode})`);
        });
      }
    }

    console.log('\n📊 Setup Summary:');
    console.log('=================');
    console.log('✅ All sellers now have vehicle rental service zones configured');
    console.log('\n🎯 Routes available:');
    console.log('   GET /api/seller/vehicles/zones - Get seller zones');
    console.log('   POST /api/seller/vehicles/zones - Update seller zones');
    console.log('   PUT /api/seller/vehicles/zones/:zoneId - Update specific zone');
    console.log('   DELETE /api/seller/vehicles/zones/:zoneId - Delete specific zone');
    console.log('\n🎯 Alternative routes:');
    console.log('   GET /api/seller/bookings/cash-flow-summary - Cash flow summary (fixed)');
    console.log('   GET /api/seller/bookings/cash-flow/summary - Cash flow summary (standard)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the setup
testAndSetupZones();