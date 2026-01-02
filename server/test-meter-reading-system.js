const mongoose = require('mongoose');
require('dotenv').config();

async function testMeterReadingSystem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Load models
    require('./models/User');
    require('./models/Vehicle');
    require('./models/VehicleBooking');
    
    const VehicleBooking = mongoose.model('VehicleBooking');
    
    console.log('=== Meter Reading System Test ===\n');
    
    // Get an existing booking
    const booking = await VehicleBooking.findById('694f2ab6038bbc6903269dd9');
    
    if (!booking) {
      console.log('❌ Test booking not found');
      return;
    }
    
    console.log('📋 Testing with booking:', booking._id);
    console.log('Current booking status:', booking.bookingStatus);
    
    // Test 1: Set start meter reading
    console.log('\n🚗 Test 1: Setting start meter reading...');
    const startResult = booking.updateMeterReading('start', 50000);
    console.log('Start meter reading result:', startResult);
    
    // Test 2: Set end meter reading
    console.log('\n🏁 Test 2: Setting end meter reading...');
    const endResult = booking.updateMeterReading('end', 50150); // 150 km trip
    console.log('End meter reading result:', endResult);
    
    // Test 3: Calculate trip metrics
    console.log('\n📊 Test 3: Calculating trip metrics...');
    const tripMetrics = booking.calculateTripMetrics();
    console.log('Trip metrics:', tripMetrics);
    
    // Test 4: Calculate extra KM charges
    console.log('\n💰 Test 4: Calculating extra KM charges...');
    const extraCharges = booking.calculateExtraKmCharges();
    console.log('Extra charges calculation:', extraCharges);
    
    // Test 5: Finalize billing
    console.log('\n🧾 Test 5: Finalizing billing...');
    const finalBilling = booking.finalizeBookingBilling();
    console.log('Final billing result:', finalBilling);
    
    // Save the booking with new data
    await booking.save();
    console.log('\n✅ Booking saved with meter readings and calculated charges');
    
    console.log('\n=== Test Summary ===');
    console.log('Start meter reading:', booking.vehicleHandover?.startMeterReading);
    console.log('End meter reading:', booking.vehicleReturn?.endMeterReading);
    console.log('Total KM traveled:', booking.tripMetrics?.totalKmTraveled);
    console.log('Base amount:', booking.billing?.baseAmount);
    console.log('Extra KM charge:', booking.billing?.extraKmCharge);
    console.log('Total bill:', booking.billing?.totalBill);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    process.exit(0);
  }
}

testMeterReadingSystem();