// Analysis of the booking discrepancy
console.log('=== BOOKING DISCREPANCY ANALYSIS ===');

// From your booking data
const bookingData = {
  startDateTime: "2025-12-18T17:57:00.000Z",
  endDateTime: "2025-12-20T02:54:00.000Z",
  rateType: "hourly24",
  storedValues: {
    baseAmount: 1440,
    extraHourCharge: 180,
    gst: 292,
    totalBill: 4912,
    depositAmount: 3000
  },
  expectedValues: {
    frontendTotal: 5903,
    frontendBaseAmount: 2310
  },
  ratePlanUsed: {
    baseRate: 1440,
    ratePerHour: 70,
    extraChargePerHour: 20
  }
};

// Calculate actual duration
const startTime = new Date(bookingData.startDateTime);
const endTime = new Date(bookingData.endDateTime);
const durationMs = endTime - startTime;
const exactDurationHours = durationMs / (1000 * 60 * 60);
const ceilDurationHours = Math.ceil(exactDurationHours);

console.log('\n--- DURATION ANALYSIS ---');
console.log('Start:', startTime);
console.log('End:', endTime);
console.log('Exact Duration (hours):', exactDurationHours);
console.log('Ceil Duration (hours):', ceilDurationHours);

// Analyze the stored calculation
console.log('\n--- STORED CALCULATION ANALYSIS ---');
console.log('Stored base amount:', bookingData.storedValues.baseAmount);
console.log('Stored extra charge:', bookingData.storedValues.extraHourCharge);
console.log('Stored GST:', bookingData.storedValues.gst);
console.log('Stored total bill:', bookingData.storedValues.totalBill);

// Working backwards from stored values
const hourlyRateFromStored = bookingData.storedValues.baseAmount / 24;
const extraHoursFromStored = bookingData.storedValues.extraHourCharge / bookingData.ratePlanUsed.extraChargePerHour;
console.log('Implied hourly rate from stored base:', hourlyRateFromStored);
console.log('Extra hours from stored calculation:', extraHoursFromStored);
console.log('Total hours implied by stored calc:', 24 + extraHoursFromStored);

// Compare with expected frontend values
console.log('\n--- FRONTEND EXPECTED ANALYSIS ---');
console.log('Expected base amount:', bookingData.expectedValues.frontendBaseAmount);
console.log('Expected total:', bookingData.expectedValues.frontendTotal);

const frontendHourlyRate = bookingData.expectedValues.frontendBaseAmount / ceilDurationHours;
console.log('Frontend implied hourly rate:', frontendHourlyRate);

// Try to calculate what the correct values should be
console.log('\n--- CORRECT CALCULATION ---');
console.log('Duration should be:', ceilDurationHours, 'hours');

// For hourly24 rate type
const baseHours = 24;
const extraHours = Math.max(0, ceilDurationHours - baseHours);

// Check different hourly rate possibilities
console.log('\nTesting different hourly rates:');

// Test 1: Using rate from ratePlanUsed (70)
const test1Rate = bookingData.ratePlanUsed.ratePerHour;
const test1Base = test1Rate * Math.min(ceilDurationHours, baseHours);
const test1Extra = extraHours * bookingData.ratePlanUsed.extraChargePerHour;
const test1Subtotal = test1Base + test1Extra;
const test1GST = Math.round(test1Subtotal * 0.18);
const test1Total = test1Subtotal + test1GST + bookingData.storedValues.depositAmount;

console.log(`Test 1 (rate=${test1Rate}):`);
console.log(`  Base: ${test1Base}, Extra: ${test1Extra}, GST: ${test1GST}, Total: ${test1Total}`);

// Test 2: Using a rate that would match frontend base amount
const test2Rate = bookingData.expectedValues.frontendBaseAmount / Math.min(ceilDurationHours, baseHours);
const test2Base = test2Rate * Math.min(ceilDurationHours, baseHours);
const test2Extra = extraHours * bookingData.ratePlanUsed.extraChargePerHour;
const test2Subtotal = test2Base + test2Extra;
const test2GST = Math.round(test2Subtotal * 0.18);
const test2Total = test2Subtotal + test2GST + bookingData.storedValues.depositAmount;

console.log(`\nTest 2 (rate=${test2Rate.toFixed(2)}):`);
console.log(`  Base: ${test2Base}, Extra: ${test2Extra}, GST: ${test2GST}, Total: ${test2Total}`);

// Analysis summary
console.log('\n=== SUMMARY ===');
console.log('The discrepancy suggests either:');
console.log('1. Wrong hourly rate being used in calculation');
console.log('2. Wrong duration calculation');
console.log('3. Different rate structure than expected');
console.log('4. Frontend and backend using different rate sources');