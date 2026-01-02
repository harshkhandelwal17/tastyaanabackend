const express = require('express');
const router = express.Router();
const sellerAnalyticsController = require('../controllers/sellerAnalyticsController');
const { authenticate, authorize } = require('../middlewares/auth');

// Apply authentication and seller role requirement to all routes
router.use(authenticate);
router.use(authorize(['seller', 'admin']));

// Main analytics dashboard endpoint
router.get('/dashboard', sellerAnalyticsController.getSellerAnalytics);

// Detailed order analytics
router.get('/orders', sellerAnalyticsController.getOrderAnalytics);

// Subscription analytics
router.get('/subscriptions', sellerAnalyticsController.getSubscriptionAnalytics);

// Financial summary
router.get('/financial', sellerAnalyticsController.getFinancialSummary);

module.exports = router;
