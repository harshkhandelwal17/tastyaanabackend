// Simple test for billing calculation logic without database
const calculateRate = function (duration, rateType, includesFuel = false) {
  let hourlyRate = 0;
  let extraCharges = 0;
  let baseHours = 0;
  let rateConfig = null;

  // Mock vehicle rate24hr data based on your booking
  const vehicle = {
    rate24hr: {
      withFuelPerHour: 70,
      withoutFuelPerHour: 60, // Guessing based on calculation
      extraChargePerHour: 20,
      kmLimit: 250,
      extraChargePerKm: 5,
      gracePeriodMinutes: 30
    },
    depositAmount: 3000
  };

  switch (rateType) {
    case 'hourly24':
      rateConfig = vehicle.rate24hr;
      baseHours = 24;
      hourlyRate = includesFuel ? rateConfig.withFuelPerHour : rateConfig.withoutFuelPerHour;
      if (duration > 24) {
        extraCharges = (duration - 24) * rateConfig.extraChargePerHour;
      }
      break;
    default:
      // Default fallback
      rateConfig = vehicle.rate24hr;
      baseHours = 24;
      hourlyRate = vehicle.rate24hr.withoutFuelPerHour;
      if (duration > 24) extraCharges = (duration - 24) * rateConfig.extraChargePerHour;
  }

  // Calculate base amount for the covered hours
  const coveredHours = Math.min(duration, baseHours);
  const baseRate = hourlyRate * coveredHours;

  return {
    baseRate,
    extraCharges,
    hourlyRate,
    baseHours,
    coveredHours,
    total: baseRate + extraCharges,
    vehicle: vehicle
  };
};

async function testBillingCalculation() {
  try {
    // Test data based on your booking
    const startDateTime = "2025-12-17T20:25:00.000Z";
    const endDateTime = "2025-12-20T07:40:00.000Z";
    const rateType = "hourly24";
    const includesFuel = false;

    // Calculate duration
    const durationMs = new Date(endDateTime) - new Date(startDateTime);
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    
    console.log('--- DURATION CALCULATION ---');
    console.log('Start:', new Date(startDateTime));
    console.log('End:', new Date(endDateTime));
    console.log('Duration (exact hours):', durationMs / (1000 * 60 * 60));
    console.log('Duration (ceil hours):', durationHours);

    // Test rate calculation
    const rateCalculation = calculateRate(durationHours, rateType, includesFuel);
    
    console.log('\n--- RATE CALCULATION ---');
    console.log('Rate calculation result:', rateCalculation);
    
    // Calculate tax and final amount
    const subtotal = rateCalculation.total;
    const gstRate = 0.18;
    const gstAmount = Math.round(subtotal * gstRate);
    const depositAmount = rateCalculation.vehicle.depositAmount;
    const finalTotal = subtotal + gstAmount + depositAmount;
    
    console.log('\n--- FINAL CALCULATION ---');
    console.log('Subtotal (base + extra):', subtotal);
    console.log('GST (18%):', gstAmount);
    console.log('Deposit:', depositAmount);
    console.log('Final total:', finalTotal);
    
    console.log('\n--- COMPARISON WITH YOUR DATA ---');
    console.log('Your booking data:');
    console.log('  baseAmount:', 1440);
    console.log('  extraHourCharge:', 720);
    console.log('  gst:', 778);
    console.log('  totalBill:', 8098);
    console.log('');
    console.log('Calculated values:');
    console.log('  baseAmount:', rateCalculation.baseRate);
    console.log('  extraHourCharge:', rateCalculation.extraCharges);
    console.log('  gst:', gstAmount);
    console.log('  totalBill:', finalTotal);
    
    // Working backwards from your data
    console.log('\n--- REVERSE ENGINEERING YOUR DATA ---');
    console.log('Your baseAmount (1440) ÷ 24 hours = hourly rate of', 1440/24);
    console.log('Your extraHourCharge (720) ÷ extra hours (' + (durationHours - 24) + ') = extra rate of', 720/(durationHours - 24));

  } catch (error) {
    console.error('Error:', error);
  }
}

testBillingCalculation();