const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminPanelController');
const { authenticate, authorize } = require('../middlewares/auth');

// Security middleware for admin-only access
const adminOnly = [authenticate, authorize(['admin', 'super-admin'])];

// Additional security: Request logging for admin actions
const adminLogger = (req, res, next) => {
  console.log(`[ADMIN ACCESS] ${new Date().toISOString()} - ${req.method} ${req.path} - User: ${req.user?.email || 'Unknown'} - Role: ${req.user?.role || 'Unknown'} - IP: ${req.ip}`);
  next();
};

// Apply logging to all admin routes
router.use(adminLogger);

// Dashboard & Analytics
router.get('/dashboard', adminOnly, adminController.getDashboardAnalytics);
router.get('/analytics', adminOnly, adminController.getAnalytics);
router.get('/analytics/revenue', adminOnly, adminController.getAnalytics); // For revenue analytics

// User Management
router.get('/users', adminOnly, adminController.getUsers);
router.get('/users/:userId', adminOnly, adminController.getUserById);
router.put('/users/:userId', adminOnly, adminController.updateUser);
router.put('/users/:userId/status', adminOnly, adminController.updateUserStatus);

// Subscription Management
router.get('/subscriptions', adminOnly, adminController.getSubscriptions);
router.get('/subscriptions/:subscriptionId', adminOnly, adminController.getSubscriptionById);
router.put('/subscriptions/:subscriptionId/status', adminOnly, adminController.updateSubscriptionStatus);

// Order Management
router.get('/orders', adminOnly, adminController.getOrders);
router.get('/orders/:orderId', adminOnly, adminController.getOrderById);
router.put('/orders/:orderId/status', adminOnly, adminController.updateOrderStatus);
// Note: updateOrderStatus needs to be implemented if needed

// Meal Plan & Product Analytics
router.get('/mealplans', adminOnly, adminController.getMealPlanAnalytics);
// Note: getMealPlanDetails needs to be implemented if needed

// Admin Management Routes (Super Admin Only)
const superAdminOnly = [authenticate, authorize(['super-admin'])];

// Super admin routes for managing other admins
router.get('/admins', superAdminOnly, adminController.getAdmins || ((req, res) => {
  res.status(501).json({ success: false, message: 'Admin management not implemented yet' });
}));

router.post('/admins', superAdminOnly, adminController.createAdmin || ((req, res) => {
  res.status(501).json({ success: false, message: 'Admin creation not implemented yet' });
}));

// Security: Admin activity logs
router.get('/activity-logs', superAdminOnly, adminController.getActivityLogs || ((req, res) => {
  res.status(501).json({ success: false, message: 'Activity logs not implemented yet' });
}));

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin panel API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Manual subscription expiry check (Super Admin Only)
router.post('/check-expired-subscriptions', superAdminOnly, async (req, res) => {
  try {
    const { runExpiryCheckNow } = require('../jobs/subscriptionExpiry');
    const result = await runExpiryCheckNow();
    
    res.json({
      success: true,
      message: 'Subscription expiry check completed',
      data: result
    });
  } catch (error) {
    console.error('Manual expiry check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run expiry check',
      error: error.message
    });
  }
});

module.exports = router;