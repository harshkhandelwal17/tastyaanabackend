const express = require('express');
const router = express.Router();
const { format } = require('date-fns');
const DeliverySchedule = require('../models/DeliverySchedule');
const DriverRoute = require('../models/DriverRoute');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const DeliveryZone = require('../models/DeliveryZone');
const { authenticate, authorize } = require('../middlewares/auth');
const { validationResult } = require('express-validator');

// Helper function to calculate distance between two coordinates (in km)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to calculate estimated duration between two points
function calculateRouteETA(from, to) {
  // Simple estimation based on distance
  // In a real implementation, you would use actual routing services
  const avgSpeed = 25; // km/h average speed in city
  const setupTime = 5; // 5 minutes per stop for delivery
  
  if (!from || !to) return 15; // Default 15 minutes
  
  const distance = calculateDistance(
    from.coordinates[1], from.coordinates[0],
    to.coordinates[1], to.coordinates[0]
  );
  
  const travelTime = (distance / avgSpeed) * 60; // Convert to minutes
  return Math.ceil(travelTime + setupTime);
}

// Helper function to update ETAs for remaining deliveries
async function updateRemainingDeliveryETAs(driverId, date, shift, completedPosition) {
  try {
    // Get the current driver route
    const driverRoute = await DriverRoute.findOne({
      driverId,
      date: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lt: new Date(date).setHours(23, 59, 59, 999)
      },
      shift
    });

    if (!driverRoute) return;

    const currentTime = new Date();
    let lastStopTime = currentTime;

    // Find the last completed stop location
    const completedStops = driverRoute.stops.filter(stop => stop.status === 'delivered');
    if (completedStops.length > 0) {
      const lastCompletedStop = completedStops[completedStops.length - 1];
      lastStopTime = lastCompletedStop.actualArrival || currentTime;
    }

    // Update ETAs for remaining stops
    for (let i = 0; i < driverRoute.stops.length; i++) {
      const stop = driverRoute.stops[i];
      
      if (stop.status === 'pending') {
        // Calculate ETA based on previous stop
        let travelTime = 15; // Default
        
        if (i > 0) {
          const prevStop = driverRoute.stops[i - 1];
          if (prevStop.address?.coordinates && stop.address?.coordinates) {
            const distance = calculateDistance(
              prevStop.address.coordinates.lat, prevStop.address.coordinates.lng,
              stop.address.coordinates.lat, stop.address.coordinates.lng
            );
            const avgSpeed = 25; // km/h
            const setupTime = 5; // minutes
            travelTime = Math.ceil((distance / avgSpeed) * 60 + setupTime);
          }
        }
        
        const newETA = new Date(lastStopTime.getTime() + (travelTime * 60 * 1000));
        driverRoute.stops[i].estimatedArrival = newETA;
        lastStopTime = newETA;
      }
    }

    await driverRoute.save();

    // Update delivery tracking records with new ETAs
    for (const stop of driverRoute.stops) {
      if (stop.status === 'pending' && stop.subscriptionId) {
        await Subscription.findOneAndUpdate(
          { 
            '_id': stop.subscriptionId,
            'deliveryTracking.shift': shift,
            'deliveryTracking.date': {
              $gte: new Date(date).setHours(0, 0, 0, 0),
              $lt: new Date(date).setHours(23, 59, 59, 999)
            }
          },
          {
            $set: {
              'deliveryTracking.$.estimatedArrival': stop.estimatedArrival,
              'deliveryTracking.$.updatedAt': currentTime
            }
          }
        );
      }
    }

  } catch (error) {
    console.error('Error updating ETAs:', error);
  }
}

/**
 * @route   GET /api/delivery-schedule/driver/schedules
 * @desc    Get driver's delivery schedules based on zones
 * @access  Private (Driver)
 */
router.get('/driver/schedules', authenticate, authorize(['delivery']), async (req, res) => {
  try {
    const { week, shift = 'both', status = 'all', search = '', page = 1, limit = 50 } = req.query;
    const driverId = req.user.id;

    // Get driver with zones
    const driver = await User.findById(driverId).populate('driverProfile.zones');
    if (!driver || !driver.driverProfile.zones.length) {
      return res.json({
        success: true,
        data: [],
        message: 'No zones assigned to this driver'
      });
    }

    const driverZones = driver.driverProfile.zones.map(zone => zone._id);
    const driverShifts = driver.driverProfile.shifts || ['morning', 'evening'];

    // Build date filter
    let dateFilter = {};
    if (week) {
      const startDate = new Date(week);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      dateFilter = { $gte: startDate, $lt: endDate };
    }

    // Find subscriptions in driver's zones and shifts
    const subscriptionQuery = {
      status: 'active'
    };

    // Zone-based filtering
    const zoneConditions = [];
    if (shift === 'morning' || shift === 'both') {
      zoneConditions.push({ morningZone: { $in: driverZones } });
    }
    if (shift === 'evening' || shift === 'both') {
      zoneConditions.push({ eveningZone: { $in: driverZones } });
    }
    
    if (zoneConditions.length > 0) {
      subscriptionQuery.$or = zoneConditions;
    }

    const subscriptions = await Subscription.find(subscriptionQuery)
      .populate('user', 'name phone')
      .populate('morningZone eveningZone', 'name code')
      .populate('mealPlan', 'name price');

    // Process delivery tracking and create schedule data
    let scheduleData = [];
    
    for (const subscription of subscriptions) {
      const relevantTracking = subscription.deliveryTracking.filter(tracking => {
        // Date filter
        if (week && dateFilter.$gte && dateFilter.$lt) {

          // console.log("Tracking date:", tracking.date); 
   const trackingDateUTC = new Date(tracking.date);
const trackingDate = new Date(trackingDateUTC.getTime() + (5.5 * 60 * 60 * 1000));

          if (trackingDate < dateFilter.$gte || trackingDate >= dateFilter.$lt) {
            return false;
          }
        }
        
        // Shift and zone filter
        const isValidShift = shift === 'both' || tracking.shift === shift;
        const trackingZone = tracking.shift === 'morning' 
          ? subscription.morningZone 
          : subscription.eveningZone;
        
        // Safe zone check - ensure trackingZone exists and has _id
        const isValidZone = trackingZone && trackingZone._id && 
          driverZones.some(zone => zone.toString() === trackingZone._id.toString());
        
        // Status filter
        const isValidStatus = status === 'all' || tracking.status === status;
        
        // Driver assignment - only show if assigned to this driver or unassigned
        const isAssignedToDriver = !tracking.driver || tracking.driver.toString() === driverId;
        
        return isValidShift && isValidZone && isValidStatus && isAssignedToDriver;
      });

      // Create schedule entries
      relevantTracking.forEach(tracking => {
        const zone = tracking.shift === 'morning' 
          ? subscription.morningZone 
          : subscription.eveningZone;

        scheduleData.push({
          id: tracking._id.toString(),
          subscriptionId: subscription._id.toString(),
          subscriptionNumber: subscription.subscriptionId,
          date: tracking.date,
          shift: tracking.shift,
          status: tracking.status,
          driver: tracking.driver,
          deliveryNo: tracking.deliveryNo,
          customer: {
            name: subscription.user.name,
            phone: subscription.user.phone,
            address: subscription.deliveryAddress
          },
          mealPlan: subscription.mealPlan,
          zone: zone,
          checkpoints: tracking.checkpoints || [],
          ETA: tracking.ETA,
          thaliCount: tracking.thaliCount,
          notes: tracking.notes,
          // Add the missing sequence fields
          sequencePosition: tracking.sequencePosition,
          deliveryNumber: tracking.deliveryNumber,
          routeId: tracking.routeId,
          routeStatus: tracking.routeStatus,
          assignedDriver: tracking.assignedDriver,
          createdAt: tracking.createdAt,
          updatedAt: tracking.updatedAt
        });
      });
    }

    // Apply search filter
    if (search) {
      scheduleData = scheduleData.filter(item => 
        item.customer.name.toLowerCase().includes(search.toLowerCase()) ||
        item.customer.address?.street?.toLowerCase().includes(search.toLowerCase()) ||
        item.subscriptionNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.deliveryNo?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort and paginate
    scheduleData.sort((a, b) => new Date(a.date) - new Date(b.date));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = scheduleData.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(scheduleData.length / limit),
        total: scheduleData.length
      },
      driverInfo: {
        zones: driver.driverProfile.zones,
        shifts: driver.driverProfile.shifts,
        currentShift: driver.driverProfile.currentShift
      }
    });
  } catch (error) {
    console.error('Get driver schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver schedules'
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/admin/create-tracking
 * @desc    Create delivery tracking for subscription if not exists
 * @access  Private (Admin)
 */
router.post('/admin/create-tracking', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { subscriptionId, date, shift } = req.body;

    // Validate required fields
    if (!subscriptionId || !date || !shift) {
      return res.status(400).json({
        success: false,
        message: 'subscriptionId, date, and shift are required'
      });
    }

    // Find subscription
    const subscription = await Subscription.findById(subscriptionId)
      .populate('morningZone eveningZone', 'name code');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const trackingDate = new Date(date);
    
    // Check if tracking already exists for this date and shift
    const existingTracking = subscription.deliveryTracking.find(
      tracking => 
        tracking.date.toDateString() === trackingDate.toDateString() && 
        tracking.shift === shift
    );

    if (existingTracking) {
      return res.status(400).json({
        success: false,
        message: 'Delivery tracking already exists for this date and shift'
      });
    }

    // Generate delivery number
    const deliveryNo = `DEL${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Get appropriate zone
    const zone = shift === 'morning' ? subscription.morningZone : subscription.eveningZone;

    // Create new tracking entry
    const newTracking = {
      date: trackingDate,
      shift: shift,
      status: 'pending',
      deliveryNo: deliveryNo,
      zone: zone._id,
      isActive: true,
      checkpoints: [],
      ETA: {
        estimated: new Date(trackingDate.getTime() + (shift === 'morning' ? 4 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000)) // 4h for morning, 8h for evening
      },
      thaliCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to subscription
    subscription.deliveryTracking.push(newTracking);
    await subscription.save();

    // Get the created tracking (last added)
    const createdTracking = subscription.deliveryTracking[subscription.deliveryTracking.length - 1];

    res.status(201).json({
      success: true,
      message: 'Delivery tracking created successfully',
      data: {
        trackingId: createdTracking._id,
        subscriptionId: subscription._id,
        deliveryNo: newTracking.deliveryNo,
        date: newTracking.date,
        shift: newTracking.shift,
        zone: zone,
        status: newTracking.status
      }
    });
  } catch (error) {
    console.error('Create tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create delivery tracking'
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/admin/unassigned-zones
 * @desc    Get subscriptions without delivery boy assigned for zones
 * @access  Private (Admin)
 */
router.get('/admin/unassigned-zones', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { date, shift = 'both' } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Get all active subscriptions
    const subscriptions = await Subscription.find({ status: 'active' })
      .populate('user', 'name phone')
      .populate('morningZone eveningZone', 'name code')
      .populate('mealPlan', 'name');

    const unassignedZones = [];
    
    for (const subscription of subscriptions) {
      // Check morning shift
      if (shift === 'both' || shift === 'morning') {
        const morningTracking = subscription.deliveryTracking.find(
          tracking => 
            tracking.date.toDateString() === targetDate.toDateString() && 
            tracking.shift === 'morning'
        );

        if (!morningTracking) {
          // No tracking exists - needs to be created
          unassignedZones.push({
            type: 'no_tracking',
            subscriptionId: subscription._id,
            subscriptionNumber: subscription.subscriptionId,
            customer: subscription.user,
            zone: subscription.morningZone,
            shift: 'morning',
            date: targetDate,
            message: 'No delivery tracking created for morning shift'
          });
        } else if (!morningTracking.driver) {
          // Tracking exists but no driver assigned
          const driversInZone = await User.find({
            role: 'delivery',
            'driverProfile.zones': subscription.morningZone._id,
            'driverProfile.shifts': 'morning'
          });

          unassignedZones.push({
            type: 'no_driver',
            subscriptionId: subscription._id,
            subscriptionNumber: subscription.subscriptionId,
            customer: subscription.user,
            zone: subscription.morningZone,
            shift: 'morning',
            date: targetDate,
            trackingId: morningTracking._id,
            deliveryNo: morningTracking.deliveryNo,
            availableDrivers: driversInZone.length,
            message: driversInZone.length > 0 
              ? `${driversInZone.length} driver(s) available but not assigned`
              : 'No delivery boy assigned for this zone'
          });
        }
      }

      // Check evening shift
      if (shift === 'both' || shift === 'evening') {
        const eveningTracking = subscription.deliveryTracking.find(
          tracking => 
            tracking.date.toDateString() === targetDate.toDateString() && 
            tracking.shift === 'evening'
        );

        if (!eveningTracking) {
          // No tracking exists - needs to be created
          unassignedZones.push({
            type: 'no_tracking',
            subscriptionId: subscription._id,
            subscriptionNumber: subscription.subscriptionId,
            customer: subscription.user,
            zone: subscription.eveningZone,
            shift: 'evening',
            date: targetDate,
            message: 'No delivery tracking created for evening shift'
          });
        } else if (!eveningTracking.driver) {
          // Tracking exists but no driver assigned
          const driversInZone = await User.find({
            role: 'delivery',
            'driverProfile.zones': subscription.eveningZone._id,
            'driverProfile.shifts': 'evening'
          });

          unassignedZones.push({
            type: 'no_driver',
            subscriptionId: subscription._id,
            subscriptionNumber: subscription.subscriptionId,
            customer: subscription.user,
            zone: subscription.eveningZone,
            shift: 'evening',
            date: targetDate,
            trackingId: eveningTracking._id,
            deliveryNo: eveningTracking.deliveryNo,
            availableDrivers: driversInZone.length,
            message: driversInZone.length > 0 
              ? `${driversInZone.length} driver(s) available but not assigned`
              : 'No delivery boy assigned for this zone'
          });
        }
      }
    }

    // Group by zone for easier management
    const groupedByZone = unassignedZones.reduce((acc, item) => {
      const zoneKey = `${item.zone._id}_${item.shift}`;
      if (!acc[zoneKey]) {
        acc[zoneKey] = {
          zone: item.zone,
          shift: item.shift,
          items: [],
          summary: {
            noTracking: 0,
            noDriver: 0,
            totalSubscriptions: 0
          }
        };
      }
      
      acc[zoneKey].items.push(item);
      acc[zoneKey].summary.totalSubscriptions++;
      if (item.type === 'no_tracking') {
        acc[zoneKey].summary.noTracking++;
      } else {
        acc[zoneKey].summary.noDriver++;
      }
      
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        unassignedZones: unassignedZones,
        groupedByZone: Object.values(groupedByZone),
        summary: {
          totalUnassigned: unassignedZones.length,
          noTracking: unassignedZones.filter(item => item.type === 'no_tracking').length,
          noDriver: unassignedZones.filter(item => item.type === 'no_driver').length,
          affectedZones: Object.keys(groupedByZone).length
        }
      }
    });
  } catch (error) {
    console.error('Get unassigned zones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unassigned zones'
    });
  }
});

/**
 * @route   PUT /api/delivery-schedule/admin/assign-driver
 * @desc    Assign driver to delivery tracking
 * @access  Private (Admin)
 */
router.put('/admin/assign-driver', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { subscriptionId, trackingId, driverId, date, shift } = req.body;

    // Validate required fields
    if ((!trackingId && (!subscriptionId || !date || !shift)) || !driverId) {
      return res.status(400).json({
        success: false,
        message: 'Either trackingId or (subscriptionId, date, shift) and driverId are required'
      });
    }

    // Verify driver exists and has access to the zone
    const driver = await User.findById(driverId).populate('driverProfile.zones');
    if (!driver || driver.role !== 'delivery') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    let subscription;
    let tracking;

    if (trackingId) {
      // Find by tracking ID
      subscription = await Subscription.findOne({
        'deliveryTracking._id': trackingId
      }).populate('morningZone eveningZone');
      
      if (subscription) {
        tracking = subscription.deliveryTracking.id(trackingId);
      }
    } else {
      // Find by subscription, date, and shift
      subscription = await Subscription.findById(subscriptionId).populate('morningZone eveningZone');
      if (subscription) {
        tracking = subscription.deliveryTracking.find(
          t => t.date.toDateString() === new Date(date).toDateString() && t.shift === shift
        );
      }
    }

    if (!subscription || !tracking) {
      return res.status(404).json({
        success: false,
        message: 'Delivery tracking not found'
      });
    }

    // Check if driver is assigned to the correct zone
    const requiredZone = tracking.shift === 'morning' 
      ? subscription.morningZone 
      : subscription.eveningZone;

    const hasZoneAccess = driver.driverProfile.zones.some(
      zone => zone._id.toString() === requiredZone._id.toString()
    );

    if (!hasZoneAccess) {
      return res.status(400).json({
        success: false,
        message: `Driver is not assigned to ${requiredZone.name} zone for ${tracking.shift} shift`
      });
    }

    // Check if driver has the required shift
    if (!driver.driverProfile.shifts.includes(tracking.shift)) {
      return res.status(400).json({
        success: false,
        message: `Driver is not available for ${tracking.shift} shift`
      });
    }

    // Assign driver
    tracking.driver = driverId;
    tracking.updatedAt = new Date();
    
    // Add initial checkpoint if not exists
    if (!tracking.checkpoints.length) {
      tracking.checkpoints.push({
        type: 'picked_up',
        timestamp: new Date(),
        notes: `Assigned to ${driver.name}`
      });
    }

    await subscription.save();

    res.json({
      success: true,
      message: `Driver ${driver.name} assigned successfully`,
      data: {
        trackingId: tracking._id,
        subscriptionId: subscription._id,
        driverId: driver._id,
        driverName: driver.name,
        zone: requiredZone,
        shift: tracking.shift,
        status: tracking.status,
        assignedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign driver'
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/admin/schedules
 * @desc    Get all delivery schedules for admin
 * @access  Private (Admin)
 */
router.get('/admin/schedules', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { 
      date, 
      status = 'all', 
      driverId = 'all', 
      shift = 'both',
      page = 1, 
      limit = 50 
    } = req.query;

    // Build query
    let query = {};

    // Date filter
    if (date) {
      const filterDate = new Date(date);
      const nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 1);
      query.date = { $gte: filterDate, $lt: nextDay };
    }

    // Status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Driver filter
    if (driverId !== 'all') {
      query.driverId = driverId;
    }

    // Shift filter
    if (shift !== 'both') {
      query.shift = shift;
    }

    const schedules = await DeliverySchedule.find(query)
      .populate('driverId', 'name phone email location')
      .sort({ date: 1, shift: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DeliverySchedule.countDocuments(query);

    // Get stats
    const stats = await getSchedulingStats(date);

    res.json({
      success: true,
      data: schedules,
      stats,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get admin schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules'
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/admin/create
 * @desc    Create a new delivery schedule
 * @access  Private (Admin)
 */
router.post('/admin/create', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      date,
      shift,
      driverId,
      deliveries = [],
      estimatedDuration,
      maxCapacity = 20,
      notes = ''
    } = req.body;

    // Verify driver exists and is available
    const driver = await User.findById(driverId).where({ role: 'driver' });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Check if schedule already exists for this driver, date, and shift
    const existingSchedule = await DeliverySchedule.findOne({
      driverId,
      date: new Date(date),
      shift
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Schedule already exists for this driver, date, and shift'
      });
    }

    // Create new schedule
    const schedule = new DeliverySchedule({
      date: new Date(date),
      shift,
      driverId,
      deliveries,
      estimatedDuration,
      maxCapacity,
      notes,
      status: 'assigned',
      createdBy: req.user.id,
      createdAt: new Date()
    });

    await schedule.save();
    await schedule.populate('driverId', 'name phone email location');

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule'
    });
  }
});

/**
 * @route   PUT /api/delivery-schedule/:id
 * @desc    Update delivery schedule
 * @access  Private (Admin/Driver)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the schedule
    const schedule = await DeliverySchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Check permissions
    const isAdmin = ['admin', 'super-admin'].includes(req.user.role);
    const isOwner = schedule.driverId.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this schedule'
      });
    }

    // Restrict certain updates for drivers
    if (!isAdmin) {
      delete updates.driverId;
      delete updates.date;
      delete updates.maxCapacity;
      // Drivers can only update notes and deliveries order
      const allowedFields = ['notes', 'deliveries', 'estimatedDuration'];
      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });
      Object.assign(updates, filteredUpdates);
    }

    // Update the schedule
    const updatedSchedule = await DeliverySchedule.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).populate('driverId', 'name phone email location');

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: updatedSchedule
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule'
    });
  }
});

/**
 * @route   DELETE /api/delivery-schedule/:id
 * @desc    Delete delivery schedule
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await DeliverySchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Don't delete if schedule is in progress or completed
    if (['in_progress', 'completed'].includes(schedule.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete schedule that is in progress or completed'
      });
    }

    await DeliverySchedule.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule'
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/admin/drivers
 * @desc    Get all drivers with their capacity info
 * @access  Private (Admin)
 */
router.get('/admin/drivers', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' })
      .select('name phone email location isOnline')
      .sort({ name: 1 });

    // Get current capacity for each driver
    const driversWithCapacity = await Promise.all(drivers.map(async (driver) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const todaySchedules = await DeliverySchedule.find({
        driverId: driver._id,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['assigned', 'in_progress'] }
      });

      const currentCapacity = todaySchedules.reduce((total, schedule) => 
        total + schedule.deliveries.length, 0
      );

      // Get driver stats
      const totalDeliveries = await DeliverySchedule.aggregate([
        { $match: { driverId: driver._id, status: 'completed' } },
        { $unwind: '$deliveries' },
        { $count: 'total' }
      ]);

      const completedSchedules = await DeliverySchedule.countDocuments({
        driverId: driver._id,
        status: 'completed'
      });

      // Calculate average rating (mock for now)
      const rating = 4.5 + (Math.random() * 0.8); // Mock rating between 4.5-5.3

      return {
        ...driver.toObject(),
        currentCapacity,
        maxCapacity: 25, // Default max capacity
        status: currentCapacity >= 20 ? 'busy' : 'available',
        rating: parseFloat(rating.toFixed(1)),
        totalDeliveries: totalDeliveries[0]?.total || 0,
        onlineStatus: driver.isOnline ? 'online' : 'offline'
      };
    }));

    res.json({
      success: true,
      data: driversWithCapacity
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers'
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/admin/unassigned
 * @desc    Get unassigned deliveries
 * @access  Private (Admin)
 */
router.get('/admin/unassigned', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { date } = req.query;
    const filterDate = date ? new Date(date) : new Date();

    // This is a simplified version - in a real implementation,
    // you'd query your subscription/order system for pending deliveries
    const unassignedDeliveries = await getUnassignedDeliveries(filterDate);

    res.json({
      success: true,
      data: unassignedDeliveries
    });
  } catch (error) {
    console.error('Get unassigned deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unassigned deliveries'
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/admin/auto-assign
 * @desc    Auto-assign unassigned deliveries to drivers
 * @access  Private (Admin)
 */
router.post('/admin/auto-assign', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { date, shift = 'both' } = req.body;
    const targetDate = new Date(date);

    // Get unassigned deliveries
    const unassignedDeliveries = await getUnassignedDeliveries(targetDate);
    
    // Get available drivers
    const availableDrivers = await getAvailableDrivers(targetDate);

    // Auto-assignment algorithm
    const assignments = await autoAssignDeliveries(unassignedDeliveries, availableDrivers, shift);

    // Create or update schedules
    const results = await Promise.all(assignments.map(async (assignment) => {
      let schedule = await DeliverySchedule.findOne({
        driverId: assignment.driverId,
        date: targetDate,
        shift: assignment.shift
      });

      if (schedule) {
        // Update existing schedule
        schedule.deliveries = [...schedule.deliveries, ...assignment.deliveries];
        schedule.estimatedDuration = calculateEstimatedDuration(schedule.deliveries);
        await schedule.save();
      } else {
        // Create new schedule
        schedule = new DeliverySchedule({
          date: targetDate,
          shift: assignment.shift,
          driverId: assignment.driverId,
          deliveries: assignment.deliveries,
          estimatedDuration: calculateEstimatedDuration(assignment.deliveries),
          maxCapacity: 25,
          status: 'assigned',
          createdBy: req.user.id,
          createdAt: new Date()
        });
        await schedule.save();
      }

      return schedule;
    }));

    res.json({
      success: true,
      message: `Successfully assigned ${assignments.reduce((total, a) => total + a.deliveries.length, 0)} deliveries`,
      data: results
    });
  } catch (error) {
    console.error('Auto-assign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-assign deliveries'
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/admin/optimize
 * @desc    Optimize delivery routes
 * @access  Private (Admin)
 */
router.post('/admin/optimize', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { date, routeIds = [] } = req.body;
    const targetDate = new Date(date);

    let query = { date: targetDate };
    if (routeIds.length > 0) {
      query._id = { $in: routeIds };
    }

    const schedules = await DeliverySchedule.find(query);

    // Route optimization algorithm
    const optimizedSchedules = await Promise.all(schedules.map(async (schedule) => {
      const optimizedDeliveries = await optimizeDeliveryOrder(schedule.deliveries);
      const newEstimatedDuration = calculateEstimatedDuration(optimizedDeliveries);
      
      schedule.deliveries = optimizedDeliveries;
      schedule.estimatedDuration = newEstimatedDuration;
      schedule.updatedAt = new Date();
      
      await schedule.save();
      return schedule;
    }));

    res.json({
      success: true,
      message: `Optimized ${optimizedSchedules.length} routes`,
      data: optimizedSchedules
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize routes'
    });
  }
});

// Helper functions
async function getSchedulingStats(date) {
  const filterDate = date ? new Date(date) : new Date();
  const nextDay = new Date(filterDate);
  nextDay.setDate(filterDate.getDate() + 1);

  const [schedules, unassignedCount] = await Promise.all([
    DeliverySchedule.find({
      date: { $gte: filterDate, $lt: nextDay }
    }),
    getUnassignedDeliveriesCount(filterDate)
  ]);

  const totalRoutes = schedules.length;
  const assignedDeliveries = schedules.reduce((total, schedule) => 
    total + schedule.deliveries.length, 0
  );
  
  const activeDrivers = await User.countDocuments({
    role: 'driver',
    isOnline: true
  });

  return {
    totalRoutes,
    assignedDeliveries,
    unassignedDeliveries: unassignedCount,
    activeDrivers,
    averageCapacity: totalRoutes > 0 ? Math.round((assignedDeliveries / (totalRoutes * 25)) * 100) : 0
  };
}

async function getUnassignedDeliveries(date) {
  // Mock implementation - replace with actual logic to get unassigned deliveries
  // This would typically query your subscription/order system
  return [
    {
      id: 'del-' + Date.now(),
      customerName: 'Sample Customer',
      address: '123 Sample St',
      phone: '+91 9876543210',
      mealType: 'Breakfast',
      timeSlot: '8:00-9:00 AM',
      shift: 'morning'
    }
  ];
}

async function getUnassignedDeliveriesCount(date) {
  const unassigned = await getUnassignedDeliveries(date);
  return unassigned.length;
}

async function getAvailableDrivers(date) {
  return User.find({
    role: 'driver',
    isOnline: true
  }).select('name phone email location');
}

async function autoAssignDeliveries(deliveries, drivers, shift) {
  // Simple assignment algorithm - can be made more sophisticated
  const assignments = [];
  
  drivers.forEach((driver, index) => {
    const driverDeliveries = deliveries.filter((_, i) => i % drivers.length === index);
    if (driverDeliveries.length > 0) {
      assignments.push({
        driverId: driver._id,
        shift: shift === 'both' ? (Math.random() > 0.5 ? 'morning' : 'evening') : shift,
        deliveries: driverDeliveries
      });
    }
  });

  return assignments;
}

async function optimizeDeliveryOrder(deliveries) {
  // Simple optimization - sort by time slot
  return deliveries.sort((a, b) => {
    const timeA = a.timeSlot ? a.timeSlot.split('-')[0] : '12:00';
    const timeB = b.timeSlot ? b.timeSlot.split('-')[0] : '12:00';
    return timeA.localeCompare(timeB);
  });
}

function calculateEstimatedDuration(deliveries) {
  // Simple calculation - can be made more sophisticated
  const baseTime = 30; // 30 minutes base time
  const timePerDelivery = 20; // 20 minutes per delivery
  const totalMinutes = baseTime + (deliveries.length * timePerDelivery);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * @route   POST /api/delivery-schedule/driver/sequence
 * @desc    Save delivery route sequence for a driver and create route tracking
 * @access  Private (Driver)
 */
router.post('/driver/sequence', authenticate, authorize(['delivery']), async (req, res) => {
  try {
    const { routeId, date, shift, deliveries } = req.body;
    const driverId = req.user.id;

    if (!routeId || !date || !shift || !deliveries || !Array.isArray(deliveries)) {
      return res.status(400).json({
        success: false,
        message: 'Route ID, date, shift, and deliveries array are required'
      });
    }

    console.log(`Saving route sequence for driver ${driverId}: ${deliveries.length} deliveries`);

    // Get driver information
    const driver = await User.findById(driverId).select('name phone');
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Update delivery tracking with sequence positions and delivery numbers
    const updatePromises = deliveries.map(async (delivery, index) => {
      const sequencePosition = index + 1;
      const deliveryNumber = `#${sequencePosition.toString().padStart(2, '0')}`;
      
      try {
        // First find the subscription containing this delivery
        const subscription = await Subscription.findOne({
          'deliveryTracking._id': delivery.id
        });

        if (!subscription) {
          console.warn(`Subscription not found for delivery ${delivery.id}`);
          return null;
        }

        // Verify the delivery has the correct driver
        const targetDelivery = subscription.deliveryTracking.find(
          d => d._id.toString() === delivery.id
        );

        if (!targetDelivery) {
          console.warn(`Delivery tracking not found for ${delivery.id}`);
          return null;
        }

        // Check driver match (either driver or assignedDriver field)
        const driverMatches = 
          targetDelivery.driver?.toString() === driverId ||
          targetDelivery.assignedDriver?.toString() === driverId;

        if (!driverMatches) {
          console.warn(`Driver mismatch for delivery ${delivery.id}: expected ${driverId}, got driver=${targetDelivery.driver}, assignedDriver=${targetDelivery.assignedDriver}`);
          return null;
        }

        // Use the correct update query pattern
        const result = await Subscription.findOneAndUpdate(
          { 
            '_id': subscription._id,
            'deliveryTracking._id': delivery.id
          },
          {
            $set: {
              'deliveryTracking.$.sequencePosition': sequencePosition,
              'deliveryTracking.$.deliveryNumber': deliveryNumber,
              'deliveryTracking.$.routeId': routeId,
              'deliveryTracking.$.routeStatus': 'sequenced',
              'deliveryTracking.$.assignedDriver': driverId, // Ensure assignedDriver is set
              'deliveryTracking.$.updatedAt': new Date()
            },
            $push: {
              'deliveryTracking.$.checkpoints': {
                type: 'route_sequenced',
                timestamp: new Date(),
                notes: `Added to route at position ${sequencePosition} by driver ${driver.name}`,
                sequencePosition: sequencePosition
              }
            }
          },
          { new: true, runValidators: true }
        )
        .populate('user', 'name phone')
        .populate('morningZone eveningZone', 'name');

        if (!result) {
          console.warn(`Failed to update sequence for delivery ${delivery.id} - delivery not found or driver mismatch`);
          console.warn(`Looking for: deliveryTracking._id = ${delivery.id}, driver = ${driverId}`);
          
          // Try to find the actual delivery to debug
          const debugResult = await Subscription.findOne({
            'deliveryTracking._id': delivery.id
          });
          
          if (debugResult) {
            const tracking = debugResult.deliveryTracking.find(t => t._id.toString() === delivery.id);
            console.warn(`Found delivery but driver mismatch: current driver = ${tracking?.driver}, assigned driver = ${tracking?.assignedDriver}, looking for = ${driverId}`);
          }
          
          return null;
        }

        // Get the updated tracking info
        const updatedTracking = result.deliveryTracking.find(track => 
          track._id.toString() === delivery.id
        );

        // Get zone information for serviceArea
        const zone = updatedTracking?.shift === 'morning' 
          ? result.morningZone 
          : result.eveningZone;

        return {
          deliveryId: delivery.id,
          subscriptionId: result._id,
          orderId: delivery.id, // Use delivery ID as order ID
          userId: result.user._id,
          customerName: result.user?.name || delivery.customerName,
          customerPhone: result.user?.phone,
          address: result.deliveryAddress,
          zone: zone,
          sequencePosition,
          deliveryNumber,
          status: updatedTracking?.status || 'pending',
          ETA: updatedTracking?.ETA
        };
      } catch (error) {
        console.error(`Error updating delivery ${delivery.id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result !== null);

    // Get service area from the first delivery's zone
    const serviceArea = successfulUpdates.length > 0 && successfulUpdates[0].zone 
      ? successfulUpdates[0].zone.name 
      : 'Default Area';

    // Create or update driver route in DriverRoute model
    const routeDate = new Date(date);
    let driverRoute = await DriverRoute.findOne({
      driverId,
      date: {
        $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
        $lt: new Date(routeDate.setHours(23, 59, 59, 999))
      },
      shift
    });

    const routeStops = successfulUpdates.map(update => ({
      subscriptionId: update.subscriptionId,
      orderId: update.orderId,
      userId: update.userId,
      sequenceNumber: update.sequencePosition, // Note: model uses sequenceNumber
      address: {
        name: update.customerName,
        phone: update.customerPhone,
        street: update.address?.street || '',
        city: update.address?.city || '',
        area: update.address?.area || '',
        coordinates: {
          lat: update.address?.coordinates?.[1] || 0,
          lng: update.address?.coordinates?.[0] || 0
        }
      },
      mealDetails: {
        items: [],
        specialInstructions: '',
        thaliCount: 1
      },
      status: 'pending',
      estimatedArrival: update.ETA?.estimated || null,
      actualArrival: null,
      deliveryNotes: ''
    }));

    if (driverRoute) {
      // Update existing route
      driverRoute.stops = routeStops;
      driverRoute.routeStatus = 'pending'; // Note: model uses routeStatus
      driverRoute.totalStops = successfulUpdates.length;
      driverRoute.currentLoad = successfulUpdates.length;
      driverRoute.updatedAt = new Date();
      await driverRoute.save();
    } else {
      // Create new route
      driverRoute = new DriverRoute({
        driverId,
        date: new Date(date),
        shift,
        serviceArea, // Required field
        stops: routeStops,
        routeStatus: 'pending', // Note: model uses routeStatus
        totalStops: successfulUpdates.length,
        currentLoad: successfulUpdates.length,
        completedStops: 0,
        estimatedDuration: `${Math.ceil(successfulUpdates.length * 15 / 60)} hours ${(successfulUpdates.length * 15) % 60} minutes`,
        actualDuration: null,
        startTime: null,
        endTime: null,
        notes: `Route created with ${successfulUpdates.length} deliveries`
      });
      await driverRoute.save();
    }

    res.status(200).json({
      success: true,
      message: 'Route sequence saved successfully',
      data: {
        routeId: driverRoute._id,
        driverId,
        driverName: driver.name,
        date,
        shift,
        serviceArea,
        deliveryCount: successfulUpdates.length,
        totalStops: successfulUpdates.length,
        route: {
          id: driverRoute._id,
          status: driverRoute.routeStatus,
          stops: routeStops,
          estimatedDuration: driverRoute.estimatedDuration,
          completedStops: driverRoute.completedStops,
          totalStops: driverRoute.totalStops
        },
        deliveries: successfulUpdates
      }
    });

  } catch (error) {
    console.error('Error saving route sequence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save route sequence',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/driver/complete
 * @desc    Mark a delivery as completed in the route sequence and update driver route
 * @access  Private (Driver)
 */
router.post('/driver/complete', authenticate, authorize(['delivery']), async (req, res) => {
  try {
    const { deliveryId, sequencePosition, completedAt, notes } = req.body;
    const driverId = req.user.id;

    if (!deliveryId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery ID is required'
      });
    }

    console.log(`Driver ${driverId} completing delivery ${deliveryId} at position ${sequencePosition}`);

    const completionTime = completedAt ? new Date(completedAt) : new Date();

    // Update the delivery tracking status
    const result = await Subscription.findOneAndUpdate(
      { 
        'deliveryTracking._id': deliveryId,
        'deliveryTracking.driver': driverId 
      },
      {
        $set: {
          'deliveryTracking.$.status': 'delivered',
          'deliveryTracking.$.deliveredAt': completionTime,
          'deliveryTracking.$.deliveredBy': driverId,
          'deliveryTracking.$.updatedAt': completionTime
        },
        $push: {
          'deliveryTracking.$.checkpoints': {
            type: 'delivered',
            timestamp: completionTime,
            notes: notes || `Delivery completed by driver at stop #${sequencePosition || 'unknown'}`,
            sequencePosition: sequencePosition
          }
        }
      },
      { new: true }
    ).populate('user', 'name phone');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found or not assigned to this driver'
      });
    }

    // Update driver route
    const deliveryTracking = result.deliveryTracking.find(track => 
      track._id.toString() === deliveryId
    );

    if (deliveryTracking) {
      const routeDate = new Date(deliveryTracking.date);
      const shift = deliveryTracking.shift;

      // Find and update the driver route
      const driverRoute = await DriverRoute.findOne({
        driverId,
        date: {
          $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
          $lt: new Date(routeDate.setHours(23, 59, 59, 999))
        },
        shift
      });

      if (driverRoute) {
        // Update the specific stop in the route
        // Try multiple matching strategies to ensure we find the correct stop
        const stopIndex = driverRoute.stops.findIndex(stop => {
          // Primary match: orderId should match the deliveryTracking._id
          if (stop.orderId === deliveryId) {
            return true;
          }
          
          // Secondary match: subscriptionId matches
          if (stop.subscriptionId && deliveryTracking.subscriptionId && 
              stop.subscriptionId.toString() === deliveryTracking.subscriptionId.toString()) {
            return true;
          }
          
          // Tertiary match: userId matches and same address/customer
          if (stop.userId && deliveryTracking.userId &&
              stop.userId.toString() === deliveryTracking.userId.toString() &&
              stop.address && result.deliveryAddress) {
            // Additional check: same customer name or address
            const customerMatch = stop.address.name === result.user?.name ||
              stop.address.street === result.deliveryAddress.street;
            if (customerMatch) {
              return true;
            }
          }
          
          return false;
        });

        if (stopIndex !== -1) {
          // Update the stop status
          driverRoute.stops[stopIndex].status = 'delivered';
          driverRoute.stops[stopIndex].actualArrival = completionTime;
          driverRoute.stops[stopIndex].deliveryNotes = notes || '';
          driverRoute.stops[stopIndex].completedAt = completionTime;
          
          // Update route progress
          driverRoute.completedStops = driverRoute.stops.filter(stop => 
            stop.status === 'delivered'
          ).length;

          // Update current stop index
          driverRoute.currentStopIndex = Math.max(driverRoute.currentStopIndex, stopIndex + 1);

          // Check if route is completed
          if (driverRoute.completedStops === driverRoute.totalStops) {
            driverRoute.routeStatus = 'completed';
            driverRoute.endTime = completionTime;
            driverRoute.actualDuration = Math.round(
              (completionTime - driverRoute.startTime) / (1000 * 60)
            ); // Duration in minutes
          } else if (driverRoute.routeStatus === 'pending' && driverRoute.completedStops === 1) {
            // First delivery - mark route as started
            driverRoute.routeStatus = 'active';
            driverRoute.startTime = completionTime;
          } else if (driverRoute.routeStatus === 'pending') {
            // Route has started
            driverRoute.routeStatus = 'active';
            if (!driverRoute.startTime) {
              driverRoute.startTime = completionTime;
            }
          }

          driverRoute.updatedAt = completionTime;
          await driverRoute.save();

          console.log(`Successfully updated DriverRoute stop at index ${stopIndex} for delivery ${deliveryId}`);
        } else {
          console.error(`Could not find matching stop in DriverRoute for delivery ${deliveryId}`);
          console.log(`Available stops:`, driverRoute.stops.map(stop => ({
            orderId: stop.orderId,
            subscriptionId: stop.subscriptionId,
            userId: stop.userId,
            customerName: stop.address?.name
          })));
        }
      } else {
        console.error(`Could not find DriverRoute for driver ${driverId} on ${deliveryTracking?.date} ${deliveryTracking?.shift}`);
      }
    }

    // Calculate updated ETAs for remaining deliveries in the route
    await updateRemainingDeliveryETAs(driverId, deliveryTracking?.date, deliveryTracking?.shift, sequencePosition);

    // Get updated route progress for response
    const updatedRoute = await DriverRoute.findOne({
      driverId,
      date: {
        $gte: new Date(deliveryTracking?.date).setHours(0, 0, 0, 0),
        $lt: new Date(deliveryTracking?.date).setHours(23, 59, 59, 999)
      },
      shift: deliveryTracking?.shift
    });

    const routeProgress = updatedRoute ? {
      totalStops: updatedRoute.totalStops,
      completedStops: updatedRoute.completedStops,
      remainingStops: updatedRoute.totalStops - updatedRoute.completedStops,
      progressPercentage: Math.round((updatedRoute.completedStops / updatedRoute.totalStops) * 100),
      status: updatedRoute.routeStatus,
      currentStopIndex: updatedRoute.currentStopIndex,
      nextStop: updatedRoute.stops.find(stop => stop.status === 'pending')
    } : null;

    res.status(200).json({
      success: true,
      message: 'Delivery marked as completed successfully',
      data: {
        deliveryId,
        sequencePosition,
        completedAt: completionTime,
        status: 'delivered',
        customerName: result.user?.name,
        subscriptionUpdated: true,
        driverRouteUpdated: updatedRoute ? true : false,
        routeProgress,
        nextDelivery: routeProgress?.nextStop
      }
    });

  } catch (error) {
    console.error('Error marking delivery as completed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark delivery as completed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/driver/route-progress/:date/:shift
 * @desc    Get real-time route progress for customers
 * @access  Public (for customer tracking)
 */
router.get('/driver/route-progress/:date/:shift', async (req, res) => {
  try {
    const { date, shift } = req.params;
    const { subscriptionId, customerPhone } = req.query;

    if (!subscriptionId && !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID or customer phone number is required'
      });
    }

    const targetDate = new Date(date);
    
    // Find all deliveries for this date and shift, sorted by sequence
    const subscriptions = await Subscription.find({
      status: 'active',
      deliveryTracking: {
        $elemMatch: {
          date: {
            $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            $lt: new Date(targetDate.setHours(23, 59, 59, 999))
          },
          shift: shift,
          sequencePosition: { $exists: true }
        }
      }
    })
    .populate('user', 'name phone')
    .populate('deliveryTracking.driver', 'name')
    .sort({ 'deliveryTracking.sequencePosition': 1 });

    // Build route progress
    const routeProgress = [];
    let customerPosition = -1;
    
    subscriptions.forEach(subscription => {
      const relevantTracking = subscription.deliveryTracking.find(track => {
        const trackDate = new Date(track.date);
        return trackDate.toDateString() === targetDate.toDateString() && 
               track.shift === shift && 
               track.sequencePosition;
      });

      if (relevantTracking) {
        const progressStop = {
          sequencePosition: relevantTracking.sequencePosition,
          customerName: subscription.user.name,
          customerPhone: subscription.user.phone,
          status: relevantTracking.status,
          deliveredAt: relevantTracking.deliveredAt,
          isCompleted: relevantTracking.status === 'delivered',
          ETA: relevantTracking.ETA
        };

        routeProgress.push(progressStop);

        // Check if this is the customer requesting the update
        if ((subscriptionId && subscription._id.toString() === subscriptionId) ||
            (customerPhone && subscription.user.phone === customerPhone)) {
          customerPosition = relevantTracking.sequencePosition;
        }
      }
    });

    // Sort by sequence position
    routeProgress.sort((a, b) => a.sequencePosition - b.sequencePosition);

    // Calculate progress statistics
    const totalStops = routeProgress.length;
    const completedStops = routeProgress.filter(stop => stop.isCompleted).length;
    const currentStop = routeProgress.find(stop => !stop.isCompleted)?.sequencePosition || totalStops;

    res.status(200).json({
      success: true,
      data: {
        date,
        shift,
        routeProgress,
        customerPosition,
        statistics: {
          totalStops,
          completedStops,
          currentStop,
          progressPercentage: Math.round((completedStops / totalStops) * 100)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching route progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route progress',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/customer/tracking/:deliveryId
 * @desc    Get customer's delivery tracking info including position in route
 * @access  Private (Customer)
 */
router.get('/customer/tracking/:deliveryId', authenticate, async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const customerId = req.user.id;

    // Get delivery tracking info
    const subscription = await Subscription.findOne({
      'deliveryTracking._id': deliveryId,
      user: customerId
    })
    .populate('user', 'name phone email address')
    .populate('deliveryTracking.driver', 'name phone vehicle');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found or not authorized'
      });
    }

    const deliveryTracking = subscription.deliveryTracking.find(track => 
      track._id.toString() === deliveryId
    );

    if (!deliveryTracking) {
      return res.status(404).json({
        success: false,
        message: 'Delivery tracking not found'
      });
    }

    // Get driver route to find position
    const routeDate = new Date(deliveryTracking.date);
    const driverRoute = await DriverRoute.findOne({
      driverId: deliveryTracking.driver._id,
      date: {
        $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
        $lt: new Date(routeDate.setHours(23, 59, 59, 999))
      },
      shift: deliveryTracking.shift
    });

    let routeInfo = null;
    let deliveryPosition = null;

    if (driverRoute && deliveryTracking.routeId) {
      const customerStop = driverRoute.stops.find(stop => 
        stop.subscriptionId.toString() === subscription._id.toString()
      );

      if (customerStop) {
        deliveryPosition = {
          deliveryNumber: `#${customerStop.sequenceNumber.toString().padStart(2, '0')}`,
          sequencePosition: customerStop.sequenceNumber,
          totalStops: driverRoute.totalStops,
          completedStops: driverRoute.completedStops,
          remainingStops: driverRoute.totalStops - driverRoute.completedStops,
          status: customerStop.status,
          estimatedTime: customerStop.estimatedArrival,
          actualTime: customerStop.actualArrival
        };

        // Calculate deliveries ahead
        const completedStops = driverRoute.stops.filter(stop => 
          stop.status === 'delivered' && stop.sequenceNumber < customerStop.sequenceNumber
        ).length;
        
        const deliveriesAhead = Math.max(0, customerStop.sequenceNumber - 1 - completedStops);

        routeInfo = {
          routeStatus: driverRoute.routeStatus,
          driverInfo: {
            name: deliveryTracking.driver.name,
            phone: deliveryTracking.driver.phone,
            vehicle: deliveryTracking.driver.vehicle
          },
          progressPercentage: Math.round((driverRoute.completedStops / driverRoute.totalStops) * 100),
          deliveriesAhead,
          positionMessage: deliveriesAhead > 0 
            ? `You are stop #${customerStop.sequenceNumber} - ${deliveriesAhead} deliveries ahead of you`
            : customerStop.status === 'delivered'
              ? 'Your delivery has been completed!'
              : 'You are next in line for delivery!',
          nextDelivery: deliveriesAhead === 0 && customerStop.status !== 'delivered'
        };
      }
    }

    // Format response
    const trackingInfo = {
      deliveryId: deliveryTracking._id,
      status: deliveryTracking.status,
      orderDate: deliveryTracking.date,
      shift: deliveryTracking.shift,
      customerInfo: {
        name: subscription.user.name,
        address: subscription.user.address
      },
      deliveryDetails: {
        items: subscription.items,
        totalAmount: subscription.totalAmount,
        specialInstructions: deliveryTracking.specialInstructions
      },
      timeline: {
        scheduled: deliveryTracking.createdAt,
        assigned: deliveryTracking.assignedAt,
        sequenced: deliveryTracking.checkpoints.find(cp => cp.type === 'route_sequenced')?.timestamp,
        estimated: deliveryTracking.estimatedArrival,
        delivered: deliveryTracking.deliveredAt
      },
      checkpoints: deliveryTracking.checkpoints,
      routeInfo,
      deliveryPosition
    };

    res.status(200).json({
      success: true,
      data: trackingInfo
    });

  } catch (error) {
    console.error('Error getting customer tracking info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tracking information',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/customer/route-updates/:deliveryId
 * @desc    Get real-time route updates for customer's delivery
 * @access  Private (Customer)
 */
router.get('/customer/route-updates/:deliveryId', authenticate, async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const customerId = req.user.id;

    // Verify customer owns this delivery
    const subscription = await Subscription.findOne({
      'deliveryTracking._id': deliveryId,
      user: customerId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found or not authorized'
      });
    }

    const deliveryTracking = subscription.deliveryTracking.find(track => 
      track._id.toString() === deliveryId
    );

    if (!deliveryTracking) {
      return res.status(404).json({
        success: false,
        message: 'Delivery tracking not found'
      });
    }

    // Get current route progress
    const routeDate = new Date(deliveryTracking.date);
    const driverRoute = await DriverRoute.findOne({
      driverId: deliveryTracking.driver,
      date: {
        $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
        $lt: new Date(routeDate.setHours(23, 59, 59, 999))
      },
      shift: deliveryTracking.shift
    });

    if (!driverRoute) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    const customerStop = driverRoute.stops.find(stop => 
      stop.subscriptionId.toString() === subscription._id.toString()
    );

    if (!customerStop) {
      return res.status(404).json({
        success: false,
        message: 'Customer stop not found in route'
      });
    }

    // Calculate real-time position
    const completedStops = driverRoute.stops.filter(stop => 
      stop.status === 'delivered' && stop.sequenceNumber < customerStop.sequenceNumber
    ).length;
    
    const deliveriesAhead = Math.max(0, customerStop.sequenceNumber - 1 - completedStops);
    
    // Get next few stops for context
    const upcomingStops = driverRoute.stops
      .filter(stop => stop.status === 'pending' && stop.sequenceNumber < customerStop.sequenceNumber)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .slice(0, 3)
      .map(stop => ({
        deliveryNumber: `#${stop.sequenceNumber.toString().padStart(2, '0')}`,
        estimatedTime: stop.estimatedArrival,
        address: stop.address
      }));

    const routeUpdates = {
      currentStatus: customerStop.status,
      deliveryNumber: `#${customerStop.sequenceNumber.toString().padStart(2, '0')}`,
      sequencePosition: customerStop.sequenceNumber,
      deliveriesAhead,
      estimatedArrival: customerStop.estimatedArrival,
      routeStatus: driverRoute.routeStatus,
      progressPercentage: Math.round((driverRoute.completedStops / driverRoute.totalStops) * 100),
      positionMessage: deliveriesAhead > 0 
        ? `You are delivery #${customerStop.sequenceNumber.toString().padStart(2, '0')} - ${deliveriesAhead} stops ahead of you`
        : customerStop.status === 'delivered'
          ? 'Delivered!'
          : 'Next delivery!',
      upcomingStops,
      lastUpdated: new Date()
    };

    res.status(200).json({
      success: true,
      data: routeUpdates
    });

  } catch (error) {
    console.error('Error getting route updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get route updates',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/debug/sync-status/:driverId/:date/:shift
 * @desc    Debug endpoint to check sync status between Subscription and DriverRoute schemas
 * @access  Private (Admin/Driver)
 */
router.get('/debug/sync-status/:driverId/:date/:shift', authenticate, authorize(['admin', 'super-admin', 'delivery']), async (req, res) => {
  try {
    const { driverId, date, shift } = req.params;

    const routeDate = new Date(date);
    
    // Find driver route
    const driverRoute = await DriverRoute.findOne({
      driverId,
      date: {
        $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
        $lt: new Date(routeDate.setHours(23, 59, 59, 999))
      },
      shift
    });

    if (!driverRoute) {
      return res.status(404).json({
        success: false,
        message: 'DriverRoute not found'
      });
    }

    // Find all subscription deliveries for this driver on this date/shift
    const subscriptions = await Subscription.find({
      'deliveryTracking.driver': driverId,
      'deliveryTracking.date': {
        $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
        $lt: new Date(routeDate.setHours(23, 59, 59, 999))
      },
      'deliveryTracking.shift': shift
    }).populate('user', 'name phone');

    // Extract relevant delivery tracking records
    const deliveryTrackings = [];
    subscriptions.forEach(sub => {
      const relevantTracking = sub.deliveryTracking.filter(track => 
        track.driver && track.driver.toString() === driverId &&
        track.shift === shift &&
        new Date(track.date).toDateString() === routeDate.toDateString()
      );
      
      relevantTracking.forEach(track => {
        deliveryTrackings.push({
          deliveryTrackingId: track._id,
          subscriptionId: sub._id,
          customerName: sub.user?.name,
          status: track.status,
          deliveredAt: track.deliveredAt,
          checkpoints: track.checkpoints,
          subscriptionData: {
            id: sub._id.toString(),
            customerName: sub.user?.name,
            address: sub.deliveryAddress
          }
        });
      });
    });

    // Compare with DriverRoute stops
    const syncStatus = driverRoute.stops.map(stop => {
      const matchingDelivery = deliveryTrackings.find(dt => 
        dt.deliveryTrackingId.toString() === stop.orderId ||
        dt.subscriptionId.toString() === stop.subscriptionId?.toString()
      );

      return {
        stopData: {
          orderId: stop.orderId,
          subscriptionId: stop.subscriptionId?.toString(),
          sequenceNumber: stop.sequenceNumber,
          status: stop.status,
          customerName: stop.address?.name,
          actualArrival: stop.actualArrival
        },
        matchingDelivery: matchingDelivery ? {
          deliveryTrackingId: matchingDelivery.deliveryTrackingId.toString(),
          status: matchingDelivery.status,
          deliveredAt: matchingDelivery.deliveredAt,
          customerName: matchingDelivery.customerName
        } : null,
        isSynced: matchingDelivery ? 
          (stop.status === matchingDelivery.status) : false,
        issues: []
      };
    });

    // Identify sync issues
    syncStatus.forEach(item => {
      if (!item.matchingDelivery) {
        item.issues.push('No matching delivery tracking found');
      } else {
        if (item.stopData.status !== item.matchingDelivery.status) {
          item.issues.push(`Status mismatch: DriverRoute(${item.stopData.status}) vs DeliveryTracking(${item.matchingDelivery.status})`);
        }
        if (item.stopData.actualArrival && item.matchingDelivery.deliveredAt) {
          const stopTime = new Date(item.stopData.actualArrival).getTime();
          const deliveryTime = new Date(item.matchingDelivery.deliveredAt).getTime();
          if (Math.abs(stopTime - deliveryTime) > 60000) { // More than 1 minute difference
            item.issues.push('Delivery time mismatch between schemas');
          }
        }
      }
    });

    // Find orphaned delivery trackings
    const orphanedDeliveries = deliveryTrackings.filter(dt => 
      !driverRoute.stops.some(stop => 
        stop.orderId === dt.deliveryTrackingId.toString() ||
        stop.subscriptionId?.toString() === dt.subscriptionId.toString()
      )
    );

    const summary = {
      totalDriverRouteStops: driverRoute.stops.length,
      totalDeliveryTrackings: deliveryTrackings.length,
      syncedItems: syncStatus.filter(item => item.isSynced && item.issues.length === 0).length,
      issuesFound: syncStatus.reduce((count, item) => count + item.issues.length, 0),
      orphanedDeliveries: orphanedDeliveries.length
    };

    res.json({
      success: true,
      data: {
        driverRoute: {
          id: driverRoute._id,
          driverId,
          date,
          shift,
          routeStatus: driverRoute.routeStatus,
          totalStops: driverRoute.totalStops,
          completedStops: driverRoute.completedStops
        },
        summary,
        syncStatus,
        orphanedDeliveries,
        recommendations: summary.issuesFound > 0 ? [
          'Check orderId matching between schemas',
          'Verify driver assignment consistency',
          'Ensure completion time synchronization'
        ] : ['Schemas are properly synchronized']
      }
    });

  } catch (error) {
    console.error('Sync status debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check sync status',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/debug/sync-repair/:driverId/:date/:shift
 * @desc    Repair sync issues between Subscription and DriverRoute schemas
 * @access  Private (Admin)
 */
router.post('/debug/sync-repair/:driverId/:date/:shift', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { driverId, date, shift } = req.params;
    const { repairType = 'status_sync' } = req.body;

    const routeDate = new Date(date);
    
    // Find driver route
    const driverRoute = await DriverRoute.findOne({
      driverId,
      date: {
        $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
        $lt: new Date(routeDate.setHours(23, 59, 59, 999))
      },
      shift
    });

    if (!driverRoute) {
      return res.status(404).json({
        success: false,
        message: 'DriverRoute not found'
      });
    }

    let repairResults = {
      statusSynced: 0,
      timesSynced: 0,
      issuesFixed: []
    };

    // Find all subscription deliveries for this driver on this date/shift
    const subscriptions = await Subscription.find({
      'deliveryTracking.driver': driverId,
      'deliveryTracking.date': {
        $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
        $lt: new Date(routeDate.setHours(23, 59, 59, 999))
      },
      'deliveryTracking.shift': shift
    });

    // Repair status sync
    if (repairType === 'status_sync' || repairType === 'all') {
      for (const stop of driverRoute.stops) {
        // Find matching delivery tracking
        for (const subscription of subscriptions) {
          const trackingIndex = subscription.deliveryTracking.findIndex(track =>
            track._id.toString() === stop.orderId ||
            (track.driver && track.driver.toString() === driverId && 
             subscription._id.toString() === stop.subscriptionId?.toString())
          );

          if (trackingIndex !== -1) {
            const tracking = subscription.deliveryTracking[trackingIndex];
            
            // Sync status from DeliveryTracking to DriverRoute (DeliveryTracking is source of truth)
            if (stop.status !== tracking.status) {
              stop.status = tracking.status;
              stop.actualArrival = tracking.deliveredAt;
              if (tracking.status === 'delivered') {
                stop.completedAt = tracking.deliveredAt;
              }
              repairResults.statusSynced++;
              repairResults.issuesFixed.push(`Synced stop ${stop.sequenceNumber} status from ${stop.status} to ${tracking.status}`);
            }

            // Sync delivery times
            if (tracking.deliveredAt && (!stop.actualArrival || 
                Math.abs(new Date(stop.actualArrival).getTime() - new Date(tracking.deliveredAt).getTime()) > 60000)) {
              stop.actualArrival = tracking.deliveredAt;
              stop.completedAt = tracking.deliveredAt;
              repairResults.timesSynced++;
              repairResults.issuesFixed.push(`Synced stop ${stop.sequenceNumber} delivery time`);
            }
          }
        }
      }

      // Update route progress counters
      driverRoute.completedStops = driverRoute.stops.filter(stop => stop.status === 'delivered').length;
      
      // Update route status
      if (driverRoute.completedStops === driverRoute.totalStops && driverRoute.routeStatus !== 'completed') {
        driverRoute.routeStatus = 'completed';
        const lastDelivery = driverRoute.stops
          .filter(stop => stop.status === 'delivered')
          .sort((a, b) => new Date(b.actualArrival) - new Date(a.actualArrival))[0];
        if (lastDelivery && lastDelivery.actualArrival) {
          driverRoute.endTime = lastDelivery.actualArrival;
        }
        repairResults.issuesFixed.push('Updated route status to completed');
      } else if (driverRoute.completedStops > 0 && driverRoute.routeStatus === 'pending') {
        driverRoute.routeStatus = 'active';
        const firstDelivery = driverRoute.stops
          .filter(stop => stop.status === 'delivered')
          .sort((a, b) => new Date(a.actualArrival) - new Date(b.actualArrival))[0];
        if (firstDelivery && firstDelivery.actualArrival && !driverRoute.startTime) {
          driverRoute.startTime = firstDelivery.actualArrival;
        }
        repairResults.issuesFixed.push('Updated route status to active');
      }

      await driverRoute.save();
    }

    res.json({
      success: true,
      message: 'Sync repair completed',
      data: {
        repairType,
        repairResults,
        finalStatus: {
          routeStatus: driverRoute.routeStatus,
          completedStops: driverRoute.completedStops,
          totalStops: driverRoute.totalStops
        }
      }
    });

  } catch (error) {
    console.error('Sync repair error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to repair sync issues',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/debug/test-single-update/:deliveryId
 * @desc    Test updating a single delivery for debugging
 * @access  Public (for testing)
 */
router.post('/debug/test-single-update/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { driverId = '689f8f1af5789fc0c43e3eb8', sequencePosition = 999 } = req.body;
    
    const deliveryNumber = `#${sequencePosition.toString().padStart(3, '0')}`;
    
    console.log(`🔧 Testing single update for delivery ${deliveryId}`);
    console.log(`Driver: ${driverId}, Sequence: ${sequencePosition}, Number: ${deliveryNumber}`);

    // First, check if the delivery exists and get the exact subscription
    const subscription = await Subscription.findOne({
      'deliveryTracking._id': deliveryId
    });

    if (!subscription) {
      return res.json({
        success: false,
        message: 'Delivery not found in any subscription'
      });
    }

    const targetDelivery = subscription.deliveryTracking.find(d => d._id.toString() === deliveryId);
    if (!targetDelivery) {
      return res.json({
        success: false,
        message: 'Delivery tracking not found'
      });
    }

    // Check driver mismatch
    if (targetDelivery.driver?.toString() !== driverId) {
      return res.json({
        success: false,
        message: 'Driver mismatch',
        expected: driverId,
        actual: targetDelivery.driver?.toString()
      });
    }

    console.log('Target delivery before update:', {
      id: targetDelivery._id,
      driver: targetDelivery.driver,
      sequencePosition: targetDelivery.sequencePosition,
      deliveryNumber: targetDelivery.deliveryNumber
    });

    // Show all deliveries before update for comparison
    const beforeAll = subscription.deliveryTracking.map(d => ({
      id: d._id.toString(),
      sequencePosition: d.sequencePosition,
      driver: d.driver?.toString()
    }));
    console.log('All deliveries before:', beforeAll);

    // Try the update using the exact array element update
    const updateResult = await Subscription.updateOne(
      { 
        '_id': subscription._id,
        'deliveryTracking._id': deliveryId
      },
      {
        $set: {
          'deliveryTracking.$.sequencePosition': sequencePosition,
          'deliveryTracking.$.deliveryNumber': deliveryNumber,
          'deliveryTracking.$.routeId': 'test-route-999',
          'deliveryTracking.$.routeStatus': 'sequenced',
          'deliveryTracking.$.updatedAt': new Date()
        }
      }
    );

    console.log('Update result:', updateResult);

    // Get the subscription after update
    const afterSubscription = await Subscription.findById(subscription._id);
    const afterDelivery = afterSubscription.deliveryTracking.find(d => d._id.toString() === deliveryId);
    
    const afterAll = afterSubscription.deliveryTracking.map(d => ({
      id: d._id.toString(),
      sequencePosition: d.sequencePosition,
      driver: d.driver?.toString()
    }));
    console.log('All deliveries after:', afterAll);

    res.json({
      success: updateResult.modifiedCount > 0,
      message: updateResult.modifiedCount > 0 ? 'Update successful' : 'Update failed',
      updateResult,
      subscriptionId: subscription._id,
      targetDeliveryId: deliveryId,
      before: {
        sequencePosition: targetDelivery.sequencePosition,
        deliveryNumber: targetDelivery.deliveryNumber,
        driver: targetDelivery.driver?.toString()
      },
      after: {
        sequencePosition: afterDelivery.sequencePosition,
        deliveryNumber: afterDelivery.deliveryNumber,
        routeId: afterDelivery.routeId,
        driver: afterDelivery.driver?.toString(),
        updatedAt: afterDelivery.updatedAt
      },
      beforeAll,
      afterAll
    });

  } catch (error) {
    console.error('Test single update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test update',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/debug/check-delivery/:deliveryId
 * @desc    Check specific delivery tracking data
 * @access  Public (for testing)
 */
router.get('/debug/check-delivery/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    console.log(`🔍 Checking delivery ${deliveryId}`);

    // Find the subscription containing this delivery tracking
    const subscription = await Subscription.findOne({
      'deliveryTracking._id': deliveryId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    const delivery = subscription.deliveryTracking.find(
      d => d._id.toString() === deliveryId
    );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery tracking entry not found'
      });
    }

    res.json({
      success: true,
      delivery: {
        _id: delivery._id,
        subscriptionId: subscription._id,
        date: delivery.date,
        shift: delivery.shift,
        status: delivery.status,
        driver: delivery.driver,
        assignedDriver: delivery.assignedDriver,
        sequencePosition: delivery.sequencePosition,
        deliveryNumber: delivery.deliveryNumber,
        routeId: delivery.routeId,
        routeStatus: delivery.routeStatus,
        updatedAt: delivery.updatedAt,
        createdAt: delivery.createdAt,
        hasSequencePosition: !!delivery.sequencePosition,
        hasDeliveryNumber: !!delivery.deliveryNumber,
        checkpoints: delivery.checkpoints || []
      }
    });

  } catch (error) {
    console.error('Check delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check delivery',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/debug/test-sequence-save
 * @desc    Test sequence saving with sample data
 * @access  Public (for testing)
 */
router.post('/debug/test-sequence-save', async (req, res) => {
  try {
    const { driverId, date, shift } = req.body;
    
    if (!driverId || !date || !shift) {
      return res.status(400).json({
        success: false,
        message: 'driverId, date, and shift are required'
      });
    }

    console.log(`🧪 Testing sequence save for driver ${driverId} on ${date} ${shift}`);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find deliveries for this driver, date, and shift
    const subscriptions = await Subscription.find({
      'deliveryTracking.date': {
        $gte: targetDate,
        $lt: nextDay
      },
      'deliveryTracking.driver': driverId,
      'deliveryTracking.shift': shift
    });

    const deliveries = [];
    
    for (const subscription of subscriptions) {
      const relevantTrackings = subscription.deliveryTracking.filter(tracking => {
        const trackingDate = new Date(tracking.date);
        trackingDate.setHours(0, 0, 0, 0);
        return trackingDate.getTime() === targetDate.getTime() && 
               tracking.shift === shift &&
               tracking.driver?.toString() === driverId;
      });

      for (const tracking of relevantTrackings) {
        deliveries.push({
          id: tracking._id.toString(),
          subscriptionId: subscription._id
        });
      }
    }

    if (deliveries.length === 0) {
      return res.json({
        success: false,
        message: 'No deliveries found for the specified driver, date, and shift',
        driverId,
        date,
        shift
      });
    }

    // Test the sequence saving logic
    const results = [];
    for (let i = 0; i < deliveries.length; i++) {
      const delivery = deliveries[i];
      const sequencePosition = i + 1;
      const deliveryNumber = `#${sequencePosition.toString().padStart(2, '0')}`;
      
      console.log(`🔄 Testing update for delivery ${delivery.id} -> position ${sequencePosition}`);
      
      try {
        const result = await Subscription.findOneAndUpdate(
          { 
            'deliveryTracking._id': delivery.id,
            'deliveryTracking.driver': driverId
          },
          {
            $set: {
              'deliveryTracking.$.sequencePosition': sequencePosition,
              'deliveryTracking.$.deliveryNumber': deliveryNumber,
              'deliveryTracking.$.routeId': 'test-route-id',
              'deliveryTracking.$.routeStatus': 'sequenced',
              'deliveryTracking.$.assignedDriver': driverId,
              'deliveryTracking.$.updatedAt': new Date()
            }
          },
          { new: true }
        );

        if (result) {
          console.log(`✅ Successfully updated delivery ${delivery.id} to position ${sequencePosition}`);
          results.push({
            deliveryId: delivery.id,
            success: true,
            sequencePosition,
            deliveryNumber
          });
        } else {
          console.warn(`❌ Failed to update delivery ${delivery.id} - not found or driver mismatch`);
          results.push({
            deliveryId: delivery.id,
            success: false,
            error: 'Delivery not found or driver mismatch'
          });
        }
      } catch (error) {
        console.error(`❌ Error updating delivery ${delivery.id}:`, error);
        results.push({
          deliveryId: delivery.id,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Test sequence save completed',
      driverId,
      date,
      shift,
      totalDeliveries: deliveries.length,
      results,
      successfulUpdates: results.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Test sequence save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test sequence save',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/debug/check-structure/:deliveryId
 * @desc    Check complete delivery and subscription structure
 * @access  Public (for testing)
 */
router.get('/debug/check-structure/:deliveryId', async (req, res) => {
  try {
    const { deliveryId } = req.params;

    console.log(`🔍 Checking complete structure for delivery ${deliveryId}`);

    // Find the complete subscription
    const subscription = await Subscription.findOne({
      'deliveryTracking._id': deliveryId
    }).populate('user', 'name phone email');

    if (!subscription) {
      return res.json({ 
        success: false, 
        message: 'Delivery not found in any subscription' 
      });
    }

    // Find the specific delivery tracking
    const delivery = subscription.deliveryTracking.find(
      d => d._id.toString() === deliveryId
    );

    if (!delivery) {
      return res.json({ 
        success: false, 
        message: 'Delivery tracking not found in subscription' 
      });
    }

    // Get all delivery tracking for this subscription
    const allDeliveries = subscription.deliveryTracking.map(d => ({
      id: d._id,
      date: d.date,
      shift: d.shift,
      status: d.status,
      driver: d.driver,
      assignedDriver: d.assignedDriver,
      sequencePosition: d.sequencePosition,
      deliveryNumber: d.deliveryNumber,
      routeId: d.routeId
    }));

    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        subscriptionId: subscription.subscriptionId,
        user: subscription.user
      },
      targetDelivery: {
        id: delivery._id,
        date: delivery.date,
        shift: delivery.shift,
        status: delivery.status,
        driver: delivery.driver,
        assignedDriver: delivery.assignedDriver,
        sequencePosition: delivery.sequencePosition,
        deliveryNumber: delivery.deliveryNumber,
        routeId: delivery.routeId,
        routeStatus: delivery.routeStatus,
        updatedAt: delivery.updatedAt,
        createdAt: delivery.createdAt,
        hasSequence: !!(delivery.sequencePosition || delivery.deliveryNumber),
        checkpoints: delivery.checkpoints || []
      },
      allDeliveries: allDeliveries,
      deliveryTrackingCount: subscription.deliveryTracking.length,
      hasSequencedDeliveries: allDeliveries.filter(d => d.sequencePosition).length
    });

  } catch (error) {
    console.error('Debug structure check error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/debug/check-fields/:driverId/:date
 * @desc    Check which driver field is being used in delivery tracking
 * @access  Public (for testing)
 */
router.get('/debug/check-fields/:driverId/:date', async (req, res) => {
  try {
    const { driverId, date } = req.params;
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find all subscriptions with delivery tracking for this date
    const subscriptions = await Subscription.find({
      'deliveryTracking.date': {
        $gte: targetDate,
        $lt: nextDay
      }
    });

    const fieldAnalysis = {
      totalDeliveries: 0,
      withDriver: 0,
      withAssignedDriver: 0,
      matchingDriver: 0,
      matchingAssignedDriver: 0,
      withSequencePosition: 0,
      samples: []
    };

    for (const subscription of subscriptions) {
      const relevantTrackings = subscription.deliveryTracking.filter(tracking => {
        const trackingDate = new Date(tracking.date);
        trackingDate.setHours(0, 0, 0, 0);
        return trackingDate.getTime() === targetDate.getTime();
      });

      for (const tracking of relevantTrackings) {
        fieldAnalysis.totalDeliveries++;
        
        if (tracking.driver) {
          fieldAnalysis.withDriver++;
          if (tracking.driver.toString() === driverId) {
            fieldAnalysis.matchingDriver++;
          }
        }
        
        if (tracking.assignedDriver) {
          fieldAnalysis.withAssignedDriver++;
          if (tracking.assignedDriver.toString() === driverId) {
            fieldAnalysis.matchingAssignedDriver++;
          }
        }
        
        if (tracking.sequencePosition) {
          fieldAnalysis.withSequencePosition++;
        }
        
        // Add sample data for first 5 deliveries
        if (fieldAnalysis.samples.length < 5) {
          fieldAnalysis.samples.push({
            deliveryId: tracking._id,
            hasDriver: !!tracking.driver,
            hasAssignedDriver: !!tracking.assignedDriver,
            driverValue: tracking.driver?.toString(),
            assignedDriverValue: tracking.assignedDriver?.toString(),
            sequencePosition: tracking.sequencePosition,
            deliveryNumber: tracking.deliveryNumber,
            status: tracking.status,
            shift: tracking.shift
          });
        }
      }
    }

    res.json({
      success: true,
      driverId,
      date,
      fieldAnalysis
    });

  } catch (error) {
    console.error('Field check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check fields',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/debug/sequence-test/:driverId/:date
 * @desc    Simple test to check if sequence positions are being returned correctly
 * @access  Public (for testing)
 */
router.get('/debug/sequence-test/:driverId/:date', async (req, res) => {
  try {
    const { driverId, date } = req.params;
    
    console.log(`🧪 Testing sequence data for driver ${driverId} on ${date}`);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find subscriptions with delivery tracking for this date
    const subscriptions = await Subscription.find({
      'deliveryTracking.date': {
        $gte: targetDate,
        $lt: nextDay
      },
      $or: [
        { 'deliveryTracking.driver': driverId },
        { 'deliveryTracking.assignedDriver': driverId }
      ]
    }).populate('user', 'name phone');

    const sequenceData = [];

    for (const subscription of subscriptions) {
      const relevantTrackings = subscription.deliveryTracking.filter(tracking => {
        const trackingDate = new Date(tracking.date);
        trackingDate.setHours(0, 0, 0, 0);
        return trackingDate.getTime() === targetDate.getTime() && 
               (tracking.driver?.toString() === driverId || 
                tracking.assignedDriver?.toString() === driverId);
      });

      for (const tracking of relevantTrackings) {
        sequenceData.push({
          subscriptionId: subscription._id,
          deliveryTrackingId: tracking._id,
          customerName: subscription.user?.name,
          phone: subscription.user?.phone,
          sequencePosition: tracking.sequencePosition,
          deliveryNumber: tracking.deliveryNumber,
          routeId: tracking.routeId,
          status: tracking.status,
          shift: tracking.shift,
          hasSequencePosition: !!tracking.sequencePosition,
          hasDeliveryNumber: !!tracking.deliveryNumber,
          hasRouteId: !!tracking.routeId
        });
      }
    }

    // Sort by sequence position
    sequenceData.sort((a, b) => (a.sequencePosition || 999) - (b.sequencePosition || 999));

    res.json({
      success: true,
      testDate: date,
      driverId,
      totalDeliveries: sequenceData.length,
      withSequencePosition: sequenceData.filter(d => d.hasSequencePosition).length,
      withDeliveryNumber: sequenceData.filter(d => d.hasDeliveryNumber).length,
      withRouteId: sequenceData.filter(d => d.hasRouteId).length,
      deliveries: sequenceData
    });

  } catch (error) {
    console.error('Sequence test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run sequence test',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/debug/test-delivery-completion
 * @desc    Test delivery completion and DriverRoute synchronization  
 * @access  Public (for testing)
 */
router.post('/debug/test-delivery-completion', async (req, res) => {
  try {
    const { deliveryId, driverId, status = 'delivered' } = req.body;
    
    if (!deliveryId || !driverId) {
      return res.status(400).json({
        success: false,
        message: 'deliveryId and driverId are required'
      });
    }

    console.log(`🧪 Testing delivery completion: ${deliveryId} by driver ${driverId}`);

    // Parse the dynamic delivery ID: subscriptionId_date_shift
    const parts = deliveryId.split('_');
    if (parts.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID format - expected subscriptionId_date_shift'
      });
    }

    const [subscriptionId, date, shift] = parts;
    const deliveryDate = new Date(date);

    console.log(`Parsed delivery: subscription=${subscriptionId}, date=${date}, shift=${shift}`);

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Find the DriverRoute
    const routeDate = new Date(deliveryDate);
    const driverRoute = await DriverRoute.findOne({
      driverId,
      date: {
        $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
        $lt: new Date(routeDate.setHours(23, 59, 59, 999))
      },
      shift
    });

    if (!driverRoute) {
      return res.json({
        success: false,
        message: 'No DriverRoute found for this date and shift',
        searchCriteria: { driverId, date, shift }
      });
    }

    console.log(`🔄 Found DriverRoute with ${driverRoute.stops.length} stops`);
    
    // Test the stop matching logic - exactly like the real code
    const stopIndex = driverRoute.stops.findIndex((stop, index) => {
      console.log(`Checking stop ${index}:`, {
        stopSubscriptionId: stop.subscriptionId?.toString(),
        stopOrderId: stop.orderId,
        stopSequenceNumber: stop.sequenceNumber,
        customerName: stop.address?.name
      });
      
      // Strategy 1: Match by subscription ID (most reliable)
      if (stop.subscriptionId && stop.subscriptionId.toString() === subscriptionId) {
        console.log(`✅ Found matching subscription ID for ${stop.address?.name}`);
        return true;
      }
      
      return false;
    });

    if (stopIndex !== -1) {
      console.log(`✅ MATCH FOUND! Updating stop at index ${stopIndex}`);
      
      const originalStatus = driverRoute.stops[stopIndex].status;
      
      // Update the stop
      driverRoute.stops[stopIndex].status = status;
      driverRoute.stops[stopIndex].actualArrival = new Date();
      driverRoute.stops[stopIndex].deliveryNotes = 'Updated via debug test';
      driverRoute.stops[stopIndex].completedAt = new Date();
      
      // Update route progress
      const completedCount = driverRoute.stops.filter(stop => 
        stop.status === 'delivered'
      ).length;
      
      driverRoute.completedStops = completedCount;
      
      await driverRoute.save();
      
      res.json({
        success: true,
        message: 'Stop updated successfully',
        stopIndex,
        originalStatus,
        newStatus: status,
        customerName: driverRoute.stops[stopIndex].address?.name,
        routeProgress: {
          completedStops: completedCount,
          totalStops: driverRoute.stops.length
        }
      });
    } else {
      console.log(`❌ NO MATCH FOUND for subscription ${subscriptionId}`);
      res.json({
        success: false,
        message: 'No matching stop found in DriverRoute',
        subscriptionId,
        availableStops: driverRoute.stops.map((stop, index) => ({
          index,
          subscriptionId: stop.subscriptionId?.toString(),
          customerName: stop.address?.name,
          sequenceNumber: stop.sequenceNumber
        }))
      });
    }

  } catch (error) {
    console.error('Debug delivery completion error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/debug/full-diagnostic/:driverId
 * @desc    Complete diagnostic of sequence positions and synchronization issues
 * @access  Public (for testing)
 */
router.get('/debug/full-diagnostic/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`🔍 Running full diagnostic for driver ${driverId}`);

    // Get all subscriptions for today
    const subscriptions = await Subscription.find({
      'deliveryTracking.date': {
        $gte: today,
        $lt: tomorrow
      },
      'deliveryTracking.assignedDriver': driverId
    });

    // Get driver routes for today
    const driverRoutes = await DriverRoute.find({
      driverId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    const diagnostic = {
      driverId,
      date: today.toISOString().split('T')[0],
      subscriptions: [],
      driverRoutes: [],
      sequenceIssues: [],
      recommendations: []
    };

    // Analyze subscriptions
    for (const subscription of subscriptions) {
      const deliveries = subscription.deliveryTracking.filter(delivery => {
        const deliveryDate = new Date(delivery.date);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate.getTime() === today.getTime() && 
               delivery.assignedDriver?.toString() === driverId;
      });

      for (const delivery of deliveries) {
        diagnostic.subscriptions.push({
          subscriptionId: subscription._id,
          subscriptionNumber: subscription.subscriptionId,
          deliveryTrackingId: delivery._id,
          sequencePosition: delivery.sequencePosition,
          deliveryNumber: delivery.deliveryNumber,
          status: delivery.status,
          routeId: delivery.routeId,
          customerName: subscription.user?.name || 'Unknown',
          address: subscription.deliveryAddress
        });

        // Check for sequence issues
        if (!delivery.sequencePosition) {
          diagnostic.sequenceIssues.push({
            type: 'missing_sequence_position',
            deliveryTrackingId: delivery._id,
            subscriptionId: subscription._id,
            description: 'Delivery has no sequencePosition assigned'
          });
        }

        if (!delivery.deliveryNumber) {
          diagnostic.sequenceIssues.push({
            type: 'missing_delivery_number',
            deliveryTrackingId: delivery._id,
            subscriptionId: subscription._id,
            description: 'Delivery has no deliveryNumber assigned'
          });
        }
      }
    }

    // Analyze driver routes
    for (const route of driverRoutes) {
      const routeInfo = {
        routeId: route._id,
        shift: route.shift,
        status: route.routeStatus,
        totalStops: route.totalStops,
        completedStops: route.completedStops,
        stops: []
      };

      for (let i = 0; i < route.stops.length; i++) {
        const stop = route.stops[i];
        routeInfo.stops.push({
          index: i,
          sequenceNumber: stop.sequenceNumber,
          orderId: stop.orderId,
          subscriptionId: stop.subscriptionId,
          status: stop.status,
          customerName: stop.address?.name,
          hasSequenceNumber: !!stop.sequenceNumber
        });

        // Check for sequence issues in driver route
        if (!stop.sequenceNumber) {
          diagnostic.sequenceIssues.push({
            type: 'missing_stop_sequence',
            routeId: route._id,
            stopIndex: i,
            description: 'Driver route stop has no sequenceNumber'
          });
        }
      }

      diagnostic.driverRoutes.push(routeInfo);
    }

    // Generate recommendations
    if (diagnostic.sequenceIssues.length > 0) {
      diagnostic.recommendations.push('Found sequence position issues that need to be fixed');
      
      const missingSequences = diagnostic.sequenceIssues.filter(issue => 
        issue.type === 'missing_sequence_position'
      );
      
      if (missingSequences.length > 0) {
        diagnostic.recommendations.push(`${missingSequences.length} deliveries missing sequence positions - use fix-sequence endpoint`);
      }
    }

    // Check synchronization between schemas
    for (const sub of diagnostic.subscriptions) {
      let foundInDriverRoute = false;
      for (const route of diagnostic.driverRoutes) {
        const matchingStop = route.stops.find(stop => {
          return stop.orderId === sub.deliveryTrackingId.toString() ||
                 stop.subscriptionId === sub.subscriptionId.toString() ||
                 (stop.sequenceNumber && sub.sequencePosition && stop.sequenceNumber === sub.sequencePosition);
        });
        
        if (matchingStop) {
          foundInDriverRoute = true;
          
          // Check if sequence numbers match
          if (matchingStop.sequenceNumber !== sub.sequencePosition) {
            diagnostic.sequenceIssues.push({
              type: 'sequence_mismatch',
              deliveryTrackingId: sub.deliveryTrackingId,
              subscriptionSequence: sub.sequencePosition,
              driverRouteSequence: matchingStop.sequenceNumber,
              description: `Sequence mismatch: Subscription says ${sub.sequencePosition}, DriverRoute says ${matchingStop.sequenceNumber}`
            });
          }
          break;
        }
      }
      
      if (!foundInDriverRoute) {
        diagnostic.sequenceIssues.push({
          type: 'missing_in_driver_route',
          deliveryTrackingId: sub.deliveryTrackingId,
          description: 'Delivery exists in Subscription but not found in any DriverRoute'
        });
      }
    }

    res.json({
      success: true,
      diagnostic,
      summary: {
        totalSubscriptionDeliveries: diagnostic.subscriptions.length,
        totalDriverRoutes: diagnostic.driverRoutes.length,
        totalSequenceIssues: diagnostic.sequenceIssues.length,
        hasIssues: diagnostic.sequenceIssues.length > 0
      }
    });

  } catch (error) {
    console.error('Full diagnostic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run diagnostic',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/debug/fix-sequence/:subscriptionId/:deliveryTrackingId
 * @desc    Manually fix/set the sequence position for a delivery
 * @access  Public (for testing)
 */
router.post('/debug/fix-sequence/:subscriptionId/:deliveryTrackingId', async (req, res) => {
  try {
    const { subscriptionId, deliveryTrackingId } = req.params;
    const { sequencePosition } = req.body;

    if (!sequencePosition || sequencePosition < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid sequencePosition (>= 1) is required'
      });
    }

    console.log(`🔧 Fixing sequence for delivery ${deliveryTrackingId} to position ${sequencePosition}`);

    // Update the sequence position
    const result = await Subscription.findOneAndUpdate(
      {
        '_id': subscriptionId,
        'deliveryTracking._id': deliveryTrackingId
      },
      {
        $set: {
          'deliveryTracking.$.sequencePosition': parseInt(sequencePosition),
          'deliveryTracking.$.deliveryNumber': `#${sequencePosition.toString().padStart(2, '0')}`,
          'deliveryTracking.$.updatedAt': new Date()
        },
        $push: {
          'deliveryTracking.$.checkpoints': {
            type: 'sequence_fixed',
            timestamp: new Date(),
            notes: `Sequence position manually fixed to ${sequencePosition}`,
            sequencePosition: parseInt(sequencePosition)
          }
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Subscription or delivery tracking not found'
      });
    }

    // Get the updated delivery tracking record
    const updatedDelivery = result.deliveryTracking.find(
      track => track._id.toString() === deliveryTrackingId
    );

    res.json({
      success: true,
      message: 'Sequence position fixed successfully',
      data: {
        deliveryTrackingId,
        oldSequencePosition: 'unknown',
        newSequencePosition: updatedDelivery.sequencePosition,
        deliveryNumber: updatedDelivery.deliveryNumber,
        status: updatedDelivery.status,
        lastUpdated: updatedDelivery.updatedAt
      }
    });

  } catch (error) {
    console.error('Fix sequence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix sequence',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/debug/check-sequence/:subscriptionId/:deliveryTrackingId
 * @desc    Check if sequence position is properly maintained for a delivery
 * @access  Public (for testing)
 */
router.get('/debug/check-sequence/:subscriptionId/:deliveryTrackingId', async (req, res) => {
  try {
    const { subscriptionId, deliveryTrackingId } = req.params;

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId)
      .populate('user', 'name phone');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Find the specific delivery tracking record
    const delivery = subscription.deliveryTracking.find(
      track => track._id.toString() === deliveryTrackingId
    );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery tracking record not found'
      });
    }

    // Get sequence-related information
    const sequenceInfo = {
      deliveryTrackingId: delivery._id.toString(),
      status: delivery.status,
      sequencePosition: delivery.sequencePosition,
      deliveryNumber: delivery.deliveryNumber,
      routeId: delivery.routeId,
      routeStatus: delivery.routeStatus,
      checkpoints: delivery.checkpoints?.map(cp => ({
        type: cp.type,
        timestamp: cp.timestamp,
        sequencePosition: cp.sequencePosition,
        notes: cp.notes
      })) || [],
      hasSequencePosition: !!delivery.sequencePosition,
      lastUpdated: delivery.updatedAt
    };

    // Also check corresponding DriverRoute if driver is assigned
    let driverRouteInfo = null;
    
    if (delivery.driver) {
      const routeDate = new Date(delivery.date);
      const driverRoute = await DriverRoute.findOne({
        driverId: delivery.driver,
        date: {
          $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
          $lt: new Date(routeDate.setHours(23, 59, 59, 999))
        },
        shift: delivery.shift
      });

      if (driverRoute) {
        const matchingStop = driverRoute.stops.find(stop => 
          stop.orderId === deliveryTrackingId ||
          stop.subscriptionId?.toString() === subscriptionId ||
          stop.userId?.toString() === subscription.user?._id?.toString()
        );

        driverRouteInfo = {
          driverRouteId: driverRoute._id,
          routeStatus: driverRoute.routeStatus,
          totalStops: driverRoute.totalStops,
          completedStops: driverRoute.completedStops,
          matchingStop: matchingStop ? {
            sequenceNumber: matchingStop.sequenceNumber,
            status: matchingStop.status,
            orderId: matchingStop.orderId,
            customerName: matchingStop.address?.name
          } : null,
          sequenceMatches: matchingStop ? 
            matchingStop.sequenceNumber === delivery.sequencePosition : null
        };
      }
    }

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscriptionId,
          customerName: subscription.user?.name
        },
        sequenceInfo,
        driverRouteInfo,
        isSequenceConsistent: driverRouteInfo ? 
          driverRouteInfo.sequenceMatches : 'No driver route found'
      }
    });

  } catch (error) {
    console.error('Check sequence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check sequence',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/debug/test-sync/:subscriptionId
 * @desc    Test sync status for a specific subscription
 * @access  Public (for testing)
 */
router.get('/debug/test-sync/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId)
      .populate('user', 'name phone');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get pending deliveries
    const pendingDeliveries = subscription.deliveryTracking.filter(track => 
      track.status === 'pending' && track.driver
    );

    console.log(`Found ${pendingDeliveries.length} pending deliveries for subscription ${subscriptionId}`);

    const syncResults = [];

    for (const delivery of pendingDeliveries) {
      const routeDate = new Date(delivery.date);
      const shift = delivery.shift;
      const driverId = delivery.driver;

      console.log(`Checking delivery ${delivery._id} for driver ${driverId}, ${routeDate.toDateString()}, ${shift}`);

      // Find corresponding DriverRoute
      const driverRoute = await DriverRoute.findOne({
        driverId,
        date: {
          $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
          $lt: new Date(routeDate.setHours(23, 59, 59, 999))
        },
        shift
      });

      const result = {
        deliveryTrackingId: delivery._id.toString(),
        deliveryDate: delivery.date,
        deliveryShift: shift,
        deliveryStatus: delivery.status,
        driverId: driverId?.toString(),
        driverRouteFound: !!driverRoute,
        matchingStops: []
      };

      if (driverRoute) {
        result.driverRouteId = driverRoute._id.toString();
        result.routeStatus = driverRoute.routeStatus;
        result.totalStops = driverRoute.totalStops;
        result.completedStops = driverRoute.completedStops;

        // Check all possible matches
        driverRoute.stops.forEach((stop, index) => {
          const matches = {
            index,
            stopData: {
              orderId: stop.orderId,
              subscriptionId: stop.subscriptionId?.toString(),
              userId: stop.userId?.toString(),
              customerName: stop.address?.name,
              status: stop.status,
              sequenceNumber: stop.sequenceNumber
            },
            matchReasons: []
          };

          // Check various matching criteria
          if (stop.orderId === delivery._id.toString()) {
            matches.matchReasons.push('orderId matches deliveryTracking._id');
          }
          if (stop.subscriptionId?.toString() === subscriptionId) {
            matches.matchReasons.push('subscriptionId matches');
          }
          if (stop.userId?.toString() === subscription.user?._id?.toString()) {
            matches.matchReasons.push('userId matches');
          }

          if (matches.matchReasons.length > 0) {
            result.matchingStops.push(matches);
          }
        });
      }

      syncResults.push(result);
    }

    res.json({
      success: true,
      data: {
        subscriptionId,
        customerName: subscription.user?.name,
        totalPendingDeliveries: pendingDeliveries.length,
        syncResults
      }
    });

  } catch (error) {
    console.error('Test sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test sync',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/debug/manual-sync/:subscriptionId/:deliveryTrackingId
 * @desc    Manually sync a specific delivery between Subscription and DriverRoute schemas
 * @access  Private (Admin)
 */
router.post('/debug/manual-sync/:subscriptionId/:deliveryTrackingId', authenticate, authorize(['admin', 'super-admin']), async (req, res) => {
  try {
    const { subscriptionId, deliveryTrackingId } = req.params;
    const { status, notes } = req.body;

    console.log(`🔄 Manual sync requested for subscription: ${subscriptionId}, delivery: ${deliveryTrackingId}`);

    // Find the subscription with the delivery tracking
    const subscription = await Subscription.findById(subscriptionId)
      .populate('user', 'name phone');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Find the specific delivery tracking record
    const deliveryTrackingIndex = subscription.deliveryTracking.findIndex(
      track => track._id.toString() === deliveryTrackingId
    );

    if (deliveryTrackingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Delivery tracking record not found'
      });
    }

    const deliveryTracking = subscription.deliveryTracking[deliveryTrackingIndex];

    // Update subscription status if provided
    if (status) {
      subscription.deliveryTracking[deliveryTrackingIndex].status = status;
      if (status === 'delivered' && !subscription.deliveryTracking[deliveryTrackingIndex].deliveredAt) {
        subscription.deliveryTracking[deliveryTrackingIndex].deliveredAt = new Date();
      }
      if (notes) {
        subscription.deliveryTracking[deliveryTrackingIndex].notes = notes;
      }
      await subscription.save();
      console.log(`✅ Updated subscription delivery status to: ${status}`);
    }

    // Find and update corresponding DriverRoute
    const routeDate = new Date(deliveryTracking.date);
    const shift = deliveryTracking.shift;
    const driverId = deliveryTracking.driver;

    if (driverId) {
      const driverRoute = await DriverRoute.findOne({
        driverId,
        date: {
          $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
          $lt: new Date(routeDate.setHours(23, 59, 59, 999))
        },
        shift
      });

      if (driverRoute) {
        console.log(`📋 Found DriverRoute with ${driverRoute.stops.length} stops`);
        
        // Try multiple matching strategies
        const stopIndex = driverRoute.stops.findIndex(stop => {
          // Strategy 1: orderId matches deliveryTracking._id
          if (stop.orderId === deliveryTrackingId) {
            console.log(`✅ Matched via orderId`);
            return true;
          }
          
          // Strategy 2: subscriptionId matches
          if (stop.subscriptionId && stop.subscriptionId.toString() === subscriptionId) {
            console.log(`✅ Matched via subscriptionId`);
            return true;
          }
          
          // Strategy 3: userId and date match
          if (stop.userId && subscription.user && 
              stop.userId.toString() === subscription.user._id.toString()) {
            console.log(`✅ Matched via userId`);
            return true;
          }

          return false;
        });

        if (stopIndex !== -1) {
          const stop = driverRoute.stops[stopIndex];
          const originalStatus = stop.status;
          
          // Update stop status to match subscription
          if (status) {
            stop.status = status === 'delivered' ? 'delivered' : 'pending';
            if (status === 'delivered' && !stop.actualArrival) {
              stop.actualArrival = subscription.deliveryTracking[deliveryTrackingIndex].deliveredAt || new Date();
              stop.completedAt = stop.actualArrival;
            }
            if (notes) {
              stop.deliveryNotes = notes;
            }
          }

          // Update route progress counters
          driverRoute.completedStops = driverRoute.stops.filter(s => s.status === 'delivered').length;

          // Update route status if needed
          if (driverRoute.completedStops === 0) {
            driverRoute.routeStatus = 'pending';
          } else if (driverRoute.completedStops === driverRoute.totalStops) {
            driverRoute.routeStatus = 'completed';
          } else {
            driverRoute.routeStatus = 'active';
          }

          await driverRoute.save();
          
          console.log(`✅ Updated DriverRoute stop ${stopIndex}: ${originalStatus} → ${stop.status}`);

          res.json({
            success: true,
            message: 'Manual sync completed successfully',
            data: {
              subscription: {
                id: subscriptionId,
                deliveryTrackingId,
                status: subscription.deliveryTracking[deliveryTrackingIndex].status,
                deliveredAt: subscription.deliveryTracking[deliveryTrackingIndex].deliveredAt
              },
              driverRoute: {
                id: driverRoute._id,
                stopIndex,
                stopStatus: stop.status,
                routeStatus: driverRoute.routeStatus,
                completedStops: driverRoute.completedStops,
                totalStops: driverRoute.totalStops
              }
            }
          });

        } else {
          console.error(`❌ Could not find matching stop in DriverRoute`);
          
          res.status(404).json({
            success: false,
            message: 'Could not find matching stop in DriverRoute',
            debug: {
              deliveryTrackingId,
              subscriptionId,
              availableStops: driverRoute.stops.map((stop, index) => ({
                index,
                orderId: stop.orderId,
                subscriptionId: stop.subscriptionId,
                userId: stop.userId,
                customerName: stop.address?.name
              }))
            }
          });
        }

      } else {
        res.status(404).json({
          success: false,
          message: `DriverRoute not found for driver ${driverId} on ${routeDate.toDateString()} ${shift}`
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'No driver assigned to this delivery tracking record'
      });
    }

  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform manual sync',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/debug/driver-routes/:driverId/:date/:shift
 * @desc    Check DriverRoute data for duplicates
 * @access  Public (for testing)
 */
router.get('/debug/driver-routes/:driverId/:date/:shift', async (req, res) => {
  try {
    const { driverId, date, shift } = req.params;
    
    console.log(`🔍 Checking DriverRoute for driver ${driverId} on ${date} ${shift}`);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find DriverRoute for this date and shift
    const driverRoute = await DriverRoute.findOne({
      driverId,
      date: {
        $gte: targetDate,
        $lt: nextDay
      },
      shift
    });

    if (!driverRoute) {
      return res.json({ 
        success: false, 
        message: 'No DriverRoute found for this date and shift' 
      });
    }

    // Check for duplicates
    const stopsBySubscription = {};
    const duplicates = [];
    
    driverRoute.stops.forEach((stop, index) => {
      const subId = stop.subscriptionId.toString();
      if (!stopsBySubscription[subId]) {
        stopsBySubscription[subId] = [];
      }
      stopsBySubscription[subId].push({
        index,
        stop: {
          id: stop._id,
          subscriptionId: stop.subscriptionId,
          orderId: stop.orderId,
          sequenceNumber: stop.sequenceNumber,
          status: stop.status,
          address: stop.address
        }
      });
    });

    // Find duplicates
    Object.keys(stopsBySubscription).forEach(subId => {
      if (stopsBySubscription[subId].length > 1) {
        duplicates.push({
          subscriptionId: subId,
          count: stopsBySubscription[subId].length,
          stops: stopsBySubscription[subId]
        });
      }
    });

    res.json({
      success: true,
      driverRouteId: driverRoute._id,
      totalStops: driverRoute.stops.length,
      completedStops: driverRoute.completedStops,
      routeStatus: driverRoute.routeStatus,
      duplicateCount: duplicates.length,
      duplicates,
      allStops: driverRoute.stops.map((stop, index) => ({
        index,
        id: stop._id,
        subscriptionId: stop.subscriptionId,
        orderId: stop.orderId,
        customerName: stop.address?.name,
        sequenceNumber: stop.sequenceNumber,
        status: stop.status,
        estimatedArrival: stop.estimatedArrival,
        actualArrival: stop.actualArrival
      }))
    });

  } catch (error) {
    console.error('Debug driver routes error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/delivery-schedule/debug/test-delivery-completion
 * @desc    Test delivery completion and DriverRoute synchronization
 * @access  Public (for testing)
 */
router.post('/debug/test-delivery-completion', async (req, res) => {
  try {
    const { deliveryId, driverId, status = 'delivered' } = req.body;
    
    if (!deliveryId || !driverId) {
      return res.status(400).json({
        success: false,
        message: 'deliveryId and driverId are required'
      });
    }

    console.log(`🧪 Testing delivery completion: ${deliveryId} by driver ${driverId}`);

    // Parse the dynamic delivery ID: subscriptionId_date_shift
    const parts = deliveryId.split('_');
    if (parts.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID format'
      });
    }

    const [subscriptionId, date, shift] = parts;
    const deliveryDate = new Date(date);

    console.log(`Parsed delivery: subscription=${subscriptionId}, date=${date}, shift=${shift}`);

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Find the DriverRoute
    const routeDate = new Date(deliveryDate);
    const driverRoute = await DriverRoute.findOne({
      driverId,
      date: {
        $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
        $lt: new Date(routeDate.setHours(23, 59, 59, 999))
      },
      shift
    });

    if (!driverRoute) {
      return res.json({
        success: false,
        message: 'No DriverRoute found for this date and shift'
      });
    }

    console.log(`🔄 Found DriverRoute with ${driverRoute.stops.length} stops`);
    
    // Test the stop matching logic
    const stopIndex = driverRoute.stops.findIndex((stop, index) => {
      console.log(`Checking stop ${index}:`, {
        stopSubscriptionId: stop.subscriptionId?.toString(),
        stopOrderId: stop.orderId,
        stopSequenceNumber: stop.sequenceNumber,
        customerName: stop.address?.name
      });
      
      // Strategy 1: Match by subscription ID (most reliable)
      if (stop.subscriptionId && stop.subscriptionId.toString() === subscriptionId) {
        console.log(`✅ Found matching subscription ID for ${stop.address?.name}`);
        return true;
      }
      
      return false;
    });

    if (stopIndex !== -1) {
      console.log(`✅ MATCH FOUND! Updating stop at index ${stopIndex}`);
      
      // Update the stop
      driverRoute.stops[stopIndex].status = status;
      driverRoute.stops[stopIndex].actualArrival = new Date();
      driverRoute.stops[stopIndex].deliveryNotes = 'Updated via debug test';
      driverRoute.stops[stopIndex].completedAt = new Date();
      
      // Update route progress
      driverRoute.completedStops = driverRoute.stops.filter(stop => 
        stop.status === 'delivered'
      ).length;
      
      await driverRoute.save();
      
      res.json({
        success: true,
        message: 'Stop updated successfully',
        stopIndex,
        updatedStop: driverRoute.stops[stopIndex],
        routeProgress: {
          completedStops: driverRoute.completedStops,
          totalStops: driverRoute.stops.length
        }
      });
    } else {
      console.log(`❌ NO MATCH FOUND for subscription ${subscriptionId}`);
      res.json({
        success: false,
        message: 'No matching stop found in DriverRoute',
        subscriptionId,
        availableStops: driverRoute.stops.map((stop, index) => ({
          index,
          subscriptionId: stop.subscriptionId?.toString(),
          customerName: stop.address?.name
        }))
      });
    }

  } catch (error) {
    console.error('Debug delivery completion error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/delivery-schedule/driver/route-schedules  
 * @desc    Get driver's route schedules from DriverRoute model (for sequencing interface)
 * @access  Private (Driver)
 */
router.get('/driver/route-schedules', authenticate, authorize(['delivery']), async (req, res) => {
  try {
    const { week, shift = 'both', status = 'all' } = req.query;
    const driverId = req.user.id;

    console.log(`📍 Fetching route schedules for driver ${driverId}, week ${week}, shift ${shift}, status ${status}`);

    // Build date filter
    let dateFilter = {};
    if (week) {
      const startDate = new Date(week);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      dateFilter = { $gte: startDate, $lt: endDate };
    }

    // Query DriverRoute directly
    const query = { driverId };
    if (week) {
      query.date = dateFilter;
    }
    if (shift !== 'both') {
      query.shift = shift;
    }

    const driverRoutes = await DriverRoute.find(query)
      .populate('driverId', 'name')
      .sort({ date: 1, shift: 1 });

    console.log(`📊 Found ${driverRoutes.length} driver routes`);

    // Transform to match frontend expectations
    const scheduleData = [];

    for (const route of driverRoutes) {
      // Filter stops by status if needed
      let stops = route.stops || [];
      if (status !== 'all') {
        stops = stops.filter(stop => stop.status === status);
      }

      // Get subscription details for each stop
      const stopsWithDetails = await Promise.all(
        stops.map(async (stop) => {
          try {
            const subscription = await Subscription.findById(stop.subscriptionId)
              .populate('user', 'name phone')
              .populate('mealPlan', 'name price');

            if (!subscription) return null;

            return {
              id: stop.orderId, // Use orderId as delivery ID
              customerName: stop.address?.name || subscription.user?.name || 'Unknown Customer',
              address: `${stop.address?.street || ''}, ${stop.address?.city || ''}`.trim() || 'No address',
              phone: stop.address?.phone || subscription.user?.phone || '',
              mealType: subscription.mealPlan?.name || 'Meal',
              timeSlot: route.shift === 'morning' ? '8:00 AM - 10:00 AM' : '7:00 PM - 9:00 PM',
              status: stop.status || 'pending',
              subscriptionNumber: subscription.subscriptionId,
              sequencePosition: stop.sequenceNumber || null,
              estimatedArrival: stop.estimatedArrival,
              actualArrival: stop.actualArrival,
              deliveryNotes: stop.deliveryNotes || '',
              isCompleted: stop.status === 'delivered',
              stopId: stop._id
            };
          } catch (error) {
            console.error(`Error processing stop for subscription ${stop.subscriptionId}:`, error);
            return null;
          }
        })
      );

      const validStops = stopsWithDetails.filter(stop => stop !== null);

      if (validStops.length > 0) {
        scheduleData.push({
          id: route._id.toString(),
          date: format(new Date(route.date), 'yyyy-MM-dd'),
          shift: route.shift,
          status: route.routeStatus || 'pending',
          deliveries: validStops.sort((a, b) => (a.sequencePosition || 999) - (b.sequencePosition || 999)),
          estimatedDuration: route.estimatedDuration || '2 hours',
          totalDistance: '15 km', // Default distance
          notes: route.notes || '',
          completedStops: route.completedStops || 0,
          totalStops: route.totalStops || validStops.length,
          routeId: route._id
        });
      }
    }

    console.log(`🎯 Returning ${scheduleData.length} route schedules`);

    res.json({
      success: true,
      data: scheduleData,
      message: `Found ${scheduleData.length} route schedules`
    });

  } catch (error) {
    console.error('Failed to load route schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load route schedules',
      error: error.message
    });
  }
});

module.exports = router;