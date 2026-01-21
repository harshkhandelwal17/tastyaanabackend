// const DeliveryTracking = require('../models/DeliveryTracking');
// const Driver = require('../models/Driver');
// const User = require('../models/User');
// const Order = require('../models/Order');

// class SocketService {
//   constructor(io) {
//     this.io = io;
//     this.connectedUsers = new Map(); // userId -> socketId
//     this.connectedDrivers = new Map(); // driverId -> socketId
//     this.trackingRooms = new Map(); // orderId -> Set of socketIds

//     this.setupEventHandlers();
//   }

//   setupEventHandlers() {
//     this.io.on('connection', (socket) => {
//       console.log('Client connected:', socket.id);

//       // Handle user joining tracking room
//       socket.on('join-tracking', (orderId) => {
//         socket.join(`tracking-${orderId}`);

//         if (!this.trackingRooms.has(orderId)) {
//           this.trackingRooms.set(orderId, new Set());
//         }
//         this.trackingRooms.get(orderId).add(socket.id);

//         console.log(`Client ${socket.id} joined tracking room for order ${orderId}`);
//       });

//       // Handle driver authentication and joining
//       socket.on('driver-connect', async (data) => {
//         try {
//           const { driverId, token } = data;

//           // Verify driver token here if needed - using User model
//           const driver = await User.findById(driverId);
//           if (driver && driver.role === 'delivery') {
//             this.connectedDrivers.set(driverId, socket.id);
//             socket.driverId = driverId;
//             socket.join(`driver-${driverId}`);

//             // Update driver online status
//             driver.isOnline = true;
//             await driver.save();

//             console.log(`Driver ${driverId} connected`);

//             socket.emit('driver-connected', {
//               message: 'Successfully connected',
//               driverId
//             });
//           }
//         } catch (error) {
//           console.error('Driver connection error:', error);
//           socket.emit('connection-error', { message: 'Failed to connect driver' });
//         }
//       });

//       // Handle real-time location updates from driver
//       socket.on('driver-location-update', async (data) => {
//         try {
//           const { orderId, lat, lng, heading, speed } = data;
//           const driverId = socket.driverId;

//           if (!driverId) {
//             socket.emit('error', { message: 'Driver not authenticated' });
//             return;
//           }

//           // Update delivery tracking with current location
//           const tracking = await DeliveryTracking.findOne({ 
//             orderId: orderId,
//             driverId: driverId 
//           }).populate({
//             path: 'driverId',
//             select: 'name phone rating vehicle'
//           });

//           if (tracking) {
//             // Update location in tracking record
//             tracking.currentLocation = { lat, lng };
//             if (heading !== undefined) tracking.currentLocation.heading = heading;
//             if (speed !== undefined) tracking.currentLocation.speed = speed;
//             tracking.lastLocationUpdate = new Date();
//             await tracking.save();

//             // Calculate ETA
//             const eta = await this.calculateETA({ lat, lng }, tracking.deliveryAddress);

//             // Get order details
//             const order = await Order.findById(orderId).populate('userId', 'name phone');

//             // Broadcast to all clients tracking this order
//             this.io.to(`tracking-${orderId}`).emit('location-update', {
//               location: { lat, lng, heading, speed },
//               timestamp: new Date(),
//               driverId,
//               orderNumber: order?.orderNumber,
//               estimatedTime: eta,
//               driver: {
//                 name: tracking.driverId?.name,
//                 phone: tracking.driverId?.phone,
//                 rating: tracking.driverId?.rating,
//                 vehicle: tracking.driverId?.vehicle
//               }
//             });

//             // Emit to specific customer
//             if (order?.userId) {
//               this.io.to(`user-${order.userId._id}`).emit('delivery-location-update', {
//                 orderId: order._id,
//                 orderNumber: order.orderNumber,
//                 location: { lat, lng, heading, speed },
//                 timestamp: new Date(),
//                 status: order.status,
//                 estimatedTime: eta,
//                 driver: {
//                   name: tracking.driverId?.name,
//                   phone: tracking.driverId?.phone
//                 }
//               });
//             }

//             console.log(`Location updated for order ${orderId}: ${lat}, ${lng}, ETA: ${eta}`);
//           }
//         } catch (error) {
//           console.error('Location update error:', error);
//           socket.emit('error', { message: 'Failed to update location' });
//         }
//       });

//       // Handle status updates
//       socket.on('status-update', async (data) => {
//         try {
//           const { orderId, status, description, location } = data;
//           const driverId = socket.driverId;

//           if (!driverId) {
//             socket.emit('error', { message: 'Driver not authenticated' });
//             return;
//           }

//           const tracking = await DeliveryTracking.findOne({ 
//             orderId, 
//             driverId 
//           }).populate('driverId', 'name phone');

//           if (tracking) {
//             // Update tracking status
//             tracking.status = status;

//             // Add timeline entry
//             tracking.timeline.push({
//               status,
//               timestamp: new Date(),
//               description: description || this.getDefaultStatusDescription(status),
//               completed: true,
//               location: location
//             });

//             await tracking.save();

//             // Update order status as well
//             const order = await Order.findById(orderId);
//             if (order) {
//               order.status = status;
//               if (status === 'delivered') {
//                 order.actualDelivery = new Date();
//               }
//               await order.save();
//             }

//             // Broadcast status update
//             this.io.to(`tracking-${orderId}`).emit('status-update', {
//               status,
//               timeline: tracking.timeline,
//               timestamp: new Date(),
//               driver: {
//                 name: tracking.driverId?.name,
//                 phone: tracking.driverId?.phone
//               }
//             });

//             // Emit to customer
//             if (order?.userId) {
//               this.io.to(`user-${order.userId}`).emit('delivery-status-update', {
//                 orderId,
//                 orderNumber: order.orderNumber,
//                 status,
//                 description: description || this.getDefaultStatusDescription(status),
//                 timestamp: new Date(),
//                 isDelivered: status === 'delivered',
//                 isReached: status === 'reached' || status === 'delivered'
//               });
//             }

//             // Send push notification to customer
//             this.sendCustomerNotification(orderId, status, description);
//           }
//         } catch (error) {
//           console.error('Status update error:', error);
//           socket.emit('error', { message: 'Failed to update status' });
//         }
//       });

//       // Handle driver reached destination
//       socket.on('driver-reached', async (data) => {
//         try {
//           const { orderId } = data;
//           const driverId = socket.driverId;

//           if (!driverId) {
//             socket.emit('error', { message: 'Driver not authenticated' });
//             return;
//           }

//           // Update status to reached
//           await this.updateDeliveryStatus(orderId, driverId, 'reached', 'Driver has reached your location');
//         } catch (error) {
//           console.error('Driver reached error:', error);
//         }
//       });

//       // Handle delivery confirmation
//       socket.on('delivery-confirmed', async (data) => {
//         try {
//           const { orderId, otp } = data;
//           const driverId = socket.driverId;

//           if (!driverId) {
//             socket.emit('error', { message: 'Driver not authenticated' });
//             return;
//           }

//           // Verify OTP if provided
//           const order = await Order.findById(orderId);
//           if (order && order.otp && order.otp !== otp) {
//             socket.emit('error', { message: 'Invalid OTP' });
//             return;
//           }

//           // Update status to delivered
//           await this.updateDeliveryStatus(orderId, driverId, 'delivered', 'Order has been delivered successfully');

//           // Update driver earnings and completion count
//           const driver = await Driver.findById(driverId);
//           if (driver) {
//             driver.incrementDeliveries();
//             driver.addEarnings(order?.totalAmount * 0.1 || 50); // 10% commission or ₹50
//           }

//         } catch (error) {
//           console.error('Delivery confirmation error:', error);
//         }
//       });

//       // Handle driver going offline
//       socket.on('driver-disconnect', async () => {
//         const driverId = socket.driverId;
//         if (driverId) {
//           try {
//             const driver = await Driver.findById(driverId);
//             if (driver) {
//               driver.isOnline = false;
//               await driver.save();
//             }

//             this.connectedDrivers.delete(driverId);
//             console.log(`Driver ${driverId} disconnected`);
//           } catch (error) {
//             console.error('Driver disconnect error:', error);
//           }
//         }
//       });

//       // Handle client disconnect
//       socket.on('disconnect', async () => {
//         console.log('Client disconnected:', socket.id);

//         // Remove from tracking rooms
//         for (const [orderId, socketIds] of this.trackingRooms.entries()) {
//           socketIds.delete(socket.id);
//           if (socketIds.size === 0) {
//             this.trackingRooms.delete(orderId);
//           }
//         }

//         // Handle driver disconnect
//         const driverId = socket.driverId;
//         if (driverId) {
//           try {
//             const driver = await Driver.findById(driverId);
//             if (driver) {
//               driver.isOnline = false;
//               await driver.save();
//             }

//             this.connectedDrivers.delete(driverId);
//             console.log(`Driver ${driverId} went offline`);
//           } catch (error) {
//             console.error('Driver offline error:', error);
//           }
//         }
//       });
//     });
//   }

//   // Emit status update to tracking room
//   emitStatusUpdate(orderId, data) {
//     this.io.to(`tracking-${orderId}`).emit('status-update', data);
//   }

//   // Emit location update to tracking room
//   emitLocationUpdate(orderId, data) {
//     this.io.to(`tracking-${orderId}`).emit('location-update', data);
//   }

//   // Send notification to specific driver
//   notifyDriver(driverId, data) {
//     const socketId = this.connectedDrivers.get(driverId);
//     if (socketId) {
//       this.io.to(socketId).emit('notification', data);
//     }
//   }

//   // Broadcast to all connected drivers
//   broadcastToDrivers(data) {
//     this.io.to('drivers').emit('broadcast', data);
//   }

//   // Calculate estimated time of arrival
//   async calculateETA(driverLocation, deliveryAddress) {
//     try {
//       // This would integrate with Google Maps Distance Matrix API
//       // For now, using simple calculation
//       if (!deliveryAddress.coordinates) return null;

//       const distance = this.calculateDistance(
//         driverLocation.lat,
//         driverLocation.lng,
//         deliveryAddress.coordinates.lat,
//         deliveryAddress.coordinates.lng
//       );

//       // Assume average speed of 25 km/h in city traffic
//       const estimatedMinutes = Math.ceil((distance / 25) * 60);

//       const now = new Date();
//       const eta = new Date(now.getTime() + estimatedMinutes * 60000);

//       return eta.toLocaleTimeString('en-IN', {
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch (error) {
//       console.error('ETA calculation error:', error);
//       return null;
//     }
//   }

//   // Calculate distance between two points (Haversine formula)
//   calculateDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371; // Earth's radius in kilometers
//     const dLat = (lat2 - lat1) * Math.PI / 180;
//     const dLon = (lon2 - lon1) * Math.PI / 180;
//     const a = 
//       Math.sin(dLat/2) * Math.sin(dLat/2) +
//       Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
//       Math.sin(dLon/2) * Math.sin(dLon/2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     return R * c;
//   }

//   // Send push notification to customer
//   async sendCustomerNotification(orderId, status, description) {
//     try {
//       // This would integrate with FCM or other push notification service
//       console.log(`Notification for order ${orderId}: ${status} - ${description}`);

//       // Emit to tracking room as well
//       this.io.to(`tracking-${orderId}`).emit('notification', {
//         type: 'status-change',
//         status,
//         description,
//         timestamp: new Date()
//       });
//     } catch (error) {
//       console.error('Notification error:', error);
//     }
//   }

//   // Helper method to update delivery status
//   async updateDeliveryStatus(orderId, driverId, status, description) {
//     try {
//       const tracking = await DeliveryTracking.findOne({ orderId, driverId }).populate('driverId', 'name phone');
//       const order = await Order.findById(orderId);

//       if (tracking && order) {
//         // Update tracking
//         tracking.status = status;
//         tracking.timeline.push({
//           status,
//           timestamp: new Date(),
//           description,
//           completed: true
//         });
//         await tracking.save();

//         // Update order
//         order.status = status;
//         if (status === 'delivered') {
//           order.actualDelivery = new Date();
//         }
//         await order.save();

//         // Broadcast updates
//         this.io.to(`tracking-${orderId}`).emit('status-update', {
//           status,
//           timeline: tracking.timeline,
//           timestamp: new Date(),
//           driver: {
//             name: tracking.driverId?.name,
//             phone: tracking.driverId?.phone
//           }
//         });

//         // Emit to customer
//         this.io.to(`user-${order.userId}`).emit('delivery-status-update', {
//           orderId,
//           orderNumber: order.orderNumber,
//           status,
//           description,
//           timestamp: new Date(),
//           isDelivered: status === 'delivered',
//           isReached: status === 'reached' || status === 'delivered'
//         });

//         console.log(`Order ${orderId} status updated to: ${status}`);
//       }
//     } catch (error) {
//       console.error('Error updating delivery status:', error);
//     }
//   }

//   // Helper method to get default status descriptions
//   getDefaultStatusDescription(status) {
//     const descriptions = {
//       'order_placed': 'Your order has been placed successfully',
//       'payment_confirmed': 'Payment has been confirmed',
//       'preparing': 'Your order is being prepared',
//       'ready_for_pickup': 'Your order is ready for pickup',
//       'assigned': 'A delivery partner has been assigned',
//       'picked_up': 'Your order has been picked up',
//       'out_for_delivery': 'Your order is on the way',
//       'reached': 'Delivery partner has reached your location',
//       'delivered': 'Your order has been delivered successfully',
//       'cancelled': 'Your order has been cancelled'
//     };

//     return descriptions[status] || 'Status updated';
//   }

//   // Get connection statistics
//   getStats() {
//     return {
//       connectedClients: this.io.engine.clientsCount,
//       connectedDrivers: this.connectedDrivers.size,
//       activeTrackingRooms: this.trackingRooms.size
//     };
//   }
// }

// module.exports = SocketService;


const DeliveryTracking = require('../models/DeliveryTracking');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderSocketService = require('./orderSocketService');

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.connectedDrivers = new Map(); // driverId -> socketId

    console.log('Socket service initialized');

    // Initialize order socket service
    this.orderSocketService = new OrderSocketService(io);

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Initialize order socket handlers
    this.orderSocketService.initializeOrderSockets();

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id, 'from origin:', socket.handshake.headers.origin);

      socket.emit('welcome', {
        message: 'Connected to Tastyaana tracking server',
        socketId: socket.id,
        timestamp: new Date()
      });

      // Handle user authentication and joining
      socket.on('user-connect', async (data) => {
        try {
          const { userId } = data;
          if (userId) {
            this.connectedUsers.set(userId, socket.id);
            socket.userId = userId;
            socket.join(`user-${userId}`);
            console.log(`User ${userId} connected and joined room user-${userId}`);
            socket.emit('user-connected', { message: 'Successfully connected', userId });
          }
        } catch (error) {
          console.error('User connection error:', error);
          socket.emit('connection-error', { message: 'Failed to connect user' });
        }
      });

      // Handle driver authentication and joining
      socket.on('driver-connect', async (data) => {
        try {
          const { driverId } = data;
          console.log("Driver connection attempt - data:", data);
          console.log("driverId inside socketService:", driverId);

          // Note: In a real app, you'd verify a token here
          const driver = await User.findById(driverId);
          console.log("Driver found in database:", driver ? {
            _id: driver._id,
            role: driver.role,
            hasDriverProfile: !!driver.driverProfile,
            driverProfileKeys: driver.driverProfile ? Object.keys(driver.driverProfile) : 'None'
          } : 'Not found');

          if (driver && driver.role === 'delivery') {
            this.connectedDrivers.set(driverId, socket.id);
            socket.driverId = driverId;
            socket.join(`driver-${driverId}`);

            // Update driver online status
            if (driver.driverProfile) {
              driver.driverProfile.isOnline = true;
              await driver.save();
            } else {
              // Create driverProfile if it doesn't exist
              driver.driverProfile = {
                isOnline: true,
                currentLocation: {
                  lat: 22.763813,
                  lng: 75.885822,
                  lastUpdated: new Date()
                },
                vehicle: {
                  type: 'bike',
                  number: 'Coming Soon'
                },
                deliveries: 0,
                workingHours: {
                  start: '09:00',
                  end: '22:00'
                }
              };
              await driver.save();
              console.log(`Created missing driverProfile for driver ${driverId}`);
            }

            console.log(`Driver ${driverId} connected successfully. Socket ID: ${socket.id}`);

            // Update any existing DeliveryTracking records for this driver
            try {
              const updatedTracking = await DeliveryTracking.updateMany(
                { driverId: null, status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] } },
                { $set: { driverId: driverId } }
              );
              console.log(`Updated ${updatedTracking.modifiedCount} tracking records with driver ID ${driverId}`);
            } catch (trackingError) {
              console.log(`⚠️ Could not update tracking records:`, trackingError.message);
            }

            socket.emit('driver-connected', {
              message: 'Successfully connected',
              driverId
            });
          } else {
            console.log(`Driver connection failed: role=${driver?.role}, found=${!!driver}`);
            socket.emit('connection-error', {
              message: 'Driver not found or not authorized for delivery',
              details: {
                found: !!driver,
                role: driver?.role,
                driverId
              }
            });
          }
        } catch (error) {
          console.error('Driver connection error:', error);
          socket.emit('connection-error', { message: 'Failed to connect driver', error: error.message });
        }
      });

      // Handle user joining a specific order tracking room
      socket.on('join-tracking', (orderId) => {
        try {
          socket.join(`tracking-${orderId}`);
          console.log(`Client ${socket.id} joined tracking room for order ${orderId}`);

          // Confirm the join operation
          socket.emit('tracking-joined', {
            orderId,
            roomName: `tracking-${orderId}`,
            message: 'Successfully joined tracking room'
          });
        } catch (error) {
          console.error('Error joining tracking room:', error);
          socket.emit('error', { message: 'Failed to join tracking room' });
        }
      });

      // --- GROUP ORDERING EVENTS ---
      socket.on('join_party', (code) => {
        socket.join(code);
        console.log(`Client ${socket.id} joined party room: ${code}`);
      });

      socket.on('leave_party', (code) => {
        socket.leave(code);
        console.log(`Client ${socket.id} left party room: ${code}`);
      });
      // -----------------------------

      // Handle real-time location updates from driver
      socket.on('driver-location-update', async (data) => {
        try {
          const { orderId, lat, lng, heading, speed, accuracy, timestamp, isBackground } = data;
          const driverId = socket.driverId;

          console.log(`📍 Driver location update received:`, {
            socketId: socket.id,
            driverId: driverId,
            orderId: orderId,
            location: { lat, lng, heading, speed, accuracy, timestamp },
            isBackground: isBackground,
            hasDriverId: !!driverId
          });

          if (!driverId) {
            console.log(`❌ Location update rejected: Driver not authenticated. Socket ID: ${socket.id}`);
            return socket.emit('error', { message: 'Driver not authenticated' });
          }

          // Validate coordinates
          if (typeof lat !== 'number' || typeof lng !== 'number' ||
            isNaN(lat) || isNaN(lng) ||
            lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.log(`❌ Invalid coordinates received: lat=${lat}, lng=${lng}`);
            return socket.emit('error', { message: 'Invalid coordinates received' });
          }

          const tracking = await DeliveryTracking.findOne({ orderId }).populate('driverId', 'name phone rating vehicle');
          console.log(`🔍 Delivery tracking found:`, tracking ? {
            orderId: tracking.orderId,
            driverId: tracking.driverId?._id,
            status: tracking.status
          } : 'Not found');

          if (tracking) {
            // Update tracking record with real driver location and ensure driverId is set
            tracking.currentLocation = {
              lat: Number(lat),
              lng: Number(lng),
              heading: heading ? Number(heading) : undefined,
              speed: speed ? Number(speed) : undefined
            };
            tracking.lastLocationUpdate = new Date();

            // Ensure driverId is set in the tracking record
            if (!tracking.driverId) {
              tracking.driverId = driverId;
              console.log(`✅ Set driverId ${driverId} in tracking record for order ${orderId}`);
            }

            // Add location update to timeline if not in background mode
            if (!isBackground) {
              const timelineUpdate = {
                status: "on-the-way",
                timestamp: new Date(),
                description: "Driver is on the way.",
                location: { lat: Number(lat), lng: Number(lng) }
              };

              // Avoid duplicate "on-the-way" status
              const lastStatus = tracking.timeline.length > 0 ? tracking.timeline[tracking.timeline.length - 1] : null;
              if (!lastStatus || lastStatus.status !== "on-the-way") {
                tracking.timeline.push(timelineUpdate);
              }
            }

            await tracking.save();
            console.log(`✅ Tracking record updated successfully for order ${orderId} with location: ${lat}, ${lng}`);

            // Also update driver's current location in User model
            try {
              await User.findByIdAndUpdate(driverId, {
                'driverProfile.currentLocation': {
                  lat: Number(lat),
                  lng: Number(lng),
                  lastUpdated: new Date()
                }
              });
              console.log(`✅ Driver location updated in User model for driver ${driverId}`);
            } catch (userUpdateError) {
              console.error('⚠️ Could not update driver location in User model:', userUpdateError.message);
            }

            // Broadcast location update to all clients tracking this order
            const locationData = {
              orderId,
              driverId,
              location: { lat: Number(lat), lng: Number(lng), heading, speed },
              timestamp: new Date(),
              isBackground: isBackground
            };

            // Emit to tracking room
            this.io.to(`tracking-${orderId}`).emit('location-update', locationData);

            // Emit to driver-specific room
            this.io.to(`driver-${driverId}`).emit('location-update', locationData);

            console.log(`📡 Location update broadcasted for order ${orderId}`);
          } else {
            console.log(`⚠️ No tracking record found for order ${orderId}`);
            socket.emit('error', { message: 'No tracking record found for this order' });
          }
        } catch (error) {
          console.error('Location update error:', error);
          socket.emit('error', { message: 'Failed to update location', error: error.message });
        }
      });

      // Handle heartbeat to keep connections alive
      socket.on('heartbeat', async (data) => {
        try {
          const { driverId, orderId, timestamp, isBackground } = data;

          console.log(`💓 Heartbeat received from driver ${driverId} for order ${orderId}`, {
            isBackground: isBackground,
            timestamp: timestamp
          });

          // Acknowledge heartbeat
          socket.emit('heartbeat-ack', {
            driverId,
            orderId,
            timestamp: new Date().toISOString(),
            received: timestamp
          });

          // If in background mode, send acknowledgment
          if (isBackground) {
            socket.emit('background-mode', {
              message: 'Background mode acknowledged',
              timestamp: new Date().toISOString()
            });
          }

          // Update driver's last activity
          if (driverId) {
            try {
              await User.findByIdAndUpdate(driverId, {
                'driverProfile.lastActivity': new Date(),
                'driverProfile.isOnline': true
              });
            } catch (error) {
              console.log('⚠️ Could not update driver last activity:', error.message);
            }
          }

        } catch (error) {
          console.error('Heartbeat handling error:', error);
        }
      });

      // Handle status updates
      socket.on('status-update', async (data) => {
        try {
          const { orderId, status, description } = data;
          const driverId = socket.driverId;

          if (!driverId) {
            return socket.emit('error', { message: 'Driver not authenticated' });
          }

          const tracking = await DeliveryTracking.findOneAndUpdate(
            { orderId },
            {
              $set: { status },
              $push: {
                timeline: {
                  status,
                  description: description || status,
                  timestamp: new Date()
                }
              }
            },
            { new: true }
          ).populate('driverId', 'name phone');

          if (tracking) {
            await Order.findByIdAndUpdate(orderId, { status });

            const updateData = {
              status,
              timeline: tracking.timeline,
              timestamp: new Date(),
              driver: tracking.driverId
            };

            this.io.to(`tracking-${orderId}`).emit('status-update', updateData);
            console.log(`Status updated for order ${orderId}: ${status}`);
          }
        } catch (error) {
          console.error('Status update error:', error);
          socket.emit('error', { message: 'Failed to update status' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log('Client disconnected:', socket.id);
        if (socket.driverId) {
          await User.findByIdAndUpdate(socket.driverId, {
            'driverProfile.isOnline': false
          });
          this.connectedDrivers.delete(socket.driverId);
          console.log(`Driver ${socket.driverId} disconnected and marked as offline.`);
        }
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          console.log(`User ${socket.userId} disconnected.`);
        }
      });
    });
  }

  // Method to emit driver assignment updates in real-time
  emitDriverAssignment(orderId, driverData, trackingData) {
    console.log(`Emitting driver assignment for order ${orderId}`);

    // Emit to tracking room for this order
    this.io.to(`tracking-${orderId}`).emit('driver-assigned', {
      orderId,
      driver: driverData,
      status: 'assigned',
      timeline: trackingData.timeline,
      driverLocation: trackingData.currentLocation,
      timestamp: new Date()
    });

    // Emit new real-time driver assignment event
    this.io.to(`tracking-${orderId}`).emit('driver-assigned-realtime', {
      orderId,
      driver: driverData,
      status: 'assigned',
      timeline: trackingData.timeline,
      driverLocation: trackingData.currentLocation,
      message: `Driver ${driverData.name} has been assigned to your order`,
      timestamp: new Date()
    });

    // Emit to order-specific room
    this.io.to(`order-${orderId}`).emit('status-update', {
      status: 'assigned',
      driver: driverData,
      timeline: trackingData.timeline,
      timestamp: new Date()
    });
  }

  // Method to emit real-time order updates
  emitOrderUpdate(orderId, updateData) {
    this.io.to(`tracking-${orderId}`).emit('order-update', {
      orderId,
      ...updateData,
      timestamp: new Date()
    });
  }

  // Emit wallet/T-Coins update to a specific user
  emitWalletUpdate(userId, data) {
    if (userId) {
      this.io.to(`user-${userId}`).emit('wallet-update', data);
      console.log(`💰 Wallet update sent to user ${userId}:`, data);
    }
  }

  // Emit generic order update to user
  emitUserOrderUpdate(userId, data) {
    if (userId) {
      this.io.to(`user-${userId}`).emit('order-update', data);
      console.log(`📦 Order update sent to user ${userId}:`, data.status);
    }
  }
}

module.exports = SocketService;