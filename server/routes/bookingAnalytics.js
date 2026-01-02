// Booking Type Analytics Routes
// API endpoints to demonstrate offline vs online booking differentiation

const express = require('express');
const router = express.Router();
const VehicleBooking = require('../models/VehicleBooking');
const { authenticate, authorize } = require('../middlewares/auth');

// Apply authentication to all routes
router.use(authenticate);

// ===== BOOKING TYPE ANALYTICS =====

// Get booking statistics by type
// GET /api/admin/booking-analytics/stats?startDate=2024-01-01&endDate=2024-12-31
router.get('/stats', authorize(['admin', 'seller']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = {};
    
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const stats = await VehicleBooking.getBookingStats(dateRange);
    
    // Process stats for better readability
    const processedStats = {
      online: stats.find(s => s._id === 'online') || { 
        _id: 'online', count: 0, totalRevenue: 0, totalCashReceived: 0, averageBookingValue: 0 
      },
      offline: stats.filter(s => ['seller-portal', 'worker-portal', 'offline'].includes(s._id)),
      summary: {
        totalOnline: stats.find(s => s._id === 'online')?.count || 0,
        totalOffline: stats.filter(s => ['seller-portal', 'worker-portal', 'offline'].includes(s._id))
          .reduce((sum, s) => sum + s.count, 0),
        totalBookings: stats.reduce((sum, s) => sum + s.count, 0),
        totalRevenue: stats.reduce((sum, s) => sum + s.totalRevenue, 0),
        totalCashCollected: stats.reduce((sum, s) => sum + s.totalCashReceived, 0),
        onlinePercentage: 0,
        offlinePercentage: 0
      }
    };

    // Calculate percentages
    if (processedStats.summary.totalBookings > 0) {
      processedStats.summary.onlinePercentage = 
        (processedStats.summary.totalOnline / processedStats.summary.totalBookings * 100).toFixed(2);
      processedStats.summary.offlinePercentage = 
        (processedStats.summary.totalOffline / processedStats.summary.totalBookings * 100).toFixed(2);
    }

    res.status(200).json({
      success: true,
      data: processedStats,
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      }
    });

  } catch (error) {
    console.error('Error getting booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking statistics',
      error: error.message
    });
  }
});

// Get bookings by type with pagination
// GET /api/admin/booking-analytics/by-type?type=online&page=1&limit=10
router.get('/by-type', authorize(['admin', 'seller']), async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 10, sellerId } = req.query;
    
    let filters = {};
    if (sellerId && req.user.role === 'admin') {
      filters.bookedBy = sellerId;
    } else if (req.user.role === 'seller') {
      filters.bookedBy = req.user.id;
    }

    const bookings = await VehicleBooking.getBookingsByType(type, filters)
      .populate('userId', 'name email phone')
      .populate('bookedBy', 'name role')
      .populate('vehicleId', 'make model licensePlate')
      .sort({ bookingDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await VehicleBooking.getBookingsByType(type, filters).countDocuments();

    // Add type info to each booking
    const bookingsWithTypeInfo = bookings.map(booking => ({
      ...booking.toObject(),
      typeInfo: booking.getBookingTypeInfo()
    }));

    res.status(200).json({
      success: true,
      data: bookingsWithTypeInfo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filter: { type }
    });

  } catch (error) {
    console.error('Error getting bookings by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings by type',
      error: error.message
    });
  }
});

// Get booking type summary for a specific booking
// GET /api/admin/booking-analytics/:bookingId/type-info
router.get('/:bookingId/type-info', authorize(['admin', 'seller']), async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await VehicleBooking.findOne({ bookingId })
      .populate('userId', 'name email phone')
      .populate('bookedBy', 'name role')
      .populate('vehicleId', 'make model licensePlate');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization for sellers
    if (req.user.role === 'seller' && booking.bookedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own bookings.'
      });
    }

    const typeInfo = booking.getBookingTypeInfo();

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        customer: {
          name: booking.userId?.name,
          email: booking.userId?.email,
          phone: booking.userId?.phone
        },
        vehicle: {
          make: booking.vehicleId?.make,
          model: booking.vehicleId?.model,
          licensePlate: booking.vehicleId?.licensePlate
        },
        creator: {
          name: booking.bookedBy?.name,
          role: booking.bookedBy?.role
        },
        typeInfo,
        isOnline: VehicleBooking.isOnlineBooking(booking),
        isOffline: VehicleBooking.isOfflineBooking(booking),
        bookingDate: booking.bookingDate,
        totalAmount: booking.billing?.finalAmount,
        paymentStatus: booking.paymentStatus
      }
    });

  } catch (error) {
    console.error('Error getting booking type info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking type information',
      error: error.message
    });
  }
});

module.exports = router;