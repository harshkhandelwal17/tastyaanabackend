const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const Subscription = require('./models/Subscription');

const TARGET_ZONE_ID = '6918da566b72021c1e70c5d9';

async function updateAllSubscriptionZones() {
  try {
    console.log('🔍 Starting zone update for all subscriptions...');
    console.log(`📍 Target Zone ID: ${TARGET_ZONE_ID}`);

    // Find all subscriptions
    const subscriptions = await Subscription.find({});
    console.log(`📊 Found ${subscriptions.length} total subscriptions`);

    if (subscriptions.length === 0) {
      console.log('ℹ️ No subscriptions found to update');
      return;
    }

    // Find subscriptions that need updating (where morning or evening zone is different)
    const subscriptionsToUpdate = subscriptions.filter(sub => {
      const morningZoneId = sub.morningZone ? sub.morningZone.toString() : null;
      const eveningZoneId = sub.eveningZone ? sub.eveningZone.toString() : null;
      
      return morningZoneId !== TARGET_ZONE_ID || eveningZoneId !== TARGET_ZONE_ID;
    });

    console.log(`🎯 Found ${subscriptionsToUpdate.length} subscriptions that need zone updates`);

    if (subscriptionsToUpdate.length === 0) {
      console.log('✅ All subscriptions already have the correct zones');
      return;
    }

    // Show current state before update
    console.log('\n📋 Current zone distribution:');
    const zoneStats = {};
    subscriptions.forEach(sub => {
      const morningZoneId = sub.morningZone ? sub.morningZone.toString() : 'null';
      const eveningZoneId = sub.eveningZone ? sub.eveningZone.toString() : 'null';
      const key = `Morning: ${morningZoneId}, Evening: ${eveningZoneId}`;
      zoneStats[key] = (zoneStats[key] || 0) + 1;
    });

    Object.entries(zoneStats).forEach(([key, count]) => {
      console.log(`  ${key}: ${count} subscriptions`);
    });

    // Update all subscriptions in bulk
    console.log('\n🔄 Updating subscription zones...');
    
    const updateResult = await Subscription.updateMany(
      {}, // Update all subscriptions
      {
        $set: {
          morningZone: new mongoose.Types.ObjectId(TARGET_ZONE_ID),
          eveningZone: new mongoose.Types.ObjectId(TARGET_ZONE_ID)
        }
      },
      { 
        runValidators: false // Skip validation to avoid any schema issues
      }
    );

    console.log('✅ Bulk update completed!');
    console.log(`📊 Update Results:`, {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged
    });

    // Verify the update
    console.log('\n🔍 Verifying updates...');
    const updatedSubscriptions = await Subscription.find({});
    
    let correctZones = 0;
    let incorrectZones = 0;

    updatedSubscriptions.forEach(sub => {
      const morningZoneId = sub.morningZone ? sub.morningZone.toString() : null;
      const eveningZoneId = sub.eveningZone ? sub.eveningZone.toString() : null;
      
      if (morningZoneId === TARGET_ZONE_ID && eveningZoneId === TARGET_ZONE_ID) {
        correctZones++;
      } else {
        incorrectZones++;
        console.log(`⚠️ Subscription ${sub.subscriptionId || sub._id} still has incorrect zones:`, {
          morningZone: morningZoneId,
          eveningZone: eveningZoneId
        });
      }
    });

    console.log('\n📈 Verification Results:');
    console.log(`✅ Subscriptions with correct zones: ${correctZones}`);
    console.log(`❌ Subscriptions with incorrect zones: ${incorrectZones}`);
    
    if (incorrectZones === 0) {
      console.log('🎉 All subscriptions now have the correct zones!');
    } else {
      console.log('⚠️ Some subscriptions still have incorrect zones. Please check manually.');
    }

    // Show final zone distribution
    console.log('\n📋 Final zone distribution:');
    const finalZoneStats = {};
    updatedSubscriptions.forEach(sub => {
      const morningZoneId = sub.morningZone ? sub.morningZone.toString() : 'null';
      const eveningZoneId = sub.eveningZone ? sub.eveningZone.toString() : 'null';
      const key = `Morning: ${morningZoneId}, Evening: ${eveningZoneId}`;
      finalZoneStats[key] = (finalZoneStats[key] || 0) + 1;
    });

    Object.entries(finalZoneStats).forEach(([key, count]) => {
      console.log(`  ${key}: ${count} subscriptions`);
    });

  } catch (error) {
    console.error('❌ Error updating subscription zones:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Execute the script
updateAllSubscriptionZones();