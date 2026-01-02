const DriverRoute = require('../models/DriverRoute');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { updateExpiredSubscriptions } = require('../utils/subscriptionExpiry');

/**
 * Get driver's daily route for a specific date and shift
 * GET /api/driver/route/:date/:shift
 */
exports.getDriverRoute = async (req, res) => {
  try {
    const { date, shift } = req.params;
    const driverId = req.user._id;
    
    const routeDate = new Date(date);
    routeDate.setHours(0, 0, 0, 0);
    
    let route = await DriverRoute.findOne({
      driverId,
      date: {
        $gte: routeDate,
        $lte: new Date(routeDate.getTime() + 24 * 60 * 60 * 1000)
      },
      shift
    }).populate('stops.userId', 'name phone')
      .populate('stops.subscriptionId', 'subscriptionId deliveryAddress');
    
    if (!route) {
      // Create empty route for the driver
      const driver = await User.findById(driverId);
      const serviceArea = driver.driverProfile?.serviceArea || 'default';
      
      route = await DriverRoute.create({
        driverId,
        date: routeDate,
        shift,
        serviceArea,
        maxCapacity: driver.driverProfile?.maxCapacity || 50,
        stops: []
      });
    }
    
    const progress = route.getRouteProgress();
    
    res.json({
      success: true,
      data: {
        route,
        progress,
        currentStop: route.getCurrentStop()
      }
    });
  } catch (error) {
    console.error('Error fetching driver route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route',
      error: error.message
    });
  }
};

/**
 * Manually reorder delivery stops in driver's route
 * PUT /api/driver/route/:routeId/reorder
 */
exports.reorderRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const { stopOrder } = req.body;
    const driverId = req.user._id;
    
    const route = await DriverRoute.findOne({
      _id: routeId,
      driverId
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    if (route.routeStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reorder completed route'
      });
    }
    
    await route.reorderStops(stopOrder);
    
    res.json({
      success: true,
      message: 'Route reordered successfully',
      data: route
    });
  } catch (error) {
    console.error('Error reordering route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder route',
      error: error.message
    });
  }
};

/**
 * Mark a delivery stop as completed
 * PUT /api/driver/route/:routeId/complete-stop/:stopId
 */
exports.completeStop = async (req, res) => {
  try {
    const { routeId, stopId } = req.params;
    const { notes, proofUrl } = req.body;
    const driverId = req.user._id;
    
    const route = await DriverRoute.findOne({
      _id: routeId,
      driverId
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    await route.completeStop(stopId, { notes, proofUrl });
    
    // Update progress for all remaining users in this route
    await this.broadcastRouteProgress(route);
    
    // Get updated progress
    const progress = route.getRouteProgress();
    const currentStop = route.getCurrentStop();
    
    res.json({
      success: true,
      message: 'Stop completed successfully',
      data: {
        route,
        progress,
        currentStop
      }
    });
  } catch (error) {
    console.error('Error completing stop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete stop',
      error: error.message
    });
  }
};

/**
 * Start driver's route for the day
 * PUT /api/driver/route/:routeId/start
 */
exports.startRoute = async (req, res) => {
  try {
    const { routeId } = req.params;
    const driverId = req.user._id;
    
    const route = await DriverRoute.findOne({
      _id: routeId,
      driverId
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    if (route.routeStatus === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Route already started'
      });
    }
    
    route.routeStatus = 'active';
    route.startTime = new Date();
    
    // Update ETAs for all stops
    route.updateRemainingETAs();
    await route.save();
    
    // Notify all users that driver has started deliveries
    await this.notifyRouteStart(route);
    
    const progress = route.getRouteProgress();
    
    res.json({
      success: true,
      message: 'Route started successfully',
      data: {
        route,
        progress
      }
    });
  } catch (error) {
    console.error('Error starting route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start route',
      error: error.message
    });
  }
};

/**
 * Get route progress for a specific user
 * GET /api/user/delivery-progress/:subscriptionId/:date/:shift
 */
exports.getUserDeliveryProgress = async (req, res) => {
  try {
    const { subscriptionId, date, shift } = req.params;
    const userId = req.user._id;
    
    const routeDate = new Date(date);
    routeDate.setHours(0, 0, 0, 0);
    
    // Find the route containing this user's delivery
    const route = await DriverRoute.findOne({
      date: {
        $gte: routeDate,
        $lte: new Date(routeDate.getTime() + 24 * 60 * 60 * 1000)
      },
      shift,
      'stops.subscriptionId': subscriptionId,
      'stops.userId': userId
    }).populate('driverId', 'name phone rating driverProfile')
      .populate('stops.subscriptionId', 'subscriptionId');
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found for this date and shift'
      });
    }
    
    // Find user's specific stop
    const userStop = route.stops.find(stop => 
      stop.subscriptionId.toString() === subscriptionId &&
      stop.userId.toString() === userId.toString()
    );
    
    if (!userStop) {
      return res.status(404).json({
        success: false,
        message: 'Your delivery not found in route'
      });
    }
    
    // Calculate progress data
    const totalStops = route.totalStops;
    const completedStops = route.completedStops;
    const userStopNumber = userStop.sequenceNumber;
    const stopsAhead = Math.max(0, userStopNumber - completedStops - 1);
    
    // Calculate ETA
    const estimatedMinutes = stopsAhead * route.averageTimePerStop;
    const eta = estimatedMinutes > 0 ? `${estimatedMinutes} minutes` : 'Next delivery';
    
    // Generate route visualization
    const routeVisualization = route.stops.map((stop, index) => ({
      stopNumber: stop.sequenceNumber,
      status: stop.status === 'delivered' ? 'completed' : 
              stop.sequenceNumber === route.currentStopIndex + 1 ? 'current' : 'pending',
      isUserStop: stop._id.toString() === userStop._id.toString(),
      estimatedTime: stop.estimatedArrival
    }));
    
    const progressPercentage = Math.round((completedStops / totalStops) * 100);
    
    res.json({
      success: true,
      data: {
        driver: route.driverId ? {
          name: route.driverId.name,
          phone: route.driverId.phone,
          rating: route.driverId.rating || 4.5,
          vehicle: route.driverId.driverProfile?.vehicle
        } : null,
        progress: {
          totalStops,
          completedStops,
          yourStopNumber: userStopNumber,
          stopsAhead,
          progressPercentage,
          eta,
          status: userStop.status
        },
        routeVisualization,
        estimatedDeliveryTime: userStop.estimatedArrival
      }
    });
  } catch (error) {
    console.error('Error fetching delivery progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery progress',
      error: error.message
    });
  }
};

/**
 * Auto-assign new delivery to optimal driver
 * POST /api/system/assign-delivery
 */
exports.autoAssignDelivery = async (req, res) => {
  try {
    const {
      subscriptionId,
      orderId,
      userId,
      serviceArea,
      shift,
      date,
      address,
      mealDetails
    } = req.body;
    
    const deliveryData = {
      subscriptionId,
      orderId,
      userId,
      address,
      mealDetails,
      serviceArea: serviceArea || 'central',
      shift: shift || 'evening',
      date: date || new Date()
    };
    
    // Check if assignment is within cutoff time (30 minutes before shift)
    const cutoffTime = this.calculateCutoffTime(shift, date);
    const now = new Date();
    
    if (now > cutoffTime) {
      // Assign to default driver
      const route = await DriverRoute.assignToDefaultDriver(deliveryData);
      return res.json({
        success: true,
        message: 'Assigned to default driver (past cutoff)',
        data: { routeId: route._id, driverId: route.driverId }
      });
    }
    
    // Try to assign to optimal driver
    const route = await DriverRoute.assignToOptimalDriver(deliveryData);
    
    res.json({
      success: true,
      message: 'Delivery assigned successfully',
      data: { 
        routeId: route._id, 
        driverId: route.driverId,
        stopNumber: route.stops.length,
        estimatedArrival: route.stops[route.stops.length - 1].estimatedArrival
      }
    });
  } catch (error) {
    console.error('Error assigning delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign delivery',
      error: error.message
    });
  }
};

/**
 * Get all routes for admin dashboard
 * GET /api/admin/routes/:date/:shift
 */
exports.getAdminRoutes = async (req, res) => {
  try {
    const { date, shift } = req.params;
    
    const routeDate = new Date(date);
    routeDate.setHours(0, 0, 0, 0);
    
    const routes = await DriverRoute.find({
      date: {
        $gte: routeDate,
        $lte: new Date(routeDate.getTime() + 24 * 60 * 60 * 1000)
      },
      shift
    })
    .populate('driverId', 'name phone rating driverProfile')
    .populate('stops.userId', 'name phone')
    .populate('stops.subscriptionId', 'subscriptionId deliveryAddress')
    .sort({ serviceArea: 1, 'driverId.name': 1 });
    
    const summary = {
      totalRoutes: routes.length,
      totalDeliveries: routes.reduce((sum, route) => sum + route.totalStops, 0),
      completedDeliveries: routes.reduce((sum, route) => sum + route.completedStops, 0),
      activeRoutes: routes.filter(r => r.routeStatus === 'active').length,
      completedRoutes: routes.filter(r => r.routeStatus === 'completed').length
    };
    
    res.json({
      success: true,
      data: {
        routes,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching admin routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
};

// Helper methods
exports.calculateCutoffTime = (shift, date) => {
  const cutoff = new Date(date);
  if (shift === 'morning') {
    cutoff.setHours(11, 30, 0, 0); // 11:30 AM cutoff for morning
  } else {
    cutoff.setHours(18, 30, 0, 0); // 6:30 PM cutoff for evening
  }
  return cutoff;
};

exports.broadcastRouteProgress = async (route) => {
  try {
    const socketService = global.socketService;
    if (!socketService) return;
    
    // Notify each user in the route about updated progress
    for (const stop of route.stops) {
      if (stop.status === 'pending') {
        const stopsAhead = stop.sequenceNumber - route.completedStops - 1;
        const eta = Math.max(0, stopsAhead * route.averageTimePerStop);
        
        socketService.io.to(`user-${stop.userId}`).emit('delivery-progress-update', {
          stopNumber: stop.sequenceNumber,
          totalStops: route.totalStops,
          completedStops: route.completedStops,
          stopsAhead,
          eta: `${eta} minutes`,
          progressPercentage: Math.round((route.completedStops / route.totalStops) * 100)
        });
      }
    }
  } catch (error) {
    console.error('Error broadcasting route progress:', error);
  }
};

exports.notifyRouteStart = async (route) => {
  try {
    const socketService = global.socketService;
    if (!socketService) return;
    
    // Notify all users that delivery has started
    for (const stop of route.stops) {
      socketService.io.to(`user-${stop.userId}`).emit('delivery-started', {
        driverName: route.driverId.name,
        estimatedArrival: stop.estimatedArrival,
        stopNumber: stop.sequenceNumber,
        totalStops: route.totalStops
      });
    }
  } catch (error) {
    console.error('Error notifying route start:', error);
  }
};

// Get today's delivery progress for current user (auto-detect)
// exports.getTodayDeliveryProgress = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     // ---- FIXED DATE LOGIC ----
//     const now = new Date();

//     const istMidnight = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate(),
//       0, 0, 0, 0
//     );

//     const utcStart = new Date(istMidnight.getTime() - (5.5 * 60 * 60 * 1000));
//     const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000);

//     // ---- ACTIVE SUBSCRIPTION ----
//     const Subscription = require('../models/Subscription');
//     const activeSubscription = await Subscription.findOne({
//       user: userId,
//       status: 'active'
//     });

//     if (!activeSubscription) {
//       return res.status(404).json({
//         success: false,
//         message: 'No active subscription found'
//       });
//     }

//     // ---- SHIFT CALCULATION ----
//     const currentHour = now.getHours();
//     const currentShift = currentHour < 15 ? 'morning' : 'evening';

//     // ---- FIND ROUTE ----
//     const route = await DriverRoute.findOne({
//       date: { $gte: utcStart, $lte: utcEnd },
//       shift: currentShift,
//       'stops.subscriptionId': activeSubscription._id,
//       'stops.userId': userId
//     })
//       .populate('driverId', 'name phone rating driverProfile')
//       .populate('stops.subscriptionId', 'subscriptionId');

//     console.log("Finding route between:", utcStart, utcEnd);

//     if (!route) {
//       return res.status(404).json({
//         success: false,
//         message: 'No delivery scheduled for today'
//       });
//     }

//     // ---- USER STOP ----
//     const userStop = route.stops.find(
//       stop =>
//         stop.subscriptionId.toString() === activeSubscription._id.toString() &&
//         stop.userId.toString() === userId.toString()
//     );

//     if (!userStop) {
//       return res.status(404).json({
//         success: false,
//         message: 'Your delivery not found in route'
//       });
//     }

//     // ---- PROGRESS CALCULATION ----
//     const totalStops = route.totalStops;
//     const completedStops = route.completedStops;
//     const userStopNumber = userStop.sequenceNumber;
//     const stopsAhead = Math.max(0, userStopNumber - completedStops - 1);

//     const estimatedMinutes = stopsAhead * route.averageTimePerStop;
//     const eta = estimatedMinutes > 0 ? `${estimatedMinutes} minutes` : 'Next delivery';

//     const routeVisualization = route.stops.map(stop => ({
//       stopNumber: stop.sequenceNumber,
//       status:
//         stop.status === 'delivered'
//           ? 'completed'
//           : stop.sequenceNumber === route.currentStopIndex + 1
//           ? 'current'
//           : 'pending',
//       isUserStop: stop._id.toString() === userStop._id.toString(),
//       estimatedTime: stop.estimatedArrival
//     }));

//     const progressPercentage = Math.round((completedStops / totalStops) * 100);

//     const responseData = {
//       routeId: route._id,
//       driver: {
//         name: route.driverId.name,
//         phone: route.driverId.phone,
//         rating: route.driverId.rating || 4.5,
//         profilePicture: route.driverId.driverProfile?.profilePicture
//       },
//       progress: {
//         percentage: progressPercentage,
//         currentStop: completedStops + 1,
//         totalStops,
//         eta,
//         estimatedDeliveryTime: userStop.estimatedArrival
//       },
//       routeVisualization,
//       userDeliveryStatus: userStop.status,
//       routeStatus: route.status,
//       shift: currentShift,
//       date: route.date
//     };

//     res.json({
//       success: true,
//       message: 'Delivery progress retrieved successfully',
//       data: responseData
//     });

//   } catch (error) {
//     console.error('Error getting today delivery progress:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// };

exports.getTodayDeliveryProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("▶ USER ID:", userId);

    // ----------------------------
    // 1. DATE CALCULATION (CORRECTED)
    // ----------------------------
    const now = new Date();

    const istMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    );

    const utcStart = new Date(istMidnight.getTime() - 5.5 * 60 * 60 * 1000);
    const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000);

    console.log("▶ IST MIDNIGHT:", istMidnight);
    console.log("▶ UTC START:", utcStart);
    console.log("▶ UTC END:", utcEnd);

    // ----------------------------
    // 2. FIND ACTIVE SUBSCRIPTION
    // ----------------------------
    const Subscription = require('../models/Subscription');
    const activeSubscription = await Subscription.findOne({
      user: userId,
      status: 'active'
    });

    console.log("▶ ACTIVE SUBSCRIPTION:", activeSubscription?._id);

    if (!activeSubscription) {
      console.log("✘ No active subscription found");
      return res.status(404).json({ success: false, message: "No active subscription" });
    }

    // ----------------------------
    // 3. SHIFT CHECK
    // ----------------------------
    const currentHour = now.getHours();
    const currentShift = currentHour < 15 ? "morning" : "evening";

    console.log("▶ CURRENT SHIFT:", currentShift);

    // ----------------------------
    // 4. CHECK IF DB ROUTES MATCH ANY CONDITION
    // ----------------------------
    const allRoutes = await DriverRoute.find();
    console.log("▶ TOTAL ROUTES IN DB:", allRoutes.length);

    allRoutes.forEach((r, i) => {
      console.log(`\n===== ROUTE ${i + 1} =====`);
      console.log("DB Date:", r.date);
      console.log("DB Shift:", r.shift);

      const stopMatch = r.stops.find(
        s =>
          s.subscriptionId.toString() === activeSubscription._id.toString() &&
          s.userId.toString() === userId.toString()
      );

      console.log("Has user in stops?", stopMatch ? "YES" : "NO");
    });

    // ----------------------------
    // 5. ACTUAL QUERY
    // ----------------------------
    console.log("\n▶ RUNNING FINAL QUERY WITH:");
    console.log({
      date: { $gte: utcStart, $lte: utcEnd },
      shift: currentShift,
      subscriptionId: activeSubscription._id,
      userId: userId
    });

    const route = await DriverRoute.findOne({
      date: { $gte: utcStart, $lte: utcEnd },
      shift: currentShift,
      "stops.subscriptionId": activeSubscription._id,
      "stops.userId": userId
    });

    console.log("\n▶ QUERY RESULT:", route );

    if (!route) {
      console.log("✘ Route not matching. Conditions failing.");
      return res.status(404).json({ success: false, message: "No route found" });
    }

    res.json({ success: true, message: "OK", route });

  } catch (err) {
    console.error("❌ ERROR:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

