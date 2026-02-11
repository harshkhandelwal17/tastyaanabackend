const express = require('express');
const router = express.Router();
const adminSubscriptionController = require('../controllers/adminSubscriptionController');
const { authenticate, authorize } = require('../middlewares/auth');

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize(['admin', 'superadmin']));

// Get all subscriptions with filtering and pagination
router.get('/', adminSubscriptionController.getAllSubscriptions);

// Get subscription by ID
router.get('/:id', adminSubscriptionController.getSubscriptionById);

// Create a new subscription (admin)
router.post('/', adminSubscriptionController.createSubscription);

// Update subscription
router.put('/:id', adminSubscriptionController.updateSubscription);

// Delete subscription (soft delete)
router.delete('/:id', adminSubscriptionController.deleteSubscription);

// Pause subscription
router.post('/:id/pause', adminSubscriptionController.pauseSubscription);

// Resume subscription
router.post('/:id/resume', adminSubscriptionController.resumeSubscription);

// Get subscription statistics
router.get('/stats/overview', adminSubscriptionController.getSubscriptionStats);

module.exports = router;
