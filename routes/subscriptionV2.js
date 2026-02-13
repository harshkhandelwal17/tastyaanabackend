const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const subscriptionController = require('../controllers/subscriptionV2Controller');
const { validateSubscription } = require('../middleware/laundryValidation.js');

// Protect all routes with authentication
router.use(authenticate);

// Create a new subscription
router.post('/', validateSubscription, subscriptionController.createSubscription);

// Get active subscription for the current user
router.get('/active', subscriptionController.getActiveSubscription);

// Get subscription by ID
router.get('/:id', subscriptionController.getSubscription);

// Update subscription
router.put('/:id', subscriptionController.updateSubscription);

// Cancel subscription
router.delete('/:id', subscriptionController.cancelSubscription);

// Pause subscription
router.post('/:id/pause', subscriptionController.pauseSubscription);

// Resume subscription
router.post('/:id/resume', subscriptionController.resumeSubscription);

module.exports = router;
