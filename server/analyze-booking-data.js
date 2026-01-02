// Detailed analysis of your booking data
console.log('=== ANALYZING YOUR BOOKING DATA ===');

// Your actual booking data
const yourData = {
  baseAmount: 1440,
  extraHourCharge: 720,
  gst: 778,
  totalBill: 8098,
  depositAmount: 3000
};

console.log('Your booking details:');
console.log('- baseAmount:', yourData.baseAmount);
console.log('- extraHourCharge:', yourData.extraHourCharge);
console.log('- gst:', yourData.gst);
console.log('- depositAmount:', yourData.depositAmount);
console.log('- totalBill:', yourData.totalBill);

// Calculate what the subtotal should be
const rentalSubtotal = yourData.baseAmount + yourData.extraHourCharge;
console.log('\nRental subtotal (base + extra):', rentalSubtotal);

// Working backwards from total
const totalWithoutDeposit = yourData.totalBill - yourData.depositAmount;
console.log('Total bill without deposit:', totalWithoutDeposit);

const totalWithoutDepositAndGST = totalWithoutDeposit - yourData.gst;
console.log('Total without deposit and GST:', totalWithoutDepositAndGST);

// Check GST percentage
const gstPercentage = (yourData.gst / rentalSubtotal) * 100;
console.log('GST percentage based on rental subtotal:', gstPercentage.toFixed(2) + '%');

// Alternative calculation - what if GST is calculated on a larger base?
const possibleGSTBase = yourData.gst / 0.18;
console.log('If GST is 18%, the taxable base would be:', possibleGSTBase);

// Let's see what could make up this base
console.log('\nPossible breakdown:');
console.log('- Rental cost:', rentalSubtotal);
console.log('- Possible additional charges:', possibleGSTBase - rentalSubtotal);

// Check if there are missing components
console.log('\n=== POSSIBLE MISSING COMPONENTS ===');
const difference = yourData.totalBill - (rentalSubtotal + yourData.gst + yourData.depositAmount);
console.log('Unaccounted amount in total bill:', difference);

// Let's try a different approach - what if there are fuel charges included?
console.log('\n=== FUEL CHARGE ANALYSIS ===');
const possibleFuelCharge = possibleGSTBase - rentalSubtotal;
console.log('Possible fuel charges (if they exist):', possibleFuelCharge);

// Duration analysis
const startDateTime = "2025-12-17T20:25:00.000Z";
const endDateTime = "2025-12-20T07:40:00.000Z";
const durationMs = new Date(endDateTime) - new Date(startDateTime);
const exactDurationHours = durationMs / (1000 * 60 * 60);

console.log('\n=== DURATION ANALYSIS ===');
console.log('Exact duration (hours):', exactDurationHours);
console.log('Rounded up duration (hours):', Math.ceil(exactDurationHours));

// What if the rate is different?
console.log('\n=== RATE ANALYSIS ===');
console.log('If base rate per hour is:', yourData.baseAmount / 24);
console.log('If extra rate per hour is:', yourData.extraHourCharge / (Math.ceil(exactDurationHours) - 24));