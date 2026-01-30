const express = require('express');
const router = express.Router();
const sellerVehicleController = require('../../controllers/vehiclerentalcontrollers/sellerVehicleController');
const sellerRevenueController = require('../../controllers/sellerRevenueController');
const { getAvailableVehicles } = require('../../controllers/vehiclerentalcontrollers/sellerBookingController');
const { authenticate, authorize } = require('../../middlewares/auth');
const { vehicleUpload } = require('../../config/cloudinary');

// Apply authentication to all routes
router.use(authenticate);

// Apply seller authorization to all routes
router.use(authorize(['seller']));

// ===== DASHBOARD =====

// Get seller dashboard statistics
router.get('/dashboard', sellerVehicleController.getSellerDashboard);

// ===== REVENUE ANALYTICS =====

// Get comprehensive revenue analytics
router.get('/revenue/analytics', sellerRevenueController.getRevenueAnalytics);

// Get monthly revenue comparison
router.get('/revenue/monthly', sellerRevenueController.getMonthlyComparison);

// Get seller profile (for settings/zones)
router.get('/profile', sellerVehicleController.getSellerProfile);

// Update seller profile (for settings/zones)
router.put('/profile', sellerVehicleController.updateSellerProfile);

// ===== VEHICLE MANAGEMENT =====

// Get seller's vehicles
router.get('/', sellerVehicleController.getSellerVehicles);

// Get available vehicles for booking (time slot check)
router.get('/available', getAvailableVehicles);

// Create new vehicle
router.post('/', vehicleUpload.array('images', 10), sellerVehicleController.createVehicle);

// Update vehicle
router.put('/:vehicleId', vehicleUpload.array('images', 5), sellerVehicleController.updateVehicle);

// Delete vehicle
router.delete('/:vehicleId', sellerVehicleController.deleteVehicle);

// Toggle vehicle availability
router.patch('/:vehicleId/toggle-availability', sellerVehicleController.toggleVehicleAvailability);

// ===== BOOKING MANAGEMENT =====

// Get seller's bookings
router.get('/bookings', sellerVehicleController.getSellerBookings);

// Get specific booking details
router.get('/bookings/:bookingId', sellerVehicleController.getBookingDetails);

// Update booking status
router.put('/bookings/:bookingId/status', sellerVehicleController.updateBookingStatus);

// Verify OTP for booking confirmation
router.post('/bookings/:bookingId/verify-otp', sellerVehicleController.verifyBookingOtp);

// Update booking details
router.put('/bookings/:bookingId', sellerVehicleController.updateBookingDetails);

// Update vehicle handover meter reading
router.put('/bookings/:bookingId/meter-reading/start', sellerVehicleController.updateStartMeterReading);

// Update vehicle return meter reading and finalize trip
router.put('/bookings/:bookingId/meter-reading/end', sellerVehicleController.updateEndMeterReading);

// Get trip metrics and billing calculation
router.get('/bookings/:bookingId/trip-metrics', sellerVehicleController.getTripMetrics);

// Finalize booking billing after vehicle return
router.post('/bookings/:bookingId/finalize-billing', sellerVehicleController.finalizeBookingBilling);

// Extension management
router.post('/bookings/:bookingId/create-extension', sellerVehicleController.createExtension);
router.post('/bookings/:bookingId/respond-extension', sellerVehicleController.respondToExtension);

// Vehicle drop processing
router.post('/bookings/:bookingId/drop-vehicle', sellerVehicleController.processVehicleDrop);

// Complete booking - Vehicle Dropoff with final bill
router.post('/bookings/:bookingId/complete', sellerVehicleController.completeBooking);

// ===== ZONE MANAGEMENT =====

// Get seller's service zones
router.get('/zones', sellerVehicleController.getSellerZones);

// Create or update seller's service zones
router.post('/zones', sellerVehicleController.updateSellerZones);

// Update specific zone
router.put('/zones/:zoneId', sellerVehicleController.updateZone);

// Delete specific zone
router.delete('/zones/:zoneId', sellerVehicleController.deleteZone);

module.exports = router;