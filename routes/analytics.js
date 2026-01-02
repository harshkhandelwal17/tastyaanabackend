
// routes/analytics.js
const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const analyticsController = require('../controllers/advancedAnalyticsController');

// All routes require seller authentication
router.use(auth);
router.use(checkRole(['seller']));

// Advanced analytics endpoints
router.get('/dashboard', analyticsController.getAdvancedDashboard);
router.get('/cohort', analyticsController.getCohortAnalysis);
router.get('/realtime', analyticsController.getRealTimeAnalytics);
router.get('/predictive', analyticsController.getPredictiveAnalytics);
router.get('/customer-segmentation', analyticsController.getCustomerSegmentation);
router.get('/product-performance', analyticsController.getProductPerformance);
router.get('/financial-metrics', analyticsController.getFinancialMetrics);
router.get('/export', analyticsController.exportAnalytics);

module.exports = router;
