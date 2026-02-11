const express = require('express');
const router = express.Router();
const {
  getAllSellers,
  getSellerSubscriptions,
  getSubscriptionTodayMeal,
  updateSubscriptionTodayMeal,
  bulkUpdateSellerTodayMeal,
  getSellerMealTemplates,
  getSellerMealPlans,
  getSellerAvailableTiers,
  debugSellerData,
  createDefaultMealPlans,
  getSubscriptionsByMealPlan,
  updateMealPlanDailyMeal,
  getMealPlanDailyMeal,
  getMealManagementDashboard,
  updateSellerMealPlanByTier,
  updateSellerMealPlanByTierAndShift,
  getSellerMealPlanByTierAndShift
} = require('../controllers/adminMealController');

// Middleware imports
const { authenticate } = require('../middlewares/auth');
const { authorize} = require('../middlewares/auth');

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize("admin"));

/**
 * @route   GET /api/admin/meal-edit/dashboard
 * @desc    Get comprehensive meal management dashboard data
 * @access  Private (Admin only)
 */
router.get('/dashboard', getMealManagementDashboard);

/**
 * @route   GET /api/admin/meal-edit/sellers
 * @desc    Get all sellers with their meal plans and subscription details
 * @access  Private (Admin only)
 */
router.get('/sellers', getAllSellers);

/**
 * @route   GET /api/admin/meal-edit/seller/:sellerId/subscriptions
 * @desc    Get subscriptions for a specific seller
 * @access  Private (Admin only)
 */
router.get('/seller/:sellerId/subscriptions', getSellerSubscriptions);

/**
 * @route   GET /api/admin/meal-edit/subscription/:subscriptionId/today-meal
 * @desc    Get today's meal for a specific subscription
 * @access  Private (Admin only)
 */
router.get('/subscription/:subscriptionId/today-meal', getSubscriptionTodayMeal);

/**
 * @route   PUT /api/admin/meal-edit/subscription/:subscriptionId/today-meal
 * @desc    Update today's meal for a specific subscription
 * @access  Private (Admin only)
 */
router.put('/subscription/:subscriptionId/today-meal', updateSubscriptionTodayMeal);

/**
 * @route   PUT /api/admin/meal-edit/seller/:sellerId/bulk-update-today-meal
 * @desc    Bulk update today's meal for all subscriptions of a seller
 * @access  Private (Admin only)
 */
router.put('/seller/:sellerId/bulk-update-today-meal', bulkUpdateSellerTodayMeal);

/**
 * @route   GET /api/admin/meal-edit/seller/:sellerId/meal-templates
 * @desc    Get meal templates for a seller
 * @access  Private (Admin only)
 */
router.get('/seller/:sellerId/meal-templates', getSellerMealTemplates);

/**
 * @route   GET /api/admin/meal-edit/seller/:sellerId/debug
 * @desc    Debug seller's meal plans and subscription data
 * @access  Private (Admin only)
 */
router.get('/seller/:sellerId/debug', debugSellerData);

/**
 * @route   POST /api/admin/meal-edit/seller/:sellerId/create-default-plans
 * @desc    Create default meal plans for a seller if they don't exist
 * @access  Private (Admin only)
 */
router.post('/seller/:sellerId/create-default-plans', createDefaultMealPlans);

/**
 * @route   GET /api/admin/meal-edit/seller/:sellerId/tiers
 * @desc    Get available tiers for a seller
 * @access  Private (Admin only)
 */
router.get('/seller/:sellerId/tiers', getSellerAvailableTiers);

/**
 * @route   GET /api/admin/meal-edit/seller/:sellerId/meal-plans
 * @desc    Get meal plans with subscription details for a seller
 * @access  Private (Admin only)
 */
router.get('/seller/:sellerId/meal-plans', getSellerMealPlans);

/**
 * @route   GET /api/admin/meal-edit/seller/:sellerId/meal-plan/:mealPlanId/subscriptions
 * @desc    Get subscriptions for a specific meal plan of a seller
 * @access  Private (Admin only)
 */
router.get('/seller/:sellerId/meal-plan/:mealPlanId/subscriptions', getSubscriptionsByMealPlan);

/**
 * @route   GET /api/admin/meal-edit/seller/:sellerId/meal-plan/:mealPlanId/daily-meal
 * @desc    Get today's meal for a specific meal plan
 * @access  Private (Admin only)
 */
router.get('/seller/:sellerId/meal-plan/:mealPlanId/daily-meal', getMealPlanDailyMeal);

/**
 * @route   PUT /api/admin/meal-edit/seller/:sellerId/meal-plan/:mealPlanId/daily-meal
 * @desc    Update daily meal for all subscriptions of a specific meal plan
 * @access  Private (Admin only)
 */
router.put('/seller/:sellerId/meal-plan/:mealPlanId/daily-meal', updateMealPlanDailyMeal);

/**
 * @route   PUT /api/admin/meal-edit/seller/:sellerId/tier/:tier/meal
 * @desc    Update meal for specific seller tier (affects all subscriptions of that tier)
 * @access  Private (Admin only)
 */
router.put('/seller/:sellerId/tier/:tier/meal', updateSellerMealPlanByTier);

/**
 * @route   GET /api/admin/meal-edit/seller/:sellerId/tier/:tier/shift/:shift
 * @desc    Get meal for specific seller tier and shift
 * @access  Private (Admin only)
 */
router.get('/seller/:sellerId/tier/:tier/shift/:shift', getSellerMealPlanByTierAndShift);

/**
 * @route   PUT /api/admin/meal-edit/seller/:sellerId/tier/:tier/shift/:shift/meal
 * @desc    Update meal for specific seller tier and shift (affects all subscriptions of that tier-shift)
 * @access  Private (Admin only)
 */
router.put('/seller/:sellerId/tier/:tier/shift/:shift/meal', updateSellerMealPlanByTierAndShift);

module.exports = router;

