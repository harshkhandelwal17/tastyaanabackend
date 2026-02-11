const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  getThaliOverview,
  getThaliPreparationSummary
} = require('../controllers/sellerThaliController');

// Apply authentication and seller authorization to all routes
router.use(authenticate);
router.use(authorize('seller', 'admin'));

// @route   GET /api/seller/thali-overview
// @desc    Get thali delivery overview for seller
// @access  Private (Seller)
router.get('/thali-overview', getThaliOverview);

// @route   GET /api/seller/thali-preparation
// @desc    Get thali preparation summary
// @access  Private (Seller)
router.get('/thali-preparation', getThaliPreparationSummary);

module.exports = router;
