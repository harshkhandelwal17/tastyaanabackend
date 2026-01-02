// Work backwards from your actual data to understand the rates
console.log('=== REVERSE ENGINEERING YOUR BOOKING ===');

const yourData = {
  baseAmount: 1440,
  extraHourCharge: 720,
  fuelCharges: 0,
  gst: 778,
  totalBill: 8098,
  depositAmount: 3000,
  duration: 60,
  baseHours: 24,
  extraHours: 36
};

console.log('Your actual data analysis:');
console.log('- Duration: 60 hours (59.25 rounded up)');
console.log('- Base hours: 24');
console.log('- Extra hours: 36');
console.log('- Base amount: 1440 (hourly rate = 60)');
console.log('- Extra hour charge: 720 (extra rate = 20)');

// Calculate what the rental subtotal should be
const rentalSubtotal = yourData.baseAmount + yourData.extraHourCharge + yourData.fuelCharges;
console.log('- Rental subtotal:', rentalSubtotal);

// Work backwards from GST to find the taxable base
const taxableBase = yourData.gst / 0.18;
console.log('- Taxable base (GST/0.18):', taxableBase);

// What additional amount is being taxed?
const additionalTaxableAmount = taxableBase - rentalSubtotal;
console.log('- Additional taxable amount:', additionalTaxableAmount);

// Check if deposit is being taxed
console.log('- Is deposit being taxed? Deposit amount:', yourData.depositAmount);
console.log('- Additional amount ÷ deposit = ratio:', additionalTaxableAmount / yourData.depositAmount);

// Total calculation verification
const totalWithoutDeposit = yourData.totalBill - yourData.depositAmount;
const totalWithoutGST = totalWithoutDeposit - yourData.gst;
console.log('- Total without deposit:', totalWithoutDeposit);
console.log('- Total without GST:', totalWithoutGST);

// Hypothesis: Maybe GST is being calculated on rental + deposit
console.log('\n=== HYPOTHESIS TESTING ===');

// Hypothesis 1: GST on rental only
const gst1 = Math.round(rentalSubtotal * 0.18);
console.log('H1 - GST on rental only (', rentalSubtotal, '):', gst1);

// Hypothesis 2: GST on rental + deposit
const gst2 = Math.round((rentalSubtotal + yourData.depositAmount) * 0.18);
console.log('H2 - GST on rental + deposit (', rentalSubtotal + yourData.depositAmount, '):', gst2);

// Hypothesis 3: GST on some other base
console.log('H3 - Actual GST base:', Math.round(taxableBase));

// Let's try to match the frontend calculation
console.log('\n=== TRYING TO MATCH FRONTEND (8074) ===');
const frontendTarget = 8074;
const frontendWithoutDeposit = frontendTarget - yourData.depositAmount;
const frontendWithoutDepositAndRental = frontendWithoutDeposit - rentalSubtotal;
console.log('Frontend without deposit:', frontendWithoutDeposit);
console.log('Frontend without deposit and rental:', frontendWithoutDepositAndRental);
console.log('Frontend implied GST:', frontendWithoutDepositAndRental);
console.log('Frontend GST percentage:', (frontendWithoutDepositAndRental / rentalSubtotal * 100).toFixed(2) + '%');

// Maybe there are additional service charges?
console.log('\n=== POSSIBLE SERVICE CHARGES ===');
const backendExtraCharges = yourData.totalBill - rentalSubtotal - yourData.gst - yourData.depositAmount;
console.log('Backend extra charges:', backendExtraCharges);

const frontendExtraCharges = frontendTarget - rentalSubtotal - frontendWithoutDepositAndRental - yourData.depositAmount;
console.log('Frontend extra charges:', frontendExtraCharges);