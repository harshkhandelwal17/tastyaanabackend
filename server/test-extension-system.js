const mongoose = require('mongoose');
require('dotenv').config();

async function testExtensionSystem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Load models
    require('./models/User');
    require('./models/Vehicle');
    require('./models/VehicleBooking');
    
    const VehicleBooking = mongoose.model('VehicleBooking');

    console.log('=== Extension System Test ===\n');

    // Test with existing booking
    const bookingId = '694f2ab6038bbc6903269dd9';
    const booking = await VehicleBooking.findById(bookingId).populate('vehicleId');

    if (!booking) {
      console.log('❌ Booking not found');
      process.exit(1);
    }

    console.log('📋 Testing with booking:', booking._id);
    console.log('Current end time:', booking.endDateTime);
    console.log('Current status:', booking.bookingStatus);

    // Simulate seller creating extension
    const newEndDateTime = new Date(booking.endDateTime);
    newEndDateTime.setHours(newEndDateTime.getHours() + 2); // Add 2 hours

    const extensionData = {
      requestId: `EXT_TEST_${Date.now()}`,
      requestedEndDateTime: newEndDateTime,
      additionalHours: 2,
      additionalAmount: 100,
      additionalGst: 18,
      additionalKmLimit: 20,
      reason: 'Test seller extension',
      requestedBy: 'seller',
      status: 'approved',
      requestedAt: new Date(),
      approvedAt: new Date()
    };

    // Add extension to booking
    if (!booking.extensionRequests) {
      booking.extensionRequests = [];
    }
    
    booking.extensionRequests.push(extensionData);
    booking.endDateTime = newEndDateTime;
    booking.totalExtensionHours = (booking.totalExtensionHours || 0) + 2;
    booking.totalExtensionAmount = (booking.totalExtensionAmount || 0) + 118;

    await booking.save();

    console.log('\n✅ Extension created successfully!');
    console.log('📊 Extension Details:');
    console.log('- Request ID:', extensionData.requestId);
    console.log('- Additional hours:', extensionData.additionalHours);
    console.log('- Additional amount:', extensionData.additionalAmount);
    console.log('- New end time:', newEndDateTime);
    console.log('- Status:', extensionData.status);

    console.log('\n📈 Updated booking:');
    console.log('- New end time:', booking.endDateTime);
    console.log('- Total extension hours:', booking.totalExtensionHours);
    console.log('- Total extension amount:', booking.totalExtensionAmount);
    console.log('- Extension requests count:', booking.extensionRequests.length);

    console.log('\n🎉 Extension system test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testExtensionSystem();