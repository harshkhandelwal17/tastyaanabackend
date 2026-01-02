const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
require('./models/User');
const User = mongoose.model('User');

const addZonesToSeller = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore');
    console.log('✅ Connected to MongoDB');

    // Find the seller by email (the one that was logged in)
    const sellerEmail = 'vikashrathor.499@gmail.com';
    console.log(`\n🔍 Looking for seller: ${sellerEmail}`);
    
    const seller = await User.findOne({ 
      email: sellerEmail,
      role: 'seller'
    });

    if (!seller) {
      console.log('❌ Seller not found!');
      process.exit(1);
    }

    console.log(`✅ Found seller: ${seller.name} (${seller.email})`);

    // Initialize seller profile structure if needed
    if (!seller.sellerProfile) {
      seller.sellerProfile = {};
      console.log('   ➕ Created sellerProfile');
    }

    if (!seller.sellerProfile.vehicleRentalService) {
      seller.sellerProfile.vehicleRentalService = {};
      console.log('   ➕ Created vehicleRentalService');
    }

    // Define the 3 zones
    const defaultZones = [
      {
        zoneName: 'Bholaram ustad marg',
        zoneCode: 'ind001',
        address: 'Bholaram ustad marg, Indore',
        isActive: true,
        coordinates: {
          latitude: 22.7196,
          longitude: 75.8577
        }
      },
      {
        zoneName: 'Indrapuri main office',
        zoneCode: 'ind003',
        address: 'Indrapuri main office, Indore',
        isActive: true,
        coordinates: {
          latitude: 22.7532,
          longitude: 75.8937
        }
      },
      {
        zoneName: 'Vijay nagar square',
        zoneCode: 'ind004',
        address: 'Vijay nagar square, Indore',
        isActive: true,
        coordinates: {
          latitude: 22.7532,
          longitude: 75.8937
        }
      }
    ];

    // Check existing zones
    if (seller.sellerProfile.vehicleRentalService.serviceZones && 
        seller.sellerProfile.vehicleRentalService.serviceZones.length > 0) {
      console.log('\n📋 Current zones:');
      seller.sellerProfile.vehicleRentalService.serviceZones.forEach((zone, idx) => {
        console.log(`   ${idx + 1}. ${zone.zoneName} (${zone.zoneCode})`);
      });
    }

    // Add/Update zones
    seller.sellerProfile.vehicleRentalService.serviceZones = defaultZones;
    
    // Save the seller
    console.log('\n💾 Saving seller with zones...');
    await seller.save();

    console.log('\n🎉 Successfully added zones to seller!');
    console.log('\n📋 Added zones:');
    defaultZones.forEach((zone, idx) => {
      console.log(`   ${idx + 1}. ${zone.zoneName} (${zone.zoneCode})`);
      console.log(`      📍 ${zone.address}`);
    });

    console.log('\n✅ Seller can now create bookings in these zones');

  } catch (error) {
    console.error('❌ Error adding zones to seller:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the script
addZonesToSeller();