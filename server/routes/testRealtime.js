const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const DeliveryTracking = require('../models/DeliveryTracking');
const User = require('../models/User');

// Test route to manually trigger driver assignment (for debugging)
router.post('/test-assign-driver', async (req, res) => {
  try {
    const { orderId, userId, driverName = 'Test Driver' } = req.body;
    
    console.log('🧪 Test driver assignment triggered:', { orderId, userId, driverName });
    
    // Get socket service
    const socketService = req.app.get('socketService');
    
    if (!socketService) {
      return res.status(500).json({ 
        success: false, 
        message: 'Socket service not available' 
      });
    }
    
    // Create mock driver data
    const mockDriverData = {
      id: 'test-driver-' + Date.now(),
      name: driverName,
      phone: '+91 98765 43210',
      rating: 4.8,
      vehicle: { type: 'bike', number: 'TEST 1234' },
      currentLocation: { lat: 22.7196, lng: 75.8577 }
    };
    
    // Create notification data
    const notificationData = {
      orderId: orderId || 'test-order-' + Date.now(),
      orderNumber: 'TEST-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      driver: mockDriverData,
      status: 'assigned',
      timeline: [{
        status: 'assigned',
        timestamp: new Date(),
        description: `${driverName} has been assigned to your order`,
        completed: true
      }],
      message: `${driverName} has been assigned to your order`,
      timestamp: new Date()
    };
    
    // Emit to user-specific room if userId provided
    if (userId) {
      socketService.io.to(`user-${userId}`).emit('driver-assigned-realtime', notificationData);
      console.log(`✅ Test notification emitted to user ${userId}`);
    }
    
    // Emit to tracking room if orderId provided
    if (orderId) {
      socketService.io.to(`tracking-${orderId}`).emit('driver-assigned-realtime', notificationData);
      console.log(`✅ Test notification emitted to tracking room ${orderId}`);
    }
    
    // Emit to all connected clients (for testing)
    socketService.io.emit('driver-assigned-realtime', notificationData);
    console.log(`✅ Test notification broadcasted to all clients`);
    
    res.json({
      success: true,
      message: 'Test driver assignment notification sent',
      data: notificationData
    });
    
  } catch (error) {
    console.error('❌ Test driver assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// Test route to check socket connections
router.get('/test-socket-status', (req, res) => {
  const socketService = req.app.get('socketService');
  
  if (!socketService) {
    return res.json({
      success: false,
      message: 'Socket service not available'
    });
  }
  
  const stats = {
    totalConnections: socketService.io.engine.clientsCount,
    connectedUsers: socketService.connectedUsers.size,
    connectedDrivers: socketService.connectedDrivers.size,
    rooms: Object.keys(socketService.io.sockets.adapter.rooms)
  };
  
  console.log('📊 Socket Status:', stats);
  
  res.json({
    success: true,
    message: 'Socket service is running',
    stats
  });
});

// Test route to emit to specific user
router.post('/test-emit-to-user', (req, res) => {
  try {
    const { userId, message } = req.body;
    const socketService = req.app.get('socketService');
    
    if (!socketService) {
      return res.status(500).json({ 
        success: false, 
        message: 'Socket service not available' 
      });
    }
    
    const testData = {
      orderId: 'test-' + Date.now(),
      orderNumber: 'TEST-' + Math.random().toString(36).substr(2, 6),
      driver: {
        id: 'test-driver',
        name: 'Test Driver',
        phone: '+91 98765 43210',
        rating: 4.8,
        vehicle: { type: 'bike', number: 'TEST 1234' }
      },
      status: 'assigned',
      message: message || 'Test notification from backend',
      timestamp: new Date()
    };
    
    socketService.io.to(`user-${userId}`).emit('driver-assigned-realtime', testData);
    console.log(`✅ Test message sent to user ${userId}`);
    
    res.json({
      success: true,
      message: `Test notification sent to user ${userId}`,
      data: testData
    });
    
  } catch (error) {
    console.error('❌ Test emit error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

module.exports = router;