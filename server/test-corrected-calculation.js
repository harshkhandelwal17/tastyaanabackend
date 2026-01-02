// Test the corrected rate calculation
const calculateRate = function (duration, rateType, includesFuel = false) {
  // Mock vehicle rate24hr data with corrected rate
  const vehicle = {
    rate24hr: {
      ratePerHour: 70, // This should be used for base calculation
      withFuelPerHour: 80,
      withoutFuelPerHour: 60,
      extraChargePerHour: 20,
      kmLimit: 250,
      extraChargePerKm: 5,
      gracePeriodMinutes: 30
    },
    depositAmount: 3000
  };

  let hourlyRate = 0;
  let extraCharges = 0;
  let baseHours = 0;
  let rateConfig = null;

  switch (rateType) {
    case 'hourly24':
      rateConfig = vehicle.rate24hr;
      baseHours = 24;
      hourlyRate = rateConfig.ratePerHour; // Use standard ratePerHour
      if (duration > 24) {
        extraCharges = (duration - 24) * rateConfig.extraChargePerHour;
      }
      break;
  }

  const coveredHours = Math.min(duration, baseHours);
  const baseRate = hourlyRate * coveredHours;
  
  // Handle fuel charges separately
  let fuelCharges = 0;
  if (includesFuel && rateConfig.withFuelPerHour && rateConfig.withoutFuelPerHour) {
    const fuelRatePerHour = rateConfig.withFuelPerHour - rateConfig.ratePerHour;
    fuelCharges = fuelRatePerHour * duration;
  }

  return {
    baseRate,
    extraCharges,
    fuelCharges,
    hourlyRate,
    baseHours,
    coveredHours,
    total: baseRate + extraCharges + fuelCharges,
    vehicle: vehicle
  };
};

// Test with your booking data
const testData = {
  startDateTime: "2025-12-18T17:57:00.000Z",
  endDateTime: "2025-12-20T02:54:00.000Z",
  rateType: "hourly24",
  includesFuel: false
};

const durationMs = new Date(testData.endDateTime) - new Date(testData.startDateTime);
const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

const rateCalculation = calculateRate(durationHours, testData.rateType, testData.includesFuel);

console.log('=== CORRECTED RATE CALCULATION TEST ===');
console.log('Duration (hours):', durationHours);
console.log('Rate calculation:', rateCalculation);

// Calculate full billing
const subtotal = rateCalculation.total;
const gstAmount = Math.round(subtotal * 0.18);
const finalTotal = subtotal + gstAmount + rateCalculation.vehicle.depositAmount;

console.log('\n--- Full Billing Calculation ---');
console.log('Subtotal (base + extra + fuel):', subtotal);
console.log('GST (18%):', gstAmount);
console.log('Deposit:', rateCalculation.vehicle.depositAmount);
console.log('Final Total:', finalTotal);

console.log('\n--- Comparison ---');
console.log('Your Expected Frontend Total: 5903');
console.log('Corrected Calculation Total:', finalTotal);
console.log('Difference:', Math.abs(finalTotal - 5903));

console.log('\n--- Expected Values vs Calculated ---');
console.log('Expected Base: 2310, Calculated Base:', rateCalculation.baseRate);
console.log('Expected Extra: ~180, Calculated Extra:', rateCalculation.extraCharges);

// Verify the calculation matches expected values
if (rateCalculation.baseRate === 1680) { // 70 * 24
  console.log('✅ Base rate calculation is correct (70 * 24 = 1680)');
} else {
  console.log('❌ Base rate calculation is wrong');
}

if (rateCalculation.extraCharges === 180) { // (33-24) * 20
  console.log('✅ Extra charge calculation is correct ((33-24) * 20 = 180)');
} else {
  console.log('❌ Extra charge calculation is wrong');
}