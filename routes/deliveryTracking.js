const express = require('express');
const router = express.Router();
const {
  getOrderTracking,
  updateOrderStatus,
  updateDeliveryStatus,
  updateDriverLocation,
  assignDriver,
  getActiveDeliveries,
  confirmPickup,
  getFlaggedHandovers
} = require('../controllers/deliveryTrackingController');
const { authenticate:protect, authorize } = require('../middlewares/auth');

// Get tracking information for a specific order
router.get('/orders/:orderId/tracking', protect, getOrderTracking);

// Alternative route that matches frontend API call
router.get('/:orderId', protect, getOrderTracking);

// Update order status (admin/driver only)
router.put('/orders/:orderId/status', protect, authorize(['admin', 'driver','delivery']), updateOrderStatus);

// Update delivery status (admin/driver only) - NEW ENDPOINT
router.put('/:orderId/status', protect, authorize(['admin', 'driver','delivery']), updateDeliveryStatus);

// Update driver location (driver only)
router.put('/orders/:orderId/location', protect, authorize('driver'), updateDriverLocation);

// Assign driver to order (admin only)
router.put('/orders/:orderId/assign-driver', protect, authorize('admin'), assignDriver);

// Get all active deliveries (admin only)
router.get('/active-deliveries', protect, authorize('admin'), getActiveDeliveries);

// Confirm pickup by delivery partner
router.put('/orders/:orderId/confirm-pickup', protect, authorize(['admin', 'driver', 'delivery']), confirmPickup);

// Get flagged handovers (admin only)
router.get('/flagged-handovers', protect, authorize('admin'), getFlaggedHandovers);

module.exports = router;
