const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupDuplicateRoutes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Access the collection directly
    const routeCollection = mongoose.connection.db.collection('driverroutes');
    const routes = await routeCollection.find({}).toArray();
    
    console.log(`Found ${routes.length} routes`);
    
    for (const route of routes) {
      console.log(`\nProcessing route ${route._id} (${route.shift} shift)`);
      console.log(`Original stops count: ${route.stops ? route.stops.length : 0}`);
      
      if (!route.stops || route.stops.length === 0) {
        console.log('No stops found, skipping...');
        continue;
      }
      
      // Remove duplicates based on subscriptionId
      const uniqueStops = [];
      const seenSubscriptions = new Set();
      
      for (const stop of route.stops) {
        const subscriptionKey = stop.subscriptionId.toString();
        
        if (!seenSubscriptions.has(subscriptionKey)) {
          seenSubscriptions.add(subscriptionKey);
          uniqueStops.push({
            ...stop,
            sequenceNumber: uniqueStops.length + 1,
            estimatedArrival: new Date(Date.now() + (uniqueStops.length * 8 * 60 * 1000)) // 8 minutes per stop
          });
        }
      }
      
      console.log(`Unique stops count: ${uniqueStops.length}`);
      console.log(`Removed ${route.stops.length - uniqueStops.length} duplicates`);
      
      if (route.stops.length !== uniqueStops.length) {
        // Update the route with unique stops
        await routeCollection.updateOne(
          { _id: route._id },
          { 
            $set: { 
              stops: uniqueStops,
              totalStops: uniqueStops.length,
              currentLoad: uniqueStops.length
            }
          }
        );
        console.log(`✅ Updated route with ${uniqueStops.length} unique stops`);
      } else {
        console.log('✅ No duplicates found in this route');
      }
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