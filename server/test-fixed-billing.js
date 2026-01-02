// Test the fixed billing calculation
const calculateRate = function (duration, rateType, includesFuel = false) {
  let hourlyRate = 0;
  let extraCharges = 0;
  let baseHours = 0;

  // Mock vehicle rate24hr data
  const rateConfig = {
    withFuelPerHour: 70,
    withoutFuelPerHour: 60,
    extraChargePerHour: 20,
    kmLimit: 250,
    extraChargePerKm: 5,
    gracePeriodMinutes: 30
  };

  switch (rateType) {
    case 'hourly24':
      baseHours = 24;
      hourlyRate = includesFuel ? rateConfig.withFuelPerHour : rateConfig.withoutFuelPerHour;
      if (duration > 24) {
        extraCharges = (duration - 24) * rateConfig.extraChargePerHour;
      }
      break;
  }

  const coveredHours = Math.min(duration, baseHours);
  const baseRate = hourlyRate * coveredHours;

  return {
    baseRate,
    extraCharges,
    total: baseRate + extraCharges
  };
};

const calculateBillingDetails = (vehicle, startDateTime, endDateTime, rateType, includesFuel, addons = []) => {
  const durationMs = new Date(endDateTime) - new Date(startDateTime);
  const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
  
  const rateCalculation = calculateRate(durationHours, rateType, includesFuel);
  const addonsTotal = addons.reduce((sum, item) => sum + (item.price * (item.count || 1)), 0);
  
  // Subtotal is rental cost + addons
  const subtotal = rateCalculation.total + addonsTotal;
  
  // GST on subtotal
  const gstAmount = Math.round(subtotal * 0.18);
  
  // Final total includes deposit
  const finalTotal = subtotal + gstAmount + vehicle.depositAmount;
  
  return {
    durationHours,
    rateCalculation,
    addonsTotal,
    subtotal,
    gstAmount,
    finalTotal,
    breakdown: {
      baseAmount: rateCalculation.baseRate,
      extraCharges: rateCalculation.extraCharges,
      fuelCharges: includesFuel ? (rateCalculation.total - rateCalculation.baseRate - rateCalculation.extraCharges) : 0,
      addons: addonsTotal,
      gst: gstAmount,
      deposit: vehicle.depositAmount,
      rentalSubtotal: rateCalculation.total
    }
  };
};

// Test with your data
const mockVehicle = {
  depositAmount: 3000,
  rate24hr: {
    withFuelPerHour: 70,
    withoutFuelPerHour: 60,
    extraChargePerHour: 20
  }
};

const testData = {
  startDateTime: "2025-12-17T20:25:00.000Z",
  endDateTime: "2025-12-20T07:40:00.000Z",
  rateType: "hourly24",
  includesFuel: false,
  addons: []
};

const result = calculateBillingDetails(
  mockVehicle,
  testData.startDateTime,
  testData.endDateTime,
  testData.rateType,
  testData.includesFuel,
  testData.addons
);

console.log('=== FIXED BILLING CALCULATION ===');
console.log('Duration (hours):', result.durationHours);
console.log('Rate calculation:', result.rateCalculation);
console.log('Subtotal (rental + addons):', result.subtotal);
console.log('GST (18%):', result.gstAmount);
console.log('Deposit:', result.breakdown.deposit);
console.log('Final Total:', result.finalTotal);

console.log('\n=== COMPARISON ===');
console.log('Your backend total: 8098');
console.log('Your frontend total: 8074');
console.log('Fixed calculation: ', result.finalTotal);
console.log('Difference (vs backend):', result.finalTotal - 8098);
console.log('Difference (vs frontend):', result.finalTotal - 8074);