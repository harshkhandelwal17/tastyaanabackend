const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const cleanupDuplicateIds = async () => {
  try {
    console.log('=== CLEANING UP DUPLICATE SUBSCRIPTION IDS ===');
    
    // Find all subscriptions
    const allSubscriptions = await Subscription.find({});
    console.log(`Found ${allSubscriptions.length} total subscriptions`);
    
    // Group by subscriptionId to find duplicates
    const idGroups = {};
    allSubscriptions.forEach(sub => {
      if (!idGroups[sub.subscriptionId]) {
        idGroups[sub.subscriptionId] = [];
      }
      idGroups[sub.subscriptionId].push(sub);
    });
    
    // Find duplicates
    const duplicates = Object.entries(idGroups).filter(([id, subs]) => subs.length > 1);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate subscription IDs found');
      return;
    }
    
    console.log(`❌ Found ${duplicates.length} duplicate subscription IDs`);
    
    let fixedCount = 0;
    
    for (const [duplicateId, subscriptions] of duplicates) {
      console.log(`\n--- Fixing duplicate ID: ${duplicateId} (${subscriptions.length} subscriptions) ---`);
      
      // Keep the first one, fix the rest
      for (let i = 1; i < subscriptions.length; i++) {
        const sub = subscriptions[i];
        
        try {
          // Generate a new unique ID
          const newId = await Subscription.generateUniqueSubscriptionId();
          console.log(`  - Subscription ${sub._id}: ${duplicateId} → ${newId}`);
          
          // Update the subscription
          sub.subscriptionId = newId;
          await sub.save();
          
          fixedCount++;
        } catch (error) {
          console.error(`  ❌ Failed to fix subscription ${sub._id}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ Cleanup completed! Fixed ${fixedCount} duplicate subscription IDs`);
    
    // Verify no more duplicates
    const finalCheck = await Subscription.find({});
    const finalIdGroups = {};
    finalCheck.forEach(sub => {
      if (!finalIdGroups[sub.subscriptionId]) {
        finalIdGroups[sub.subscriptionId] = [];
      }
      finalIdGroups[sub.subscriptionId].push(sub);
    });
    
    const remainingDuplicates = Object.entries(finalIdGroups).filter(([id, subs]) => subs.length > 1);
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ Verification passed - no duplicate IDs remain');
    } else {
      console.log(`❌ Verification failed - ${remainingDuplicates.length} duplicate IDs still exist`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the cleanup
cleanupDuplicateIds();
