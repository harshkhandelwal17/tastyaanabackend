

// // Driver authentication middleware
// const authenticateDriver = async (req, res, next) => {
//   try {
//     const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
//     console.log("token",req.cookies)
//     console.log("re header",req.headers)
//     if (!token) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Access denied. No token provided.' 
//       });
//     }

//     // Verify JWT token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
    
//     // Get driver from database (excluding password)
//     const driver = await User.findById(decoded.id).select('-password');
    
//     if (!driver) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Invalid token - driver not found.' 
//       });
//     }

//     // Check if driver account is active and role is delivery
//     if (!driver.isActive || driver.role !== 'delivery') {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Account has been deactivated or not authorized for delivery.' 
//       });
//     }

//     // Add driver to request object
//     req.user = { 
//       ...driver.toObject(), 
//       id: driver._id.toString() // Make sure ID is properly set
//     };
//     next();
    
//   } catch (error) {
//     console.error("Driver authentication error:", error.message);
    
//     // Handle specific JWT errors
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Token has expired. Please login again.' 
//       });
//     }
    
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Invalid token format.' 
//       });
//     }
    
//     res.status(401).json({ 
//       success: false,
//       message: 'Authentication failed.' 
//     });
//   }
// };

// // Driver registration
// router.post('/register', async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       phone,
//       password,
//       vehicle
//     } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({
//       $or: [{ email }, { phone }]
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         message: 'User with this email or phone already exists'
//       });
//     }

//     // Create new driver user
//     const driver = new User({
//       name,
//       email,
//       phone,
//       password,
//       role: 'delivery',
//       driverProfile: {
//         isOnline: false,
//         currentLocation: {
//           lat: 22.763813,
//           lng: 75.885822,
//           lastUpdated: new Date()
//         },
//         vehicle: vehicle || {
//           type: 'bike',
//           number: 'Coming Soon'
//         },
//         deliveries: 0,
//         earnings: {
//           today: 0,
//           thisWeek: 0,
//           thisMonth: 0,
//           total: 0
//         }
//       }
//     });

//     await driver.save();

//     res.status(201).json({
//       message: 'Driver registered successfully. You can now login.',
//       driver: {
//         id: driver._id,
//         name: driver.name,
//         email: driver.email,
//         phone: driver.phone,
//         vehicle: driver.driverProfile.vehicle,
//         role: driver.role
//       }
//     });
//   } catch (error) {
//     console.error('Driver registration error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Driver login
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find driver user
//     const driver = await User.findOne({ 
//       email, 
//       role: 'delivery' 
//     }).select('+password');
    
//     if (!driver) {
//       return res.status(401).json({ message: 'Invalid credentials or not authorized for delivery' });
//     }

//     // Check password
//     const isPasswordValid = await driver.comparePassword(password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Update last login
//     driver.lastLogin = new Date();
//     await driver.save();

//     // Generate JWT token for driver
//     const token = jwt.sign(
//       { id: driver._id, role: driver.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '30d' }
//     );

//     // Set cookie
//     res.cookie('token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
//     });

//     res.json({
//       message: 'Login successful',
//       token,
//       user: {
//         _id: driver._id,
//         id: driver._id,
//         name: driver.name,
//         email: driver.email,
//         phone: driver.phone,
//         role: driver.role,
//         vehicle: driver.driverProfile?.vehicle,
//         rating: driver.rating,
//         deliveries: driver.driverProfile?.deliveries || 0,
//         isOnline: driver.driverProfile?.isOnline || false,
//         driverProfile: driver.driverProfile
//       }
//     });
//   } catch (error) {
//     console.error('Driver login error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Get driver profile
// router.get('/profile', authenticateDriver, authorize(['delivery']), async (req, res) => {
//   try {
//     const driver = await User.findById(req.user.id).select('-password');
//     res.json(driver);
//   } catch (error) {
//     console.error('Error fetching driver profile:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Update driver profile
// router.put('/profile', authenticateDriver, authorize(['delivery']), async (req, res) => {
//   try {
//     const updates = req.body;
//     // Remove sensitive fields
//     delete updates.password;
//     delete updates.role;
    
//     const driver = await User.findByIdAndUpdate(
//       req.user.id,
//       updates,
//       { new: true, runValidators: true }
//     ).select('-password');

//     res.json({
//       message: 'Profile updated successfully',
//       driver
//     });
//   } catch (error) {
//     console.error('Error updating driver profile:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Toggle online status
// router.put('/toggle-online', authenticateDriver, authorize(['delivery']), async (req, res) => {
//   try {
//     const driver = await User.findById(req.user.id);
    
//     // Toggle online status in driverProfile
//     driver.driverProfile.isOnline = !driver.driverProfile.isOnline;
//     await driver.save();

//     res.json({
//       message: `Driver is now ${driver.driverProfile.isOnline ? 'online' : 'offline'}`,
//       isOnline: driver.driverProfile.isOnline
//     });
//   } catch (error) {
//     console.error('Error toggling online status:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Update driver location
// router.put('/location', authenticateDriver, authorize(['delivery']), async (req, res) => {
//   try {
//     const { lat, lng } = req.body;
//     const driver = await User.findById(req.user.id);
    
//     // Update location in driverProfile
//     driver.driverProfile.currentLocation = {
//       lat,
//       lng,
//       lastUpdated: new Date()
//     };
//     await driver.save();

//     res.json({
//       message: 'Location updated successfully',
//       location: { lat, lng }
//     });
//   } catch (error) {
//     console.error('Error updating driver location:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Get driver's assigned orders/deliveries
// router.get('/orders', authenticateDriver, authorize(['delivery']), async (req, res) => {
//   try {
//     // Get orders assigned to this driver from Order schema
//     const orders = await Order.find({
//       deliveryPartner: req.user.id,
//       status: { $in: ['confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery','out-for-delivery','picked-up'] }
//     })
//     .populate('userId', 'name email phone')
//     .populate('deliveryPartner', 'name phone rating driverProfile')
//     .sort({ createdAt: -1 });

//     // Transform to match expected format
//     const formattedOrders = orders.map(order => ({
//       _id: order._id,
//       orderId: order._id,
//       orderNumber: order.orderNumber,
//       status: order.status,
//       totalAmount: order.totalAmount,
//       items: order.items,
//       deliveryAddress: order.deliveryAddress,
//       specialInstructions: order.instructions || order.specialInstructions,
//       customerName: order.userId?.name,
//       customerPhone: order.userContactNo || order.userId?.phone,
//       estimatedDeliveryTime: order.estimatedDelivery,
//       createdAt: order.createdAt,
//       paymentMethod: order.paymentMethod
//     }));

//     res.json(formattedOrders);
//   } catch (error) {
//     console.error('Error fetching driver orders:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Get driver's assigned deliveries (legacy endpoint)
// router.get('/deliveries', authenticateDriver, authorize(['driver','delivery']), async (req, res) => {
//   try {
//     const deliveries = await DeliveryTracking.find({
//       driverId: req.user.id,
//       status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] }
//     })
//     .populate('orderId', 'totalAmount items deliveryAddress specialInstructions')
//     .sort({ createdAt: -1 });

//     res.json(deliveries);
//   } catch (error) {
//     console.error('Error fetching driver deliveries:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Get driver's delivery history
// router.get('/delivery-history', authenticateDriver, authorize(['driver','delivery']), async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
    
//     const deliveries = await DeliveryTracking.find({
//       driverId: req.user.id,
//       status: 'delivered'
//     })
//     .populate('orderId', 'totalAmount createdAt')
//     .sort({ actualDeliveryTime: -1 })
//     .limit(limit * 1)
//     .skip((page - 1) * limit);

//     const total = await DeliveryTracking.countDocuments({
//       driverId: req.user.id,
//       status: 'delivered'
//     });

//     res.json({
//       deliveries,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (error) {
//     console.error('Error fetching delivery history:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Get driver earnings
// router.get('/earnings', authenticateDriver, authorize(['driver','delivery']), async (req, res) => {
//   try {
//     const driver = await Driver.findById(req.user.id);
//     res.json(driver.earnings);
//   } catch (error) {
//     console.error('Error fetching driver earnings:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });



// // Admin routes for driver management
// router.get('/all', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
//   try {
//     const { page = 1, limit = 10, status } = req.query;
    
//     let query = {};
//     if (status) {
//       query.isActive = status === 'active';
//     }

//     const drivers = await Driver.find(query)  
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Driver.countDocuments(query);

//     res.json({
//       drivers,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (error) {
//     console.error('Error fetching drivers:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Get available drivers for assignment
// router.get('/available', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
//   try {
//     const drivers = await Driver.getAvailableDrivers();
//     res.json(drivers);
//   } catch (error) {
//     console.error('Error fetching available drivers:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// // Import delivery partner controller
// const deliveryPartnerController = require('../controllers/deliveryPartnerController');

// // Delivery partner specialization routes
// router.put('/:driverId/specialization', authenticate, deliveryPartnerController.updateDeliveryPartnerSpecialization);
// router.get('/available-for-category', authenticate, authorize(['admin']), deliveryPartnerController.getAvailablePartnersForCategory);
// //router.post('/auto-assign/:orderId', authenticate, authorize(['admin']), deliveryPartnerController.autoAssignDeliveryPartner);
// router.get('/delivery-stats', authenticate, authorize(['admin']), deliveryPartnerController.getDeliveryStatsByCategory);

// // Updated delivery routes
// router.get('/dashboard', authenticateDriver, authorize(['driver','delivery']), getDriverDashboard);
// router.put('/toggle-online-status', authenticateDriver, authorize(['driver']), toggleDriverOnlineStatus);

// // Normal order assignment (first come, first served)
// router.post('/accept-order/:orderId', authenticateDriver, authorize(['driver', 'delivery']), async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const driverId = req.user.id;
    
//     const { assignOrderToDriver } = require('../utils/driverNotificationService');
//     const result = await assignOrderToDriver(orderId, driverId);
    
//     if (result.success) {
//       res.json({
//         success: true,
//         message: 'Order accepted successfully',
//         data: {
//           orderId,
//           orderNumber: result.order.orderNumber,
//           assignedAt: result.order.assignedAt
//         }
//       });
//     } else {
//       res.status(400).json({
//         success: false,
//         message: result.message
//       });
//     }
//   } catch (error) {
//     console.error('Error accepting order:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error' 
//     });
//   }
// });

// // Get available orders for drivers (first come, first served)
// router.get('/available-orders', authenticateDriver, authorize(['driver', 'delivery']), async (req, res) => {
//   try {
//     const driverId = req.user.id;
    
//     // Get orders that are not assigned to any driver and within 25-minute window
//     const availableOrders = await Order.find({
//       assignedDriver: null,
//       status: { $in: ['pending', 'confirmed'] },
//       type: { $ne: 'gkk' }, // Exclude subscription orders
//       preparationDeadline: { $gt: new Date() } // Only orders still within deadline
//     }).populate('userId', 'name phone')
//       .select('orderNumber items totalAmount deliveryAddress preparationDeadline createdAt')
//       .sort({ createdAt: 1 }) // First come, first served
//       .limit(20);

//     const formattedOrders = availableOrders.map(order => {
//       const countdownInfo = order.getCountdownInfo();
//       return {
//         id: order._id,
//         orderNumber: order.orderNumber,
//         items: order.items.map(item => `${item.name} x ${item.quantity}`).join(', '),
//         totalAmount: order.totalAmount,
//         customerName: order.userId?.name,
//         customerPhone: order.userId?.phone,
//         deliveryAddress: order.deliveryAddress,
//         countdown: countdownInfo,
//         createdAt: order.createdAt
//       };
//     });

//     res.json({
//       success: true,
//       data: {
//         orders: formattedOrders,
//         count: formattedOrders.length
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching available orders:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Internal server error' 
//     });
//   }
// });

// // Assignment acceptance/rejection
// router.post('/accept-assignment/:orderId', authenticateDriver, authorize(['driver']), async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const driverId = req.user.id;
    
//     // Find tracking record
//     const tracking = await DeliveryTracking.findOne({ orderId });
//     if (!tracking) {
//       return res.status(404).json({ message: 'Order not found' });
//     }
    
//     // Check if driver is assigned to this order
//     if (tracking.driverId?.toString() !== driverId) {
//       return res.status(403).json({ message: 'You are not assigned to this order' });
//     }
    
//     // Update status to accepted
//     tracking.status = 'preparing';
//     tracking.timeline.push({
//       status: 'preparing',
//       timestamp: new Date(),
//       description: 'Driver accepted the assignment and order is being prepared',
//       completed: true
//     });
    
//     await tracking.save();
    
//     res.json({ 
//       message: 'Assignment accepted successfully',
//       orderId,
//       status: tracking.status
//     });
//   } catch (error) {
//     console.error('Error accepting assignment:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// router.post('/reject-assignment/:orderId', authenticateDriver, authorize(['driver']), async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const driverId = req.user.id;
//     const { reason } = req.body;
    
//     // Find tracking record
//     const tracking = await DeliveryTracking.findOne({ orderId });
//     if (!tracking) {
//       return res.status(404).json({ message: 'Order not found' });
//     }
    
//     // Check if driver is assigned to this order
//     if (tracking.driverId?.toString() !== driverId) {
//       return res.status(403).json({ message: 'You are not assigned to this order' });
//     }
    
//     // Reset assignment
//     tracking.driverId = null;
//     tracking.status = 'order_placed';
//     tracking.timeline.push({
//       status: 'order_placed',
//       timestamp: new Date(),
//       description: `Driver rejected assignment${reason ? ': ' + reason : ''}. Finding new driver...`,
//       completed: false
//     });
    
//     await tracking.save();
    
//     // Try to reassign to another driver
//     const { autoAssignDriver } = require('../controllers/deliveryTrackingController');
//     setTimeout(() => {
//       autoAssignDriver(orderId);
//     }, 2000); // 2 second delay
    
//     res.json({ 
//       message: 'Assignment rejected. Finding new driver...',
//       orderId
//     });
//   } catch (error) {
//     console.error('Error rejecting assignment:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
// const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DeliveryTracking = require('../models/DeliveryTracking');
const Order = require('../models/Order');
const { authenticate, authorize } = require('../middlewares/auth');
const { getDriverDashboard, toggleDriverOnlineStatus } = require('../controllers/deliveryPartnerController');
const { 
  getDriverDeliveryList,
  updateDeliveryStatus,
  bulkUpdateDeliveryStatus,
  getDriverStats,
  getOptimizedRoute
} = require('../controllers/driverController');
const { getDriverDailyDeliveries, updateDynamicDeliveryStatus } = require('../controllers/driverDailyDeliveriesController');

// Add the new driver routes
router.use('/delivery', require('../routes/driverRoutes'));
// Driver authentication middleware
const authenticateDriver = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
    console.log("token",req.cookies)
    console.log("re header",req.headers)
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
    
    // Get driver from database (excluding password)
    const driver = await User.findById(decoded.id).select('-password');
    
    if (!driver) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token - driver not found.' 
      });
    }

    // Check if driver account is active and role is delivery
    if (!driver.isActive || driver.role !== 'delivery') {
      return res.status(403).json({ 
        success: false,
        message: 'Account has been deactivated or not authorized for delivery.' 
      });
    }

    // Add driver to request object
    req.user = { 
      ...driver.toObject(), 
      id: driver._id.toString() // Make sure ID is properly set
    };
    next();
    
  } catch (error) {
    console.error("Driver authentication error:", error.message);
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired. Please login again.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format.' 
      });
    }
    
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed.' 
    });
  }
};

// Driver registration
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      vehicle
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or phone already exists'
      });
    }

    // Create new driver user
    const driver = new User({
      name,
      email,
      phone,
      password,
      role: 'delivery',
      driverProfile: {
        isOnline: false,
        currentLocation: {
          lat: 22.763813,
          lng: 75.885822,
          lastUpdated: new Date()
        },
        vehicle: vehicle || {
          type: 'bike',
          number: 'Coming Soon'
        },
        deliveries: 0,
        earnings: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          total: 0
        }
      }
    });

    await driver.save();

    res.status(201).json({
      message: 'Driver registered successfully. You can now login.',
      driver: {
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicle: driver.driverProfile.vehicle,
        role: driver.role
      }
    });
  } catch (error) {
    console.error('Driver registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Driver login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find driver user
    const driver = await User.findOne({ 
      email, 
      role: 'delivery' 
    }).select('+password');
    
    if (!driver) {
      return res.status(401).json({ message: 'Invalid credentials or not authorized for delivery' });
    }

    // Check password
    const isPasswordValid = await driver.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    driver.lastLogin = new Date();
    await driver.save();

    // Generate JWT token for driver
    const token = jwt.sign(
      { id: driver._id, role: driver.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: driver._id,
        id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: driver.role,
        vehicle: driver.driverProfile?.vehicle,
        rating: driver.rating,
        deliveries: driver.driverProfile?.deliveries || 0,
        isOnline: driver.driverProfile?.isOnline || false,
        driverProfile: driver.driverProfile
      }
    });
  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get driver profile
router.get('/profile', authenticateDriver, authorize(['delivery']), async (req, res) => {
  try {
    const driver = await User.findById(req.user.id).select('-password');
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update driver profile
router.put('/profile', authenticateDriver, authorize(['delivery']), async (req, res) => {
  try {
    const updates = req.body;
    // Remove sensitive fields
    delete updates.password;
    delete updates.role;
    
    const driver = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      driver
    });
  } catch (error) {
    console.error('Error updating driver profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle online status
router.put('/toggle-online', authenticateDriver, authorize(['delivery']), async (req, res) => {
  try {
    const driver = await User.findById(req.user.id);
    
    // Toggle online status in driverProfile
    driver.driverProfile.isOnline = !driver.driverProfile.isOnline;
    await driver.save();

    res.json({
      message: `Driver is now ${driver.driverProfile.isOnline ? 'online' : 'offline'}`,
      isOnline: driver.driverProfile.isOnline
    });
  } catch (error) {
    console.error('Error toggling online status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update driver location
router.put('/location', authenticateDriver, authorize(['delivery']), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const driver = await User.findById(req.user.id);
    
    // Update location in driverProfile
    driver.driverProfile.currentLocation = {
      lat,
      lng,
      lastUpdated: new Date()
    };
    await driver.save();

    res.json({
      message: 'Location updated successfully',
      location: { lat, lng }
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get driver's assigned orders/deliveries
// router.get('/orders', authenticateDriver, authorize(['delivery']), async (req, res) => {
//   try {
//     // Get orders assigned to this driver from Order schema
//     const orders = await Order.find({
//       deliveryPartner: req.user.id,
//       status: { $in: ['confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery','out-for-delivery','picked-up'] }
//     })
//     .populate('userId', 'name email phone')
//     .populate('deliveryPartner', 'name phone rating driverProfile')
//     .sort({ createdAt: -1 });

//     // Transform to match expected format
//     const formattedOrders = orders.map(order => ({
//       _id: order._id,
//       orderId: order._id,
//       orderNumber: order.orderNumber,
//       status: order.status,
//       totalAmount: order.totalAmount,
//       items: order.items,
//       deliveryAddress: order.deliveryAddress,
//       specialInstructions: order.instructions || order.specialInstructions,
//       customerName: order.userId?.name,
//       customerPhone: order.userContactNo || order.userId?.phone,
//       estimatedDeliveryTime: order.estimatedDelivery,
//       createdAt: order.createdAt,
//       paymentMethod: order.paymentMethod
//     }));




//     res.json(formattedOrders);
//   } catch (error) {
//     console.error('Error fetching driver orders:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });

// Get driver's assigned orders/deliveries
router.get('/orders', authenticateDriver, authorize(['delivery']), async (req, res) => {
  try {
    // Get normal orders assigned to this driver from Order schema
    const normalOrders = await Order.find({
      deliveryPartner: req.user.id,
      status: { $in: ['confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery','out-for-delivery','picked-up','pending'] }
    })
    .populate('userId', 'name email phone')
    .populate('deliveryPartner', 'name phone rating driverProfile')
    .sort({ createdAt: -1 });

    // Get subscription orders assigned to this driver from DailyOrder schema
    const DailyOrder = require('../models/DailyOrder');
    const subscriptionOrders = await DailyOrder.find({
      deliveryPartner: req.user.id,
      status: { $in: ['confirmed', 'preparing', 'ready_for_pickup', 'assigned', 'picked_up', 'delivered','pending'] }
    })
    .populate('userId', 'name email phone')
    .populate('subscriptionId', 'subscriptionId planType')
    .populate({
      path: 'subscriptionId',
      populate: {
        path: 'mealPlan',
        select: 'title'
      }
    })
    .sort({ createdAt: -1 });

    // Transform normal orders to match expected format
    const formattedNormalOrders = normalOrders.map(order => ({
      _id: order._id,
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items,
      deliveryAddress: order.deliveryAddress,
      specialInstructions: order.instructions || order.specialInstructions,
      customerName: order.userId?.name,
      customerPhone: order.userContactNo || order.userId?.phone,
      estimatedDeliveryTime: order.estimatedDelivery,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      type: 'normal'
    }));
    
    // Transform subscription orders to match expected format
    const formattedSubscriptionOrders = subscriptionOrders.map(order => {
      console.log("name of order ",order)
      const date = new Date(order.preparationTime)
      return {
      _id: order._id,
      orderId: order._id,
      orderNumber: order.subscriptionId?.subscriptionId || `SUB-${order._id}`,
      status: order.status,
      totalAmount: 0, // Subscription orders don't have total amount
      items: [{
        name: order.subscriptionId?.mealPlan?.title || 'Tiffin Service',
        quantity: 1,
        unit: 'meal'
      }],
      deliveryAddress: order.deliveryAddress,
      specialInstructions: order.customerNotes,
      customerName: order.userId?.name,
      customerPhone: order.userId?.phone,
      estimatedDeliveryTime: date.toLocaleString(),
      createdAt: order.createdAt,
      paymentMethod: 'subscription',
      type: 'subscription',
      shift: order.shift,
      subscriptionId: order.subscriptionId?.subscriptionId
    }});

    // Combine and sort all orders
    const allOrders = [...formattedNormalOrders, ...formattedSubscriptionOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 console.log("all orders",allOrders)
    res.json(allOrders);
  } catch (error) {
    console.error('Error fetching driver orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// router.get('/subscription/orders',authenticateDriver, authorize(['driver','delivery','admin']) , async (req,res) => {
//    const subscription_orders = await dailyOrders.find({
//       deliveryPartner: req.user.id,
//       status: { $in: ['confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery','out-for-delivery','picked-up'] }
//    })

//     const formattedOrders = subscription_orders.map(order => ({
//       _id: order._id,
//       orderId: order._id,
//       orderNumber: order.orderNumber,
//       status: order.status,
//       totalAmount: order.totalAmount,
//       items: order.items,
//       deliveryAddress: order.deliveryAddress,
//       specialInstructions: order.instructions || order.specialInstructions,
//       customerName: order.userId?.name,
//       customerPhone: order.userContactNo || order.userId?.phone,
//       estimatedDeliveryTime: order.estimatedDelivery,
//       createdAt: order.createdAt,
//       paymentMethod: order.paymentMethod
//     }));


// });

// Get driver's assigned deliveries (legacy endpoint)
router.get('/deliveries', authenticateDriver, authorize(['driver','delivery']), async (req, res) => {
  try {
    const deliveries = await DeliveryTracking.find({
      driverId: req.user.id,
      status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] }
    })
    .populate('orderId', 'totalAmount items deliveryAddress specialInstructions')
    .sort({ createdAt: -1 });

    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching driver deliveries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all daily deliveries for driver dashboard (similar to admin daily meals)
router.get('/daily-deliveries', authenticate, authorize(['admin', 'driver', 'delivery']), getDriverDailyDeliveries);

// Update delivery status for dynamic delivery IDs
router.put('/delivery/:deliveryId/status', authenticate, authorize(['admin', 'driver', 'delivery']), updateDynamicDeliveryStatus);

// Get driver's delivery history
router.get('/delivery-history', authenticateDriver, authorize(['driver','delivery']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const deliveries = await DeliveryTracking.find({
      driverId: req.user.id,
      status: 'delivered'
    })
    .populate('orderId', 'totalAmount createdAt')
    .sort({ actualDeliveryTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await DeliveryTracking.countDocuments({
      driverId: req.user.id,
      status: 'delivered'
    });

    res.json({
      deliveries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching delivery history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get driver earnings
router.get('/earnings', authenticateDriver, authorize(['driver','delivery']), async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id);
    res.json(driver.earnings);
  } catch (error) {
    console.error('Error fetching driver earnings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Admin routes for driver management
router.get('/all', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = {};
    if (status) {
      query.isActive = status === 'active';
    }

    const drivers = await Driver.find(query)  
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Driver.countDocuments(query);

    res.json({
      drivers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available drivers for assignment
router.get('/available', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const drivers = await Driver.getAvailableDrivers();
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Import delivery partner controller
const deliveryPartnerController = require('../controllers/deliveryPartnerController');

// Delivery partner specialization routes
router.put('/:driverId/specialization', authenticate, deliveryPartnerController.updateDeliveryPartnerSpecialization);
router.get('/available-for-category', authenticate, authorize(['admin']), deliveryPartnerController.getAvailablePartnersForCategory);
//router.post('/auto-assign/:orderId', authenticate, authorize(['admin']), deliveryPartnerController.autoAssignDeliveryPartner);
router.get('/delivery-stats', authenticate, authorize(['admin']), deliveryPartnerController.getDeliveryStatsByCategory);

// Updated delivery routes
router.get('/dashboard', authenticateDriver, authorize(['driver','delivery']), getDriverDashboard);
router.put('/toggle-online-status', authenticateDriver, authorize(['driver']), toggleDriverOnlineStatus);

// Normal order assignment (first come, first served)
router.post('/accept-order/:orderId', authenticateDriver, authorize(['driver', 'delivery']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.id;
    
    const { assignOrderToDriver } = require('../utils/driverNotificationService');
    const result = await assignOrderToDriver(orderId, driverId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Order accepted successfully',
        data: {
          orderId,
          orderNumber: result.order.orderNumber,
          assignedAt: result.order.assignedAt
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Subscription order assignment (first come, first served)
router.post('/accept-subscription-order/:orderId', authenticateDriver, authorize(['driver', 'delivery']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.id || req.user?._id; 
    
    const DailyOrder = require('../models/DailyOrder');
    const { DailySubscriptionOrderService }  = require('../jobs/dailySubscriptionOrders');
    
    // Use the existing assignment logic from DailySubscriptionOrderService
    const result = await DailySubscriptionOrderService.assignOrderToDriver(orderId, driverId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Subscription order accepted successfully',
        data: {
          orderId,
          assignedAt: result.order.assignedAt
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error accepting subscription order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get available orders for drivers (first come, first served)
router.get('/available-orders', authenticateDriver, authorize(['driver', 'delivery']), async (req, res) => {
  try {
    const driverId = req.user.id;
    const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    // Get orders that are not assigned to any driver and within 25-minute window
    const availableOrders = await Order.find({
      deliveryPartner: null,
      status: { $in: ['pending', 'confirmed','prepared','out-for-delivery','ready','placed','out_for_delivery',] },
      // type: { $ne: 'gkk' }, // Exclude subscription orders
      // Don't filter by deadline - show all available orders
       orderDate: { $gte: twoDaysAgo }
    }).populate('userId', 'name phone')
      .select('orderNumber items totalAmount deliveryAddress preparationDeadline createdAt customer ')
      .sort({ createdAt: 1 }) // First come, first served
      .limit(30);

    const formattedOrders = availableOrders.map(order => {
      const countdownInfo = order.preparationDeadline ? order.getCountdownInfo() : null;
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        items: order.items || [],
        totalAmount: order.totalAmount,
        customer: {
          name: order.userId?.name || order.customer?.name,
          phone: order.userId?.phone || order.customer?.phone
        },
        deliveryAddress: order.deliveryAddress,
        countdownInfo,
        preparationDeadline: order.preparationDeadline,
        createdAt: order.createdAt,
        status: order.status
      };
    });

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching available orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get available subscription orders for drivers
router.get('/available-subscription-orders', authenticateDriver, authorize(['driver', 'delivery']), async (req, res) => {
  try {
    const DailyOrder = require('../models/DailyOrder');
    const moment = require('moment-timezone');
    
    const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
    const tomorrow = moment().tz('Asia/Kolkata').startOf('day').add(1, 'day').toDate();
    
    // Get today's subscription orders that are not assigned to any driver
    const availableOrders = await DailyOrder.find({
      deliveryPartner: null,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready_for_pickup'] },
      orderType: 'subscription'
    }).populate([
      { 
        path: 'subscriptionId', 
        select: 'subscriptionId planType',
        populate: {
          path: 'mealPlan',
          select: 'title'
        }
      },
      { path: 'userId', select: 'name phone' }
    ]).sort({ preparationTime: 1 })
      .limit(20);

    const formattedOrders = availableOrders.map(order => ({
      _id: order._id,
      subscriptionId: order.subscriptionId?.subscriptionId,
      planType: order.subscriptionId?.mealPlan?.title || order.planType,
      itemForToday: order.subscriptionId?.mealPlan?.title,
      date: order.date,
      shift: order.shift,
      preparationTime: order.preparationTime,
      status: order.status,
      handoverFlag: order.isDelayed ? 'delay' : null,
      customerInfo: {
        name: order.userId?.name,
        phone: order.userId?.phone
      },
      delayInfo: order.isDelayed ? {
        delayedAt: order.delayedAt,
        delayReason: order.delayReason,
        penaltyAmount: order.penaltyAmount
      } : null
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Error fetching available subscription orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Assignment acceptance/rejection
router.post('/accept-assignment/:orderId', authenticateDriver, authorize(['driver']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.id;
    
    // Find tracking record
    const tracking = await DeliveryTracking.findOne({ orderId });
    if (!tracking) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if driver is assigned to this order
    if (tracking.driverId?.toString() !== driverId) {
      return res.status(403).json({ message: 'You are not assigned to this order' });
    }
    
    // Update status to accepted
    tracking.status = 'preparing';
    tracking.timeline.push({
      status: 'preparing',
      timestamp: new Date(),
      description: 'Driver accepted the assignment and order is being prepared',
      completed: true
    });
    
    await tracking.save();
    
    res.json({ 
      message: 'Assignment accepted successfully',
      orderId,
      status: tracking.status
    });
  } catch (error) {
    console.error('Error accepting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/reject-assignment/:orderId', authenticateDriver, authorize(['driver']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.user.id;
    const { reason } = req.body;
    
    // Find tracking record
    const tracking = await DeliveryTracking.findOne({ orderId });
    if (!tracking) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if driver is assigned to this order
    if (tracking.driverId?.toString() !== driverId) {
      return res.status(403).json({ message: 'You are not assigned to this order' });
    }
    
    // Reset assignment
    tracking.driverId = null;
    tracking.status = 'order_placed';
    tracking.timeline.push({
      status: 'order_placed',
      timestamp: new Date(),
      description: `Driver rejected assignment${reason ? ': ' + reason : ''}. Finding new driver...`,
      completed: false
    });
    
    await tracking.save();
    
    // Try to reassign to another driver
    const { autoAssignDriver } = require('../controllers/deliveryTrackingController');
    setTimeout(() => {
      autoAssignDriver(orderId);
    }, 2000); // 2 second delay
    
    res.json({ 
      message: 'Assignment rejected. Finding new driver...',
      orderId
    });
  } catch (error) {
    console.error('Error rejecting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status - handles both subscription and normal orders
router.put('/orders/:orderId/status', authenticateDriver, authorize(['driver', 'delivery']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, description } = req.body;
    const driverId = req.user.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // First try to find it as a subscription order (DailyOrder)
    const DailyOrder = require('../models/DailyOrder');
    let subscriptionOrder = await DailyOrder.findOne({
      _id: orderId,
      deliveryPartner: driverId
    });

    if (subscriptionOrder) {
      // Update subscription order status
      await subscriptionOrder.updateOrderStatus(status, description);
      
      return res.json({
        success: true,
        message: 'Subscription order status updated successfully',
        data: {
          orderId: subscriptionOrder._id,
          status: subscriptionOrder.status,
          type: 'subscription'
        }
      });
    }

    // If not found as subscription, try as normal order
    const Order = require('../models/Order');
    const DeliveryTracking = require('../models/DeliveryTracking');
    
    let normalOrder = await Order.findOne({
      _id: orderId,
      deliveryPartner: driverId
    });

    if (normalOrder) {
      // Update both Order and DeliveryTracking for normal orders
      
      // Update Order status
      normalOrder.status = status;
      if (status === 'delivered') {
        normalOrder.deliveredAt = new Date();
      }
      await normalOrder.save();

      // Update or create DeliveryTracking
      let tracking = await DeliveryTracking.findOne({ orderId: orderId });
      
      if (tracking) {
        tracking.status = status;
        tracking.timeline.push({
          status,
          timestamp: new Date(),
          description: description || `Order status updated to ${status}`,
          completed: ['delivered', 'cancelled'].includes(status)
        });
        await tracking.save();
      } else {
        // Create new tracking if it doesn't exist
        tracking = new DeliveryTracking({
          orderId: orderId,
          driverId: driverId,
          status,
          timeline: [{
            status,
            timestamp: new Date(),
            description: description || `Order status updated to ${status}`,
            completed: ['delivered', 'cancelled'].includes(status)
          }]
        });
        await tracking.save();
      }

      return res.json({
        success: true,
        message: 'Normal order status updated successfully',
        data: {
          orderId: normalOrder._id,
          status: normalOrder.status,
          type: 'normal'
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Order not found or not assigned to this driver'
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update payment status - only for normal orders
router.put('/orders/:orderId/payment-status', authenticateDriver, authorize(['driver', 'delivery']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, description } = req.body;
    const driverId = req.user.id;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }

    // Only handle normal orders for payment status updates
    const Order = require('../models/Order');
    
    let normalOrder = await Order.findOne({
      _id: orderId,
      deliveryPartner: driverId
    });

    if (!normalOrder) {
      return res.status(404).json({
        success: false,
        message: 'Normal order not found or not assigned to this driver'
      });
    }

    // Update payment status
    normalOrder.paymentStatus = paymentStatus;
    await normalOrder.save();

    return res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        orderId: normalOrder._id,
        paymentStatus: normalOrder.paymentStatus
      }
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


module.exports = router;
