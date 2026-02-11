const express = require('express');
const router = express.Router();
const thaliSubscriptionController = require('../controllers/thaliSubscriptionController');
const { protect, authorize } = require('../middleware/auth');

// Create a new 56-thali subscription
router.post(
  '/', 
  protect, 
  authorize('user', 'admin'),
  thaliSubscriptionController.createThaliSubscription
);

// Get subscription details
router.get(
  '/:subscriptionId', 
  protect, 
  thaliSubscriptionController.getSubscriptionDetails
);

// Skip a meal
router.post(
  '/:subscriptionId/skip-meal', 
  protect, 
  thaliSubscriptionController.skipMeal
);

// Get delivery schedule
router.get(
  '/:subscriptionId/schedule', 
  protect, 
  thaliSubscriptionController.getDeliverySchedule
);

module.exports = router;
