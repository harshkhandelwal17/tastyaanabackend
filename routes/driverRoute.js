const express = require('express');
const router = express.Router();
const {
  getDriverRoute,
  reorderRoute,
  completeStop,
  startRoute,
  getUserDeliveryProgress,
  getTodayDeliveryProgress,
  autoAssignDelivery,
  getAdminRoutes
} = require('../controllers/driverRouteController');
const { authenticate, authorize } = require('../middlewares/auth');

// Driver routes
router.get('/driver/route/:date/:shift', authenticate, authorize(['delivery', 'driver']), getDriverRoute);
router.put('/driver/route/:routeId/reorder', authenticate, authorize(['delivery', 'driver']), reorderRoute);
router.put('/driver/route/:routeId/complete-stop/:stopId', authenticate, authorize(['delivery', 'driver']), completeStop);
router.put('/driver/route/:routeId/start', authenticate, authorize(['delivery', 'driver']), startRoute);

// User routes
router.get('/user/delivery-progress/:subscriptionId/:date/:shift', authenticate, getUserDeliveryProgress);
router.get('/user/delivery-progress', authenticate, getTodayDeliveryProgress);

// System routes
router.post('/system/assign-delivery', authenticate, authorize(['admin', 'system']), autoAssignDelivery);

// Admin routes
router.get('/admin/routes/:date/:shift', authenticate, authorize(['admin', 'super-admin']), getAdminRoutes);

module.exports = router;
