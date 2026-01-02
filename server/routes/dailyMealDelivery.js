const express = require('express');
const router = express.Router();
const {
  getSellerDailyDeliveries,
  updateDeliveryStatus,
  bulkUpdateDeliveryStatus,
  getDeliveryDetails,
  getSellerDeliveryStats,
  createDailyMealRecords
} = require('../controllers/dailyMealDeliveryController');
const { authenticate, authorize} = require('../middlewares/auth');

// ===================================================================
// SELLER DAILY MEAL DELIVERY ROUTES
// ===================================================================

/**
 * @route   GET /api/daily-meal-delivery/seller/:sellerId/deliveries
 * @desc    Get seller's daily meal deliveries with filtering
 * @access  Private (Seller)
 * @params  sellerId, date, shift, status, userId, page, limit
 */
router.get('/seller/:sellerId/deliveries', 
  authenticate, 
  authorize(['seller', 'admin']), 
  getSellerDailyDeliveries
);

/**
 * @route   PUT /api/daily-meal-delivery/:deliveryId/status
 * @desc    Update delivery status
 * @access  Private (Seller)
 * @body    { status, notes, deliveryImage }
 */
router.put('/:deliveryId/status', 
  authenticate, 
  authorize(['seller', 'admin']), 
  updateDeliveryStatus
);

/**
 * @route   PUT /api/daily-meal-delivery/bulk-update-status
 * @desc    Bulk update delivery statuses
 * @access  Private (Seller)
 * @body    { deliveryIds: [], status, notes }
 */
router.put('/bulk-update-status', 
  authenticate, 
  authorize(['seller', 'admin']), 
  bulkUpdateDeliveryStatus
);

/**
 * @route   GET /api/daily-meal-delivery/:deliveryId
 * @desc    Get delivery details by ID
 * @access  Private (Seller/User)
 */
router.get('/:deliveryId', 
  authenticate, 
  getDeliveryDetails
);

/**
 * @route   GET /api/daily-meal-delivery/seller/:sellerId/stats
 * @desc    Get seller's delivery statistics
 * @access  Private (Seller)
 * @params  startDate, endDate
 */
router.get('/seller/:sellerId/stats', 
  authenticate, 
  authorize(['seller', 'admin']), 
  getSellerDeliveryStats
);

/**
 * @route   POST /api/daily-meal-delivery/create-records
 * @desc    Create daily meal records for active subscriptions (Admin/Cron)
 * @access  Private (Admin)
 * @body    { date, shift }
 */
router.post('/create-records', 
  authenticate, 
  authorize(['admin']), 
  createDailyMealRecords
);

module.exports = router;
