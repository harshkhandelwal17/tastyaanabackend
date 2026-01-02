const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const testUniqueIdGeneration = async () => {
  try {
    console.log('=== TESTING UNIQUE SUBSCRIPTION ID GENERATION ===');
    
    // Test generating multiple unique IDs
    const ids = [];
    const count = 100;
    
    console.log(`Generating ${count} unique subscription IDs...`);
    
    for (let i = 0; i < count; i++) {
      try {
        const uniqueId = await Subscription.generateUniqueSubscriptionId();
        ids.push(uniqueId);
        
        if (i % 10 === 0) {
          console.log(`Generated ${i + 1}/${count} IDs...`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate ID ${i + 1}:`, error.message);
        break;
      }
    }
    
    console.log(`\n✅ Successfully generated ${ids.length} unique IDs`);
    
    // Check for duplicates
    const uniqueIds = new Set(ids);
    const duplicates = ids.length - uniqueIds.size;
    
    if (duplicates === 0) {
      console.log('✅ No duplicate IDs found - all IDs are unique!');
    } else {
      console.log(`❌ Found ${duplicates} duplicate IDs`);
    }
    
    // Show some sample IDs
    console.log('\n=== SAMPLE GENERATED IDS ===');
    ids.slice(0, 10).forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
    });
    
    // Test format
    const formatTest = ids.every(id => {
      const pattern = /^SUB_\d+_[A-F0-9]{12}$/;
      return pattern.test(id);
    });
    
    if (formatTest) {
      console.log('\n✅ All IDs follow the correct format: SUB_timestamp_12charUUID');
    } else {
      console.log('\n❌ Some IDs do not follow the correct format');
    }
    
    // Test timestamp uniqueness
    const timestamps = ids.map(id => {
      const match = id.match(/^SUB_(\d+)_/);
      return match ? parseInt(match[1]) : 0;
    });
    
    const uniqueTimestamps = new Set(timestamps);
    console.log(`\n📊 Timestamp analysis:`);
    console.log(`  - Total IDs: ${ids.length}`);
    console.log(`  - Unique timestamps: ${uniqueTimestamps.size}`);
    console.log(`  - Timestamp collisions: ${ids.length - uniqueTimestamps.size}`);
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the test
testUniqueIdGeneration();
