const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodDelivery');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function findVehicles() {
  await connectDB();
  
  // Import the Vehicle model
  const Vehicle = require('./models/Vehicle');
  
  try {
    // Find all vehicles and show their IDs
    const vehicles = await Vehicle.find({}, { name: 1, _id: 1, rate24hr: 1 });
    
    console.log('Available Vehicles:');
    vehicles.forEach(vehicle => {
      console.log(`ID: ${vehicle._id}`);
      console.log(`Name: ${vehicle.name}`);
      if (vehicle.rate24hr && vehicle.rate24hr.ratePerHour) {
        console.log(`24hr Rate: ₹${vehicle.rate24hr.ratePerHour}/hour`);
      }
      console.log('---');
    });
    
    // Test with the first vehicle that has a 24hr rate of ₹70
    const testVehicle = vehicles.find(v => v.rate24hr?.ratePerHour === 70);
    
    if (testVehicle) {
      console.log(`\nUsing vehicle: ${testVehicle.name} (ID: ${testVehicle._id})`);
      
      // Get full vehicle details
      const vehicle = await Vehicle.findById(testVehicle._id);
      
      console.log('Rate 24hr:', JSON.stringify(vehicle.rate24hr, null, 2));
      
      // Test calculation
      const duration = 33;
      const rateType = 'hourly24';
      
      console.log('\n--- NEW CALCULATION METHOD ---');
      const rateCalculation = vehicle.calculateRate(duration, rateType);
      console.log('Duration:', duration, 'hours');
      console.log('Rate Type:', rateType);
      console.log('Calculation Result:', JSON.stringify(rateCalculation, null, 2));
      
      // Calculate full billing
      const baseAmount = rateCalculation.baseRate;
      const extraCharges = rateCalculation.extraCharges;
      const gst = Math.round(baseAmount * 0.18); // 18% GST
      const depositAmount = 3000; // Fixed deposit
      const total = baseAmount + gst + depositAmount;
      
      console.log('\n--- FULL BILLING BREAKDOWN ---');
      console.log('Base Amount (₹70 × 33 hrs):', baseAmount);
      console.log('Extra Charges:', extraCharges);
      console.log('Subtotal:', baseAmount + extraCharges);
      console.log('GST (18%):', gst);
      console.log('Deposit Amount:', depositAmount);
      console.log('TOTAL:', total);
      
      console.log('\n--- COMPARISON ---');
      console.log('Frontend Expected Total: ₹5,903');
      console.log('Backend Calculated Total: ₹' + total);
      console.log('Difference: ₹' + Math.abs(5903 - total));
      
      if (total === 5903) {
        console.log('✅ PERFECT MATCH!');
      } else if (Math.abs(total - 5903) <= 10) {
        console.log('✅ CLOSE MATCH (within ₹10)');
      } else {
        console.log('❌ Still needs adjustment');
      }
    } else {
      console.log('No vehicle with ₹70/hour rate found');
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

findVehicles();