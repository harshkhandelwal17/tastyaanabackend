const express = require('express');
const router = express.Router();
const {
  getWorkerDashboard,
  getWorkerVehicles,
  getWorkerBookings,
  getWorkerBookingDetails,
  getWorkerProfile,
  completeWorkerBooking,
  updateWorkerBookingStatus,
  updateWorkerBookingDetails,
  createWorkerExtension,
  getWorkerDailyHisab,
  getWorkerRevenueAnalytics,
  getWorkerMonthlyRevenue
} = require('../controllers/vehiclerentalcontrollers/workerVehicleController');
const { authenticate, authorize } = require('../middlewares/auth');

// Protect all routes - only workers can access
router.use(authenticate);
router.use(authorize(['worker']));

// Dashboard
router.get('/dashboard', getWorkerDashboard);

// Daily Hisab (date-based transaction summary for worker's zone)
router.get('/daily-hisab', getWorkerDailyHisab);

// Worker profile
router.get('/profile', getWorkerProfile);

// Vehicles (in worker's zone)
router.get('/vehicles', getWorkerVehicles);

// Bookings (in worker's zone)
router.get('/bookings', getWorkerBookings);

// Booking details
router.get('/bookings/:bookingId', getWorkerBookingDetails);

// Update booking status
router.put('/bookings/:bookingId/status', updateWorkerBookingStatus);

// Update booking details (customer info, meter, deposit, notes)
router.put('/bookings/:bookingId', updateWorkerBookingDetails);

// Create / approve extension (worker-initiated, auto-approved)
router.post('/bookings/:bookingId/create-extension', createWorkerExtension);

// Complete booking (dropoff)
router.post('/bookings/:bookingId/complete', completeWorkerBooking);

// Revenue Analytics
router.get('/revenue/analytics', getWorkerRevenueAnalytics);

// Monthly Revenue
router.get('/revenue/monthly', getWorkerMonthlyRevenue);

module.exports = router;
