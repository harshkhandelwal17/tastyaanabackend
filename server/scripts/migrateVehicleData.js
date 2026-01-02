const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import the enhanced vehicle model
const Vehicle = require('../models/VehicleEnhanced');

// Function to convert existing vehicle data to new schema format
function convertVehicleData() {
  try {
    // Read the existing vehicle rental data
    const dataPath = path.join(__dirname, '..', 'config', 'vehicleRentaldata.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const vehicleData = JSON.parse(rawData);

    if (!vehicleData.success || !vehicleData.data) {
      throw new Error('Invalid data format in vehicleRentaldata.json');
    }

    const convertedVehicles = vehicleData.data.map(oldVehicle => {
      // Helper function to safely parse numeric values
      const parseNumber = (value, defaultValue = 0) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string' && value !== 'undefined' && value !== '') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? defaultValue : parsed;
        }
        return defaultValue;
      };

      // Map company names to match enum
      const mapCompanyName = (company) => {
        if (!company) return 'Other';
        const lowerCompany = company.toLowerCase().trim();
        const companyMapping = {
          'hero': 'Hero',
          'honda': 'Honda', 
          'jawa': 'jawa', // Jawa not in enum, map to Other
          'bajaj': 'Bajaj',
          'suzuki': 'Suzuki',
          'yamaha': 'Yamaha',
          'tvs': 'TVS',
          'maruti': 'Maruti',
          'hyundai': 'Hyundai',
          'tata': 'Tata',
          'mahindra': 'Mahindra',
          'toyota': 'Toyota',
          'kia': 'Kia'
        };
        return companyMapping[lowerCompany] || 'Other';
      };

      // Determine vehicle category based on name
      const determineCategory = (name, company) => {
        if (!name) return 'bike';
        const lowerName = name.toLowerCase();
        if (lowerName.includes('activa') || lowerName.includes('scooty')) return 'scooty';
        if (lowerName.includes('car') || lowerName.includes('swift') || lowerName.includes('city')) return 'car';
        if (lowerName.includes('bus')) return 'bus';
        if (lowerName.includes('truck')) return 'truck';
        return 'bike'; // Default for most entries
      };

      // Convert the old format to new schema
      const convertedVehicle = {
        // Basic Information
        name: oldVehicle.name || 'Unknown Vehicle',
        category: determineCategory(oldVehicle.name, oldVehicle.company),
        type: 'Petrol', // Default assumption
        vehicleNo: (oldVehicle.number || '').toUpperCase(),
        companyName: mapCompanyName(oldVehicle.company),

        // Location & Zone Information
        zoneCenterName: oldVehicle.center?.fullName || 'Unknown Zone',
        zoneCenterAddress: oldVehicle.center?.address || 'Unknown Address',
        zoneCode: oldVehicle.center?.code || 'unknown',

        // Vehicle Details
        vehicleImages: oldVehicle.image || ['/assets/uploads/default.jpg'],
        meterReading: parseNumber(oldVehicle.meter, 0),
        
        // Rate Lists - mapping from old structure
        rate12hr: {
          baseRate: parseNumber(oldVehicle.rateTw, 500),
          ratePerHour: parseNumber(oldVehicle.availTw, 40),
          kmLimit: parseNumber(oldVehicle.limitTw, 120),
          extraChargePerKm: parseNumber(oldVehicle.extraTw, 3),
          extraChargePerHour: parseNumber(oldVehicle.extraHrCharge, 50),
          gracePeriodMinutes: 15,
          withFuelPerHour: parseNumber(oldVehicle.rateWf, 50),
          withoutFuelPerHour: parseNumber(oldVehicle.rateWtf, 40)
        },

        rateHourly: {
          ratePerHour: parseNumber(oldVehicle.rateWf, 50),
          kmFreePerHour: parseNumber(oldVehicle.limitWtf, 10),
          extraChargePerKm: parseNumber(oldVehicle.rsprkmWf || oldVehicle.extraWtf, 6),
          withFuelPerHour: parseNumber(oldVehicle.rateWf, 50),
          withoutFuelPerHour: parseNumber(oldVehicle.rateWtf, 40)
        },

        rate24hr: {
          baseRate: parseNumber(oldVehicle.rateTf, 750),
          extraBlockRate: 500,
          ratePerHour: 30,
          kmLimit: parseNumber(oldVehicle.limitTf, 150),
          extraChargePerKm: parseNumber(oldVehicle.extraTf, 3),
          extraChargePerHour: parseNumber(oldVehicle.availTf, 3),
          gracePeriodMinutes: 30,
          withFuelPerHour: 40,
          withoutFuelPerHour: 30
        },

        rateDaily: [{
          dayName: 'Monday',
          rate: parseNumber(oldVehicle.rateDw, 750),
          kmLimit: parseNumber(oldVehicle.limitDw, 150),
          extraChargePerKm: parseNumber(oldVehicle.extraDw, 3),
          withFuel: parseNumber(oldVehicle.rateDw, 750),
          withoutFuel: parseNumber(oldVehicle.rateDw, 750) * 0.8, // Assume 20% less without fuel
          gracePeriodMinutes: 60
        }],

        // Financial Details
        depositAmount: 2000, // Default
        requiredPaymentPercentage: 50, // Default

        // Maintenance Records
        maintenance: [{
          lastServicingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          nextDueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          serviceType: 'general-service',
          serviceCost: 0,
          serviceCenter: 'Local Service Center',
          notes: 'Migrated from old system',
          isCompleted: true,
          createdAt: new Date()
        }],

        // Documents
        documents: {
          rcBook: 'pending',
          insurance: 'pending',
          pollutionCert: 'pending',
          puc: 'pending'
        },

        // Analytics
        analytics: {
          totalBookings: 0,
          totalRevenue: 0,
          totalKmDriven: 0,
          totalHoursRented: 0,
          averageRating: 0,
          ratingCount: 0,
          popularTimeslots: []
        },

        // Legacy fields
        originalId: oldVehicle._id,
        isDeleted: oldVehicle.isDeleted || 0,

        // Status mapping
        status: (oldVehicle.status === 1) ? 'active' : 'inactive',
        availability: (oldVehicle.status === 1) ? 'available' : 'not-available',

        // Timestamps
        createdAt: oldVehicle.createdAt ? new Date(oldVehicle.createdAt) : new Date(),
        updatedAt: oldVehicle.updatedAt ? new Date(oldVehicle.updatedAt) : new Date(),

        // Required fields that need to be set (assuming defaults)
        sellerId: new mongoose.Types.ObjectId(), // This will need to be mapped properly
        requireConfirmation: true,
        color: 'Black',
        fuelCapacity: 5,
        mileage: 40,
        vehicleFeatures: [],
        damageReports: [],
        minBufferTime: 30,
        requiresApproval: false
      };

      return convertedVehicle;
    });

    return {
      success: true,
      count: convertedVehicles.length,
      vehicles: convertedVehicles
    };

  } catch (error) {
    console.error('Error converting vehicle data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to save converted data to a new file
function saveConvertedData() {
  const result = convertVehicleData();
  
  if (result.success) {
    const outputPath = path.join(__dirname, '..', 'config', 'convertedVehicleData.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`✅ Successfully converted ${result.count} vehicles`);
    console.log(`📁 Saved to: ${outputPath}`);
    
    // Also save just the vehicles array for easy import
    const vehiclesOnlyPath = path.join(__dirname, '..', 'config', 'vehiclesForImport.json');
    fs.writeFileSync(vehiclesOnlyPath, JSON.stringify(result.vehicles, null, 2), 'utf8');
    console.log(`📁 Vehicles array saved to: ${vehiclesOnlyPath}`);
    
    return result;
  } else {
    console.error('❌ Failed to convert vehicle data:', result.error);
    return result;
  }
}

// Function to bulk insert converted data into MongoDB
async function migrateToDatabase(mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/onlinestore') {
  try {
    await mongoose.connect(mongoUri);
    console.log('📡 Connected to MongoDB');
    
    const result = convertVehicleData();
    
    if (!result.success) {
      throw new Error('Failed to convert data: ' + result.error);
    }

    console.log(`🔄 Preparing to migrate ${result.count} vehicles...`);

    // Clear existing vehicles (optional - comment out if you want to keep existing data)
    // await Vehicle.deleteMany({});
    // console.log('🗑️  Cleared existing vehicles');

    // Insert converted vehicles
    const insertedVehicles = await Vehicle.insertMany(result.vehicles, { ordered: false });
    console.log(`✅ Successfully migrated ${insertedVehicles.length} vehicles to database`);
    
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    
    return {
      success: true,
      migrated: insertedVehicles.length
    };

  } catch (error) {
    console.error('❌ Migration error:', error);
    await mongoose.disconnect();
    return {
      success: false,
      error: error.message
    };
  }
}

// Export functions for use
module.exports = {
  convertVehicleData,
  saveConvertedData,
  migrateToDatabase
};

// Run conversion if this file is executed directly
if (require.main === module) {
  console.log('🚀 Starting vehicle data conversion...');
  
  // Save converted data to files
  saveConvertedData();
  
  // Uncomment the following lines to also migrate to database
  // const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/onlinestore';
  // migrateToDatabase(mongoUri).then(result => {
  //   if (result.success) {
  //     console.log(`🎉 Migration completed successfully! ${result.migrated} vehicles migrated.`);
  //   } else {
  //     console.log(`💥 Migration failed: ${result.error}`);
  //   }
  //   process.exit(0);
  // });
}