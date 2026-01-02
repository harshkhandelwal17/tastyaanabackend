const express = require('express');
const router = express.Router();
const sellerMealController = require('../controllers/sellerMealController');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @desc    Get seller meal edit dashboard
 * @route   GET /api/seller/meal-edit/dashboard
 * @access  Private (Seller only)
 */
router.get('/dashboard', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getMealEditDashboard);

/**
 * @desc    Get seller's meal templates
 * @route   GET /api/seller/meal-edit/meal-templates
 * @access  Private (Seller only)
 */
router.get('/meal-templates', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getMealTemplates);

/**
 * @desc    Get seller's meal plans
 * @route   GET /api/seller/meal-edit/meal-plans
 * @access  Private (Seller only)
 */
router.get('/meal-plans', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getMealPlans);

/**
 * @desc    Get meal plan by tier and shift
 * @route   GET /api/seller/meal-edit/tier/:tier/shift/:shift
 * @access  Private (Seller only)
 */
router.get('/tier/:tier/shift/:shift', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getMealPlanByTierShift);

/**
 * @desc    Get meal plan by tier (general)
 * @route   GET /api/seller/meal-edit/meal-plans/:tier
 * @access  Private (Seller only)
 */
router.get('/meal-plans/:tier', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getMealPlanByTierShift);

/**
 * @desc    Get meal plan by tier and shift (alternate route)
 * @route   GET /api/seller/meal-edit/meal-plans/:tier/shift/:shift
 * @access  Private (Seller only)
 */
router.get('/meal-plans/:tier/shift/:shift', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getMealPlanByTierShift);

/**
 * @desc    Update meal plan by tier and shift
 * @route   PUT /api/seller/meal-edit/tier/:tier/shift/:shift/meal
 * @access  Private (Seller only)
 */
router.put('/tier/:tier/shift/:shift/meal', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.updateMealPlanByTierShift);

/**
 * @desc    Update meal plan by tier (general)
 * @route   PUT /api/seller/meal-edit/meal-plans/:tier
 * @access  Private (Seller only)
 */
router.put('/meal-plans/:tier', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.updateMealPlanByTierShift);

/**
 * @desc    Update meal plan by tier and shift (alternate route)
 * @route   PUT /api/seller/meal-edit/meal-plans/:tier/shift/:shift
 * @access  Private (Seller only)
 */
router.put('/meal-plans/:tier/shift/:shift', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.updateMealPlanByTierShift);

/**
 * @desc    Get specific subscription today's meal
 * @route   GET /api/seller/meal-edit/subscription/:subscriptionId/today-meal
 * @access  Private (Seller only)
 */
router.get('/subscription/:subscriptionId/today-meal', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getSubscriptionTodayMeal);

/**
 * @desc    Update specific subscription today's meal
 * @route   PUT /api/seller/meal-edit/subscription/:subscriptionId/today-meal
 * @access  Private (Seller only)
 */
router.put('/subscription/:subscriptionId/today-meal', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.updateSubscriptionTodayMeal);

/**
 * @desc    Get seller's daily orders (delivery tracking)
 * @route   GET /api/seller/meal-edit/daily-orders
 * @access  Private (Seller only)
 */
router.get('/daily-orders', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getSellerDailyOrders);

/**
 * @desc    Mark no meal available for today/shift
 * @route   POST /api/seller/meal-edit/no-meal-today
 * @access  Private (Seller only)
 */
router.post('/no-meal-today', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.markNoMealToday);

/**
 * @desc    Get no meal status for today
 * @route   GET /api/seller/meal-edit/no-meal-today
 * @access  Private (Seller only)
 */
router.get('/no-meal-today', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getNoMealStatus);

/**
 * @desc    Get no meal status for today (alternative route)
 * @route   GET /api/seller/meal-edit/no-meal-status
 * @access  Private (Seller only)
 */
router.get('/no-meal-status', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getNoMealStatus);

/**
 * @desc    Remove no meal restriction
 * @route   DELETE /api/seller/meal-edit/no-meal-today
 * @access  Private (Seller only)
 */
router.delete('/no-meal-today', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.removeNoMealToday);

/**
 * @desc    Update seller meal availability status
 * @route   PUT /api/seller/meal-edit/availability
 * @access  Private (Seller only)
 */
router.put('/availability', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.updateMealAvailability);

/**
 * @desc    Get seller meal availability status
 * @route   GET /api/seller/meal-edit/availability
 * @access  Private (Seller only)
 */
router.get('/availability', [
  authenticate,
  authorize(['seller', 'admin'])
], sellerMealController.getMealAvailability);

module.exports = router;