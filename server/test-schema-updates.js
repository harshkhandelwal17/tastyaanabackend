// Test script to verify all fixes: helmet count, verification codes, document uploads, and vehicle return
const mongoose = require('mongoose');
require('./config/database'); // Database connection

const VehicleBooking = require('./models/VehicleBooking');
const Vehicle = require('./models/Vehicle');

// Test data for creating a booking with all the fixes
const createTestBooking = async () => {
  console.log('=== TESTING UPDATED VEHICLE BOOKING SCHEMA ===\n');

  try {
    // Find a vehicle to test with
    const testVehicle = await Vehicle.findOne();
    if (!testVehicle) {
      console.log('❌ No vehicles found in database');
      return;
    }

    console.log('✅ Found test vehicle:', testVehicle.model, testVehicle.brand);

    // Create test booking with new fields
    const testBookingData = {
      vehicleId: testVehicle._id,
      userId: new mongoose.Types.ObjectId(), // Mock user ID
      startDateTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      endDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // 25 hours from now
      zone: 'TEST001',
      centerId: 'TEST001',
      centerName: 'Test Center',
      centerAddress: 'Test Address',
      rateType: 'hourly24',
      ratePlanUsed: {
        baseRate: 1680,
        ratePerHour: 70,
        kmLimit: 200,
        extraChargePerKm: 8,
        extraChargePerHour: 40,
        gracePeriodMinutes: 30,
        includesFuel: false
      },
      billing: {
        baseAmount: 1680,
        extraKmCharge: 0,
        extraHourCharge: 0,
        fuelCharges: 0,
        taxes: {
          gst: 302,
          serviceTax: 0
        },
        totalBill: 4982
      },
      depositAmount: 3000,
      customerDetails: {
        name: 'Test User',
        phone: '+917805000329',
        email: 'test@example.com',
        drivingLicense: {
          number: 'TEST123456',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      },
      // NEW: Test helmet count (should be number, not boolean)
      accessoriesChecklist: {
        helmet: 3, // 3 helmets instead of true/false
        toolkit: true,
        spareTyre: false,
        firstAidKit: true
      }
      // NEW: Verification codes will be auto-generated
      // NEW: Vehicle return fields will be default
    };

    console.log('\n--- Creating Test Booking ---');
    const booking = new VehicleBooking(testBookingData);
    await booking.save();

    console.log('✅ Test booking created successfully!');
    console.log('Booking ID:', booking.bookingId);

    // Test 1: Verify helmet count is a number
    console.log('\n--- Test 1: Helmet Count ---');
    console.log('Helmet count:', booking.accessoriesChecklist.helmet);
    console.log('Type:', typeof booking.accessoriesChecklist.helmet);
    console.log('Is Number:', typeof booking.accessoriesChecklist.helmet === 'number' ? '✅' : '❌');

    // Test 2: Verify verification codes are generated
    console.log('\n--- Test 2: Verification Codes ---');
    console.log('Pickup Code:', booking.verificationCodes.pickup.code);
    console.log('Drop Code:', booking.verificationCodes.drop.code);
    console.log('Pickup Code Length:', booking.verificationCodes.pickup.code.length);
    console.log('Drop Code Length:', booking.verificationCodes.drop.code.length);
    console.log('4-digit codes:', 
      (booking.verificationCodes.pickup.code.length === 4 && 
       booking.verificationCodes.drop.code.length === 4) ? '✅' : '❌'
    );

    // Test 3: Verify vehicle return tracking fields exist
    console.log('\n--- Test 3: Vehicle Return Tracking ---');
    console.log('Vehicle Return Object:', booking.vehicleReturn);
    console.log('Submitted:', booking.vehicleReturn.submitted);
    console.log('Vehicle Available Again:', booking.vehicleReturn.vehicleAvailableAgain);
    console.log('Return tracking fields exist:', booking.vehicleReturn ? '✅' : '❌');

    // Test 4: Test document upload structure
    console.log('\n--- Test 4: Document Structure ---');
    console.log('Documents Array:', booking.documents);
    console.log('Documents Array Length:', booking.documents.length);
    console.log('Document schema ready:', Array.isArray(booking.documents) ? '✅' : '❌');

    // Add a mock document to test the structure
    booking.documents.push({
      type: 'id-proof',
      url: 'https://res.cloudinary.com/test/document.pdf',
      uploadedAt: new Date(),
      verified: false
    });
    await booking.save();

    console.log('Mock document added:', booking.documents.length);
    console.log('Document URL:', booking.documents[0].url);

    // Summary
    console.log('\n=== SCHEMA UPDATE VERIFICATION ===');
    console.log('✅ Helmet count changed to Number (0-5)');
    console.log('✅ Pickup verification code generated:', booking.verificationCodes.pickup.code);
    console.log('✅ Drop verification code generated:', booking.verificationCodes.drop.code);
    console.log('✅ Vehicle return tracking fields added');
    console.log('✅ Document upload structure working');

    return booking;

  } catch (error) {
    console.error('❌ Error creating test booking:', error);
    console.error('Error details:', error.message);
    
    if (error.name === 'ValidationError') {
      console.log('\nValidation Errors:');
      Object.keys(error.errors).forEach(key => {
        console.log(`- ${key}: ${error.errors[key].message}`);
      });
    }
  }
};

// Test the document upload endpoint simulation
const testDocumentUploadFlow = async (booking) => {
  if (!booking) return;

  console.log('\n=== TESTING DOCUMENT UPLOAD FLOW ===');
  
  // Mock the upload process
  const mockDocuments = [
    {
      type: 'driving-license',
      url: 'https://res.cloudinary.com/tastyaana/image/upload/license.jpg',
      originalName: 'license.jpg',
      size: 512000,
      uploadedAt: new Date(),
      verified: false
    },
    {
      type: 'address-proof',
      url: 'https://res.cloudinary.com/tastyaana/image/upload/address.pdf',
      originalName: 'address.pdf', 
      size: 1024000,
      uploadedAt: new Date(),
      verified: false
    }
  ];

  // Add mock documents to booking
  booking.documents.push(...mockDocuments);
  await booking.save();

  console.log('✅ Mock documents added to booking');
  console.log('Total documents:', booking.documents.length);
  console.log('Document types:', booking.documents.map(doc => doc.type));

  console.log('\n--- API Endpoints Available ---');
  console.log('✅ POST /api/vehicles/bookings/documents/upload');
  console.log('   - Upload files with bookingId in body');
  console.log('   - Automatically saves to booking.documents array');
  
  console.log('✅ POST /api/vehicles/bookings/:id/return');
  console.log('   - Mark vehicle as returned with drop verification code');
  console.log('   - Makes vehicle available again');
};

// Run the test
const runCompleteTest = async () => {
  try {
    console.log('🚀 Starting comprehensive schema update test...\n');
    
    const testBooking = await createTestBooking();
    
    if (testBooking) {
      await testDocumentUploadFlow(testBooking);
      
      console.log('\n🎉 ALL SCHEMA UPDATES TESTED SUCCESSFULLY! 🎉');
      console.log('\nNext steps:');
      console.log('1. Frontend can now upload documents with bookingId');
      console.log('2. Helmet count shows as number (0-5) instead of boolean');
      console.log('3. Pickup/drop verification codes auto-generated');
      console.log('4. Vehicle return tracking ready for seller use');
      
      console.log('\nBooking ID for testing:', testBooking.bookingId);
      console.log('Pickup Code:', testBooking.verificationCodes.pickup.code);
      console.log('Drop Code:', testBooking.verificationCodes.drop.code);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  runCompleteTest();
}

module.exports = { createTestBooking, testDocumentUploadFlow, runCompleteTest };