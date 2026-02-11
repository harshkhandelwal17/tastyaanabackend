const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// Configure logging
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(path.join(logDir, 'addRatingsToProducts.log'), { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  logStream.write(logMessage);
}

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore';
log(`Connecting to MongoDB at: ${MONGODB_URI.replace(/:[^:]*@/, ':***@')}`);

async function updateProductsWithRatings() {
  try {
    log('Starting product ratings update process...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    log('Successfully connected to MongoDB');

    // Find products that either don't have ratings field or have it as null/undefined
    const productsToUpdate = await Product.find({
      $or: [
        { ratings: { $exists: false } },
        { ratings: null },
        { 'ratings.average': { $exists: false } },
        { 'ratings.count': { $exists: false } }
      ]
    });

    log(`Found ${productsToUpdate.length} products to update`);

    if (productsToUpdate.length === 0) {
      log('No products require updates. Exiting...');
      return;
    }

    // Update each product with default ratings
    const updatePromises = productsToUpdate.map((product, index) => {
      log(`Updating product ${index + 1}/${productsToUpdate.length}: ${product._id} - ${product.title}`);
      
      return Product.updateOne(
        { _id: product._id },
        { 
          $set: { 
            ratings: {
              average: 0,
              count: 0
            }
          } 
        }
      ).catch(error => {
        log(`Error updating product ${product._id}: ${error.message}`);
        throw error; // Re-throw to be caught by Promise.all
      });
    });

    const results = await Promise.allSettled(updatePromises);
    
    const successfulUpdates = results.filter(r => r.status === 'fulfilled').length;
    const failedUpdates = results.filter(r => r.status === 'rejected').length;
    
    log(`\nUpdate Summary:`);
    log(`- Total products processed: ${productsToUpdate.length}`);
    log(`- Successfully updated: ${successfulUpdates}`);
    log(`- Failed updates: ${failedUpdates}`);

  } catch (error) {
    log(`FATAL ERROR: ${error.message}`);
    if (error.stack) {
      log(error.stack);
    }
  } finally {
    try {
      // Close the connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        log('Disconnected from MongoDB');
      }
    } catch (e) {
      log(`Error while disconnecting: ${e.message}`);
    } finally {
      log('Script execution completed');
      logStream.end();
      process.exit(0);
    }
  }
}

// Run the script
updateProductsWithRatings();
