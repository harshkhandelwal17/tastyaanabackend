// Alternative calculation to match frontend expectations
console.log('=== ALTERNATIVE CALCULATION ANALYSIS ===');

const bookingData = {
  duration: 33,
  rateType: "hourly24",
  ratePlanUsed: {
    ratePerHour: 70,
    extraChargePerHour: 20
  },
  frontendExpected: {
    baseAmount: 2310,
    total: 5903
  }
};

// Method 1: Frontend might be using simple hourly calculation
const method1 = {
  baseAmount: bookingData.ratePlanUsed.ratePerHour * bookingData.duration,
  extraCharges: 0,
  total: 0
};
method1.total = method1.baseAmount;

console.log('Method 1 - Simple Hourly (Rate × Duration):');
console.log(`Base: ${bookingData.ratePlanUsed.ratePerHour} × ${bookingData.duration} = ${method1.baseAmount}`);
console.log(`Total: ${method1.total}`);

// Method 2: Base for 24hr + extra for additional hours (current backend)
const method2 = {
  baseAmount: bookingData.ratePlanUsed.ratePerHour * 24,
  extraCharges: (bookingData.duration - 24) * bookingData.ratePlanUsed.extraChargePerHour,
  total: 0
};
method2.total = method2.baseAmount + method2.extraCharges;

console.log('\nMethod 2 - Base 24hr + Extra (Current Backend):');
console.log(`Base: ${bookingData.ratePlanUsed.ratePerHour} × 24 = ${method2.baseAmount}`);
console.log(`Extra: (${bookingData.duration} - 24) × ${bookingData.ratePlanUsed.extraChargePerHour} = ${method2.extraCharges}`);
console.log(`Total: ${method2.total}`);

// Method 3: Try to reverse engineer frontend logic
const method3 = {
  baseAmount: bookingData.frontendExpected.baseAmount,
  impliedRate: bookingData.frontendExpected.baseAmount / bookingData.duration,
  total: 0
};
method3.total = method3.baseAmount;

console.log('\nMethod 3 - Reverse Engineering Frontend:');
console.log(`Frontend base: ${method3.baseAmount}`);
console.log(`Implied rate: ${method3.baseAmount} ÷ ${bookingData.duration} = ${method3.impliedRate.toFixed(2)}`);

// Method 4: What if frontend uses a different base rate?
// From your booking: baseAmount=2310, duration=33, this gives rate=70
// But what if there's a minimum charge or different structure?
const method4 = {
  // Maybe there's a 24hr minimum charge, then additional hours at different rate
  minimumCharge: bookingData.ratePlanUsed.ratePerHour * 24, // 1680
  additionalHours: bookingData.duration - 24, // 9
  additionalChargeAtSameRate: (bookingData.duration - 24) * bookingData.ratePlanUsed.ratePerHour, // 9 * 70 = 630
  baseAmount: 0,
  extraCharges: 0
};

method4.baseAmount = method4.minimumCharge + method4.additionalChargeAtSameRate;
method4.extraCharges = 0; // All in base

console.log('\nMethod 4 - 24hr minimum + additional at same rate:');
console.log(`24hr minimum: ${method4.minimumCharge}`);
console.log(`Additional 9hr at ${bookingData.ratePlanUsed.ratePerHour}: ${method4.additionalChargeAtSameRate}`);
console.log(`Total base: ${method4.baseAmount}`);

// Check which method matches frontend expectation
console.log('\n=== COMPARISON WITH FRONTEND EXPECTATION ===');
console.log(`Frontend expected base: ${bookingData.frontendExpected.baseAmount}`);
console.log(`Method 1 matches: ${method1.baseAmount === bookingData.frontendExpected.baseAmount ? '✅' : '❌'}`);
console.log(`Method 2 matches: ${method2.baseAmount === bookingData.frontendExpected.baseAmount ? '✅' : '❌'}`);
console.log(`Method 3 matches: ${method3.baseAmount === bookingData.frontendExpected.baseAmount ? '✅' : '❌'}`);
console.log(`Method 4 matches: ${method4.baseAmount === bookingData.frontendExpected.baseAmount ? '✅' : '❌'}`);

// Calculate full billing for matching method
if (method1.baseAmount === bookingData.frontendExpected.baseAmount) {
  console.log('\n=== METHOD 1 FULL CALCULATION ===');
  const subtotal = method1.total;
  const gst = Math.round(subtotal * 0.18);
  const deposit = 3000;
  const total = subtotal + gst + deposit;
  
  console.log(`Subtotal: ${subtotal}`);
  console.log(`GST (18%): ${gst}`);
  console.log(`Deposit: ${deposit}`);
  console.log(`Final Total: ${total}`);
  console.log(`Frontend Expected: ${bookingData.frontendExpected.total}`);
  console.log(`Difference: ${Math.abs(total - bookingData.frontendExpected.total)}`);
}