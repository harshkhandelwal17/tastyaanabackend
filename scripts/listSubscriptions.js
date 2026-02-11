const mongoose = require('mongoose');
require('dotenv').config();
const Subscription = require('../models/Subscription');

async function listSubscriptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all subscriptions
    const subscriptions = await Subscription.find({})
      .select('subscriptionId status startDate endDate planType duration')
      .sort({ endDate: -1 });

    console.log('Found', subscriptions.length, 'subscriptions');
    console.log('Current date:', new Date().toISOString());
    console.log('--------------------------------------------------');
    
    subscriptions.forEach(sub => {
      console.log(`ID: ${sub._id}`);
      console.log(`Subscription ID: ${sub.subscriptionId}`);
      console.log(`Status: ${sub.status}`);
      console.log(`Plan: ${sub.planType} (${sub.duration} days)`);
      console.log(`Total Meals: ${sub.mealCounts?.totalMeals || 'N/A'}`);
      console.log(`Meals Remaining: ${sub.mealCounts?.mealsRemaining || 'N/A'}`);
      console.log(`Should Expire (Meal Count): ${(sub.mealCounts?.mealsRemaining || 0) <= 0 ? 'YES' : 'NO'}`);
      console.log('--------------------------------------------------');
    });

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error listing subscriptions:', error);
    process.exit(1);
  }
}

// Run the script
listSubscriptions();
