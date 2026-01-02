const mongoose = require('mongoose');
const User = require('../models/User');
const { allVehicleRentalSellers, hashPasswords } = require('../mockData/vehicleRentalSellers');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Seed function for vehicle rental sellers
const seedVehicleRentalSellers = async () => {
  try {
    console.log('🚗 Starting vehicle rental sellers seeding...');
    
    // Hash passwords for all sellers
    console.log('🔐 Hashing passwords...');
    const hashedSellers = await hashPasswords(allVehicleRentalSellers);
    
    // Check if sellers already exist
    const existingEmails = hashedSellers.map(seller => seller.email);
    const existingSellers = await User.find({ 
      email: { $in: existingEmails }, 
      role: 'seller',
      'sellerProfile.vehicleRentalService.isEnabled': true 
    });
    
    if (existingSellers.length > 0) {
      console.log(`⚠️  Found ${existingSellers.length} existing vehicle rental sellers:`);
      existingSellers.forEach(seller => {
        console.log(`   - ${seller.name} (${seller.email})`);
      });
      
      console.log('🔄 Removing existing sellers to avoid duplicates...');
      await User.deleteMany({ 
        email: { $in: existingEmails }, 
        role: 'seller' 
      });
    }
    
    // Insert new sellers
    console.log('📝 Inserting new vehicle rental sellers...');
    const insertedSellers = await User.insertMany(hashedSellers);
    
    console.log(`✅ Successfully seeded ${insertedSellers.length} vehicle rental sellers:`);
    
    // Log summary by zones
    console.log('\n🏢 Sellers by Zone:');
    const zones = {
      "Bholaram Ustad Marg": [],
      "Vijaynagar": [],
      "Indrapuri": []
    };
    
    insertedSellers.forEach(seller => {
      const serviceZones = seller.sellerProfile.vehicleRentalService.serviceZones;
      serviceZones.forEach(zone => {
        if (zones[zone.zoneName]) {
          zones[zone.zoneName].push({
            name: seller.sellerProfile.storeName,
            vehicles: seller.sellerProfile.vehicleRentalService.fleetStats.totalVehicles,
            rating: seller.sellerProfile.vehicleRentalService.businessMetrics.averageRating
          });
        }
      });
    });
    
    Object.entries(zones).forEach(([zoneName, sellers]) => {
      console.log(`\n📍 ${zoneName}:`);
      if (sellers.length === 0) {
        console.log('   No sellers in this zone');
      } else {
        sellers.forEach(seller => {
          console.log(`   - ${seller.name} (${seller.vehicles} vehicles, ${seller.rating}⭐)`);
        });
      }
    });
    
    // Summary statistics
    const totalVehicles = insertedSellers.reduce((sum, seller) => 
      sum + seller.sellerProfile.vehicleRentalService.fleetStats.totalVehicles, 0
    );
    
    const avgRating = insertedSellers.reduce((sum, seller) => 
      sum + seller.sellerProfile.vehicleRentalService.businessMetrics.averageRating, 0
    ) / insertedSellers.length;
    
    console.log('\n📊 Summary Statistics:');
    console.log(`   Total Sellers: ${insertedSellers.length}`);
    console.log(`   Total Vehicles: ${totalVehicles}`);
    console.log(`   Average Rating: ${avgRating.toFixed(1)}⭐`);
    console.log(`   Zones Covered: Bholaram Ustad Marg, Vijaynagar, Indrapuri`);
    
    return insertedSellers;
  } catch (error) {
    console.error('❌ Error seeding vehicle rental sellers:', error);
    throw error;
  }
};

// Cleanup function
const cleanupExistingSellers = async () => {
  try {
    console.log('🧹 Cleaning up existing vehicle rental sellers...');
    const result = await User.deleteMany({ 
      role: 'seller',
      'sellerProfile.vehicleRentalService.isEnabled': true 
    });
    console.log(`✅ Removed ${result.deletedCount} existing vehicle rental sellers`);
  } catch (error) {
    console.error('❌ Error cleaning up existing sellers:', error);
    throw error;
  }
};

// Main execution function
const runSeeding = async () => {
  try {
    await connectDB();
    
    // Ask user if they want to cleanup first
    const args = process.argv.slice(2);
    if (args.includes('--cleanup') || args.includes('-c')) {
      await cleanupExistingSellers();
    }
    
    await seedVehicleRentalSellers();
    
    console.log('\n🎉 Vehicle rental sellers seeding completed successfully!');
    console.log('\n💡 You can now test the vehicle rental system with these sellers:');
    console.log('   - Bholaram Wheels (Bholaram Ustad Marg)');
    console.log('   - Vijaynagar Auto Rentals (Vijaynagar)');
    console.log('   - Indrapuri Speed Rentals (Indrapuri)');
    console.log('   - Premium Auto Hub (Multi-zone)');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📤 Database connection closed.');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  runSeeding();
}

module.exports = {
  seedVehicleRentalSellers,
  cleanupExistingSellers,
  runSeeding
};

// Usage:
// npm run seed:vehicle-sellers
// or
// node scripts/seedVehicleRentalSellers.js
// or with cleanup:
// node scripts/seedVehicleRentalSellers.js --cleanup