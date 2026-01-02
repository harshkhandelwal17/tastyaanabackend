const mongoose = require('mongoose');
require('dotenv').config();
const Subscription = require('../models/Subscription');

// The subscription ID that needs to be updated
const SUBSCRIPTION_ID = '688bd4d701443fd5d69b1fff';

async function forceUpdateSubscription() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Use findOneAndUpdate to directly update the subscription
    const result = await Subscription.findOneAndUpdate(
      { _id: SUBSCRIPTION_ID },
      { $set: { status: 'expired', updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!result) {
      console.log('❌ Subscription not found');
    } else {
      console.log('✅ Subscription updated successfully:');
      console.log('ID:', result._id);
      console.log('Status:', result.status);
      console.log('Start Date:', result.startDate);
      console.log('End Date:', result.endDate);
      console.log('Plan Type:', result.planType);
      console.log('Duration:', result.duration);
      console.log('Is Expired:', new Date(result.endDate) < new Date() ? 'YES' : 'NO');
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
    process.exit(1);
  }
}

// Run the script
forceUpdateSubscription();
