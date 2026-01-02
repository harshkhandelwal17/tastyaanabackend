// scripts/createDailyOrders.js
const mongoose = require('mongoose');
const DailyOrder = require('../models/DailyOrder');
const Subscription = require('../models/Subscription');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/onlinestore', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createDailyOrders = async (date = new Date()) => {
  try {
    console.log('Creating daily orders for date:', date);
    
    // Set time to start of day
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Use the static method from DailyOrder model
    const createdOrders = await DailyOrder.createDailyOrders(targetDate);
    
    console.log(`Created ${createdOrders.length} daily orders for ${targetDate.toDateString()}`);
    
    // Log details of created orders
    createdOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`);
      console.log(`  User: ${order.userId}`);
      console.log(`  Subscription: ${order.subscriptionId}`);
      console.log(`  Date: ${order.date}`);
      console.log(`  Morning: ${order.morning ? 'Yes' : 'No'}`);
      console.log(`  Evening: ${order.evening ? 'Yes' : 'No'}`);
      console.log('---');
    });
    
    return createdOrders;
  } catch (error) {
    console.error('Error creating daily orders:', error);
    throw error;
  }
};

// If running directly
if (require.main === module) {
  const dateArg = process.argv[2];
  const targetDate = dateArg ? new Date(dateArg) : new Date();
  
  createDailyOrders(targetDate)
    .then(() => {
      console.log('Daily orders creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create daily orders:', error);
      process.exit(1);
    });
}

module.exports = { createDailyOrders }; 