const mongoose = require('mongoose');
require('dotenv').config();
const Subscription = require('../models/Subscription');

async function listAllSubscriptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all subscriptions
    const subscriptions = await Subscription.find({})
      .select('_id subscriptionId status startDate endDate planType duration user')
      .sort({ endDate: -1 });

    console.log('Found', subscriptions.length, 'subscriptions in total');
    console.log('Current date:', new Date().toISOString());
    console.log('--------------------------------------------------');
    
    subscriptions.forEach((sub, index) => {
      console.log(`[${index + 1}/${subscriptions.length}]`);
      console.log(`MongoDB ID: ${sub._id}`);
      console.log(`Subscription ID: ${sub.subscriptionId || 'N/A'}`);
      console.log(`User ID: ${sub.user || 'N/A'}`);
      console.log(`Plan: ${sub.planType || 'N/A'} (${sub.duration || 0} days)`);
      console.log(`Status: ${sub.status || 'N/A'}`);
      console.log(`Start: ${sub.startDate || 'N/A'}`);
      console.log(`End: ${sub.endDate || 'N/A'}`);
      if (sub.endDate) {
        const isExpired = new Date(sub.endDate) < new Date();
        console.log(`Is Expired: ${isExpired ? 'YES' : 'NO'}`);
        if (isExpired && sub.status !== 'expired') {
          console.log('⚠️  WARNING: This subscription should be marked as expired!');
        }
      }
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
listAllSubscriptions();
