const Order = require('../models/Order');
const DeliveryTracking = require('../models/DeliveryTracking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendDriverAssignmentNotification } = require('../utils/emailService');

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistanceHaversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Helper function to calculate estimated delivery time
const calculateEstimatedDeliveryTime = async (driverLocation, deliveryAddress) => {
  try {
    if (!driverLocation?.lat || !deliveryAddress?.coordinates?.lat) {
      return '30-45 minutes'; // Default estimate
    }
    
    const distance = calculateDistanceHaversine(
      driverLocation.lat,
      driverLocation.lng,
      deliveryAddress.coordinates.lat,
      deliveryAddress.coordinates.lng
    );
    
    // Assume average speed of 25 km/h for city delivery
    const estimatedMinutes = Math.ceil((distance / 25) * 60);
    return `${Math.max(estimatedMinutes, 10)}-${Math.max(estimatedMinutes + 10, 20)} minutes`;
  } catch (error) {
    console.error('Error calculating delivery time:', error);
    return '30-45 minutes';
  }
};

// Get tracking information for an order
const getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Find the order and verify ownership
    const order = await Order.findOne({
      $or: [
        { orderNumber: orderId },
        { _id: orderId }
      ]
    })
    .populate('items.product')
    .populate('deliveryPartner', 'name phone rating avatar driverProfile role');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order (or is admin)
    if (order?.userId?.toString() !== userId && req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get tracking information
    const tracking = await DeliveryTracking.findOne({ orderId: order._id.toString() })
      .populate('driverId', 'name phone rating avatar driverProfile role');

    if (!tracking) {
      // Create initial tracking record if it doesn't exist with default driver location
      const newTracking = new DeliveryTracking({
        orderId: order._id.toString(),
        status: 'order_placed',
        timeline: [{
          status: 'order_placed',
          timestamp: order.createdAt,
          description: 'Order has been placed successfully',
          completed: true
        }],
        deliveryAddress: {
          name: order.deliveryAddress?.name,
          phone: order.deliveryAddress?.phone || order.userContactNo,
          street: order.deliveryAddress?.street,
          city: order.deliveryAddress?.city,
          state: order.deliveryAddress?.state,
          zipCode: order.deliveryAddress?.pincode,
          country: order.deliveryAddress?.country || 'India',
          coordinates: order.deliveryAddress?.coordinates || {
            lat: 22.763813,
            lng: 75.885822
          }
        },
        // Set default driver location (delivery hub/restaurant location)
        currentLocation: {
          lat: 22.763813,
          lng: 75.885822
        }
      });
      await newTracking.save();
      
      // Calculate estimated time from restaurant/center location if available
      const centerLocation = { lat: 22.763813, lng: 75.885822 }; // Default restaurant location
      const estimatedTime = await calculateEstimatedDeliveryTime(
        centerLocation,
        newTracking.deliveryAddress
      );
      
      return res.json({
        orderId,
        status: 'order_placed',
        timeline: newTracking.timeline,
        deliveryAddress: newTracking.deliveryAddress,
        items: order.items,
        total: order.totalAmount,
        paymentMethod: order.paymentMethod,
        driver: {
          name: 'Delivery Partner',
          phone: 'Will be assigned soon',
          rating: 4.5,
          vehicle: { type: 'bike', number: 'Coming Soon' }
        },
        driverLocation: null,
        estimatedDeliveryTime: estimatedTime
      });
    }

    // Try to auto-assign driver if not assigned yet
    if (!tracking.driverId && !order.deliveryPartner && ['order_placed', 'payment_confirmed', 'confirmed'].includes(tracking.status)) {
      const assigned = await autoAssignDriver(orderId);
      if (assigned) {
        // Refresh both tracking and order data after assignment
        const updatedTracking = await DeliveryTracking.findOne({ orderId: order._id.toString() })
          .populate('driverId', 'name phone rating avatar driverProfile role');
        const updatedOrder = await Order.findById(order._id)
          .populate('deliveryPartner', 'name phone rating avatar driverProfile role');
        
        if (updatedTracking && updatedOrder) {
          Object.assign(tracking, updatedTracking);
          Object.assign(order, updatedOrder);
        }
      }
    }

    // Calculate real-time estimated delivery time
    const estimatedTime = tracking.currentLocation ? 
      await calculateEstimatedDeliveryTime(tracking.currentLocation, tracking.deliveryAddress) :
      '30-45 minutes';

    // Prepare response data
    const responseData = {
      orderId,
      status: tracking.status,
      timeline: tracking.timeline,
      deliveryAddress: tracking.deliveryAddress || {
        name: order.deliveryAddress?.name,
        phone: order.deliveryAddress?.phone || order.userContactNo,
        street: order.deliveryAddress?.street,
        city: order.deliveryAddress?.city,
        state: order.deliveryAddress?.state,
        zipCode: order.deliveryAddress?.pincode,
        country: 'India',
        coordinates: order.deliveryAddress?.coordinates || {
          lat: 22.763813,
          lng: 75.885822
        }
      },
      items: order.items,
      total: order.totalAmount,
      paymentMethod: order.paymentMethod,
      driver: tracking.driverId ? {
        name: tracking.driverId.name,
        phone: tracking.driverId.phone,
        rating: tracking.driverId.rating,
        deliveries: tracking.driverId.driverProfile?.deliveries || 0,
        vehicle: tracking.driverId.driverProfile?.vehicle || { type: 'bike', number: 'Coming Soon' },
        profileImage: tracking.driverId.avatar
      } : order.deliveryPartner ? {
        name: order.deliveryPartner.name,
        phone: order.deliveryPartner.phone,
        rating: order.deliveryPartner.rating,
        deliveries: order.deliveryPartner.driverProfile?.deliveries || 0,
        vehicle: order.deliveryPartner.driverProfile?.vehicle || { type: 'bike', number: 'Coming Soon' },
        profileImage: order.deliveryPartner.avatar
      } : (!tracking.driverId && !order.deliveryPartner && ['order_placed', 'payment_confirmed', 'confirmed'].includes(tracking.status)) ? {
        name: 'Finding delivery partner...',
        phone: 'Will be assigned soon',
        rating: 4.5,
        vehicle: { type: 'bike', number: 'Coming Soon' }
      } : null,
      driverLocation: tracking.currentLocation || { lat: 22.763813, lng: 75.885822 },
      estimatedDeliveryTime: tracking.estimatedDeliveryTime || estimatedTime,
      specialInstructions: order.specialInstructions
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update order status (for admin/driver use)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, location, estimatedTime, description } = req.body;
    const userId = req.user.id;

    // Check if user is admin or assigned driver
    const tracking = await DeliveryTracking.findOne({ orderId });
    if (!tracking) {
      return res.status(404).json({ message: 'Tracking record not found' });
    }

    const isAuthorized = req.user.role === 'admin' || 
                        (tracking.driverId && tracking.driverId.toString() === userId);
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update tracking status
    tracking.status = status;
    
    // Add to timeline
    const timelineEntry = {
      status,
      timestamp: new Date(),
      description: description || getDefaultStatusDescription(status),
      completed: true
    };

    if (location) {
      timelineEntry.location = location;
      tracking.currentLocation = {
        lat: location.lat,
        lng: location.lng
      };
    }

    if (estimatedTime) {
      tracking.estimatedDeliveryTime = estimatedTime;
      timelineEntry.estimatedTime = estimatedTime;
    }

    tracking.timeline.push(timelineEntry);
    await tracking.save();

    // Emit real-time update to connected clients
    try {
      const io = global.io;
      if (io) {
        io.to(`tracking-${orderId}`).emit('status-update', {
          status,
          timeline: tracking.timeline,
          location: tracking.currentLocation,
          estimatedTime: tracking.estimatedDeliveryTime
        });
        console.log(`Status update emitted for order ${orderId}`);
      }
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
    }

    res.json({ message: 'Status updated successfully', tracking });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update driver location (real-time tracking)
const updateDriverLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { lat, lng, heading, speed } = req.body;
    const userId = req.user.id;

    const tracking = await DeliveryTracking.findOne({ orderId });
    if (!tracking) {
      return res.status(404).json({ message: 'Tracking record not found' });
    }

    // Check if user is the assigned driver
    if (!tracking.driverId || tracking.driverId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update driver location
    tracking.currentLocation = { lat, lng };
    if (heading !== undefined) tracking.currentLocation.heading = heading;
    if (speed !== undefined) tracking.currentLocation.speed = speed;
    tracking.lastLocationUpdate = new Date();

    await tracking.save();

    // Calculate estimated delivery time based on distance
    const estimatedTime = await calculateEstimatedDeliveryTime(
      { lat, lng },
      tracking.deliveryAddress
    );

    // Emit real-time location update
    try {
      const io = global.io;
      if (io) {
        io.to(`tracking-${orderId}`).emit('location-update', {
          location: { lat, lng, heading, speed },
          estimatedTime,
          timestamp: new Date()
        });
        console.log(`Location update emitted for order ${orderId}`);
      }
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
    }

    res.json({ 
      message: 'Location updated successfully',
      estimatedTime
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Assign driver to order
const assignDriver = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tracking = await DeliveryTracking.findOne({ orderId });
    if (!tracking) {
      return res.status(404).json({ message: 'Tracking record not found' });
    }

    const driver = await User.findOne({ _id: driverId, role: 'delivery' });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Assign driver
    tracking.driverId = driverId;
    tracking.status = 'assigned';
    
    // Add timeline entry
    tracking.timeline.push({
      status: 'assigned',
      timestamp: new Date(),
      description: `Driver ${driver.name} has been assigned to your order`,
      completed: true
    });

    await tracking.save();

    // Update order with driver assignment
    const order = await Order.findById(orderId);
    if (order) {
      order.deliveryPartner = driverId;
      order.status = 'confirmed';
      await order.save();
    }

    // Emit real-time updates
    try {
      const io = global.io;
      const socketService = req.app.get('socketService');
      
      if (io || socketService) {
        const driverData = {
          id: driver._id,
          name: driver.name,
          phone: driver.phone,
          rating: driver.rating || 4.5,
          vehicle: driver.driverProfile?.vehicle || { type: 'bike', number: 'Coming Soon' },
          currentLocation: driver.driverProfile?.currentLocation
        };

        const notificationData = {
          orderId,
          orderNumber: order?.orderNumber || 'ORD-' + orderId.slice(-6),
          driver: driverData,
          status: 'assigned',
          timeline: tracking.timeline,
          message: `Driver ${driver.name} has been assigned to your order`,
          timestamp: new Date()
        };

        // Emit to user-specific room for immediate notification
        if (order?.userId) {
          if (socketService?.io) {
            socketService.io.to(`user-${order.userId}`).emit('driver-assigned-realtime', notificationData);
          } else if (io) {
            io.to(`user-${order.userId}`).emit('driver-assigned-realtime', notificationData);
          }
          console.log(`✅ Real-time driver assignment emitted to user ${order.userId}`);
        }

        // Emit to tracking room
        if (socketService?.io) {
          socketService.io.to(`tracking-${orderId}`).emit('driver-assigned-realtime', notificationData);
        } else if (io) {
          io.to(`tracking-${orderId}`).emit('driver-assigned-realtime', notificationData);
        }

        // Legacy status update (for backward compatibility)
        if (socketService?.io) {
          socketService.io.to(`tracking-${orderId}`).emit('status-update', {
            status: 'assigned',
            timeline: tracking.timeline,
            driver: driverData
          });
        } else if (io) {
          io.to(`tracking-${orderId}`).emit('status-update', {
            status: 'assigned',
            timeline: tracking.timeline,
            driver: driverData
          });
        }

        // Use order socket service for broader notifications if available
        if (socketService?.orderSocketService) {
          socketService.orderSocketService.emitDriverAssignmentNotification({
            ...order.toObject(),
            deliveryPartner: {
              _id: driver._id,
              name: driver.name,
              phone: driver.phone,
              rating: driver.rating,
              vehicle: driver.driverProfile?.vehicle
            }
          });
        }

        console.log(`✅ Manual driver assignment notifications sent for order ${orderId}`);
      }
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
    }

    res.json({ message: 'Driver assigned successfully', tracking });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all active deliveries (for admin dashboard)
const getActiveDeliveries = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const activeDeliveries = await DeliveryTracking.find({
      status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] }
    })
    .populate('orderId', 'totalAmount createdAt')
    .populate('driverId', 'name phone driverProfile avatar')
    .sort({ createdAt: -1 });

    res.json(activeDeliveries);
  } catch (error) {
    console.error('Error fetching active deliveries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to get default status descriptions
// const getDefaultStatusDescription = (status) => {
//   const descriptions = {
//     'order_placed': 'Your order has been placed successfully',
//     'payment_confirmed': 'Payment has been confirmed',
//     'preparing': 'Your order is being prepared',
//     'ready_for_pickup': 'Your order is ready for pickup',
//     'assigned': 'A delivery partner has been assigned',
//     'picked_up': 'Your order has been picked up',
//     'out_for_delivery': 'Your order is on the way',
//     'delivered': 'Your order has been delivered successfully',
//     'cancelled': 'Your order has been cancelled'
//   };
  
//   return descriptions[status] || 'Status updated';
// };

// Additional helper function that uses the main calculateDistanceHaversine
const calculateDeliveryETA = async (driverLocation, deliveryAddress) => {
  try {
    // This would typically use Google Maps Distance Matrix API
    // For now, we'll use a simple calculation based on straight-line distance
    const distance = calculateDistanceHaversine(
      driverLocation.lat,
      driverLocation.lng,
      deliveryAddress.coordinates?.lat || 0,
      deliveryAddress.coordinates?.lng || 0
    );
    
    // Assume average speed of 30 km/h in city traffic
    const estimatedMinutes = Math.ceil((distance / 30) * 60);
    
    const now = new Date();
    const estimatedArrival = new Date(now.getTime() + estimatedMinutes * 60000);
    
    return estimatedArrival.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error calculating delivery time:', error);
    return null;
  }
};

// Auto-assign driver function
const autoAssignDriver = async (orderId, socketService = null) => {
  try {
    console.log('Notifying all drivers about new order:', orderId);
    
    // Find available drivers 
    const availableDrivers = await User.find({
      role: 'delivery',
      isActive: true,
      'driverProfile.isOnline': true
    });

    if (availableDrivers.length === 0) {
      console.log('No available drivers found for notifications');
      return false;
    }

    // Get order details
    const order = await Order.findById(orderId).populate('userId', 'name phone');
    if (!order) {
      console.log('Order not found:', orderId);
      return false;
    }

    // Import notification services
    const nodemailer = require('nodemailer');
    const { sendNotification } = require('../utils/notificationService');

    // Create email transporter
    const transporter = nodemailer.createTransport({
       service: 'gmail',
      auth: {
        user:  'tastyaana@gmail.com',
        pass: 'evuvbiguzmavkkch'
      }});

    console.log(`Sending notifications to ${availableDrivers.length} drivers`);

    // Send notifications to all available drivers
    for (const driver of availableDrivers) {
      try {
        // Send email notification if email exists
        if (driver.email) {
          const orderItems = order.items.map(item => 
            `${item.name} x ${item.quantity}`
          ).join(', ');

          const emailTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
              <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
                  🛵 New Order Available!
                </h2>
                
                <div style="background: #e8f4fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #34495e;">Order Details:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #555;">
                    <li><strong>Order Number:</strong> ${order.orderNumber}</li>
                    <li><strong>Total Amount:</strong> ₹${order.totalAmount}</li>
                    <li><strong>Items:</strong> ${orderItems}</li>
                    <li><strong>Customer:</strong> ${order.userId?.name || 'N/A'}</li>
                    <li><strong>Delivery Area:</strong> ${order.deliveryAddress?.area || 'N/A'}</li>
                  </ul>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
                  <p style="margin: 0; color: #856404; font-weight: bold;">
                    ⏰ First come, first served! Accept quickly to get this order.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.DRIVER_DASHBOARD_URL || 'http://localhost:5173/driver/dashboard'}" 
                     style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Accept Order
                  </a>
                </div>
              </div>
            </div>
          `;

          await transporter.sendMail({
            from: `"Tastyaana "<${process.env.EMAIL_USER}>`,
            to: driver.email,
            subject: `New Order Available - ${order.orderNumber} (₹${order.totalAmount})`,
            html: emailTemplate
          });
        }

        // Send browser notification
        await sendNotification({
          userId: driver._id,
          title: `New Order Available - ${order.orderNumber}`,
          message: `Order worth ₹${order.totalAmount} available for acceptance`,
          type: 'new_order',
          data: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            deliveryAddress: order.deliveryAddress
          }
        });

      } catch (error) {
        console.error(`Error notifying driver ${driver.email || driver.name}:`, error);
      }
    }

    console.log(`✅ Notifications sent to ${availableDrivers.length} drivers for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Error notifying drivers:', error);
    return false;
  }
};


// Update delivery status (NEW FUNCTION)
const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, description, location, estimatedTime } = req.body;
    const userId = req.user.id;

    console.log(`📦 Updating delivery status for order: ${orderId} -> ${status}`);

    // Find the delivery tracking record by orderId
    const tracking = await DeliveryTracking.findOne({ orderId: orderId.toString() });
    if (!tracking) {
      return res.status(404).json({ 
        success: false,
        message: 'Delivery tracking record not found' 
      });
    }

    // Check if user is authorized (admin or assigned driver)
    const isAuthorized = req.user.role === 'admin' || 
                        (tracking.driverId && tracking.driverId.toString() === userId);
    
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only admin or assigned driver can update status.' 
      });
    }

    // Validate status
    const validStatuses = [
      'order_placed',
      'payment_confirmed',
      'preparing',
      'ready_for_pickup',
      'assigned',
      'picked_up',
      'out_for_delivery',
      'reached',
      'delivered',
      'cancelled',
      'delayed'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update tracking status
    const oldStatus = tracking.status;
    tracking.status = status;
    
    // Add to timeline
    const timelineEntry = {
      status,
      timestamp: new Date(),
      description: description || getDefaultStatusDescription(status),
      completed: true
    };

    if (location) {
      timelineEntry.location = location;
      tracking.currentLocation = {
        lat: location.lat,
        lng: location.lng
      };
    }

    if (estimatedTime) {
      tracking.estimatedDeliveryTime = estimatedTime;
      timelineEntry.estimatedTime = estimatedTime;
    }

    tracking.timeline.push(timelineEntry);
    await tracking.save();

    // Update corresponding order status
    try {
      const order = await Order.findById(tracking.orderId);
      if (order) {
        order.status = status;
        
        // Add specific timestamps based on status
        if (status === 'delivered') {
          order.actualDelivery = new Date();
          order.deliveredAt = new Date();
        } else if (status === 'cancelled') {
          order.cancelledAt = new Date();
        } else if (status === 'picked_up') {
          order.pickedUpAt = new Date();
        }
        
        await order.save();
        console.log(`✅ Order ${order.orderNumber} status updated to: ${status}`);
      }
    } catch (orderError) {
      console.error('Error updating order status:', orderError);
    }

    // Emit real-time update to connected clients
    try {
      const io = global.io;
      if (io) {
        io.to(`tracking-${tracking.orderId}`).emit('status-update', {
          status,
          timeline: tracking.timeline,
          location: tracking.currentLocation,
          estimatedTime: tracking.estimatedDeliveryTime,
          timestamp: new Date(),
          driver: tracking.driverId ? {
            name: req.user.name,
            phone: req.user.phone
          } : null
        });
        console.log(`✅ Status update emitted for order ${orderId}`);
      }
    } catch (socketError) {
      console.error('Socket emission error:', socketError);
    }

    // Send notification to customer if status changed significantly
    if (['delivered', 'cancelled', 'reached', 'picked_up'].includes(status)) {
      try {
        const order = await Order.findById(tracking.orderId).populate('userId', 'name email phone');
        if (order?.userId) {
          // Send email notification
          const emailData = {
            orderNumber: order.orderNumber,
            status,
            description: description || getDefaultStatusDescription(status),
            customerName: order.userId.name,
            deliveryAddress: order.deliveryAddress || tracking.deliveryAddress
          };
          
          // You can implement email sending here
          console.log(`📧 Notification sent to customer for order ${order.orderNumber}: ${status}`);
        }
      } catch (notificationError) {
        console.error('Error sending customer notification:', notificationError);
      }
    }

    res.json({ 
      success: true,
      message: 'Delivery status updated successfully',
      data: {
        orderId,
        status,
        previousStatus: oldStatus,
        timeline: tracking.timeline,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error updating delivery status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Helper function to get default status descriptions
const getDefaultStatusDescription = (status) => {
  const descriptions = {
    'order_placed': 'Order has been placed successfully',
    'payment_confirmed': 'Payment has been confirmed',
    'preparing': 'Your order is being prepared',
    'ready_for_pickup': 'Your order is ready for pickup',
    'assigned': 'A delivery partner has been assigned',
    'picked_up': 'Your order has been picked up',
    'out_for_delivery': 'Your order is on the way',
    'reached': 'Delivery partner has reached your location',
    'delivered': 'Your order has been delivered successfully',
    'cancelled': 'Your order has been cancelled',
    'delayed': 'Your order delivery has been delayed'
  };
  
  return descriptions[status] || 'Status updated';
};



/**
 * Confirm pickup by delivery partner
 */
const confirmPickup = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;
    const deliveryPartnerId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is ready for pickup
    if (order.handoverDetails?.handoverStatus !== 'ready-waiting-pickup') {
      return res.status(400).json({
        success: false,
        message: 'Order is not ready for pickup yet'
      });
    }

    // Validate OTP if provided
    if (otp && order.otp && order.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark delivery pickup
    await order.markDeliveryPickup(deliveryPartnerId, otp);

    // Create notification
    await Notification.create({
      userId: order.userId,
      title: 'Order Picked Up',
      message: `Your order #${order.orderNumber} has been picked up by delivery partner`,
      type: 'delivery',
      data: {
        orderId: order._id,
        status: order.status,
        orderNumber: order.orderNumber
      }
    });

    res.json({
      success: true,
      message: 'Pickup confirmed successfully',
      data: {
        orderId: order._id,
        handoverStatus: order.handoverDetails.handoverStatus,
        pickedUpAt: order.handoverDetails.deliveryPartnerPickup.pickedUpAt,
        status: order.status,
        handoverFlag: order.handoverFlag
      }
    });

  } catch (error) {
    console.error('Confirm pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm pickup',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get flagged handovers (mismatched pickup/ready times)
 */
const getFlaggedHandovers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const flaggedOrders = await Order.find({
      'handoverDetails.handoverStatus': 'flagged-mismatch'
    })
    .populate('userId', 'name email phone')
    .populate('handoverDetails.restaurantMarkedReady.markedBy', 'name')
    .populate('handoverDetails.deliveryPartnerPickup.pickedUpBy', 'name')
    .sort({ 'handoverDetails.flaggedAt': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

    const totalFlagged = await Order.countDocuments({
      'handoverDetails.handoverStatus': 'flagged-mismatch'
    });

    res.json({
      success: true,
      data: {
        orders: flaggedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalFlagged / limit),
          totalItems: totalFlagged,
          hasNext: page < Math.ceil(totalFlagged / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get flagged handovers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flagged handovers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getOrderTracking,
  updateOrderStatus,
  updateDeliveryStatus,
  updateDriverLocation,
  assignDriver,
  getActiveDeliveries,
  autoAssignDriver,
  confirmPickup,
  getFlaggedHandovers
};
