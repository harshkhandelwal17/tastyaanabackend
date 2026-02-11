const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const subscriptionController = require('../controllers/subscriptionController');
const thaliSubscriptionController = require('../controllers/thaliSubscriptionController');
const subscriptionDeliveryController = require('../controllers/subscriptionDeliveryController');
const {
  getDailySubscriptionMeals,
  updateDailyMealStatus,
  exportDailyMeals,
  getDailyMealStats
} = require('../controllers/adminController');
// ===== Subscription Management =====
router.post('/:id/skip-meal', authenticate, subscriptionController.skipMeal);
// Add this route to get skip history and limits

router.get('/:subscriptionId/skip-history', authenticate, subscriptionController.getSkipHistory);
// // Create a subscription
 router.get('/upcoming-deliveries', 
  authenticate, 
  authorize(['seller', 'admin', 'delivery_person']), 
  subscriptionDeliveryController.getUpcomingDeliveries
);
router.put('/:subscriptionId/delivery-tracking/status', authenticate, subscriptionDeliveryController.updateDeliveryStatus);
router.post('/', authenticate, subscriptionController.createSubscription);

// Clean up old failed subscriptions
router.post('/cleanup-failed', authenticate, subscriptionController.cleanupOldFailedSubscriptions);

// Clean up ALL pending_payment subscriptions (for unique index issues)
router.post('/cleanup-pending-payment', authenticate, subscriptionController.cleanupAllPendingPaymentSubscriptions);

// Process subscription payment verification
router.post('/verify-payment', authenticate, subscriptionController.processSubscriptionPayment);

// // Get all subscriptions for user
router.get('/user', authenticate, subscriptionController.getUserSubscriptions);

// Get specific user's subscriptions (for admin or user themselves)
router.get('/user/:userId', authenticate, subscriptionController.getUserSubscriptions);

// Get subscription detail with delivery tracking
router.get('/:subscriptionId/detail', authenticate, subscriptionController.getSubscriptionDetails);

// Get today's meal for a specific subscription (user-access)
router.get('/:subscriptionId/today-meal', authenticate, subscriptionController.getSubscriptionTodayMealForUser);

// Get user's today meal
router.get('/user/today-meal', authenticate, subscriptionController.getUserTodayMeal);

// Update user's today meal (refresh)
router.post('/user/today-meal/refresh', authenticate, subscriptionController.updateUserTodayMeal);

// Get user's today meal based on active subscription
router.get('/user/today-meal', authenticate, subscriptionController.getUserTodayMeal);

// Update user's today meal (refresh from seller meal plan)
router.put('/user/today-meal/refresh', authenticate, subscriptionController.updateUserTodayMeal);

// // Get details of a specific subscription
router.get('/:id', authenticate, subscriptionController.getSubscriptionDetails);

// // Pause a subscription
router.post('/:id/pause', authenticate, subscriptionController.pauseSubscription);

// // Resume a subscription
// router.post('/:id/resume', authenticate, subscriptionController.resumeSubscription);

// // Cancel a subscription
// router.post('/:id/cancel', authenticate, subscriptionController.cancelSubscription);

// // ===== Meal Customization =====

// // Customize meal for a subscription
router.post('/:id/customize', authenticate, subscriptionController.customizeMeal);

// // Skip meal for a subscription

// // Replace thali for a subscription
router.post('/:id/replace-thali', authenticate, subscriptionController.replaceThali);
// // Process payment for customization charges
router.post('/:id/customization-payment', authenticate, subscriptionController.processCustomizationPayment);

// ===== Thali Subscription Specific =====

// Skip a meal in thali subscription
router.post('/thali/:subscriptionId/skip-meal', authenticate, thaliSubscriptionController.skipMeal);

// Get delivery schedule for thali subscription
router.get('/thali/:subscriptionId/schedule', authenticate, thaliSubscriptionController.getDeliverySchedule);

// ===== Delivery Tracking =====

// Get delivery tracking for a subscription
router.get('/:subscriptionId/delivery-tracking', authenticate, subscriptionDeliveryController.getDeliveryTracking);

// Update delivery status

// Skip a delivery
router.post('/:subscriptionId/delivery-tracking/skip', authenticate, subscriptionDeliveryController.skipDelivery);

// Get upcoming deliveries (for sellers/delivery persons)
// router.get('/:id', authenticate, subscriptionController.getSubscriptionDetails);

// Create a new 56-thali subscription
router.post('/thali', authenticate, authorize('user', 'admin',"buyer"), thaliSubscriptionController.createThaliSubscription);

// Get thali subscription details
router.get('/thali/:subscriptionId', authenticate, thaliSubscriptionController.getSubscriptionDetails);

// ===== Test Routes =====
// Test subscription creation (for debugging)
router.post('/test/create', authenticate, subscriptionController.createTestSubscription);

// ===== Analytics & Reports =====

// Get meal calendar
// router.get('/:id/calendar', authenticate, subscriptionController.getMealCalendar);

// Trigger manual deduction
// router.post('/:id/deduct', authenticate, subscriptionController.triggerManualDeduction);

// // Process subscription payment verification
// router.post('/verify-payment', authenticate, subscriptionController.processSubscriptionPayment);
// // Update subscription with customization data
// router.post('/:id/update-customization', authenticate, subscriptionController.updateSubscriptionWithCustomization);




// Daily meals management routes
router.get('/daily-subscription-meals', authenticate, authorize('admin'), getDailySubscriptionMeals);
router.patch('/daily-meals/:mealId/status', authenticate, authorize('admin'), updateDailyMealStatus);
router.get('/daily-meals/export', authenticate, authorize('admin'), exportDailyMeals);
router.get('/daily-meals/stats', authenticate, authorize('admin'), getDailyMealStats);

module.exports = router;
module.exports = router;