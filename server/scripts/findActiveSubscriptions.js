const mongoose = require('mongoose');
require('dotenv').config();
const Subscription = require('../models/Subscription');

async function findActiveSubscriptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all active subscriptions
    const subscriptions = await Subscription.find({ status: 'active' })
      .select('_id subscriptionId status startDate endDate planType duration user')
      .sort({ endDate: -1 });

    console.log('Found', subscriptions.length, 'active subscriptions');
    console.log('Current date:', new Date().toISOString());
    console.log('--------------------------------------------------');
    
    subscriptions.forEach(sub => {
      console.log(`MongoDB ID: ${sub._id}`);
      console.log(`Subscription ID: ${sub.subscriptionId}`);
      console.log(`User ID: ${sub.user}`);
      console.log(`Plan: ${sub.planType} (${sub.duration} days)`);
      console.log(`Status: ${sub.status}`);
      console.log(`Start: ${sub.startDate}`);
      console.log(`End: ${sub.endDate}`);
      console.log(`Is Expired: ${new Date(sub.endDate) < new Date() ? 'YES' : 'NO'}`);
      console.log('--------------------------------------------------');
    });

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error finding active subscriptions:', error);
    process.exit(1);
  }
}

// Run the script
findActiveSubscriptions();
