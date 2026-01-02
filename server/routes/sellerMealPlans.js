// routes/sellerMealPlans.js
const express = require('express');
const { body } = require('express-validator');
const {
  getSellerMealPlans,
  createSellerMealPlan,
  updateSellerMealPlan,
  deleteSellerMealPlan,
  getSellerMealPlanById
} = require('../controllers/SellerMealPlanController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/seller/meal-plans
 * @desc    Get all meal plans for the authenticated seller
 * @access  Private (Seller)
 */
router.get('/', getSellerMealPlans);

/**
 * @route   GET /api/seller/meal-plans/:id
 * @desc    Get specific meal plan by ID for the authenticated seller
 * @access  Private (Seller)
 */
router.get('/:id', getSellerMealPlanById);

/**
 * @route   POST /api/seller/meal-plans
 * @desc    Create new meal plan
 * @access  Private (Seller)
 */
router.post('/', [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('pricing.oneDay')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('One day price must be a positive number'),
  body('pricing.tenDays')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Ten days price must be a positive number'),
  body('pricing.thirtyDays')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Thirty days price must be a positive number'),
  body('planDetails.days')
    .isArray()
    .withMessage('Plan details days must be an array'),
  body('planDetails.totalThalis')
    .isNumeric()
    .isInt({ min: 1 })
    .withMessage('Total thalis must be a positive integer'),
  body('planDetails.pricePerThali')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Price per thali must be a positive number')
], createSellerMealPlan);

/**
 * @route   PUT /api/seller/meal-plans/:id
 * @desc    Update meal plan
 * @access  Private (Seller)
 */
router.put('/:id', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('tier')
    .optional()
    .isIn(['low', 'basic', 'premium'])
    .withMessage('Tier must be low, basic, or premium'),
  body('pricing.oneDay')
    .optional()
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('One day price must be a positive number'),
  body('pricing.tenDays')
    .optional()
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Ten days price must be a positive number'),
  body('pricing.thirtyDays')
    .optional()
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Thirty days price must be a positive number')
], updateSellerMealPlan);

/**
 * @route   DELETE /api/seller/meal-plans/:id
 * @desc    Delete meal plan
 * @access  Private (Seller)
 */
router.delete('/:id', deleteSellerMealPlan);

module.exports = router;




