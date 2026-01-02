const mongoose = require('mongoose');
require('dotenv').config();

// Import Vehicle model
const Vehicle = require('./models/Vehicle');

async function checkSellerIdTypes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore');
    console.log('✅ Connected to MongoDB');

    // Get all vehicles and check sellerId types
    const vehicles = await Vehicle.find({}).select('_id sellerId createdAt').limit(100);
    
    console.log(`\n📊 Found ${vehicles.length} vehicles (showing first 100)`);
    console.log('=====================================');

    let objectIdCount = 0;
    let stringCount = 0;
    let nullCount = 0;
    let stringSellerIds = [];

    vehicles.forEach((vehicle, index) => {
      const sellerIdType = typeof vehicle.sellerId;
      const isObjectId = mongoose.Types.ObjectId.isValid(vehicle.sellerId) && 
                        vehicle.sellerId instanceof mongoose.Types.ObjectId;
      
      if (vehicle.sellerId === null || vehicle.sellerId === undefined) {
        nullCount++;
        console.log(`${index + 1}. ID: ${vehicle._id} - sellerId: NULL/UNDEFINED`);
      } else if (isObjectId) {
        objectIdCount++;
        console.log(`${index + 1}. ID: ${vehicle._id} - sellerId: ${vehicle.sellerId} (ObjectId) ✅`);
      } else if (sellerIdType === 'string') {
        stringCount++;
        stringSellerIds.push({
          vehicleId: vehicle._id,
          sellerId: vehicle.sellerId,
          createdAt: vehicle.createdAt
        });
        console.log(`${index + 1}. ID: ${vehicle._id} - sellerId: ${vehicle.sellerId} (String) ❌`);
      } else {
        console.log(`${index + 1}. ID: ${vehicle._id} - sellerId: ${vehicle.sellerId} (${sellerIdType}) ⚠️`);
      }
    });

    console.log('\n📈 Summary:');
    console.log(`=====================================`);
    console.log(`🟢 ObjectId sellerId: ${objectIdCount}`);
    console.log(`🔴 String sellerId: ${stringCount}`);
    console.log(`⚫ Null/Undefined sellerId: ${nullCount}`);
    console.log(`📊 Total checked: ${vehicles.length}`);

    if (stringCount > 0) {
      console.log('\n🔴 Vehicles with String sellerId that need migration:');
      console.log('=====================================================');
      stringSellerIds.forEach((item, index) => {
        console.log(`${index + 1}. Vehicle: ${item.vehicleId} | sellerId: "${item.sellerId}" | Created: ${item.createdAt}`);
      });

      // Check if string sellerIds are valid ObjectIds
      console.log('\n🔍 Validating String sellerIds:');
      console.log('================================');
      
      for (const item of stringSellerIds) {
        const isValidObjectId = mongoose.Types.ObjectId.isValid(item.sellerId);
        console.log(`sellerId: "${item.sellerId}" - Valid ObjectId format: ${isValidObjectId ? '✅' : '❌'}`);
      }
    } else {
      console.log('\n✅ All sellerId fields are already properly typed as ObjectId!');
    }

    // Get total count in database
    const totalCount = await Vehicle.countDocuments();
    console.log(`\n📊 Total vehicles in database: ${totalCount}`);
    
    if (totalCount > 100) {
      console.log('⚠️  Only checked first 100 vehicles. Run full scan if needed.');
    }

  } catch (error) {
    console.error('❌ Error checking sellerId types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkSellerIdTypes();