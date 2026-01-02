const express = require('express');
const router = express.Router();
const DeliveryZone = require('../models/DeliveryZone');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { authenticate, authorize } = require('../middlewares/auth');
const { validationResult, body } = require('express-validator');

/**
 * @route   GET /api/zones/public
 * @desc    Get public delivery zones (for vehicle listing)
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    // First try to get active zones
    let zones = await DeliveryZone.find({ isActive: true })
      .select('name code description areas coverage')
      .sort({ priority: -1, name: 1 });

    // If no active zones found, get all zones for development
    if (zones.length === 0) {
      console.log('No active zones found, fetching all zones...');
      zones = await DeliveryZone.find({})
        .select('name code description areas coverage isActive')
        .sort({ priority: -1, name: 1 });
      
      console.log(`Found ${zones.length} total zones:`, zones.map(z => ({ name: z.name, code: z.code, isActive: z.isActive })));
    }

    // If still no zones, create a sample zone for development
    if (zones.length === 0) {
      console.log('No zones exist in database, creating a sample zone...');
      const sampleZone = new DeliveryZone({
        name: 'Sample Zone',
        code: 'SAMPLE',
        description: 'Sample delivery zone for testing',
        boundaries: {
          type: 'Polygon',
          coordinates: [[[77.5946, 12.9716], [77.6946, 12.9716], [77.6946, 13.0716], [77.5946, 13.0716], [77.5946, 12.9716]]]
        },
        center: { lat: 12.9716, lng: 77.5946 },
        areas: [
          { name: 'Sample Area 1', pincode: '560001', locality: 'Sample Locality' }
        ],
        isActive: true,
        priority: 1
      });
      
      await sampleZone.save();
      zones = [sampleZone];
      console.log('Sample zone created successfully');
    }

    res.json({
      success: true,
      data: zones,
      count: zones.length
    });
  } catch (error) {
    console.error('Get public zones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch zones',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/zones
 * @desc    Get all delivery zones
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { active = 'all', search = '', page = 1, limit = 50 } = req.query;

    // Build query
    let query = {};
    
    if (active !== 'all') {
      query.isActive = active === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'areas.name': { $regex: search, $options: 'i' } }
      ];
    }

    const zones = await DeliveryZone.find(query)
      .populate('createdBy updatedBy', 'name email')
      .populate('drivers')
      .sort({ priority: -1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DeliveryZone.countDocuments(query);

    // Add current capacity and driver info
    const zonesWithStats = await Promise.all(zones.map(async (zone) => {
      // Get drivers in this zone
      const driversCount = await User.countDocuments({
        role: 'delivery',
        'driverProfile.zones': zone._id
      });

      // Get current subscriptions
      const morningSubscriptions = await Subscription.countDocuments({
        status: 'active',
        morningZone: zone._id
      });

      const eveningSubscriptions = await Subscription.countDocuments({
        status: 'active',
        eveningZone: zone._id
      });

      return {
        ...zone.toObject(),
        stats: {
          driversCount,
          subscriptions: {
            morning: morningSubscriptions,
            evening: eveningSubscriptions,
            total: morningSubscriptions + eveningSubscriptions
          },
          capacity: {
            morning: {
              used: morningSubscriptions,
              max: zone.maxCapacity.morning,
              percentage: Math.round((morningSubscriptions / zone.maxCapacity.morning) * 100)
            },
            evening: {
              used: eveningSubscriptions,
              max: zone.maxCapacity.evening,
              percentage: Math.round((eveningSubscriptions / zone.maxCapacity.evening) * 100)
            }
          }
        }
      };
    }));

    res.json({
      success: true,
      data: zonesWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch zones'
    });
  }
});

/**
 * @route   GET /api/zones/:id
 * @desc    Get zone by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id)
      .populate('createdBy updatedBy', 'name email');

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Zone not found'
      });
    }

    // Get zone statistics
    const drivers = await User.find({
      role: 'delivery',
      'driverProfile.zones': zone._id
    }).select('name phone email driverProfile.currentLocation driverProfile.isOnline');

    const subscriptions = await Subscription.find({
      status: 'active',
      $or: [
        { morningZone: zone._id },
        { eveningZone: zone._id }
      ]
    }).populate('user', 'name phone').select('subscriptionId user morningZone eveningZone');

    res.json({
      success: true,
      data: {
        zone,
        drivers,
        subscriptions
      }
    });
  } catch (error) {
    console.error('Get zone by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch zone'
    });
  }
});

/**
 * @route   POST /api/zones
 * @desc    Create new delivery zone
 * @access  Private (Admin)
 */
router.post('/', 
  authenticate, 
  authorize(['admin', 'super-admin']),
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Zone name must be at least 2 characters'),
    body('code').trim().isLength({ min: 2 }).withMessage('Zone code must be at least 2 characters'),
    body('center.lat').isNumeric().withMessage('Center latitude must be a number'),
    body('center.lng').isNumeric().withMessage('Center longitude must be a number'),
    body('radius').optional().isNumeric().withMessage('Radius must be a number')
  ],
  async (req, res) => {
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
        name,
        code,
        description,
        center,
        radius = 5,
        areas = [],
        maxCapacity = { morning: 50, evening: 50 },
        serviceHours,
        deliveryConfig,
        priority = 1
      } = req.body;

      // Check if code already exists
      const existingZone = await DeliveryZone.findOne({ 
        code: code.toUpperCase() 
      });

      if (existingZone) {
        return res.status(400).json({
          success: false,
          message: 'Zone code already exists'
        });
      }

      // Create zone
      const zone = new DeliveryZone({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim(),
        center,
        radius,
        areas,
        maxCapacity,
        serviceHours: serviceHours || {
          morning: { start: '08:00', end: '12:00' },
          evening: { start: '18:00', end: '22:00' }
        },
        deliveryConfig: deliveryConfig || {
          estimatedTime: 30,
          minimumOrders: 5,
          deliveryFee: 0
        },
        priority,
        createdBy: req.user.id,
        isActive: true
      });

      await zone.save();
      await zone.populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Zone created successfully',
        data: zone
      });
    } catch (error) {
      console.error('Create zone error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create zone'
      });
    }
  }
);

/**
 * @route   PUT /api/zones/:id
 * @desc    Update delivery zone
 * @access  Private (Admin)
 */
router.put('/:id', 
  authenticate, 
  authorize(['admin', 'super-admin']),
  async (req, res) => {
    try {
      const zone = await DeliveryZone.findById(req.params.id);
      if (!zone) {
        return res.status(404).json({
          success: false,
          message: 'Zone not found'
        });
      }

      const updates = { ...req.body };
      delete updates._id;
      delete updates.createdBy;
      delete updates.createdAt;

      // Add update metadata
      updates.updatedBy = req.user.id;
      updates.updatedAt = new Date();

      const updatedZone = await DeliveryZone.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      ).populate('createdBy updatedBy', 'name email');

      res.json({
        success: true,
        message: 'Zone updated successfully',
        data: updatedZone
      });
    } catch (error) {
      console.error('Update zone error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update zone'
      });
    }
  }
);

/**
 * @route   DELETE /api/zones/:id
 * @desc    Delete delivery zone
 * @access  Private (Admin)
 */
router.delete('/:id', 
  authenticate, 
  authorize(['admin', 'super-admin']),
  async (req, res) => {
    try {
      const zone = await DeliveryZone.findById(req.params.id);
      if (!zone) {
        return res.status(404).json({
          success: false,
          message: 'Zone not found'
        });
      }

      // Check if zone has active subscriptions
      const activeSubscriptions = await Subscription.countDocuments({
        status: 'active',
        $or: [
          { morningZone: zone._id },
          { eveningZone: zone._id }
        ]
      });

      if (activeSubscriptions > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete zone with ${activeSubscriptions} active subscriptions. Please reassign subscriptions first.`
        });
      }

      // Check if zone has assigned drivers
      const assignedDrivers = await User.countDocuments({
        'driverProfile.zones': zone._id
      });

      if (assignedDrivers > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete zone with ${assignedDrivers} assigned drivers. Please reassign drivers first.`
        });
      }

      await DeliveryZone.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Zone deleted successfully'
      });
    } catch (error) {
      console.error('Delete zone error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete zone'
      });
    }
  }
);

/**
 * @route   POST /api/zones/:id/drivers
 * @desc    Assign drivers to zone
 * @access  Private (Admin)
 */
router.post('/:id/drivers',
  authenticate,
  authorize(['admin', 'super-admin']),
  async (req, res) => {
    try {
      const { driverIds } = req.body;
      
      if (!Array.isArray(driverIds) || driverIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'driverIds array is required'
        });
      }

      const zone = await DeliveryZone.findById(req.params.id);
      if (!zone) {
        return res.status(404).json({
          success: false,
          message: 'Zone not found'
        });
      }

      // Verify all driver IDs exist and are drivers
      const drivers = await User.find({
        _id: { $in: driverIds },
        role: 'delivery'
      });

      if (drivers.length !== driverIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more driver IDs are invalid'
        });
      }

      // Add zone to each driver's zones array
      await User.updateMany(
        { _id: { $in: driverIds } },
        { $addToSet: { 'driverProfile.zones': zone._id } }
      );

      res.json({
        success: true,
        message: `Successfully assigned ${drivers.length} drivers to ${zone.name}`,
        data: {
          zone: zone,
          assignedDrivers: drivers.map(d => ({
            id: d._id,
            name: d.name,
            phone: d.phone
          }))
        }
      });
    } catch (error) {
      console.error('Assign drivers to zone error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign drivers to zone'
      });
    }
  }
);

/**
 * @route   DELETE /api/zones/:id/drivers/:driverId
 * @desc    Remove driver from zone
 * @access  Private (Admin)
 */
router.delete('/:id/drivers/:driverId',
  authenticate,
  authorize(['admin', 'super-admin']),
  async (req, res) => {
    try {
      const { id: zoneId, driverId } = req.params;

      const zone = await DeliveryZone.findById(zoneId);
      if (!zone) {
        return res.status(404).json({
          success: false,
          message: 'Zone not found'
        });
      }

      const driver = await User.findById(driverId);
      if (!driver || driver.role !== 'delivery') {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Remove zone from driver's zones array
      await User.findByIdAndUpdate(
        driverId,
        { $pull: { 'driverProfile.zones': zoneId } }
      );

      res.json({
        success: true,
        message: `Driver ${driver.name} removed from ${zone.name} zone`
      });
    } catch (error) {
      console.error('Remove driver from zone error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove driver from zone'
      });
    }
  }
);

module.exports = router;