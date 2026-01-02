// routes/mealPlans.js
const express = require('express');
const { body } = require('express-validator');
const {
  getAllMealPlans,
  getMealPlanById,
  createMealPlan,
  updateMealPlan,
  getMealPlanAddOns,
  getReplaceableThalis,
  getMealPlanExtraItems,
  getMealPlanReplacements,
  getSkipMealLimit
} = require('../controllers/MealPlanController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
/**
 * @route   GET /api/mealplans
 * @desc    Get all meal plans with filters
 * @access  Public
 */
router.get('/', getAllMealPlans);

/**
 * @route   GET /api/mealplans/:id
 * @desc    Get meal plan by ID
 * @access  Public
 */
router.get('/:id', getMealPlanById);

/**
 * @route   POST /api/mealplans
 * @desc    Create new meal plan (Admin only)
 * @access  Private (Admin)
 */
router.post('/', authenticate, [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('tier')
    .isIn(['low', 'basic', 'premium'])
    .withMessage('Tier must be low, basic, or premium'),
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
    .withMessage('Thirty days price must be a positive number')
], createMealPlan);

/**
 * @route   PUT /api/mealplans/:id
 * @desc    Update meal plan (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, updateMealPlan);

/**
 * @route   GET /api/mealplans/:id/add-ons
 * @desc    Get available add-ons for a meal plan
 * @access  Public
 */
router.get('/:id/add-ons', getMealPlanAddOns);

/**
 * @route   GET /api/mealplans/:planId/replaceable-thalis
 * @desc    Get list of thalis that can replace the current meal plan
 * @access  Private (Authenticated users)
 */
router.get('/:planId/replaceable-thalis', authenticate, getReplaceableThalis);

/**
 * @route   GET /api/mealplans/:id/extra-items
 * @desc    Get meal plan extra items
 * @access  Public
 */
router.get('/:id/extra-items', getMealPlanExtraItems);

/**
 * @route   GET /api/mealplans/:id/replacements
 * @desc    Get meal plan thali replacements
 * @access  Public
 */
router.get('/:id/replacements', getMealPlanReplacements);

/**
 * @route   GET /api/settings/skip-meal-limit
 * @desc    Get skip meal limit from settings
 * @access  Public
 */
router.get('/settings/skip-meal-limit', getSkipMealLimit);

module.exports = router;
