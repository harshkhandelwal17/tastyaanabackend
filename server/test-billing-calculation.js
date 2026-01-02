// Test script to verify billing calculation accuracy
require('dotenv').config();
const mongoose = require('mongoose');
require('./config/database');

const Vehicle = require('./models/Vehicle');

async function testBillingCalculation() {
  try {
    // Test data based on your booking
    const vehicleId = "693524438b72912258c630f7";
    const startDateTime = "2025-12-17T20:25:00.000Z";
    const endDateTime = "2025-12-20T07:40:00.000Z";
    const rateType = "hourly24";
    const includesFuel = false;

    // Get vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      console.log('Vehicle not found');
      return;
    }

    console.log('--- VEHICLE RATE DETAILS ---');
    console.log('24hr rate configuration:', vehicle.rate24hr);
    
    // Calculate duration
    const durationMs = new Date(endDateTime) - new Date(startDateTime);
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    
    console.log('\n--- DURATION CALCULATION ---');
    console.log('Start:', new Date(startDateTime));
    console.log('End:', new Date(endDateTime));
    console.log('Duration (ms):', durationMs);
    console.log('Duration (hours):', durationHours);
    console.log('Duration (exact hours):', durationMs / (1000 * 60 * 60));

    // Test rate calculation
    const rateCalculation = vehicle.calculateRate(durationHours, rateType, includesFuel);
    
    console.log('\n--- RATE CALCULATION ---');
    console.log('Rate calculation result:', rateCalculation);
    
    // Manual calculation for verification
    const hourlyRate = vehicle.rate24hr.withoutFuelPerHour; // Since includesFuel = false
    const baseHours = 24;
    const extraHours = Math.max(0, durationHours - baseHours);
    const extraChargePerHour = vehicle.rate24hr.extraChargePerHour;
    
    const baseAmount = hourlyRate * baseHours;
    const extraCharges = extraHours * extraChargePerHour;
    const total = baseAmount + extraCharges;
    
    console.log('\n--- MANUAL VERIFICATION ---');
    console.log('Hourly rate (without fuel):', hourlyRate);
    console.log('Base hours covered:', baseHours);
    console.log('Extra hours:', extraHours);
    console.log('Extra charge per hour:', extraChargePerHour);
    console.log('Base amount:', baseAmount);
    console.log('Extra charges:', extraCharges);
    console.log('Total rental cost:', total);
    
    // Calculate tax
    const gstRate = 0.18;
    const gstAmount = Math.round(total * gstRate);
    const depositAmount = vehicle.depositAmount || 3000; // Based on your data
    const finalTotal = total + gstAmount + depositAmount;
    
    console.log('\n--- TAX & FINAL CALCULATION ---');
    console.log('GST (18%):', gstAmount);
    console.log('Deposit:', depositAmount);
    console.log('Final total:', finalTotal);
    
    console.log('\n--- COMPARISON WITH YOUR DATA ---');
    console.log('Your frontend total: 8074');
    console.log('Your backend total: 8098');
    console.log('Calculated total: ', finalTotal);
    console.log('Difference (calculated vs your backend):', finalTotal - 8098);
    console.log('Difference (calculated vs your frontend):', finalTotal - 8074);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testBillingCalculation();