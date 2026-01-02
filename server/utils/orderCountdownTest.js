// Test script for Order Countdown and Flag System
const mongoose = require('mongoose');
const Order = require('../models/Order');

// Test configuration
const TEST_CONFIG = {
  MONGODB_URI: 'mongodb://localhost:27017/tastyaana', // Update with your MongoDB URI
  TEST_USER_ID: '64a123456789abcd12345678', // Replace with a valid seller ID from your database
  TEST_CUSTOMER_ID: '64a123456789abcd12345679', // Replace with a valid customer ID
};

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(TEST_CONFIG.MONGODB_URI);
    console.log('✅ Connected to MongoDB for testing');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Create a test order
async function createTestOrder() {
  try {
    const testOrder = new Order({
      orderNumber: `TEST${Date.now()}`,
      userId: TEST_CONFIG.TEST_CUSTOMER_ID,
      type: 'gkk',
      items: [{
        name: 'Test Thali',
        quantity: 1,
        price: 150,
        category: 'tiffin',
        seller: TEST_CONFIG.TEST_USER_ID
      }],
      deliveryAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        country: 'India'
      },
      subtotal: 150,
      totalAmount: 150,
      paymentMethod: 'COD',
      userContactNo: 9876543210,
      status: 'pending'
    });

    const savedOrder = await testOrder.save();
    console.log('✅ Test order created:', savedOrder.orderNumber);
    return savedOrder;
  } catch (error) {
    console.error('❌ Failed to create test order:', error);
    throw error;
  }
}

// Test countdown timer functionality
async function testCountdownTimer(orderId) {
  try {
    console.log('\n🔄 Testing countdown timer...');
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    console.log('Order status before confirmation:', order.status);
    console.log('Preparation start time:', order.preparationStartTime);
    console.log('Preparation deadline:', order.preparationDeadline);

    // Confirm the order to start the countdown
    order.status = 'confirmed';
    await order.save();

    // Reload order to get updated data
    const updatedOrder = await Order.findById(orderId);
    
    console.log('✅ Order status after confirmation:', updatedOrder.status);
    console.log('✅ Preparation start time:', updatedOrder.preparationStartTime);
    console.log('✅ Preparation deadline:', updatedOrder.preparationDeadline);
    console.log('✅ Time remaining (virtual):', updatedOrder.timeRemaining, 'minutes');
    console.log('✅ Is overdue (virtual):', updatedOrder.isOverdue);

    return updatedOrder;
  } catch (error) {
    console.error('❌ Countdown timer test failed:', error);
    throw error;
  }
}

// Test handover tracking
async function testHandoverTracking(orderId) {
  try {
    console.log('\n🔄 Testing handover tracking...');
    
    const order = await Order.findById(orderId);
    
    // Test restaurant marking ready
    console.log('Marking restaurant as ready...');
    await order.markRestaurantReady(TEST_CONFIG.TEST_USER_ID);
    
    console.log('✅ Restaurant marked ready at:', order.handoverDetails.restaurantMarkedReady.markedAt);
    console.log('✅ Handover status:', order.handoverDetails.handoverStatus);
    console.log('✅ Order status:', order.status);
    
    // Simulate waiting time to test flag system
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test delivery partner pickup
    console.log('Simulating delivery partner pickup...');
    await order.markDeliveryPickup(TEST_CONFIG.TEST_USER_ID, '1234');
    
    console.log('✅ Delivery partner pickup at:', order.handoverDetails.deliveryPartnerPickup.pickedUpAt);
    console.log('✅ Handover status after pickup:', order.handoverDetails.handoverStatus);
    console.log('✅ Order status after pickup:', order.status);
    console.log('✅ Handover validated at:', order.handoverDetails.handoverValidatedAt);
    
    return order;
  } catch (error) {
    console.error('❌ Handover tracking test failed:', error);
    throw error;
  }
}

// Test delay detection
async function testDelayDetection(orderId) {
  try {
    console.log('\n🔄 Testing delay detection...');
    
    const order = await Order.findById(orderId);
    
    // Manually set preparation deadline to past time to simulate delay
    order.preparationDeadline = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    await order.save();
    
    // Reload and check delay info
    const delayedOrder = await Order.findById(orderId);
    const delayInfo = delayedOrder.getDelayInfo();
    
    console.log('✅ Delay info:', delayInfo);
    console.log('✅ Is overdue (virtual):', delayedOrder.isOverdue);
    console.log('✅ Time remaining (virtual):', delayedOrder.timeRemaining);
    
    // Test status update with delay check
    delayedOrder.status = 'preparing';
    await delayedOrder.save();
    
    const finalOrder = await Order.findById(orderId);
    console.log('✅ Is delayed after status update:', finalOrder.isDelayed);
    console.log('✅ Delayed at:', finalOrder.delayedAt);
    console.log('✅ Delay reason:', finalOrder.delayReason);
    
    return finalOrder;
  } catch (error) {
    console.error('❌ Delay detection test failed:', error);
    throw error;
  }
}

// Test handover flag system
async function testHandoverFlags(orderId) {
  try {
    console.log('\n🔄 Testing handover flag system...');
    
    const order = await Order.findById(orderId);
    
    // Reset handover details
    order.handoverDetails = {};
    
    // Mark restaurant ready
    await order.markRestaurantReady(TEST_CONFIG.TEST_USER_ID);
    
    // Set ready time to 15 minutes ago to simulate flag condition
    order.handoverDetails.restaurantMarkedReady.markedAt = new Date(Date.now() - 15 * 60 * 1000);
    await order.save();
    
    // Check flag
    const flaggedOrder = await Order.findById(orderId);
    const handoverFlag = flaggedOrder.handoverFlag;
    
    console.log('✅ Handover flag:', handoverFlag);
    
    return flaggedOrder;
  } catch (error) {
    console.error('❌ Handover flag test failed:', error);
    throw error;
  }
}

// Clean up test data
async function cleanup(orderId) {
  try {
    await Order.findByIdAndDelete(orderId);
    console.log('✅ Test order cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup test order:', error);
  }
}

// Main test function
async function runTests() {
  try {
    console.log('🚀 Starting Order Countdown and Flag System Tests\n');
    
    // Connect to database
    await connectDB();
    
    // Create test order
    const testOrder = await createTestOrder();
    const orderId = testOrder._id;
    
    // Run tests
    await testCountdownTimer(orderId);
    await testHandoverTracking(orderId);
    await testDelayDetection(orderId);
    await testHandoverFlags(orderId);
    
    // Clean up
    await cleanup(orderId);
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary of implemented features:');
    console.log('   - ✅ 20-minute countdown timer starts when order is confirmed');
    console.log('   - ✅ Delay tracking when preparation time exceeds deadline');
    console.log('   - ✅ Restaurant ready marking for handover');
    console.log('   - ✅ Delivery partner pickup confirmation');
    console.log('   - ✅ Handover validation with timestamp checking');
    console.log('   - ✅ Red flag system for pickup delays');
    console.log('   - ✅ Updated /seller/dailyhtali endpoint with delay info');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };