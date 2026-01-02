// Test the updated validation logic
console.log('🧪 Testing Updated Duplicate Customization Logic');
console.log('============================================\n');

// Simulate the existing customization from user's log
const existingCustomization = {
  _id: '691ce9d7d0cbf5d0d54d1a34',
  paymentStatus: 'pending', 
  payableAmount: 30,
  date: '2025-11-19',
  shift: 'morning'
};

console.log('📋 Existing Customization:');
console.log('ID:', existingCustomization._id);
console.log('Payment Status:', existingCustomization.paymentStatus);
console.log('Payable Amount:', existingCustomization.payableAmount);
console.log('Date:', existingCustomization.date);
console.log('Shift:', existingCustomization.shift);

console.log('\n🧪 Testing NEW Validation Logic:');
console.log('Old Logic: Block if payment state is "valid" (pending with amount > 0)');
console.log('New Logic: Only block if payment status is "completed"');

console.log('\n📊 Results:');

if (existingCustomization.paymentStatus === 'completed') {
  console.log('❌ BLOCKED: Existing customization has completed payment');
  console.log('   Message: This thali replacement is already scheduled and paid');
} else {
  console.log('✅ ALLOWED: Existing customization is pending payment');
  console.log('   Message: Customer can create multiple pending customizations');
}

console.log('\n🎯 Business Logic Summary:');
console.log('• Customers can have multiple PENDING customizations for same meal/date/shift');
console.log('• Only COMPLETED payments prevent duplicate customizations');
console.log('• This allows customers to modify/replace unpaid customizations');

console.log('\n💡 Expected Outcome:');
console.log('The customization with payableAmount=30 and status=pending should NOT block new customizations');