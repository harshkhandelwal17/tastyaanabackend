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

async function testNewCalculation() {
  await connectDB();
  
  // Import the Vehicle model
  const Vehicle = require('./server/models/Vehicle');
  
  try {
    // Find the specific vehicle from the booking
    const vehicle = await Vehicle.findById('6733d5f7a5c1e7a29db4e5d7');
    
    if (!vehicle) {
      console.log('Vehicle not found');
      return;
    }
    
    console.log('Vehicle Details:');
    console.log('Name:', vehicle.name);
    console.log('Rate 12hr:', JSON.stringify(vehicle.rate12hr, null, 2));
    console.log('Rate 24hr:', JSON.stringify(vehicle.rate24hr, null, 2));
    
    // Test calculation with booking parameters
    const duration = 33; // 33 hours as per booking
    const rateType = 'hourly24'; // 24hr rate type
    
    console.log('\n--- NEW CALCULATION METHOD ---');
    const rateCalculation = vehicle.calculateRate(duration, rateType);
    console.log('Duration:', duration, 'hours');
    console.log('Rate Type:', rateType);
    console.log('Calculation Result:', JSON.stringify(rateCalculation, null, 2));
    
    // Calculate full billing as backend does
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
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testNewCalculation();