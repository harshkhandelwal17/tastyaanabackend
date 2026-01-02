const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Vehicle = require('./models/Vehicle');

/**
 * Migration script to convert sellerId fields from String to ObjectId
 * 
 * This script:
 * 1. Creates a backup collection before migration
 * 2. Finds all vehicles with string-type sellerId
 * 3. Validates that string sellerIds are valid ObjectId format
 * 4. Converts valid string sellerIds to proper ObjectId type
 * 5. Provides rollback functionality
 */

class SellerIdMigration {
  constructor() {
    this.backupCollectionName = `vehicles_backup_${Date.now()}`;
    this.migratedCount = 0;
    this.errorCount = 0;
    this.errors = [];
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore');
      console.log('✅ Connected to MongoDB');
      console.log(`🏛️  Database: ${mongoose.connection.db.databaseName}`);
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }

  async createBackup() {
    try {
      console.log('\n📦 Creating backup...');
      const vehicleCount = await Vehicle.countDocuments();
      
      if (vehicleCount === 0) {
        console.log('ℹ️  No vehicles to backup');
        return;
      }

      // Create backup collection
      await mongoose.connection.db.collection('vehicles')
        .aggregate([{ $out: this.backupCollectionName }])
        .toArray();
      
      console.log(`✅ Backup created: ${this.backupCollectionName} (${vehicleCount} documents)`);
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }

  async analyzeData() {
    console.log('\n🔍 Analyzing sellerId field types...');
    
    // Get all vehicles with their sellerId types
    const vehicles = await Vehicle.find({}).select('_id sellerId').lean();
    
    let objectIdCount = 0;
    let stringCount = 0;
    let nullCount = 0;
    let invalidStringCount = 0;
    let validStringSellerIds = [];

    for (const vehicle of vehicles) {
      if (vehicle.sellerId === null || vehicle.sellerId === undefined) {
        nullCount++;
      } else if (mongoose.Types.ObjectId.isValid(vehicle.sellerId) && 
                 vehicle.sellerId instanceof mongoose.Types.ObjectId) {
        objectIdCount++;
      } else if (typeof vehicle.sellerId === 'string') {
        stringCount++;
        
        // Check if string is a valid ObjectId format
        if (mongoose.Types.ObjectId.isValid(vehicle.sellerId)) {
          validStringSellerIds.push({
            vehicleId: vehicle._id,
            sellerId: vehicle.sellerId
          });
        } else {
          invalidStringCount++;
          this.errors.push({
            vehicleId: vehicle._id,
            error: `Invalid ObjectId format: "${vehicle.sellerId}"`
          });
        }
      }
    }

    console.log('\n📊 Analysis Results:');
    console.log('====================');
    console.log(`🟢 ObjectId sellerId: ${objectIdCount}`);
    console.log(`🟡 String sellerId (valid): ${validStringSellerIds.length}`);
    console.log(`🔴 String sellerId (invalid): ${invalidStringCount}`);
    console.log(`⚫ Null/Undefined sellerId: ${nullCount}`);
    console.log(`📊 Total vehicles: ${vehicles.length}`);

    if (validStringSellerIds.length === 0) {
      console.log('\n✅ No migration needed - all sellerId fields are already properly typed!');
      return [];
    }

    if (invalidStringCount > 0) {
      console.log('\n⚠️  Found invalid sellerId values:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Vehicle ${error.vehicleId}: ${error.error}`);
      });
    }

    return validStringSellerIds;
  }

  async migrateSellerId(vehiclesToMigrate) {
    if (vehiclesToMigrate.length === 0) {
      console.log('\n✅ No vehicles to migrate');
      return;
    }

    console.log(`\n🔄 Migrating ${vehiclesToMigrate.length} vehicles...`);
    console.log('=====================================');

    for (let i = 0; i < vehiclesToMigrate.length; i++) {
      const { vehicleId, sellerId } = vehiclesToMigrate[i];
      
      try {
        // Convert string to ObjectId
        const objectIdSellerId = new mongoose.Types.ObjectId(sellerId);
        
        // Update the vehicle document
        const result = await Vehicle.updateOne(
          { _id: vehicleId },
          { $set: { sellerId: objectIdSellerId } }
        );

        if (result.modifiedCount === 1) {
          this.migratedCount++;
          console.log(`✅ ${i + 1}/${vehiclesToMigrate.length} - Vehicle ${vehicleId}: "${sellerId}" → ObjectId`);
        } else {
          this.errorCount++;
          console.log(`❌ ${i + 1}/${vehiclesToMigrate.length} - Vehicle ${vehicleId}: Failed to update`);
        }
      } catch (error) {
        this.errorCount++;
        console.error(`❌ ${i + 1}/${vehiclesToMigrate.length} - Vehicle ${vehicleId}: ${error.message}`);
        this.errors.push({
          vehicleId,
          error: error.message
        });
      }
    }
  }

  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    const remainingStringSellerIds = await Vehicle.find({
      sellerId: { $type: "string" }
    }).select('_id sellerId');

    if (remainingStringSellerIds.length === 0) {
      console.log('✅ Migration verification passed - no string sellerId fields remain');
    } else {
      console.log(`❌ Migration verification failed - ${remainingStringSellerIds.length} string sellerId fields still exist:`);
      remainingStringSellerIds.forEach((vehicle, index) => {
        console.log(`   ${index + 1}. Vehicle ${vehicle._id}: "${vehicle.sellerId}"`);
      });
    }
  }

  async showSummary() {
    console.log('\n📈 Migration Summary:');
    console.log('=====================');
    console.log(`✅ Successfully migrated: ${this.migratedCount}`);
    console.log(`❌ Errors encountered: ${this.errorCount}`);
    console.log(`📦 Backup collection: ${this.backupCollectionName}`);
    
    if (this.errors.length > 0) {
      console.log('\n🔴 Errors details:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Vehicle ${error.vehicleId}: ${error.error}`);
      });
    }
  }

  async rollback() {
    try {
      console.log(`\n🔄 Rolling back from backup: ${this.backupCollectionName}...`);
      
      // Check if backup exists
      const collections = await mongoose.connection.db.listCollections().toArray();
      const backupExists = collections.some(col => col.name === this.backupCollectionName);
      
      if (!backupExists) {
        console.log('❌ Backup collection not found');
        return false;
      }

      // Drop current vehicles collection
      await mongoose.connection.db.collection('vehicles').drop();
      console.log('🗑️  Dropped current vehicles collection');

      // Restore from backup
      await mongoose.connection.db.collection(this.backupCollectionName)
        .aggregate([{ $out: 'vehicles' }])
        .toArray();
      
      console.log('✅ Rollback completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return false;
    }
  }

  async run(options = {}) {
    try {
      await this.connect();
      
      // Create backup before migration
      if (!options.skipBackup) {
        await this.createBackup();
      }

      // Analyze current data
      const vehiclesToMigrate = await this.analyzeData();
      
      // If no migration needed, exit
      if (vehiclesToMigrate.length === 0) {
        return;
      }

      // Confirm migration
      if (!options.autoConfirm) {
        console.log(`\n⚠️  About to migrate ${vehiclesToMigrate.length} vehicles`);
        console.log('   This will convert string sellerId values to ObjectId type');
        console.log(`   Backup created: ${this.backupCollectionName}`);
        console.log('\n   Run with --confirm flag to proceed');
        return;
      }

      // Perform migration
      await this.migrateSellerId(vehiclesToMigrate);
      
      // Verify migration
      await this.verifyMigration();
      
      // Show summary
      await this.showSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    autoConfirm: args.includes('--confirm'),
    skipBackup: args.includes('--skip-backup'),
    rollback: args.includes('--rollback'),
    help: args.includes('--help') || args.includes('-h')
  };

  if (options.help) {
    console.log(`
🔧 Seller ID Migration Script
============================

Usage: node migrate-sellerid.js [options]

Options:
  --confirm      Automatically confirm migration (required for execution)
  --skip-backup  Skip creating backup (NOT recommended)
  --rollback     Rollback to the most recent backup
  --help, -h     Show this help message

Examples:
  node migrate-sellerid.js                    # Dry run - analyze only
  node migrate-sellerid.js --confirm          # Execute migration with backup
  node migrate-sellerid.js --rollback         # Rollback to backup
    `);
    return;
  }

  const migration = new SellerIdMigration();

  if (options.rollback) {
    await migration.connect();
    const success = await migration.rollback();
    await migration.disconnect();
    process.exit(success ? 0 : 1);
    return;
  }

  await migration.run(options);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SellerIdMigration;