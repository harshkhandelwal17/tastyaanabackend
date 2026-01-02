require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');

async function updateExpiredSubscriptions() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const now = new Date();
    
    // Find all active subscriptions that have passed their end date
    const result = await Subscription.updateMany(
      {
        status: { $in: ['active', 'pending_payment'] },
        endDate: { $lt: now }
      },
      { $set: { status: 'expired' } }
    );

    console.log(`Updated ${result.nModified} expired subscriptions`);
    
    // Also update any subscriptions that are marked as active but have no end date
    const noEndDateResult = await Subscription.updateMany(
      {
        status: { $in: ['active', 'pending_payment'] },
        endDate: { $exists: false }
      },
      { $set: { status: 'expired' } }
    );

    console.log(`Updated ${noEndDateResult.nModified} subscriptions with no end date`);

  } catch (error) {
    console.error('Error updating expired subscriptions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
updateExpiredSubscriptions();
