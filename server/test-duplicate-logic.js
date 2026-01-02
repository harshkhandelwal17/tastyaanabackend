const mongoose = require('mongoose');
require('./config/database');
const MealCustomization = require('./models/MealCustomization');

async function testDuplicateCustomizationLogic() {
  try {
    console.log('🧪 Testing duplicate customization logic...');
    
    // Find the existing customization mentioned in the user's log
    const existingCustomization = await MealCustomization.findById('691ce9d7d0cbf5d0d54d1a34')
      .populate('replacementMeal', 'name')
      .populate('subscription', 'userId');
      
    if (!existingCustomization) {
      console.log('❌ Existing customization not found');
      return;
    }
    
    console.log('\n📋 Existing Customization Details:');
    console.log('ID:', existingCustomization._id);
    console.log('Date:', existingCustomization.date);
    console.log('Shift:', existingCustomization.shift);
    console.log('Replacement Meal:', existingCustomization.replacementMeal?.name || existingCustomization.replacementMeal);
    console.log('Payment Status:', existingCustomization.paymentStatus);
    console.log('Payable Amount:', existingCustomization.payableAmount);
    console.log('Total Amount:', existingCustomization.totalAmount);
    console.log('Is Active:', existingCustomization.isActive);
    console.log('Status:', existingCustomization.status);
    
    // Check if there are any other customizations for the same date/shift/meal
    const sameCustomizations = await MealCustomization.find({
      subscription: existingCustomization.subscription,
      date: {
        $gte: new Date('2025-11-19T00:00:00.000Z'),
        $lt: new Date('2025-11-20T00:00:00.000Z')
      },
      shift: 'morning',
      replacementMeal: existingCustomization.replacementMeal,
      isActive: true,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('replacementMeal', 'name');
    
    console.log('\n🔍 All matching customizations for same date/shift/meal:');
    sameCustomizations.forEach((cust, index) => {
      console.log(`${index + 1}. ID: ${cust._id}`);
      console.log(`   Payment Status: ${cust.paymentStatus}`);
      console.log(`   Payable Amount: ${cust.payableAmount}`);
      console.log(`   Created At: ${cust.createdAt}`);
      console.log('');
    });
    
    // Test the validation logic
    console.log('🧪 Testing validation logic:');
    console.log('With new logic, pending customizations should NOT block new ones');
    console.log('Only completed payments should block duplicates');
    
    if (existingCustomization.paymentStatus === 'completed') {
      console.log('❌ This would block new customizations (already paid)');
    } else {
      console.log('✅ This would ALLOW new customizations (pending payment)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDuplicateCustomizationLogic();