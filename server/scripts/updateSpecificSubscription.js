const mongoose = require('mongoose');
require('dotenv').config();
const Subscription = require('../models/Subscription');

// The subscription ID that needs to be updated
const SUBSCRIPTION_ID = '688bd4d701443fd5d69b1fff';

async function updateSpecificSubscription() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find the specific subscription
    const subscription = await Subscription.findById(SUBSCRIPTION_ID);
    
    if (!subscription) {
      console.log('Subscription not found');
      await mongoose.connection.close();
      return;
    }

    console.log('Current subscription details:');
    console.log('Status:', subscription.status);
    console.log('Total Meals:', subscription.mealCounts?.totalMeals);
    console.log('Meals Delivered:', subscription.mealCounts?.mealsDelivered);
    console.log('Meals Skipped:', subscription.mealCounts?.mealsSkipped);
    console.log('Meals Remaining:', subscription.mealCounts?.mealsRemaining);
    console.log('Should Expire (Meal Count Based):', subscription.mealCounts?.mealsRemaining <= 0 ? 'YES' : 'NO');
    
    // Check if the subscription should be expired - ONLY based on meal count
    if (subscription.mealCounts?.mealsRemaining <= 0 && subscription.status !== 'expired') {
      console.log('Updating subscription status to expired (no meals remaining)...');
      subscription.status = 'expired';
      subscription.isActive = false;
      await subscription.save();
      console.log('Subscription updated successfully');
    } else {
      console.log('No update needed - subscription still has remaining meals or is already expired');
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error updating subscription:', error);
    process.exit(1);
  }
}

// Run the script
updateSpecificSubscription();
