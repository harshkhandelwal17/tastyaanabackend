/**
 * Database Migration Script: sittingCapacity -> seatingCapacity
 * 
 * This script migrates the field name from the incorrectly spelled 
 * 'sittingCapacity' to the correct 'seatingCapacity'
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Migration function
async function migrateSittingToSeatingCapacity() {
  try {
    console.log('🔄 Starting migration: sittingCapacity -> seatingCapacity');
    
    const db = mongoose.connection.db;
    const vehiclesCollection = db.collection('vehicles');
    
    // Step 1: Check current data state
    console.log('📊 Analyzing current data...');
    
    const totalVehicles = await vehiclesCollection.countDocuments();
    const vehiclesWithSitting = await vehiclesCollection.countDocuments({ sittingCapacity: { $exists: true } });
    const vehiclesWithSeating = await vehiclesCollection.countDocuments({ seatingCapacity: { $exists: true } });
    
    console.log(`Total vehicles: ${totalVehicles}`);
    console.log(`Vehicles with sittingCapacity: ${vehiclesWithSitting}`);
    console.log(`Vehicles with seatingCapacity: ${vehiclesWithSeating}`);
    
    // Step 2: Migrate data
    if (vehiclesWithSitting > 0) {
      console.log('🔄 Migrating sittingCapacity to seatingCapacity...');
      
      const result = await vehiclesCollection.updateMany(
        { 
          sittingCapacity: { $exists: true },
          seatingCapacity: { $exists: false }
        },
        [
          {
            $set: {
              seatingCapacity: "$sittingCapacity"
            }
          }
        ]
      );
      
      console.log(`✅ Migrated ${result.modifiedCount} vehicles`);
      
      // Step 3: Remove old field
      console.log('🗑️ Removing old sittingCapacity field...');
      
      const removeResult = await vehiclesCollection.updateMany(
        { sittingCapacity: { $exists: true } },
        { $unset: { sittingCapacity: 1 } }
      );
      
      console.log(`✅ Removed sittingCapacity from ${removeResult.modifiedCount} vehicles`);
    } else {
      console.log('✅ No vehicles with sittingCapacity found - migration may already be complete');
    }
    
    // Step 4: Verify migration
    console.log('🔍 Verifying migration...');
    
    const finalSitting = await vehiclesCollection.countDocuments({ sittingCapacity: { $exists: true } });
    const finalSeating = await vehiclesCollection.countDocuments({ seatingCapacity: { $exists: true } });
    
    console.log(`Final check - sittingCapacity: ${finalSitting}, seatingCapacity: ${finalSeating}`);
    
    if (finalSitting === 0 && finalSeating > 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️ Migration may need review');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Migration for configuration files (Rideyourbike.json)
async function updateConfigurationData() {
  try {
    console.log('🔄 Updating configuration data in database...');
    
    const db = mongoose.connection.db;
    const vehiclesCollection = db.collection('vehicles');
    
    // Update any vehicles that came from the configuration file
    const configUpdateResult = await vehiclesCollection.updateMany(
      { 
        source: 'rideyourbike_config' // Assuming you have a source field
      },
      [
        {
          $set: {
            seatingCapacity: { $ifNull: ["$seatingCapacity", "$sittingCapacity", 2] }
          }
        }
      ]
    );
    
    console.log(`✅ Updated ${configUpdateResult.modifiedCount} configuration-based vehicles`);
    
  } catch (error) {
    console.error('❌ Configuration update error:', error);
  }
}

// Main execution function
async function runMigration() {
  try {
    await connectDB();
    await migrateSittingToSeatingCapacity();
    await updateConfigurationData();
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  runMigration();
}

module.exports = {
  migrateSittingToSeatingCapacity,
  updateConfigurationData,
  runMigration
};