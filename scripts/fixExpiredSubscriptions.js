const mongoose = require('mongoose');
require('dotenv').config();
const Subscription = require('../models/Subscription');

async function fixExpiredSubscriptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all active subscriptions that have an end date in the past
    const now = new Date();
    const result = await Subscription.updateMany(
      {
        status: 'active',
        endDate: { $lt: now },
      },
      {
        $set: { status: 'expired' },
      }
    );

    console.log('Updated subscriptions:', result);
    console.log(`Marked ${result.modifiedCount} subscriptions as expired`);

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error fixing expired subscriptions:', error);
    process.exit(1);
  }
}

// Run the script
fixExpiredSubscriptions();
