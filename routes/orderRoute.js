const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/auth');
const { getAllOrders } = require('../controllers/adminController');

// ==================== CUSTOMER ROUTES ====================
/**
 * @route   POST /api/orders
 * @desc    Create new order (both cart-based and direct food orders)
 * @access  Private
 */
router.post('/',
  authenticate, [
  // Common validations
  body('type')
    .optional()
    .isIn(['gkk', 'custom', 'addon', 'sunday-special', 'product'])
    .withMessage('Invalid order type'),
  body('paymentMethod')
    .isIn(['razorpay', 'wallet', 'cod', 'subscription', 'card', 'upi', 'COD'])
    .withMessage('Invalid payment method'),

  // Cart-based order validations
  body('items')
    .if(body('type').equals('product'))
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),

  // Food order validations
  body('deliveryDate')
    .if(body('type').not().equals('product'))
    .isISO8601()
    .withMessage('Valid delivery date required')
    .custom(value => new Date(value) >= new Date().setHours(0, 0, 0, 0))
    .withMessage('Delivery date cannot be in past'),
  body('deliverySlot')
    .if(body('type').not().equals('product'))
    .isIn(['breakfast', 'lunch', 'dinner', 'anytime'])
    .withMessage('Invalid delivery slot'),
  body('items.*.customizations')
    .if(body('type').not().equals('product'))
    .optional()
    .isArray()
    .withMessage('Customizations must be array')
],
  orderController.createOrder
);

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get authenticated user's orders with filtering
 * @access  Private
 */
router.get('/my-orders',
  authenticate, [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'delivered', 'cancelled'])
    .withMessage('Invalid status filter'),
  body('type')
    .optional()
    .isIn(['gkk', 'addon', 'product'])
    .withMessage('Invalid type filter'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be positive')
],
  orderController.getOrders
);

/**
 * @route   GET /api/orders/:orderNumber
 * @desc    Get order details
 * @access  Private
 */
router.get('/:orderNumber',
  authenticate,
  orderController.getOrderDetails
);

/**
 * @route   GET /api/orders/details/:orderId
 * @desc    Get order details by ID (for tracking)
 * @access  Private
 */
router.get('/details/:orderId',
  authenticate,
  orderController.getOrderDetails
);

/**
 * @route   PUT /api/orders/:orderNumber/cancel
 * @desc    Cancel order
 * @access  Private
 */
router.put('/:id/cancel',
  authenticate, [
  body('reason')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Reason must be 3-200 characters')
],
  orderController.cancelOrder
);

/**
 * @route   GET /api/orders/:orderNumber/track
 * @desc    Track order status with live updates
 * @access  Private
 */
router.get('/:orderNumber/track',
  authenticate,
  orderController.trackOrder
);

/**
 * @route   POST /api/orders/:orderId/customize
 * @desc    Customize today's meal for a GKK order
 * @access  Private
 */
router.post('/:orderId/customize', authenticate, orderController.customizeOrder);

/**
 * @route   POST /api/orders/:orderId/pay-customization
 * @desc    Pay for extra customization charges (placeholder)
 * @access  Private
 */
router.post('/:orderId/pay-customization', authenticate, orderController.payCustomizationCharges);

// ==================== ADMIN ROUTES ====================
/**
 * @route   GET /api/orders
 * @desc    Get all orders (admin dashboard)
 * @access  Private (Admin)
 */
router.get('/',
  authenticate,
  authorize('admin'), [
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'delivered', 'cancelled'])
    .withMessage('Invalid status filter'),
  body('fromDate')
    .optional()
    .isISO8601()
    .withMessage('Valid from date required'),
  body('toDate')
    .optional()
    .isISO8601()
    .withMessage('Valid to date required'),
  body('search')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Search requires 3+ characters')
],
  getAllOrders
);

/**
 * @route   PUT /api/orders/:orderNumber/status
 * @desc    Update order status
 * @access  Private (Admin)
 */
router.put('/:orderNumber/status',
  authenticate,
  authorize(['admin', 'delivery', 'driver']), [
  body('status')
    .isIn(['confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  body('trackingNumber')
    .if(body('status').equals('out-for-delivery'))
    .notEmpty()
    .withMessage('Tracking number required for dispatch')
],
  orderController.updateOrderStatus
);

/**
 * @route   PUT /api/orders/:orderNumber/payment-status
 * @desc    Update order payment status
 * @access  Private (Admin, Driver)
 */
router.put('/:orderNumber/payment-status',
  authenticate,
  authorize(['admin', 'delivery', 'driver']), [
  body('paymentStatus')
    .isIn(['pending', 'paid', 'failed', 'refunded', 'completed'])
    .withMessage('Invalid payment status'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Description must be 3-200 characters')
],
  orderController.updatePaymentStatus
);

module.exports = router;