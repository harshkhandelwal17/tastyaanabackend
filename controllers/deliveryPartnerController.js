const Driver = require('../models/Driver');
const Order = require('../models/Order');
const DeliveryTracking = require('../models/DeliveryTracking');

const User = require('../models/User')

// Dynamic delivery partner categories
const DELIVERY_CATEGORIES = {
  'food': {
    name: 'Food Zone',
    description: 'Handles food orders and meal deliveries',
    priority: 1
  },
  'vegetable': {
    name: 'Grocery & Vegetables',
    description: 'Fresh vegetables and grocery items',
    priority: 2
  },
  'sweets': {
    name: 'Sweets & Desserts',
    description: 'Traditional sweets and desserts',
    priority: 3
  },
  'stationary': {
    name: 'Stationery & Books',
    description: 'Books, stationery, and educational items',
    priority: 4
  },
  'general': {
    name: 'General Items',
    description: 'Miscellaneous products and items',
    priority: 5
  }
};

// Create or update delivery partner specialization
const updateDeliveryPartnerSpecialization = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { categories, serviceAreas } = req.body;

    if (req.user.role !== 'admin' && req.user.id !== driverId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update driver specialization
    driver.specialization = {
      categories: categories || ['general'],
      serviceAreas: serviceAreas || driver.serviceAreas || []
    };

    await driver.save();

    res.json({
      message: 'Driver specialization updated successfully',
      specialization: driver.specialization
    });
  } catch (error) {
    console.error('Error updating driver specialization:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get available delivery partners for specific category
const getAvailablePartnersForCategory = async (req, res) => {
  try {
    const { category, lat, lng, radius = 10 } = req.query;

    let query = {
      isActive: true,
      isOnline: true,
      emailVerified: true
    };

    // Add category filter if specified
    if (category && category !== 'all') {
      query['specialization.categories'] = { $in: [category, 'general'] };
    }

    let drivers;
    if (lat && lng) {
      // Find nearby drivers
      drivers = await Driver.find(query).then(allDrivers => {
        return allDrivers.filter(driver => {
          if (!driver.currentLocation?.lat || !driver.currentLocation?.lng) {
            return false;
          }
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            driver.currentLocation.lat,
            driver.currentLocation.lng
          );
          return distance <= parseFloat(radius);
        });
      });
    } else {
      drivers = await Driver.find(query);
    }

    // Sort by rating and delivery count
    drivers.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.deliveries - a.deliveries;
    });

    res.json({
      category: DELIVERY_CATEGORIES[category] || { name: 'All Categories' },
      availableDrivers: drivers.map(driver => ({
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        rating: driver.rating,
        deliveries: driver.deliveries,
        vehicle: driver.vehicle,
        currentLocation: driver.currentLocation,
        specialization: driver.specialization,
        distance: lat && lng && driver.currentLocation?.lat && driver.currentLocation?.lng
          ? calculateDistance(parseFloat(lat), parseFloat(lng), driver.currentLocation.lat, driver.currentLocation.lng).toFixed(2)
          : null
      }))
    });
  } catch (error) {
    console.error('Error fetching available partners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Auto-assign delivery partner based on order category
const autoAssignDeliveryPartner = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { forceCategory } = req.body;

    // Get order details
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Determine order category based on items
    let orderCategory = forceCategory || determineOrderCategory(order.items);

    // Find or create delivery tracking
    let tracking = await DeliveryTracking.findOne({ orderId: order._id.toString() });
    if (!tracking) {
      tracking = new DeliveryTracking({
        orderId: order._id.toString(),
        status: 'order_placed',
        timeline: [{
          status: 'order_placed',
          timestamp: order.createdAt,
          description: 'Order has been placed successfully',
          completed: true
        }],
        deliveryAddress: order.deliveryAddress
      });
    }

    // Find best available driver
    const bestDriver = await findBestDriverForOrder(order, orderCategory);

    if (!bestDriver) {
      return res.status(404).json({
        message: 'No available delivery partners found for this order',
        category: orderCategory,
        suggestion: 'Please try again later or contact support'
      });
    }

    // Assign driver
    tracking.driverId = bestDriver._id;
    tracking.status = 'assigned';
    tracking.assignedCategory = orderCategory;

    // Add timeline entry
    tracking.timeline.push({
      status: 'assigned',
      timestamp: new Date(),
      description: `${DELIVERY_CATEGORIES[orderCategory]?.name || 'Delivery'} partner ${bestDriver.name} has been assigned`,
      completed: true
    });

    await tracking.save();

    // Update order status
    order.status = 'confirmed';
    order.deliveryPartner = bestDriver._id;
    await order.save();

    // Emit real-time updates to all relevant parties
    const socketService = req.app.get('socketService');
    if (socketService) {
      // Emit to tracking room for this order
      socketService.emitDriverAssignment(orderId, {
        id: bestDriver._id,
        name: bestDriver.name,
        phone: bestDriver.phone,
        rating: bestDriver.rating,
        vehicle: bestDriver.vehicle,
        profileImage: bestDriver.profileImage,
        currentLocation: bestDriver.currentLocation
      }, tracking);

      // Emit to user-specific room (immediate notification to user)
      socketService.io.to(`user-${order.userId}`).emit('driver-assigned-realtime', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        driver: {
          id: bestDriver._id,
          name: bestDriver.name,
          phone: bestDriver.phone,
          rating: bestDriver.rating,
          vehicle: bestDriver.vehicle,
          currentLocation: bestDriver.currentLocation
        },
        status: 'assigned',
        timeline: tracking.timeline,
        message: `Driver ${bestDriver.name} has been assigned to your order`,
        timestamp: new Date()
      });

      // Also emit to tracking room
      socketService.io.to(`tracking-${orderId}`).emit('driver-assigned-realtime', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        driver: {
          id: bestDriver._id,
          name: bestDriver.name,
          phone: bestDriver.phone,
          rating: bestDriver.rating,
          vehicle: bestDriver.vehicle,
          currentLocation: bestDriver.currentLocation
        },
        status: 'assigned',
        timeline: tracking.timeline,
        message: `Driver ${bestDriver.name} has been assigned`,
        timestamp: new Date()
      });

      // Emit to order socket service for broader notifications
      if (socketService.orderSocketService) {
        socketService.orderSocketService.emitDriverAssignmentNotification({
          ...order.toObject(),
          deliveryPartner: {
            _id: bestDriver._id,
            name: bestDriver.name,
            phone: bestDriver.phone,
            rating: bestDriver.rating,
            vehicle: bestDriver.vehicle
          }
        });
      }
    }

    // Notify driver
    if (socketService) {
      const driverSocketId = socketService.connectedDrivers.get(bestDriver._id.toString());
      if (driverSocketId) {
        socketService.io.to(driverSocketId).emit('new-delivery-assignment', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          deliveryAddress: order.deliveryAddress,
          estimatedDistance: bestDriver.distance || 'Unknown',
          items: order.items,
          paymentStatus: order.paymentStatus
        });
      }
    }

    res.json({
      message: 'Delivery partner assigned successfully',
      driver: {
        id: bestDriver._id,
        name: bestDriver.name,
        phone: bestDriver.phone,
        rating: bestDriver.rating,
        vehicle: bestDriver.vehicle
      },
      category: DELIVERY_CATEGORIES[orderCategory],
      tracking
    });
  } catch (error) {
    console.error('Error auto-assigning delivery partner:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get delivery statistics by category
const getDeliveryStatsByCategory = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await DeliveryTracking.aggregate([
      {
        $group: {
          _id: '$assignedCategory',
          totalDeliveries: { $sum: 1 },
          completedDeliveries: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          activeDeliveries: {
            $sum: { $cond: [{ $in: ['$status', ['assigned', 'picked_up', 'out_for_delivery']] }, 1, 0] }
          }
        }
      }
    ]);

    const formattedStats = stats.map(stat => ({
      category: stat._id || 'general',
      categoryName: DELIVERY_CATEGORIES[stat._id]?.name || 'General',
      totalDeliveries: stat.totalDeliveries,
      completedDeliveries: stat.completedDeliveries,
      activeDeliveries: stat.activeDeliveries,
      completionRate: stat.totalDeliveries > 0
        ? ((stat.completedDeliveries / stat.totalDeliveries) * 100).toFixed(2)
        : 0
    }));

    res.json({
      categories: DELIVERY_CATEGORIES,
      statistics: formattedStats
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get driver dashboard data
// const getDriverDashboard = async (req, res) => {
//   try {
//     const driverId = req.user.id;

//     // Get driver details
//     const driver = await Driver.findById(driverId);

//     // Get active deliveries
//     const activeDeliveries = await DeliveryTracking.find({
//       driverId,
//       status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] }
//     }).populate('orderId', 'orderNumber totalAmount items deliveryAddress specialInstructions userContactNo');

//     // Get today's completed deliveries
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const todayDeliveries = await DeliveryTracking.countDocuments({
//       driverId,
//       status: 'delivered',
//       actualDeliveryTime: { $gte: today }
//     });

//     // Get earnings
//     const earnings = driver.earnings;

//     res.json({
//       driver: {
//         id: driver._id,
//         name: driver.name,
//         phone: driver.phone,
//         rating: driver.rating,
//         deliveries: driver.deliveries,
//         isOnline: driver.isOnline,
//         specialization: driver.specialization || { categories: ['general'] }
//       },
//       activeDeliveries: activeDeliveries.map(delivery => ({
//         id: delivery._id,
//         orderId: delivery.orderId._id,
//         orderNumber: delivery.orderId.orderNumber,
//         totalAmount: delivery.orderId.totalAmount,
//         status: delivery.status,
//         deliveryAddress: delivery.orderId.deliveryAddress,
//         customerPhone: delivery.orderId.userContactNo,
//         specialInstructions: delivery.orderId.specialInstructions,
//         items: delivery.orderId.items,
//         assignedCategory: delivery.assignedCategory
//       })),
//       stats: {
//         todayDeliveries,
//         totalDeliveries: driver.deliveries,
//         rating: driver.rating,
//         earnings
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching driver dashboard:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// Helper functions
const determineOrderCategory = (items) => {
  const categoryPriority = {
    'food': 1,
    'sweets': 2,
    'vegetable': 3,
    'stationary': 4,
    'general': 5
  };

  let bestCategory = 'general';
  let highestPriority = 5;

  items.forEach(item => {
    const category = item.category?.toLowerCase() || 'general';
    const priority = categoryPriority[category] || 5;

    if (priority < highestPriority) {
      highestPriority = priority;
      bestCategory = category;
    }
  });

  return bestCategory;
};

const findBestDriverForOrder = async (order, category) => {
  try {
    const deliveryLat = order.deliveryAddress?.coordinates?.lat;
    const deliveryLng = order.deliveryAddress?.coordinates?.lng;

    let query = {
      isActive: true,
      isOnline: true,
      emailVerified: true
    };

    // Add category specialization filter
    if (category !== 'general') {
      query['specialization.categories'] = { $in: [category, 'general'] };
    }

    const drivers = await Driver.find(query);

    if (drivers.length === 0) {
      return null;
    }

    // Calculate distance and score for each driver
    const scoredDrivers = drivers.map(driver => {
      let score = 0;

      // Rating score (0-40 points)
      score += (driver.rating / 5) * 40;

      // Experience score (0-30 points)
      score += Math.min(driver.deliveries / 100, 1) * 30;

      // Distance score (0-30 points) - closer is better
      let distanceScore = 30;
      if (deliveryLat && deliveryLng && driver.currentLocation?.lat && driver.currentLocation?.lng) {
        const distance = calculateDistance(
          deliveryLat,
          deliveryLng,
          driver.currentLocation.lat,
          driver.currentLocation.lng
        );
        driver.distance = distance;
        distanceScore = Math.max(0, 30 - (distance * 2)); // Reduce score by 2 points per km
      }
      score += distanceScore;

      driver.score = score;
      return driver;
    });

    // Sort by score (highest first)
    scoredDrivers.sort((a, b) => b.score - a.score);

    return scoredDrivers[0];
  } catch (error) {
    console.error('Error finding best driver:', error);
    return null;
  }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// Updated Delivery Dashboard for drivers using Driver model
const getDriverDashboard = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Get driver data
    const driver = await User.findById(driverId).select('-password');
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Get active deliveries assigned to this driver
    const activeDeliveries = await Order.find({
      deliveryPartner: driverId,
      status: { $in: ['confirmed', 'preparing', 'ready', 'out-for-delivery'] }
    })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });

    // Get delivery stats
    const deliveryStats = await Order.aggregate([
      {
        $match: {
          deliveryPartner: driver._id,
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          totalEarnings: { $sum: '$deliveryCharges' }
        }
      }
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEarnings = await Order.aggregate([
      {
        $match: {
          deliveryPartner: driver._id,
          status: 'delivered',
          updatedAt: { $gte: todayStart }
        }
      },
      {
        $group: {
          _id: null,
          todayEarnings: { $sum: '$deliveryCharges' }
        }
      }
    ]);

    const stats = {
      earnings: {
        today: todayEarnings.length > 0 ? todayEarnings[0].todayEarnings : 0,
        thisWeek: 0, // Can be calculated if needed
        thisMonth: 0, // Can be calculated if needed
        total: deliveryStats.length > 0 ? deliveryStats[0].totalEarnings : 0
      }
    };

    res.json({
      driver: {
        ...driver.toObject(),
        deliveries: deliveryStats.length > 0 ? deliveryStats[0].totalDeliveries : 0,
        rating: driver.rating || 4.5
      },
      activeDeliveries: activeDeliveries.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        orderId: order._id,
        totalAmount: order.totalAmount,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        customerPhone: order.userContactNo,
        specialInstructions: order.specialInstructions,
        items: order.items,
        estimatedDeliveryTime: order.estimatedDelivery ?
          new Date(order.estimatedDelivery).toLocaleTimeString() : 'Calculating...'
      })),
      stats
    });

  } catch (error) {
    console.error('Error fetching driver dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle driver online/offline status
const toggleDriverOnlineStatus = async (req, res) => {
  try {
    const driverId = req.user.id;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Toggle the online status using Driver model method
    await driver.toggleOnlineStatus();

    res.json({
      isOnline: driver.isOnline,
      message: `You are now ${driver.isOnline ? 'online' : 'offline'}`
    });

  } catch (error) {
    console.error('Error toggling online status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  updateDeliveryPartnerSpecialization,
  getAvailablePartnersForCategory,
  autoAssignDeliveryPartner,
  getDeliveryStatsByCategory,
  getDriverDashboard,
  toggleDriverOnlineStatus,
  DELIVERY_CATEGORIES
};