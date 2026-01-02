const Order = require('../models/Order');
const DeliveryTracking = require('../models/DeliveryTracking');
const User = require('../models/User');

class OrderSocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.connectedAdmins = new Map(); // adminId -> socketId
    this.connectedSellers = new Map(); // sellerId -> socketId
    this.connectedDrivers = new Map(); // driverId -> socketId
  }

  // Initialize socket connections for order management
  initializeOrderSockets() {
    this.io.on('connection', (socket) => {
      console.log('🔌 New socket connection for order management:', socket.id);

      // User joins their personal room for order updates
      socket.on('join-user-orders', (userId) => {
        try {
          socket.join(`user-orders-${userId}`);
          this.connectedUsers.set(userId, socket.id);
          console.log(`👤 User ${userId} joined order room`);
          
          socket.emit('user-orders-joined', {
            message: 'Successfully joined user orders room',
            userId
          });
        } catch (error) {
          console.error('Error joining user orders room:', error);
          socket.emit('error', { message: 'Failed to join user orders room' });
        }
      });

      // Admin joins admin room for all order updates
      socket.on('join-admin-orders', (adminId) => {
        try {
          socket.join('admin-orders');
          this.connectedAdmins.set(adminId, socket.id);
          console.log(`👨‍💼 Admin ${adminId} joined admin orders room`);
          
          socket.emit('admin-orders-joined', {
            message: 'Successfully joined admin orders room',
            adminId
          });
        } catch (error) {
          console.error('Error joining admin orders room:', error);
          socket.emit('error', { message: 'Failed to join admin orders room' });
        }
      });

      // Seller joins seller room for their order updates
      socket.on('join-seller-orders', (sellerId) => {
        try {
          socket.join(`seller-orders-${sellerId}`);
          this.connectedSellers.set(sellerId, socket.id);
          console.log(`🏪 Seller ${sellerId} joined seller orders room`);
          
          socket.emit('seller-orders-joined', {
            message: 'Successfully joined seller orders room',
            sellerId
          });
        } catch (error) {
          console.error('Error joining seller orders room:', error);
          socket.emit('error', { message: 'Failed to join seller orders room' });
        }
      });

      // Driver joins driver room for their assigned orders
      socket.on('join-driver-orders', (driverId) => {
        try {
          socket.join(`driver-orders-${driverId}`);
          this.connectedDrivers.set(driverId, socket.id);
          console.log(`🚗 Driver ${driverId} joined driver orders room`);
          
          socket.emit('driver-orders-joined', {
            message: 'Successfully joined driver orders room',
            driverId
          });
        } catch (error) {
          console.error('Error joining driver orders room:', error);
          socket.emit('error', { message: 'Failed to join driver orders room' });
        }
      });

      // Handle order status updates
      socket.on('update-order-status', async (data) => {
        try {
          const { orderId, status, userId, driverId } = data;
          console.log(`📦 Order status update: ${orderId} -> ${status}`);

          // Update order in database
          const order = await Order.findByIdAndUpdate(
            orderId,
            { 
              status,
              ...(status === 'delivered' && { deliveredAt: new Date() }),
              ...(driverId && { deliveryPartner: driverId })
            },
            { new: true }
          ).populate('deliveryPartner', 'name phone rating avatar');

          if (!order) {
            socket.emit('error', { message: 'Order not found' });
            return;
          }

          // Update delivery tracking
          const tracking = await DeliveryTracking.findOneAndUpdate(
            { orderId: orderId.toString() },
            { 
              status,
              ...(status === 'delivered' && { actualDeliveryTime: new Date() })
            },
            { new: true }
          );

          // Emit real-time updates to all relevant parties
          this.emitOrderStatusUpdate(order, status, userId, driverId);

        } catch (error) {
          console.error('Error updating order status:', error);
          socket.emit('error', { message: 'Failed to update order status' });
        }
      });

      // Handle new order creation
      socket.on('new-order-created', async (orderData) => {
        try {
          console.log('🆕 New order created:', orderData.orderId);
          
          // Emit to admin and relevant seller
          this.emitNewOrderNotification(orderData);
          
        } catch (error) {
          console.error('Error handling new order:', error);
        }
      });

      // Handle driver assignment
      socket.on('assign-driver', async (data) => {
        try {
          const { orderId, driverId } = data;
          console.log(`🚗 Assigning driver ${driverId} to order ${orderId}`);

          // Update order with driver assignment
          const order = await Order.findByIdAndUpdate(
            orderId,
            { 
              deliveryPartner: driverId,
              status: 'assigned'
            },
            { new: true }
          ).populate('deliveryPartner', 'name phone rating avatar');

          if (!order) {
            socket.emit('error', { message: 'Order not found' });
            return;
          }

          // Update delivery tracking
          await DeliveryTracking.findOneAndUpdate(
            { orderId: orderId.toString() },
            { 
              driverId,
              status: 'assigned'
            }
          );

          // Emit driver assignment notification
          this.emitDriverAssignmentNotification(order);

        } catch (error) {
          console.error('Error assigning driver:', error);
          socket.emit('error', { message: 'Failed to assign driver' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected:', socket.id);
        
        // Remove from connected users maps
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            console.log(`👤 User ${userId} disconnected`);
            break;
          }
        }
        
        for (const [adminId, socketId] of this.connectedAdmins.entries()) {
          if (socketId === socket.id) {
            this.connectedAdmins.delete(adminId);
            console.log(`👨‍💼 Admin ${adminId} disconnected`);
            break;
          }
        }
        
        for (const [sellerId, socketId] of this.connectedSellers.entries()) {
          if (socketId === socket.id) {
            this.connectedSellers.delete(sellerId);
            console.log(`🏪 Seller ${sellerId} disconnected`);
            break;
          }
        }
        
        for (const [driverId, socketId] of this.connectedDrivers.entries()) {
          if (socketId === socket.id) {
            this.connectedDrivers.delete(driverId);
            console.log(`🚗 Driver ${driverId} disconnected`);
            break;
          }
        }
      });
    });
  }

  // Emit order status update to all relevant parties
  emitOrderStatusUpdate(order, status, userId, driverId) {
    const orderData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status,
      updatedAt: new Date(),
      deliveryPartner: order.deliveryPartner,
      totalAmount: order.totalAmount,
      items: order.items
    };

    // Emit to user who placed the order
    if (userId) {
      this.io.to(`user-orders-${userId}`).emit('order-status-updated', orderData);
      console.log(`📤 Emitted order status update to user ${userId}`);
    }

    // Emit to admin
    this.io.to('admin-orders').emit('order-status-updated', orderData);
    console.log('📤 Emitted order status update to admin');

    // Emit to assigned driver
    if (driverId) {
      this.io.to(`driver-orders-${driverId}`).emit('order-status-updated', orderData);
      console.log(`📤 Emitted order status update to driver ${driverId}`);
    }

    // Emit to relevant sellers (if order has seller-specific items)
    if (order.items && order.items.length > 0) {
      const sellerIds = [...new Set(order.items.map(item => item.sellerId).filter(Boolean))];
      sellerIds.forEach(sellerId => {
        this.io.to(`seller-orders-${sellerId}`).emit('order-status-updated', orderData);
        console.log(`📤 Emitted order status update to seller ${sellerId}`);
      });
    }
  }

  // Emit new order notification
  emitNewOrderNotification(orderData) {
    // Emit to admin
    this.io.to('admin-orders').emit('new-order-created', orderData);
    console.log('📤 Emitted new order notification to admin');

    // Emit to relevant sellers
    if (orderData.items && orderData.items.length > 0) {
      const sellerIds = [...new Set(orderData.items.map(item => item.sellerId).filter(Boolean))];
      sellerIds.forEach(sellerId => {
        this.io.to(`seller-orders-${sellerId}`).emit('new-order-created', orderData);
        console.log(`📤 Emitted new order notification to seller ${sellerId}`);
      });
    }
  }

  // Emit driver assignment notification
  emitDriverAssignmentNotification(order) {
    const assignmentData = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      driver: order.deliveryPartner,
      assignedAt: new Date()
    };

    // Emit to user
    if (order.userId) {
      this.io.to(`user-orders-${order.userId}`).emit('driver-assigned', assignmentData);
      console.log(`📤 Emitted driver assignment to user ${order.userId}`);
      
      // Also emit real-time notification
      this.io.to(`user-orders-${order.userId}`).emit('driver-assigned-realtime', {
        ...assignmentData,
        status: 'assigned',
        message: `Driver ${order.deliveryPartner.name} has been assigned to your order`,
        timestamp: new Date()
      });
    }

    // Emit to admin
    this.io.to('admin-orders').emit('driver-assigned', assignmentData);
    console.log('📤 Emitted driver assignment to admin');
    
    // Also emit real-time notification to admin
    this.io.to('admin-orders').emit('driver-assigned-realtime', {
      ...assignmentData,
      status: 'assigned',
      message: `Driver ${order.deliveryPartner.name} has been assigned to order ${order.orderNumber}`,
      timestamp: new Date()
    });

    // Emit to assigned driver
    if (order.deliveryPartner) {
      this.io.to(`driver-orders-${order.deliveryPartner._id}`).emit('driver-assigned', assignmentData);
      console.log(`📤 Emitted driver assignment to driver ${order.deliveryPartner._id}`);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return {
      users: this.connectedUsers.size,
      admins: this.connectedAdmins.size,
      sellers: this.connectedSellers.size,
      drivers: this.connectedDrivers.size
    };
  }
}

module.exports = OrderSocketService;

