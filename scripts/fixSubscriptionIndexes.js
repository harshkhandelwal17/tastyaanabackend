const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const fixSubscriptionIndexes = async () => {
  try {
    // Wait for connection to be ready
    await mongoose.connection.asPromise();
    
    console.log('=== CHECKING SUBSCRIPTION INDEXES ===');
    
    // Get the database connection
    const db = mongoose.connection.db;
    const collection = db.collection('subscriptions');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Check for problematic unique indexes
    const problematicIndexes = indexes.filter(index => {
      const key = Object.keys(index.key);
      return (
        (key.includes('user') && key.includes('status') && index.unique) ||
        (key.includes('user') && key.includes('mealPlan') && index.unique) ||
        (key.includes('user') && key.includes('planType') && index.unique)
      );
    });
    
    if (problematicIndexes.length > 0) {
      console.log('❌ Found problematic unique indexes:');
      problematicIndexes.forEach(index => {
        console.log('  -', index.name, ':', index.key, '(unique:', index.unique, ')');
      });
      
      // Drop problematic indexes
      for (const index of problematicIndexes) {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped problematic index: ${index.name}`);
        } catch (dropError) {
          console.error(`❌ Failed to drop index ${index.name}:`, dropError.message);
        }
      }
      
      // Recreate the correct indexes
      try {
        await collection.createIndex({ user: 1, status: 1 });
        console.log('✅ Created non-unique index on { user: 1, status: 1 }');
        
        await collection.createIndex({ user: 1, createdAt: -1 });
        console.log('✅ Created index on { user: 1, createdAt: -1 }');
        
        await collection.createIndex({ status: 1, startDate: 1 });
        console.log('✅ Created index on { status: 1, startDate: 1 }');
        
        await collection.createIndex({ subscriptionId: 1 }, { unique: true });
        console.log('✅ Created unique index on { subscriptionId: 1 }');
        
      } catch (createError) {
        console.error('❌ Failed to create indexes:', createError.message);
      }
      
    } else {
      console.log('✅ No problematic indexes found');
    }
    
    // Verify the final state
    const finalIndexes = await collection.indexes();
    console.log('\n=== FINAL INDEXES ===');
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key, '(unique:', index.unique, ')');
    });
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the fix
fixSubscriptionIndexes();
