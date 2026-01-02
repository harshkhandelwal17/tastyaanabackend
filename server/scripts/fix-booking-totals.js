// Script to check and fix booking totals
require('dotenv').config();
const mongoose = require('mongoose');
require('../config/database');

const VehicleBooking = require('../models/VehicleBooking');

async function checkAndFixBookingTotals() {
  try {
    console.log('Checking all bookings for total bill discrepancies...');
    
    const bookings = await VehicleBooking.find({});
    let fixedCount = 0;
    let checkedCount = 0;
    
    for (const booking of bookings) {
      checkedCount++;
      const storedTotal = booking.billing.totalBill;
      const correctTotal = booking.correctTotalBill;
      const difference = Math.abs(storedTotal - correctTotal);
      
      if (difference > 1) { // More than 1 rupee difference
        console.log(`\nBooking ID: ${booking.bookingId}`);
        console.log(`Stored Total: ${storedTotal}`);
        console.log(`Correct Total: ${correctTotal}`);
        console.log(`Difference: ${difference}`);
        console.log(`Rental Subtotal: ${booking.rentalSubtotal}`);
        console.log(`GST: ${booking.billing.taxes.gst}`);
        console.log(`Deposit: ${booking.depositAmount}`);
        
        // Update the booking with correct total
        booking.billing.totalBill = correctTotal;
        await booking.save();
        fixedCount++;
        
        console.log(`✓ Fixed total for booking ${booking.bookingId}`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Checked: ${checkedCount} bookings`);
    console.log(`Fixed: ${fixedCount} bookings`);
    console.log(`No issues: ${checkedCount - fixedCount} bookings`);
    
  } catch (error) {
    console.error('Error checking bookings:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Check specific booking if ID provided
async function checkSpecificBooking(bookingId) {
  try {
    const booking = await VehicleBooking.findOne({ 
      $or: [
        { bookingId: bookingId },
        { _id: bookingId }
      ]
    });
    
    if (!booking) {
      console.log('Booking not found');
      return;
    }
    
    console.log('=== BOOKING ANALYSIS ===');
    console.log('Booking ID:', booking.bookingId);
    console.log('Duration:', Math.ceil((booking.endDateTime - booking.startDateTime) / (1000 * 60 * 60)), 'hours');
    console.log('Rate Type:', booking.rateType);
    console.log('\n--- Billing Breakdown ---');
    console.log('Base Amount:', booking.billing.baseAmount);
    console.log('Extra Hour Charge:', booking.billing.extraHourCharge);
    console.log('Fuel Charges:', booking.billing.fuelCharges);
    console.log('Addons Total:', booking.billing.addonsTotal || 0);
    console.log('GST:', booking.billing.taxes.gst);
    console.log('Deposit:', booking.depositAmount);
    console.log('\n--- Calculations ---');
    console.log('Rental Subtotal:', booking.rentalSubtotal);
    console.log('Stored Total:', booking.billing.totalBill);
    console.log('Correct Total:', booking.correctTotalBill);
    console.log('Difference:', Math.abs(booking.billing.totalBill - booking.correctTotalBill));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];
const bookingId = args[1];

if (command === 'check' && bookingId) {
  checkSpecificBooking(bookingId);
} else if (command === 'fix-all') {
  checkAndFixBookingTotals();
} else {
  console.log('Usage:');
  console.log('  node fix-booking-totals.js check <bookingId>     - Check specific booking');
  console.log('  node fix-booking-totals.js fix-all              - Fix all bookings');
}