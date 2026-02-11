const mongoose = require('mongoose');
const connect = require('../config/database');

// Import models
const Subscription = require('../models/Subscription');

/**
 * Check what subscriptions exist in the database
 */
async function checkSubscriptions() {
  try {
    console.log('🔍 Checking subscription data in database...');
    
    // Get total count
    const totalCount = await Subscription.countDocuments({});
    console.log(`📊 Total subscriptions in database: ${totalCount}`);
    
    // Get count by status
    const statuses = await Subscription.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📈 Subscriptions by status:');
    statuses.forEach(status => {
      console.log(`  ${status._id || 'undefined'}: ${status.count}`);
    });
    
    // Get some sample subscriptions
    const sampleSubs = await Subscription.find({}).limit(5).select('_id subscriptionId status shift deliveryTracking');
    
    console.log('\n📄 Sample subscriptions:');
    sampleSubs.forEach(sub => {
      console.log(`  ID: ${sub._id}`);
      console.log(`  SubscriptionID: ${sub.subscriptionId || 'None'}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Shift: ${sub.shift}`);
      console.log(`  DeliveryTracking entries: ${sub.deliveryTracking ? sub.deliveryTracking.length : 0}`);
      
      if (sub.deliveryTracking && sub.deliveryTracking.length > 0) {
        console.log(`  Latest delivery: ${sub.deliveryTracking[sub.deliveryTracking.length - 1].date} - ${sub.deliveryTracking[sub.deliveryTracking.length - 1].status}`);
      }
      console.log('  ---');
    });
    
  } catch (error) {
    console.error('❌ Error checking subscriptions:', error);
  }
}

/**
 * Run the script
 */
async function runScript() {
  try {
    await connect();
    await checkSubscriptions();
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script if executed directly
if (require.main === module) {
  console.log('🔍 Subscription Database Check');
  console.log('=============================');
  runScript();
}

module.exports = { checkSubscriptions };