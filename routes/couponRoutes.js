const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate, authorize } = require('../middlewares/auth');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// ====== ADMIN ROUTES ======

/**
 * @route   POST /api/coupons
 * @desc    Create a new coupon (Admin only)
 * @access  Private (Admin)
 */
router.post('/',
  authenticate,
  authorize(['admin', 'super-admin']),
  [
    body('code')
      .notEmpty()
      .withMessage('Coupon code is required')
      .isLength({ min: 3, max: 20 })
      .withMessage('Coupon code must be between 3 and 20 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Coupon code must contain only uppercase letters and numbers'),
    
    body('discountType')
      .isIn(['percentage', 'fixed', 'free_shipping', 'buy_one_get_one', 'buy_x_get_y', 'cashback', 'points_multiplier'])
      .withMessage('Invalid discount type'),
    
    body('discountValue')
      .isNumeric()
      .withMessage('Discount value must be a number')
      .isFloat({ min: 0 })
      .withMessage('Discount value must be positive'),
    
    body('maxDiscount')
      .optional()
      .isNumeric()
      .withMessage('Max discount must be a number')
      .isFloat({ min: 0 })
      .withMessage('Max discount must be positive'),
    
    body('minOrderAmount')
      .optional()
      .isNumeric()
      .withMessage('Min order amount must be a number')
      .isFloat({ min: 0 })
      .withMessage('Min order amount must be positive'),
    
    body('maxUsage')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max usage must be a positive integer'),
    
    body('startDate')
      .isISO8601()
      .withMessage('Start date must be a valid date')
      .custom((value) => {
        if (new Date(value) < new Date()) {
          throw new Error('Start date cannot be in the past');
        }
        return true;
      }),
    
    body('endDate')
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    
    body('applicableProducts')
      .optional()
      .isArray()
      .withMessage('Applicable products must be an array'),
    
    body('applicableCategories')
      .optional()
      .isArray()
      .withMessage('Applicable categories must be an array'),
    
    body('applicableUsers')
      .optional()
      .isArray()
      .withMessage('Applicable users must be an array'),
    
    body('excludeUsers')
      .optional()
      .isArray()
      .withMessage('Exclude users must be an array')
  ],
  couponController.createCoupon
);

/**
 * @route   GET /api/coupons
 * @desc    Get all coupons with filtering and pagination (Admin only)
 * @access  Private (Admin)
 */
router.get('/',
  authenticate,
  authorize(['admin', 'super-admin']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn(['active', 'expired', 'inactive'])
      .withMessage('Status must be active, expired, or inactive'),
    
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
  ],
  couponController.getAllCoupons
);

/**
 * @route   GET /api/coupons/:id
 * @desc    Get coupon by ID with usage statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/:id',
  authenticate,
  authorize(['admin', 'super-admin']),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID')
  ],
  couponController.getCouponById
);

/**
 * @route   PUT /api/coupons/:id
 * @desc    Update coupon (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id',
  authenticate,
  authorize(['admin', 'super-admin']),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID'),
    
    body('code')
      .optional()
      .isLength({ min: 3, max: 20 })
      .withMessage('Coupon code must be between 3 and 20 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Coupon code must contain only uppercase letters and numbers'),
    
    body('discountType')
      .optional()
      .isIn(['percentage', 'fixed'])
      .withMessage('Discount type must be either percentage or fixed'),
    
    body('discountValue')
      .optional()
      .isNumeric()
      .withMessage('Discount value must be a number')
      .isFloat({ min: 0 })
      .withMessage('Discount value must be positive'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  couponController.updateCoupon
);

/**
 * @route   GET /api/coupons/:id/usage
 * @desc    Get coupon usage history (Admin only)
 * @access  Private (Admin)
 */
router.get('/:id/usages',
  authenticate,
  authorize(['admin', 'super-admin']),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
  ],
  handleValidationErrors,
  couponController.getCouponUsageHistory
);

/**
 * @route   DELETE /api/coupons/:id
 * @desc    Delete coupon (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id',
  authenticate,
  authorize(['admin', 'super-admin']),
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID')
  ],
  couponController.deleteCoupon
);

// ====== USER ROUTES ======

/**
 * @route   GET /api/coupons/available
 * @desc    Get available coupons for user based on context
 * @access  Private
 */
router.get('/available',
  authenticate,
  [
    query('orderAmount')
      .optional()
      .isNumeric()
      .withMessage('Order amount must be a number'),
    
    query('orderType')
      .optional()
      .isIn(['gkk', 'custom', 'addon', 'sunday-special', 'product', 'subscription'])
      .withMessage('Invalid order type'),
    
    query('paymentMethod')
      .optional()
      .isIn(['razorpay', 'wallet', 'cod', 'subscription', 'card', 'upi', 'COD'])
      .withMessage('Invalid payment method')
  ],
  handleValidationErrors,
  couponController.getAvailableCoupons
);

/**
 * @route   POST /api/coupons/validate
 * @desc    Validate coupon code for user
 * @access  Private
 */
router.post('/validate',
  authenticate,
  [
    body('code')
      .notEmpty()
      .withMessage('Coupon code is required')
      .isLength({ min: 3, max: 20 })
      .withMessage('Coupon code must be between 3 and 20 characters'),
    
    body('orderAmount')
      .optional()
      .isNumeric()
      .withMessage('Order amount must be a number')
      .isFloat({ min: 0 })
      .withMessage('Order amount must be positive')
  ],
  handleValidationErrors,
  couponController.validateCoupon
);

/**
 * @route   GET /api/coupons/available
 * @desc    Get available coupons for user
 * @access  Private
 */
router.get('/available',
  authenticate,
  [
    query('orderAmount')
      .optional()
      .isNumeric()
      .withMessage('Order amount must be a number')
      .isFloat({ min: 0 })
      .withMessage('Order amount must be positive')
  ],
  handleValidationErrors,
  (req, res, next) => {
    console.log('Available coupons route hit, user:', req.user?.email, 'orderAmount:', req.query.orderAmount);
    next();
  },
  couponController.getAvailableCoupons
);

/**
 * @route   GET /api/coupons/history
 * @desc    Get user's coupon usage history
 * @access  Private
 */
router.get('/history',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  couponController.getUserCouponHistory
);

module.exports = router;
