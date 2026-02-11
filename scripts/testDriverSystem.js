const mongoose = require('mongoose');
const User = require('../models/User');
const DeliveryTracking = require('../models/DeliveryTracking');
const Order = require('../models/Order');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tastyaana', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testDriverSystem() {
  try {
    console.log('🧪 Testing Dynamic Driver ID System...\n');

    // 1. Check if there are any delivery drivers in the system
    const drivers = await User.find({ role: 'delivery' });
    console.log(`📊 Found ${drivers.length} delivery drivers in the system:`);
    
    drivers.forEach((driver, index) => {
      console.log(`  ${index + 1}. ${driver.name} (${driver.email}) - ID: ${driver._id}`);
      console.log(`     Role: ${driver.role}, Online: ${driver.driverProfile?.isOnline || false}`);
    });

    // 2. Check DeliveryTracking records
    const trackingRecords = await DeliveryTracking.find().populate('driverId', 'name email role');
    console.log(`\n📦 Found ${trackingRecords.length} delivery tracking records:`);
    
    trackingRecords.forEach((tracking, index) => {
      console.log(`  ${index + 1}. Order: ${tracking.orderId}`);
      console.log(`     Status: ${tracking.status}`);
      console.log(`     Driver: ${tracking.driverId ? tracking.driverId.name : 'Not assigned'}`);
      console.log(`     Driver ID: ${tracking.driverId ? tracking.driverId._id : 'null'}`);
    });

    // 3. Check Orders with deliveryPartner
    const orders = await Order.find().populate('deliveryPartner', 'name email role');
    console.log(`\n🛒 Found ${orders.length} orders:`);
    
    orders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order: ${order.orderNumber || order._id}`);
      console.log(`     Status: ${order.status}`);
      console.log(`     Delivery Partner: ${order.deliveryPartner ? order.deliveryPartner.name : 'Not assigned'}`);
      console.log(`     Partner ID: ${order.deliveryPartner ? order.deliveryPartner._id : 'null'}`);
    });

    // 4. Test driver ID consistency
    console.log('\n🔍 Testing Driver ID Consistency:');
    
    for (const tracking of trackingRecords) {
      if (tracking.driverId) {
        const order = await Order.findOne({ orderNumber: tracking.orderId }).populate('deliveryPartner');
        if (order && order.deliveryPartner) {
          if (tracking.driverId._id.toString() === order.deliveryPartner._id.toString()) {
            console.log(`  ✅ Order ${tracking.orderId}: Driver IDs match`);
          } else {
            console.log(`  ❌ Order ${tracking.orderId}: Driver ID mismatch!`);
            console.log(`     Tracking: ${tracking.driverId._id}`);
            console.log(`     Order: ${order.deliveryPartner._id}`);
          }
        }
      }
    }

    // 5. Check for null driverId issues
    const nullDriverTracking = await DeliveryTracking.find({ driverId: null });
    console.log(`\n⚠️  Found ${nullDriverTracking.length} tracking records with null driverId:`);
    
    nullDriverTracking.forEach((tracking, index) => {
      console.log(`  ${index + 1}. Order: ${tracking.orderId}, Status: ${tracking.status}`);
    });

    // 6. Check for orders without deliveryPartner
    const ordersWithoutDriver = await Order.find({ deliveryPartner: { $exists: false } });
    console.log(`\n⚠️  Found ${ordersWithoutDriver.length} orders without deliveryPartner:`);
    
    ordersWithoutDriver.forEach((order, index) => {
      console.log(`  ${index + 1}. Order: ${order.orderNumber || order._id}, Status: ${order.status}`);
    });

    console.log('\n✅ Driver System Test Complete!');
    
  } catch (error) {
    console.error('❌ Error testing driver system:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the test
testDriverSystem();

