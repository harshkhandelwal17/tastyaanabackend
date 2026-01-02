const express = require('express');
const router = express.Router();
const {
  getSellerDashboard,
  getTodayTiffinList,
  updateTiffinStatus,
  getPenaltySection,
  updateNormalOrderStatus,
  getNormalOrdersAnalytics,
  getSubscriptionAnalytics,
  getSellerSubscriptions,
  getTiffinHistory
} = require('../controllers/sellerTiffinController');
const { authenticate, authorize } = require('../middlewares/auth');
const { query, param, body } = require('express-validator');
const { validate } = require('../middlewares/validation');

// Apply authentication and seller authorization to all routes
router.use(authenticate);
router.use(authorize(['seller', 'admin']));

/**
 * @route   GET /api/seller/tiffin/dashboard
 * @desc    Get seller dashboard with today's statistics
 * @access  Private (Seller)
 */
router.get('/dashboard', getSellerDashboard);

/**
 * @route   GET /api/seller/tiffin/today/:shift
 * @desc    Get today's tiffin list for specific shift (morning/evening)
 * @access  Private (Seller)
 */
router.get('/today/:shift', [
  param('shift')
    .isIn(['morning', 'evening'])
    .withMessage('Shift must be morning or evening'),
  validate
], getTodayTiffinList);

/**
 * @route   PUT /api/seller/tiffin/:orderId/status
 * @desc    Update tiffin order status
 * @access  Private (Seller)
 */
router.put('/:orderId/status', [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('status')
    .isIn(['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'delivered', 'not_prepared'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  validate
], updateTiffinStatus);

/**
 * @route   GET /api/seller/tiffin/penalties
 * @desc    Get penalty/flag section data
 * @access  Private (Seller)
 */
router.get('/penalties', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
], getPenaltySection);

/**
 * @route   PUT /api/seller/tiffin/normal-order/:orderId/status
 * @desc    Update normal order status with delay tracking
 * @access  Private (Seller)
 */
router.put('/normal-order/:orderId/status', [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('status')
    .isIn(['confirmed', 'preparing', 'ready_for_pickup', 'not_prepared'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  validate
], updateNormalOrderStatus);

/**
 * @route   GET /api/seller/tiffin/analytics/normal-orders
 * @desc    Get normal orders analytics
 * @access  Private (Seller)
 */
router.get('/analytics/normal-orders', [
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Period must be daily, weekly, or monthly'),
  validate
], getNormalOrdersAnalytics);

/**
 * @route   GET /api/seller/tiffin/analytics/subscriptions
 * @desc    Get subscription analytics
 * @access  Private (Seller)
 */
router.get('/analytics/subscriptions', getSubscriptionAnalytics);

/**
 * @route   GET /api/seller/tiffin/subscriptions
 * @desc    Get seller's subscriptions list
 * @access  Private (Seller)
 */
router.get('/subscriptions', getSellerSubscriptions);

/**
 * @route   GET /api/seller/tiffin/history
 * @desc    Get tiffin delivery history
 * @access  Private (Seller)
 */
router.get('/history', getTiffinHistory);

module.exports = router;