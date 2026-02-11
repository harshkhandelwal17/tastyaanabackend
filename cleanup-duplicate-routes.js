const mongoose = require('mongoose');
const DriverRoute = require('./models/DriverRoute');
require('dotenv').config();

async function cleanupDuplicateRoutes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all routes
    const routes = await DriverRoute.find({});
    
    for (const route of routes) {
      console.log(`\nProcessing route ${route._id} (${route.shift} shift)`);
      console.log(`Original stops count: ${route.stops.length}`);
      
      // Remove duplicates based on subscriptionId
      const uniqueStops = [];
      const seenSubscriptions = new Set();
      
      for (const stop of route.stops) {
        const subscriptionKey = stop.subscriptionId.toString();
        
        if (!seenSubscriptions.has(subscriptionKey)) {
          seenSubscriptions.add(subscriptionKey);
          uniqueStops.push(stop);
        }
      }
      
      console.log(`Unique stops count: ${uniqueStops.length}`);
      console.log(`Removed ${route.stops.length - uniqueStops.length} duplicates`);
      
      // Update the route with unique stops and fix sequence numbers
      route.stops = uniqueStops.map((stop, index) => ({
        ...stop.toObject(),
        sequenceNumber: index + 1,
        estimatedArrival: new Date(Date.now() + (index * 8 * 60 * 1000)) // 8 minutes per stop
      }));
      
      route.totalStops = uniqueStops.length;
      route.currentLoad = uniqueStops.length;
      
      await route.save();
      console.log(`✅ Updated route with ${uniqueStops.length} unique stops`);
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupDuplicateRoutes();