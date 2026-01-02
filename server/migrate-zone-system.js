// Migration script for Zone-based Vehicle Rental System
// Run this script to migrate existing data to the new structure

const mongoose = require('mongoose');

// Connect to your database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// Migration functions

// 1. Add zoneId to existing vehicles based on their zoneCode
async function migrateVehicles() {
  const Vehicle = require('./models/Vehicle');
  
  console.log('Migrating vehicles...');
  
  const vehicles = await Vehicle.find({ zoneId: { $exists: false } });
  
  for (const vehicle of vehicles) {
    if (vehicle.zoneCode) {
      vehicle.zoneId = vehicle.zoneCode; // Use zoneCode as zoneId for existing vehicles
      await vehicle.save();
      console.log(`Updated vehicle ${vehicle.vehicleNo} with zoneId: ${vehicle.zoneId}`);
    }
  }
  
  console.log(`Migrated ${vehicles.length} vehicles`);
}

// 2. Add zoneId to existing bookings based on their zone
async function migrateBookings() {
  const VehicleBooking = require('./models/VehicleBooking');
  
  console.log('Migrating bookings...');
  
  const bookings = await VehicleBooking.find({ zoneId: { $exists: false } });
  
  for (const booking of bookings) {
    if (booking.zone) {
      // Create a zoneId from zone name (you might need to adjust this logic)
      booking.zoneId = booking.zone.toUpperCase().replace(/\s+/g, '_');
      await booking.save();
      console.log(`Updated booking ${booking.bookingId} with zoneId: ${booking.zoneId}`);
    }
  }
  
  console.log(`Migrated ${bookings.length} bookings`);
}

// 3. Initialize workerProfile for existing workers (if any)
async function initializeWorkerProfiles() {
  const User = require('./models/User');
  
  console.log('Initializing worker profiles...');
  
  const workers = await User.find({ 
    role: 'worker',
    workerProfile: { $exists: false }
  });
  
  for (const worker of workers) {
    worker.workerProfile = {
      sellerId: null, // You'll need to manually assign sellers
      zoneId: null, // You'll need to manually assign zones
      zoneCode: null,
      zoneName: null,
      isActive: true,
      joinedDate: worker.createdAt || new Date(),
      lastActiveDate: new Date(),
      performance: {
        bookingsHandled: 0,
        averageRating: 0,
        totalRatings: 0
      },
      workingHours: {
        monday: { start: "08:00", end: "18:00", isWorking: true },
        tuesday: { start: "08:00", end: "18:00", isWorking: true },
        wednesday: { start: "08:00", end: "18:00", isWorking: true },
        thursday: { start: "08:00", end: "18:00", isWorking: true },
        friday: { start: "08:00", end: "18:00", isWorking: true },
        saturday: { start: "08:00", end: "18:00", isWorking: true },
        sunday: { start: "08:00", end: "18:00", isWorking: false }
      }
    };
    
    await worker.save();
    console.log(`Initialized worker profile for ${worker.name}`);
  }
  
  console.log(`Initialized ${workers.length} worker profiles`);
}

// 4. Setup sample data for testing
async function setupSampleData() {
  const User = require('./models/User');
  const Vehicle = require('./models/Vehicle');
  
  console.log('Setting up sample data...');
  
  try {
    // Create a sample seller
    const seller = new User({
      name: "Sample Vehicle Rental Business",
      email: "sample@vehiclerental.com",
      phone: 9876543210,
      role: "seller",
      password: "password123",
      sellerProfile: {
        vehicleRentalService: {
          isEnabled: true,
          serviceStatus: "active",
          businessType: "fleet_owner",
          serviceZones: [
            {
              zoneName: "Main City Zone",
              zoneCode: "MCZ001",
              address: "123 Main Street, City Center",
              coordinates: { lat: 28.6139, lng: 77.2090 },
              isActive: true,
              operatingHours: {
                monday: { open: "08:00", close: "20:00", isOpen: true },
                tuesday: { open: "08:00", close: "20:00", isOpen: true },
                wednesday: { open: "08:00", close: "20:00", isOpen: true },
                thursday: { open: "08:00", close: "20:00", isOpen: true },
                friday: { open: "08:00", close: "20:00", isOpen: true },
                saturday: { open: "09:00", close: "18:00", isOpen: true },
                sunday: { open: "09:00", close: "18:00", isOpen: true }
              },
              contactInfo: {
                phone: "9876543211",
                email: "mcz@vehiclerental.com",
                managerName: "Zone Manager"
              }
            }
          ]
        }
      }
    });
    
    const savedSeller = await seller.save();
    console.log('Created sample seller');
    
    // Create a sample worker
    const worker = new User({
      name: "Zone Worker",
      email: "worker@vehiclerental.com",
      phone: 9876543220,
      role: "worker",
      password: "password123",
      workerProfile: {
        sellerId: savedSeller._id,
        zoneId: "MCZ001",
        zoneCode: "MCZ001",
        zoneName: "Main City Zone",
        isActive: true,
        joinedDate: new Date(),
        lastActiveDate: new Date(),
        performance: {
          bookingsHandled: 0,
          averageRating: 0,
          totalRatings: 0
        }
      }
    });
    
    const savedWorker = await worker.save();
    console.log('Created sample worker');
    
    // Update the seller's zone with worker ID
    savedSeller.sellerProfile.vehicleRentalService.serviceZones[0].workerId = savedWorker._id;
    await savedSeller.save();
    console.log('Updated seller zone with worker ID');
    
    console.log('Sample data setup complete!');
    console.log('Seller ID:', savedSeller._id);
    console.log('Worker ID:', savedWorker._id);
    
  } catch (error) {
    console.error('Error setting up sample data:', error);
  }
}

// Main migration function
async function runMigration() {
  try {
    await connectDB();
    
    console.log('Starting migration...');
    
    // Run migrations in order
    await migrateVehicles();
    await migrateBookings();
    await initializeWorkerProfiles();
    
    console.log('Migration completed successfully!');
    
    // Optionally set up sample data
    const setupSample = process.argv.includes('--setup-sample');
    if (setupSample) {
      await setupSampleData();
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  migrateVehicles,
  migrateBookings,
  initializeWorkerProfiles,
  setupSampleData
};