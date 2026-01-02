const mongoose = require('mongoose');
const { cleanupDuplicateDeliveryTracking } = require('./controllers/driverDailyDeliveriesController');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testCleanup() {
  try {
    console.log('🧹 Starting duplicate delivery tracking cleanup test...');
    
    const result = await cleanupDuplicateDeliveryTracking();
    
    console.log('Cleanup result:', result);
    console.log('✅ Cleanup test completed!');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error during cleanup test:', error);
    mongoose.disconnect();
  }
}

testCleanup();