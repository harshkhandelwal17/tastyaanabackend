const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
require('./models/User');
const User = mongoose.model('User');

const verifySellerZones = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore');
    console.log('✅ Connected to MongoDB');

    const seller = await User.findOne({ 
      email: 'vikashrathor.499@gmail.com',
      role: 'seller'
    });

    if (!seller) {
      console.log('❌ Seller not found!');
      process.exit(1);
    }

    console.log('📊 Verification Results:');
    console.log('=========================');
    console.log(`👤 Seller: ${seller.name}`);
    console.log(`📧 Email: ${seller.email}`);
    console.log(`🚗 Vehicle Rental Service Enabled: ${seller.sellerProfile?.vehicleRentalService?.isEnabled || false}`);
    console.log(`📊 Service Status: ${seller.sellerProfile?.vehicleRentalService?.serviceStatus || 'Not set'}`);
    
    const zones = seller.sellerProfile?.vehicleRentalService?.serviceZones || [];
    console.log(`📋 Service Zones Count: ${zones.length}`);
    
    if (zones.length > 0) {
      console.log('\n🏢 Available Service Zones:');
      zones.forEach((zone, idx) => {
        console.log(`   ${idx + 1}. ${zone.zoneName} (${zone.zoneCode})`);
        console.log(`      📍 Address: ${zone.address}`);
        console.log(`      ✅ Active: ${zone.isActive}`);
      });
      
      console.log('\n✅ ZONE ACCESS CHECK SHOULD NOW WORK!');
      console.log('🎯 Vehicle zone codes that will match:');
      zones.forEach(zone => {
        console.log(`   ✓ ${zone.zoneCode} → ${zone.zoneName}`);
      });
    } else {
      console.log('\n❌ No service zones found! This needs to be fixed.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

verifySellerZones();