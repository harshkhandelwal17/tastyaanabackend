const express = require('express');
const router = express.Router();
// const {  authorize } = require('../middlewares/auth');
const subscriptionController = require('../controllers/subscriptionV2Controller');
const { authenticate, authorize } = require('../middlewares/auth');

// Protect all routes with authentication and seller authorization
router.use(authenticate);
router.use(authorize('seller', 'admin'));

// Get all subscriptions for seller's meal plans
router.get('/', subscriptionController.getSellerSubscriptions);

// Get subscription statistics for seller dashboard
router.get('/stats', subscriptionController.getSellerSubscriptionStats);

// Get subscription by ID
router.get('/:id', subscriptionController.getSubscription);

// Update subscription by ID
router.put('/:id', subscriptionController.updateSubscription);

// Delete subscription by ID
router.delete('/:id', subscriptionController.deleteSubscription);

// Get upcoming deliveries for seller's meal plans
router.get('/deliveries/upcoming', subscriptionController.getUpcomingDeliveries);

// Get delivery history for seller's meal plans
router.get('/deliveries/history', subscriptionController.getDeliveryHistory);

module.exports = router;
