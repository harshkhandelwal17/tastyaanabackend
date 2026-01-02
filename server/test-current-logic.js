// Test the current rate calculation logic from the Vehicle model
const calculateRate = function (duration, rateType, includesFuel = false) {
  // Mock the current logic from Vehicle.js
  let hourlyRate = 0;
  let extraCharges = 0;
  let baseHours = 0;
  let rateConfig = null;

  const mockVehicle = {
    rate24hr: {
      ratePerHour: 70,
      withFuelPerHour: 80,
      withoutFuelPerHour: 60,
      extraChargePerHour: 20
    }
  };

  switch (rateType) {
    case 'hourly24':
      rateConfig = mockVehicle.rate24hr;
      baseHours = 24;
      hourlyRate = rateConfig.ratePerHour;
      break;
  }

  // Current logic from Vehicle.js
  const baseRate = hourlyRate * duration;
  
  if (duration > baseHours) {
    extraCharges = 0; // Frontend includes extra in base amount
  }
  
  let fuelCharges = 0;
  if (includesFuel && rateConfig.withFuelPerHour && rateConfig.withoutFuelPerHour) {
    const fuelRatePerHour = rateConfig.withFuelPerHour - rateConfig.withoutFuelPerHour;
    fuelCharges = fuelRatePerHour * duration;
  }

  return {
    baseRate,
    extraCharges,
    fuelCharges,
    hourlyRate,
    baseHours,
    duration,
    total: baseRate + extraCharges + fuelCharges,
    mockVehicle
  };
};

// Test with your booking data
const testData = {
  duration: 33,
  rateType: "hourly24",
  includesFuel: false
};

const result = calculateRate(testData.duration, testData.rateType, testData.includesFuel);

console.log('=== TESTING CURRENT VEHICLE.JS LOGIC ===');
console.log('Duration:', testData.duration, 'hours');
console.log('Rate calculation:', result);

// Calculate full billing
const subtotal = result.total;
const gstAmount = Math.round(subtotal * 0.18);
const depositAmount = 3000;
const finalTotal = subtotal + gstAmount + depositAmount;

console.log('\n--- Complete Billing Calculation ---');
console.log('Base Amount:', result.baseRate);
console.log('Extra Charges:', result.extraCharges);
console.log('Fuel Charges:', result.fuelCharges);
console.log('Subtotal:', subtotal);
console.log('GST (18%):', gstAmount);
console.log('Deposit:', depositAmount);
console.log('Final Total:', finalTotal);

console.log('\n--- Comparison with Expected ---');
console.log('Expected Base Amount: 2310');
console.log('Calculated Base Amount:', result.baseRate);
console.log('Base Amount Match:', result.baseRate === 2310 ? '✅' : '❌');

console.log('\nExpected Total: 5903');
console.log('Calculated Total:', finalTotal);
console.log('Total Difference:', Math.abs(finalTotal - 5903));
console.log('Total Match (±20):', Math.abs(finalTotal - 5903) <= 20 ? '✅' : '❌');

// Calculate what the remaining difference might be
if (result.baseRate === 2310) {
  console.log('\n✅ Base calculation is now correct!');
  if (Math.abs(finalTotal - 5903) > 0) {
    console.log('Remaining difference of', Math.abs(finalTotal - 5903), 'might be due to:');
    console.log('- Different GST calculation');
    console.log('- Service charges');
    console.log('- Rounding differences');
  }
}