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

async function testWithActualDeposit() {
  await connectDB();
  
  // Import the Vehicle model
  const Vehicle = require('./models/Vehicle');
  
  try {
    // Find the Bajaj Pulsar 150 vehicle
    const vehicle = await Vehicle.findOne({ name: 'Bajaj Pulsar 150' });
    
    if (!vehicle) {
      console.log('Vehicle not found');
      return;
    }
    
    console.log('Vehicle Details:');
    console.log('Name:', vehicle.name);
    console.log('ID:', vehicle._id);
    console.log('Deposit Amount:', vehicle.depositAmount);
    console.log('Rate 24hr:', JSON.stringify(vehicle.rate24hr, null, 2));
    
    // Import the calculateBillingDetails function (copy it here since it's not exported)
    const calculateBillingDetails = (vehicle, startDateTime, endDateTime, rateType, includesFuel, addons = []) => {
      try {
        // Calculate duration in hours
        const durationMs = new Date(endDateTime) - new Date(startDateTime);
        const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
        
        // Get rate calculation
        const rateCalculation = vehicle.calculateRate(durationHours, rateType, includesFuel);
        
        // Calculate addons total
        const addonsTotal = addons.reduce((sum, item) => sum + (item.price * (item.count || 1)), 0);
        
        // Calculate subtotal (base + extra charges + fuel charges + addons)
        // Note: rateCalculation.total already includes base + extra + fuel
        const subtotal = rateCalculation.total + addonsTotal;
        
        // Calculate GST (18% on rental + fuel + addons, deposit is usually exempt)
        const gstAmount = Math.round(subtotal * 0.18);
        
        // Calculate final total (rental + addons + GST + deposit)
        const finalTotal = subtotal + gstAmount + vehicle.depositAmount;
        
        return {
          durationHours,
          rateCalculation,
          addonsTotal,
          subtotal,
          gstAmount,
          finalTotal,
          depositAmount: vehicle.depositAmount,
          breakdown: {
            baseAmount: rateCalculation.baseRate,
            extraCharges: rateCalculation.extraCharges,
            fuelCharges: rateCalculation.fuelCharges,
            addons: addonsTotal,
            gst: gstAmount,
            deposit: vehicle.depositAmount,
            rentalSubtotal: rateCalculation.total // This is base + extra + fuel
          }
        };
      } catch (error) {
        throw new Error(`Billing calculation failed: ${error.message}`);
      }
    };
    
    // Test with realistic booking dates (33 hours)
    const startDateTime = '2024-11-16T10:00:00Z';
    const endDateTime = '2024-11-17T19:00:00Z'; // 33 hours later
    const rateType = 'hourly24';
    const includesFuel = false;
    const addons = [];
    
    console.log('\n--- FULL BACKEND CALCULATION ---');
    const billingDetails = calculateBillingDetails(vehicle, startDateTime, endDateTime, rateType, includesFuel, addons);
    
    console.log('Duration Hours:', billingDetails.durationHours);
    console.log('Rate Calculation:', JSON.stringify(billingDetails.rateCalculation, null, 2));
    console.log('Billing Details:', JSON.stringify(billingDetails, null, 2));
    
    console.log('\n--- BREAKDOWN COMPARISON ---');
    console.log('Base Amount (₹70 × 33 hrs):', billingDetails.breakdown.baseAmount);
    console.log('Extra Charges:', billingDetails.breakdown.extraCharges);
    console.log('Fuel Charges:', billingDetails.breakdown.fuelCharges);
    console.log('Addons:', billingDetails.breakdown.addons);
    console.log('GST (18%):', billingDetails.breakdown.gst);
    console.log('Deposit Amount:', billingDetails.breakdown.deposit);
    console.log('FINAL TOTAL:', billingDetails.finalTotal);
    
    console.log('\n--- COMPARISON ---');
    console.log('Frontend Expected Total: ₹5,903');
    console.log('Backend Calculated Total: ₹' + billingDetails.finalTotal);
    console.log('Difference: ₹' + Math.abs(5903 - billingDetails.finalTotal));
    
    if (billingDetails.finalTotal === 5903) {
      console.log('✅ PERFECT MATCH!');
    } else if (Math.abs(billingDetails.finalTotal - 5903) <= 10) {
      console.log('✅ CLOSE MATCH (within ₹10)');
    } else {
      console.log('❌ Still needs adjustment');
      
      // Let's see what deposit amount would make it match
      const targetTotal = 5903;
      const currentTotalWithoutDeposit = billingDetails.finalTotal - billingDetails.breakdown.deposit;
      const neededDeposit = targetTotal - currentTotalWithoutDeposit;
      console.log('Current deposit:', billingDetails.breakdown.deposit);
      console.log('Needed deposit for exact match:', neededDeposit);
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

testWithActualDeposit();