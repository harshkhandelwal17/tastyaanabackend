const mongoose = require('mongoose');
const VehicleBooking = require('./models/VehicleBooking');
const Vehicle = require('./models/Vehicle');

require('dotenv').config();

async function testVehicleDropSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a test booking that's ongoing
    const testBooking = await VehicleBooking.findOne({ 
      bookingStatus: 'ongoing' 
    }).populate('vehicleId');

    if (!testBooking) {
      console.log('No ongoing booking found. Creating test data...');
      
      // Create a test vehicle drop scenario
      const dropData = {
        endMeterReading: 50250, // 250 km traveled from start reading of 50000
        fuelLevel: 'quarter',
        vehicleCondition: 'good',
        damageNotes: '',
        returnImages: [],
        extraCharges: {
          damage: 0,
          cleaning: 200,
          fuel: 500,
          toll: 150,
          parking: 50,
          lateFees: 0,
          other: 100,
          otherDescription: 'Window tinting'
        },
        generalNotes: 'Vehicle returned in good condition, minor cleaning required',
        dropTime: new Date().toISOString()
      };

      console.log('Test Vehicle Drop Data:');
      console.log(JSON.stringify(dropData, null, 2));

      // Simulate calculations
      const startReading = 50000;
      const endReading = parseFloat(dropData.endMeterReading);
      const totalKmTraveled = endReading - startReading;
      
      console.log(`\n📊 Trip Calculations:`);
      console.log(`- Start Reading: ${startReading} km`);
      console.log(`- End Reading: ${endReading} km`);
      console.log(`- Total Distance: ${totalKmTraveled} km`);

      // Calculate extra charges
      const totalExtraCharges = Object.values(dropData.extraCharges).reduce((sum, charge) => {
        return sum + (parseFloat(charge) || 0);
      }, 0);

      console.log(`\n💰 Additional Charges:`);
      Object.entries(dropData.extraCharges).forEach(([key, value]) => {
        if (value > 0) {
          console.log(`- ${key}: ₹${value}`);
        }
      });
      console.log(`- Total Extra Charges: ₹${totalExtraCharges}`);

      return;
    }

    console.log('Found ongoing booking:', testBooking.bookingId);
    console.log('Vehicle:', testBooking.vehicleId?.brand, testBooking.vehicleId?.model);
    console.log('Start Reading:', testBooking.vehicleHandover?.startMeterReading, 'km');

    // Test the drop calculation logic
    const dropData = {
      endMeterReading: (testBooking.vehicleHandover?.startMeterReading || 0) + 150,
      extraCharges: {
        damage: 0,
        cleaning: 200,
        fuel: 300,
        toll: 100,
        parking: 50,
        lateFees: 0,
        other: 0
      }
    };

    console.log('\n🚗 Vehicle Drop Test:');
    console.log('- End Reading:', dropData.endMeterReading, 'km');
    console.log('- Distance Traveled:', dropData.endMeterReading - (testBooking.vehicleHandover?.startMeterReading || 0), 'km');
    
    const totalExtraCharges = Object.values(dropData.extraCharges).reduce((sum, charge) => {
      return sum + (parseFloat(charge) || 0);
    }, 0);
    
    console.log('- Extra Charges:', totalExtraCharges);
    console.log('- Original Amount:', testBooking.totalAmount || 0);
    console.log('- Final Amount:', (testBooking.totalAmount || 0) + totalExtraCharges);

    console.log('\n✅ Vehicle drop system testing complete');

  } catch (error) {
    console.error('Error testing vehicle drop system:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testVehicleDropSystem();