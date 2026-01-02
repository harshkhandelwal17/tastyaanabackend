const mongoose = require('mongoose');
require('dotenv').config();

// Import Vehicle model
require('./models/Vehicle');
const Vehicle = mongoose.model('Vehicle');

const checkVehicleZones = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore');
    console.log('✅ Connected to MongoDB');

    // Get vehicles for the seller
    const sellerEmail = 'vikashrathor.499@gmail.com';
    
    // Find User to get seller ID
    require('./models/User');
    const User = mongoose.model('User');
    const seller = await User.findOne({ email: sellerEmail });
    
    if (!seller) {
      console.log('❌ Seller not found!');
      process.exit(1);
    }

    console.log(`\n🔍 Checking vehicles for seller: ${seller.name}`);
    
    const vehicles = await Vehicle.find({ 
      sellerId: seller._id,
      status: 'active'
    }).limit(5);

    console.log(`\n📊 Found ${vehicles.length} vehicles:`);
    
    vehicles.forEach((vehicle, i) => {
      console.log(`\n🚗 Vehicle ${i + 1}: ${vehicle.brand} ${vehicle.model}`);
      console.log(`   📍 Zone ID: ${vehicle.zoneId || 'Not set'}`);
      console.log(`   📍 Zone Code: ${vehicle.zoneCode || 'Not set'}`);
      console.log(`   📍 Zone Name: ${vehicle.zoneCenterName || 'Not set'}`);
      console.log(`   💳 Vehicle ID: ${vehicle._id}`);
    });

    if (vehicles.length === 0) {
      console.log('\n⚠️ No vehicles found for this seller!');
      console.log('You may need to create vehicles or check if they belong to this seller.');
    }

  } catch (error) {
    console.error('❌ Error checking vehicles:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the script
checkVehicleZones();