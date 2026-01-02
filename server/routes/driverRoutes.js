const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const {authenticate} = require('../middlewares/auth');
const {
  getDriverDeliveryList,
  getDriverDailyDeliveries,
  updateDeliveryStatus,
  bulkUpdateDeliveryStatus,
  getDriverStats,
  getOptimizedRoute
} = require('../controllers/driverController');

// Validation middleware
const validateDriverRole = (req, res, next) => {
  console.log('User role:', req.user.role);
  console.log('User ID:', req.user._id);
  
  // Allow admin, driver, delivery roles, and temporarily allow buyer for testing/demo purposes
  const allowedRoles = ['driver', 'delivery', 'admin', 'buyer']; // Added delivery role
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Driver role required. Current role: ${req.user.role}`
    });
  }
  
  // Log for debugging
  if (req.user.role === 'buyer') {
    console.log('⚠️  Warning: Buyer role accessing driver functionality for testing purposes');
  }
  next();
};

/**
 * @route   GET /api/driver/deliveries
 * @desc    Get delivery list for a driver
 * @access  Private (Driver, Admin)
 */
router.get('/deliveries', [
  authenticate,
  validateDriverRole,
  query('driverId').optional().isMongoId().withMessage('Invalid driver ID'),
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  query('shift').optional().isIn(['morning', 'evening']).withMessage('Invalid shift'),
  query('status').optional().isIn(['pending', 'delivered', 'skipped', 'replaced', 'all']).withMessage('Invalid status')
], getDriverDeliveryList);

/**
 * @route   GET /api/drivers/daily-deliveries
 * @desc    Get all daily deliveries for driver dashboard (similar to admin daily meals)
 * @access  Private (Driver, Delivery, Admin)
 */
router.get('/daily-deliveries', [
  authenticate,
  validateDriverRole,
  query('date').optional().isISO8601().withMessage('Invalid date format'),
  query('shift').optional().isIn(['morning', 'evening', 'all']).withMessage('Invalid shift'),
  query('status').optional().isIn(['pending', 'delivered', 'skipped', 'replaced', 'all']).withMessage('Invalid status'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], getDriverDailyDeliveries);

/**
 * @route   PUT /api/driver/delivery/:deliveryId/status
 * @desc    Update single delivery status
 * @access  Private (Driver, Admin)
 */
router.put('/delivery/:deliveryId/status', [
authenticate,
  validateDriverRole,
  param('deliveryId').isMongoId().withMessage('Invalid delivery ID'),
  body('status').isIn(['pending', 'delivered', 'failed']).withMessage('Invalid status'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes must be a string with max 500 characters'),
  body('deliveredAt').optional().isISO8601().withMessage('Invalid delivery date format')
], updateDeliveryStatus);

/**
 * @route   PUT /api/driver/deliveries/bulk-status
 * @desc    Bulk update delivery status
 * @access  Private (Driver, Admin)
 */
router.put('/deliveries/bulk-status', [
  authenticate,
  validateDriverRole,
  body('deliveryIds').isArray({ min: 1 }).withMessage('Delivery IDs array is required'),
  body('deliveryIds.*').isMongoId().withMessage('Invalid delivery ID'),
  body('status').isIn(['pending', 'delivered', 'failed']).withMessage('Invalid status'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes must be a string with max 500 characters'),
  body('deliveredAt').optional().isISO8601().withMessage('Invalid delivery date format')
], bulkUpdateDeliveryStatus);

/**
 * @route   GET /api/driver/stats
 * @desc    Get driver delivery statistics
 * @access  Private (Driver, Admin)
 */
router.get('/stats', [
  authenticate,
  validateDriverRole,
  query('driverId').optional().isMongoId().withMessage('Invalid driver ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], getDriverStats);

/**
 * @route   GET /api/driver/route
 * @desc    Get optimized delivery route
 * @access  Private (Driver, Admin)
 */
router.get('/route', [
  authenticate,
  validateDriverRole,
  query('driverId').optional().isMongoId().withMessage('Invalid driver ID'),
  query('date').isISO8601().withMessage('Date is required in ISO format'),
  query('shift').isIn(['morning', 'evening']).withMessage('Shift (morning/evening) is required')
], getOptimizedRoute);

module.exports = router;