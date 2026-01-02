
// utils/socket.js - Advanced Socket.io Setup
const { setConnectionStatus, addRealTimeNotification } = require('../store/socketHandlers');
const { sendPushNotification } = require('./BroadcastManager');

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user authentication and room joining
    socket.on('authenticate', async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user) {
          socket.userId = user._id.toString();
          socket.userRole = user.role;
          
          // Join user-specific room
          socket.join(`user_${user._id}`);
          
          // Join role-specific rooms
          if (user.role === 'seller') {
            socket.join(`seller_${user._id}`);
            socket.join('sellers');
          } else if (user.role === 'admin') {
            socket.join('admins');
          }
          
          socket.emit('authenticated', { userId: user._id, role: user.role });
        }
      } catch (error) {
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    // Handle order updates
    socket.on('orderUpdate', (data) => {
      // Broadcast to relevant parties
      if (data.customerId) {
        io.to(`user_${data.customerId}`).emit('orderStatusUpdate', data);
      }
      if (data.sellerId) {
        io.to(`seller_${data.sellerId}`).emit('orderUpdate', data);
      }
      // Notify admins
      io.to('admins').emit('orderUpdate', data);
    });

    // Handle new orders
    socket.on('newOrder', (orderData) => {
      // Notify seller
      io.to(`seller_${orderData.sellerId}`).emit('newOrder', orderData);
      
      // Notify admins
      io.to('admins').emit('newOrder', orderData);
      
      // Send push notification
      sendPushNotification(orderData.sellerId, {
        title: 'New Order',
        body: `Order #${orderData.orderNumber} received`,
        data: { orderId: orderData._id }
      });
    });

    // Handle product views for analytics
    socket.on('productView', (data) => {
      updateProductViews(data.productId, data.sellerId);
    });

    // Handle real-time analytics requests
    socket.on('requestRealtimeData', () => {
      if (socket.userRole === 'seller') {
        getRealTimeData(socket.userId).then(data => {
          socket.emit('realtimeData', data);
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Periodic updates
  setInterval(() => {
    // Send periodic updates to connected sellers
    io.to('sellers').emit('periodicUpdate', {
      timestamp: new Date(),
      type: 'heartbeat'
    });
  }, 30000); // Every 30 seconds
};
