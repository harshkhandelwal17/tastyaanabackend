// Seller Booking Routes
// API endpoints for seller-side booking functionality

const express = require('express');
const router = express.Router();
const {
  createOfflineBooking,
  getSellerBookings,
  updateCashPayment,
  getCashFlowSummary,
  markCashHandover
} = require('../controllers/sellerBookingController');

// Middleware to check if user is seller
const checkSellerRole = (req, res, next) => {
  if (req.user.role !== 'seller') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Seller role required.'
    });
  }
  next();
};

// ===== Booking Management Routes =====

// Create offline booking for walk-in customers
// POST /api/seller/bookings/create-offline
router.post('/create-offline', checkSellerRole, createOfflineBooking);

// Get seller's bookings with filters (alternative endpoint for compatibility)
// GET /api/seller/bookings?zoneId=&status=&startDate=&endDate=&source=&page=&limit=
router.get('/', checkSellerRole, getSellerBookings);

// Update cash payment for a booking
// PUT /api/seller/bookings/:bookingId/cash-payment
router.put('/:bookingId/cash-payment', checkSellerRole, updateCashPayment);

// ===== Cash Flow Management Routes =====

// Get cash flow summary (with both endpoints for compatibility)
// GET /api/seller/bookings/cash-flow/summary?startDate=&endDate=&zoneId=
router.get('/cash-flow/summary', checkSellerRole, getCashFlowSummary);

// Alternative endpoint for frontend compatibility
// GET /api/seller/bookings/cash-flow-summary?startDate=&endDate=&zoneId=
router.get('/cash-flow-summary', checkSellerRole, getCashFlowSummary);

// Mark cash as handed over to admin
// POST /api/seller/cash-flow/handover
router.post('/cash-flow/handover', checkSellerRole, markCashHandover);

// Get daily cash collection report
// GET /api/seller/cash-flow/daily-report
router.get('/cash-flow/daily-report', checkSellerRole, async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const VehicleBooking = require('../models/VehicleBooking');
    
    const dailyReport = await VehicleBooking.aggregate([
      {
        $match: {
          bookedBy: sellerId,
          bookingDate: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: '$zoneId',
          zoneName: { $first: '$zone' },
          totalBookings: { $sum: 1 },
          offlineBookings: {
            $sum: { $cond: [{ $eq: ['$bookingSource', 'seller-portal'] }, 1, 0] }
          },
          onlineBookings: {
            $sum: { $cond: [{ $ne: ['$bookingSource', 'seller-portal'] }, 1, 0] }
          },
          totalCashCollected: {
            $sum: '$cashFlowDetails.cashPaymentDetails.totalCashReceived'
          },
          totalRevenue: { $sum: '$billing.finalAmount' },
          pendingAmount: {
            $sum: '$cashFlowDetails.cashPaymentDetails.pendingCashAmount'
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      date,
      report: dailyReport
    });

  } catch (error) {
    console.error('Error getting daily cash report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily cash report',
      error: error.message
    });
  }
});

module.exports = router;