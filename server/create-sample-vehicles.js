const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');
require('dotenv').config();

const createSampleVehicles = async () => {
  try {
    // Connect to the same database as the main app
    const mongoUri = "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas successfully');

    // Check if vehicles already exist
    const existingVehicles = await Vehicle.countDocuments();
    if (existingVehicles > 0) {
      console.log(`${existingVehicles} vehicles already exist in database`);
      process.exit(0);
    }

    // Sample vehicles with all required fields
    const sampleVehicles = [
      {
        // Basic Information
        name: 'Honda Activa 6G',
        category: 'scooty',
        type: 'Petrol',
        vehicleNo: 'MH12AB1234',
        companyName: 'Honda',

        // Location
        zoneCenterName: 'North Zone Center',
        zoneCenterAddress: 'Vijay Nagar, Indore',
        zoneCode: 'NX001T',
        locationGeo: {
          type: 'Point',
          coordinates: [75.8577, 22.7196] // [longitude, latitude] for Indore
        },

        // Status
        status: 'active',
        availability: 'available',

        // Required fields
        vehicleImages: ['https://via.placeholder.com/400x300?text=Honda+Activa'],
        meterReading: 5000,
        fuelCapacity: 5.3,
        mileage: 60,

        // Documents (required)
        documents: {
          rcBook: 'https://via.placeholder.com/400x300?text=RC+Book',
          insurance: 'https://via.placeholder.com/400x300?text=Insurance',
          pollutionCert: 'https://via.placeholder.com/400x300?text=Pollution+Cert'
        },

        // Rate structures (12hr)
        rate12hr: {
          ratePerHour: 50,
          kmLimit: 100,
          extraChargePerKm: 5,
          extraChargePerHour: 20,
          withFuelPerHour: 60,
          withoutFuelPerHour: 45
        },

        // Rate structures (24hr) 
        rate24hr: {
          ratePerHour: 40,
          kmLimit: 200,
          extraChargePerKm: 4,
          extraChargePerHour: 15,
          withFuelPerHour: 50,
          withoutFuelPerHour: 35
        },

        // Daily rates (required array)
        rateDaily: [
          {
            dayName: 'Monday',
            rate: 400,
            kmLimit: 150,
            extraChargePerKm: 3,
            withFuel: 450,
            withoutFuel: 350
          },
          {
            dayName: 'Weekend',
            rate: 500,
            kmLimit: 150,
            extraChargePerKm: 4,
            withFuel: 550,
            withoutFuel: 450
          }
        ],

        // Financial
        depositAmount: 2000,
        requiredPaymentPercentage: 50,

        // Maintenance (required)
        maintenance: [
          {
            lastServicingDate: new Date('2024-10-01'),
            nextDueDate: new Date('2025-04-01'),
            serviceType: 'general-service' // Valid enum value
          }
        ],

        // Seller ID (we'll create a sample seller)
        sellerId: null // Will be set after creating seller
      },

      {
        // Basic Information
        name: 'Bajaj Pulsar 150',
        category: 'bike',
        type: 'Petrol',
        vehicleNo: 'MH12CD5678',
        companyName: 'Bajaj',

        // Location
        zoneCenterName: 'South Zone Center', 
        zoneCenterAddress: 'Palasia, Indore',
        zoneCode: 'NX002T',
        locationGeo: {
          type: 'Point',
          coordinates: [75.8577, 22.7196] // [longitude, latitude] for Indore
        },

        // Status
        status: 'active',
        availability: 'available',

        // Required fields
        vehicleImages: ['https://via.placeholder.com/400x300?text=Bajaj+Pulsar'],
        meterReading: 8000,
        fuelCapacity: 15,
        mileage: 45,

        // Documents (required)
        documents: {
          rcBook: 'https://via.placeholder.com/400x300?text=RC+Book+Pulsar',
          insurance: 'https://via.placeholder.com/400x300?text=Insurance+Pulsar',
          pollutionCert: 'https://via.placeholder.com/400x300?text=Pollution+Cert+Pulsar'
        },

        // Rate structures (12hr)
        rate12hr: {
          ratePerHour: 80,
          kmLimit: 120,
          extraChargePerKm: 6,
          extraChargePerHour: 25,
          withFuelPerHour: 90,
          withoutFuelPerHour: 70
        },

        // Rate structures (24hr)
        rate24hr: {
          ratePerHour: 70,
          kmLimit: 250,
          extraChargePerKm: 5,
          extraChargePerHour: 20,
          withFuelPerHour: 80,
          withoutFuelPerHour: 60
        },

        // Daily rates
        rateDaily: [
          {
            dayName: 'Monday',
            rate: 600,
            kmLimit: 200,
            extraChargePerKm: 4,
            withFuel: 700,
            withoutFuel: 550
          },
          {
            dayName: 'Weekend',
            rate: 750,
            kmLimit: 200,
            extraChargePerKm: 5,
            withFuel: 850,
            withoutFuel: 650
          }
        ],

        // Financial
        depositAmount: 3000,
        requiredPaymentPercentage: 50,

        // Maintenance
        maintenance: [
          {
            lastServicingDate: new Date('2024-11-01'),
            nextDueDate: new Date('2025-05-01'),
            serviceType: 'oil-change'
          }
        ],

        // Seller ID
        sellerId: null // Will be set after creating seller
      },

      {
        // Basic Information
        name: 'Maruti Swift',
        category: 'car',
        type: 'Petrol',
        vehicleNo: 'MH12EF9012',
        companyName: 'Maruti',

        // Location
        zoneCenterName: 'North Zone Center',
        zoneCenterAddress: 'Vijay Nagar, Indore',
        zoneCode: 'NX001T',
        locationGeo: {
          type: 'Point',
          coordinates: [75.8577, 22.7196] // [longitude, latitude] for Indore
        },

        // Status
        status: 'active',
        availability: 'available',

        // Required fields
        vehicleImages: ['https://via.placeholder.com/400x300?text=Maruti+Swift'],
        meterReading: 12000,
        fuelCapacity: 42,
        mileage: 22,

        // Documents (required)
        documents: {
          rcBook: 'https://via.placeholder.com/400x300?text=RC+Book+Swift',
          insurance: 'https://via.placeholder.com/400x300?text=Insurance+Swift',
          pollutionCert: 'https://via.placeholder.com/400x300?text=Pollution+Cert+Swift'
        },

        // Rate structures (12hr)
        rate12hr: {
          ratePerHour: 150,
          kmLimit: 100,
          extraChargePerKm: 10,
          extraChargePerHour: 50,
          withFuelPerHour: 170,
          withoutFuelPerHour: 130
        },

        // Rate structures (24hr)
        rate24hr: {
          ratePerHour: 130,
          kmLimit: 200,
          extraChargePerKm: 8,
          extraChargePerHour: 40,
          withFuelPerHour: 150,
          withoutFuelPerHour: 110
        },

        // Daily rates
        rateDaily: [
          {
            dayName: 'Monday',
            rate: 1200,
            kmLimit: 150,
            extraChargePerKm: 8,
            withFuel: 1400,
            withoutFuel: 1000
          },
          {
            dayName: 'Weekend',
            rate: 1500,
            kmLimit: 150,
            extraChargePerKm: 10,
            withFuel: 1700,
            withoutFuel: 1300
          }
        ],

        // Financial
        depositAmount: 5000,
        requiredPaymentPercentage: 50,

        // Maintenance
        maintenance: [
          {
            lastServicingDate: new Date('2024-09-15'),
            nextDueDate: new Date('2025-03-15'),
            serviceType: 'full-service'
          }
        ],

        // Seller ID
        sellerId: null // Will be set after creating seller
      }
    ];

    // First, create a sample seller if none exists
    const User = require('./models/User');
    let seller = await User.findOne({ role: 'seller' });
    
    if (!seller) {
      console.log('Creating sample seller...');
      seller = await User.create({
        name: 'Sample Vehicle Rental',
        email: 'seller@vehiclerental.com', 
        phone: '9876543210',
        role: 'seller',
        sellerProfile: {
          storeName: 'TastyAana Vehicle Rentals',
          gstNumber: 'GST123456789',
          panNumber: 'ABCDE1234F',
          isVerified: true
        },
        isVerified: true
      });
      console.log('Sample seller created successfully');
    }

    // Set seller ID for all vehicles
    sampleVehicles.forEach(vehicle => {
      vehicle.sellerId = seller._id;
    });

    // Create vehicles
    const createdVehicles = await Vehicle.insertMany(sampleVehicles);
    console.log(`✅ Successfully created ${createdVehicles.length} sample vehicles:`);
    
    createdVehicles.forEach(vehicle => {
      console.log(`   - ${vehicle.name} (${vehicle.vehicleNo}) in ${vehicle.zoneCenterName}`);
    });

    console.log('\n🎉 Vehicle rental system is now ready with sample data!');
    
  } catch (error) {
    console.error('❌ Error creating sample vehicles:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(field => {
        console.error(`   - ${field}: ${error.errors[field].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createSampleVehicles();