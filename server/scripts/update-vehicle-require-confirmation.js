const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database using existing config
const connectDB = require('../config/database');

// Import Vehicle model
const Vehicle = require('../models/Vehicle');

const updateVehiclesRequireConfirmation = async () => {
  try {
    await connectDB();
    
    console.log('🔄 Starting to update vehicles...');
    
    // Find all vehicles that don't have requireConfirmation field or have it set to false
    const vehiclesToUpdate = await Vehicle.find({
      $or: [
        { requireConfirmation: { $exists: false } },
        { requireConfirmation: false }
      ]
    });

    console.log(`📋 Found ${vehiclesToUpdate.length} vehicles to update`);

    if (vehiclesToUpdate.length === 0) {
      console.log('✅ All vehicles already have requireConfirmation set to true');
      return;
    }

    // Update all vehicles to set requireConfirmation: true
    const updateResult = await Vehicle.updateMany(
      {
        $or: [
          { requireConfirmation: { $exists: false } },
          { requireConfirmation: false }
        ]
      },
      {
        $set: { requireConfirmation: true }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} vehicles successfully`);
    
    // Verify the update
    const totalVehicles = await Vehicle.countDocuments();
    const vehiclesWithRequireConfirmation = await Vehicle.countDocuments({ requireConfirmation: true });
    
    console.log(`📊 Summary:`);
    console.log(`   - Total vehicles: ${totalVehicles}`);
    console.log(`   - Vehicles with requireConfirmation=true: ${vehiclesWithRequireConfirmation}`);
    
    if (totalVehicles === vehiclesWithRequireConfirmation) {
      console.log('🎉 All vehicles now have requireConfirmation set to true!');
    } else {
      console.log('⚠️ Some vehicles may still need manual review');
    }

  } catch (error) {
    console.error('❌ Error updating vehicles:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the update script
if (require.main === module) {
  console.log('🚀 Vehicle Update Script Started');
  console.log('📝 This script will set requireConfirmation=true for all vehicles');
  updateVehiclesRequireConfirmation();
}

module.exports = { updateVehiclesRequireConfirmation };