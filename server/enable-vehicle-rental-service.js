const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
require('./models/User');
const User = mongoose.model('User');

const enableVehicleRentalAndAddZones = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore');
    console.log('✅ Connected to MongoDB');

    // Find the seller by email
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
    console.log(`📊 Current service status:`, seller.sellerProfile?.vehicleRentalService?.isEnabled);
    console.log(`📋 Current zones count:`, seller.sellerProfile?.vehicleRentalService?.serviceZones?.length || 0);

    // Initialize seller profile structure if needed
    if (!seller.sellerProfile) {
      seller.sellerProfile = {};
      console.log('   ➕ Created sellerProfile');
    }

    if (!seller.sellerProfile.vehicleRentalService) {
      seller.sellerProfile.vehicleRentalService = {};
      console.log('   ➕ Created vehicleRentalService');
    }

    // FIRST: Enable the vehicle rental service
    console.log('\n🔧 Enabling vehicle rental service...');
    seller.sellerProfile.vehicleRentalService.isEnabled = true;
    seller.sellerProfile.vehicleRentalService.serviceStatus = 'active';

    // Define the 3 zones with all required fields
    const defaultZones = [
      {
        zoneName: 'Bholaram ustad marg',
        zoneCode: 'ind001',
        address: 'Bholaram ustad marg, Indore, Madhya Pradesh',
        isActive: true,
        coordinates: {
          lat: 22.7196,
          lng: 75.8577
        },
        operatingHours: {
          monday: { open: '09:00', close: '21:00', isOpen: true },
          tuesday: { open: '09:00', close: '21:00', isOpen: true },
          wednesday: { open: '09:00', close: '21:00', isOpen: true },
          thursday: { open: '09:00', close: '21:00', isOpen: true },
          friday: { open: '09:00', close: '21:00', isOpen: true },
          saturday: { open: '09:00', close: '21:00', isOpen: true },
          sunday: { open: '10:00', close: '20:00', isOpen: true }
        },
        contactInfo: {
          phone: seller.phone || '9876543210',
          email: seller.email,
          managerName: seller.name
        }
      },
      {
        zoneName: 'Indrapuri main office',
        zoneCode: 'ind003',
        address: 'Indrapuri main office, Indore, Madhya Pradesh',
        isActive: true,
        coordinates: {
          lat: 22.7532,
          lng: 75.8937
        },
        operatingHours: {
          monday: { open: '09:00', close: '21:00', isOpen: true },
          tuesday: { open: '09:00', close: '21:00', isOpen: true },
          wednesday: { open: '09:00', close: '21:00', isOpen: true },
          thursday: { open: '09:00', close: '21:00', isOpen: true },
          friday: { open: '09:00', close: '21:00', isOpen: true },
          saturday: { open: '09:00', close: '21:00', isOpen: true },
          sunday: { open: '10:00', close: '20:00', isOpen: true }
        },
        contactInfo: {
          phone: seller.phone || '9876543211',
          email: seller.email,
          managerName: seller.name
        }
      },
      {
        zoneName: 'Vijay nagar square',
        zoneCode: 'ind004',
        address: 'Vijay nagar square, Indore, Madhya Pradesh',
        isActive: true,
        coordinates: {
          lat: 22.7532,
          lng: 75.8937
        },
        operatingHours: {
          monday: { open: '09:00', close: '21:00', isOpen: true },
          tuesday: { open: '09:00', close: '21:00', isOpen: true },
          wednesday: { open: '09:00', close: '21:00', isOpen: true },
          thursday: { open: '09:00', close: '21:00', isOpen: true },
          friday: { open: '09:00', close: '21:00', isOpen: true },
          saturday: { open: '09:00', close: '21:00', isOpen: true },
          sunday: { open: '10:00', close: '20:00', isOpen: true }
        },
        contactInfo: {
          phone: seller.phone || '9876543212',
          email: seller.email,
          managerName: seller.name
        }
      }
    ];

    // SECOND: Add the zones AFTER enabling the service
    console.log('\n📋 Adding service zones...');
    seller.sellerProfile.vehicleRentalService.serviceZones = defaultZones;
    
    // Update other service settings
    seller.sellerProfile.vehicleRentalService.businessType = 'individual';
    seller.sellerProfile.vehicleRentalService.fleetStats = seller.sellerProfile.vehicleRentalService.fleetStats || {
      totalVehicles: 0,
      activeVehicles: 0,
      vehicleCategories: {
        bikes: 0,
        cars: 0,
        scooties: 0,
        buses: 0,
        trucks: 0
      },
      lastUpdated: new Date()
    };

    // Save the seller
    console.log('\n💾 Saving seller with enabled service and zones...');
    await seller.save();

    console.log('\n🎉 Successfully enabled vehicle rental service and added zones!');
    console.log('\n📊 Service Status:');
    console.log(`   ✅ Is Enabled: ${seller.sellerProfile.vehicleRentalService.isEnabled}`);
    console.log(`   📊 Service Status: ${seller.sellerProfile.vehicleRentalService.serviceStatus}`);
    console.log(`   🏢 Business Type: ${seller.sellerProfile.vehicleRentalService.businessType}`);
    
    console.log('\n📋 Added zones:');
    seller.sellerProfile.vehicleRentalService.serviceZones.forEach((zone, idx) => {
      console.log(`   ${idx + 1}. ${zone.zoneName} (${zone.zoneCode})`);
      console.log(`      📍 ${zone.address}`);
      console.log(`      📞 ${zone.contactInfo.phone}`);
      console.log(`      ✅ Active: ${zone.isActive}`);
    });

    console.log('\n✅ Seller can now create bookings in these zones!');
    console.log('\n🔄 Vehicle rental service is now ACTIVE');

  } catch (error) {
    console.error('❌ Error setting up vehicle rental service:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the script
enableVehicleRentalAndAddZones();