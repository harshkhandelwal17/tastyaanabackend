const express = require('express');
const router = express.Router();
const {
  getWorkerDashboard,
  getWorkerVehicles,
  getWorkerBookings,
  getWorkerBookingDetails,
  getWorkerProfile,
  completeWorkerBooking
} = require('../controllers/vehiclerentalcontrollers/workerVehicleController');
const { authenticate, authorize } = require('../middlewares/auth');

// Protect all routes - only workers can access
router.use(authenticate);
router.use(authorize(['worker']));

// Dashboard
router.get('/dashboard', getWorkerDashboard);

// Worker profile
router.get('/profile', getWorkerProfile);

// Vehicles (in worker's zone)
router.get('/vehicles', getWorkerVehicles);

// Bookings (in worker's zone)
router.get('/bookings', getWorkerBookings);

// Booking details
router.get('/bookings/:bookingId', getWorkerBookingDetails);

// Complete booking (dropoff)
router.post('/bookings/:bookingId/complete', completeWorkerBooking);

module.exports = router;
