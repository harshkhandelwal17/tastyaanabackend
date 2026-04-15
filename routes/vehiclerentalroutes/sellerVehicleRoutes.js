// const express = require('express');
// const router = express.Router();
// const sellerVehicleController = require('../../controllers/vehiclerentalcontrollers/sellerVehicleController');
// const sellerRevenueController = require('../../controllers/sellerRevenueController');
// const { getAvailableVehicles, getLastMeterReading } = require('../../controllers/vehiclerentalcontrollers/sellerBookingController');
// const { authenticate, authorize } = require('../../middlewares/auth');
// const { vehicleUpload } = require('../../config/cloudinary');

// // Apply authentication to all routes
// router.use(authenticate);

// // Apply seller authorization to all routes
// router.use(authorize(['seller']));

// // ===== DASHBOARD =====

// // Get seller dashboard statistics
// router.get('/dashboard', sellerVehicleController.getSellerDashboard);

// // ===== REVENUE ANALYTICS =====

// // Get comprehensive revenue analytics
// router.get('/revenue/analytics', sellerRevenueController.getRevenueAnalytics);

// // Get monthly revenue comparison
// router.get('/revenue/monthly', sellerRevenueController.getMonthlyComparison);

// // Get seller profile (for settings/zones)
// router.get('/profile', sellerVehicleController.getSellerProfile);

// // Update seller profile (for settings/zones)
// router.put('/profile', sellerVehicleController.updateSellerProfile);

// // ===== VEHICLE MANAGEMENT =====

// // Get seller's vehicles
// router.get('/', sellerVehicleController.getSellerVehicles);

// // Get available vehicles for booking (time slot check)
// router.get('/available', getAvailableVehicles);

// // ===== BOOKING MANAGEMENT (must come before dynamic :vehicleId routes) =====

// // Get seller's bookings
// router.get('/bookings', sellerVehicleController.getSellerBookings);

// // Get specific booking details
// router.get('/bookings/:bookingId', sellerVehicleController.getBookingDetails);

// // Update booking status
// router.put('/bookings/:bookingId/status', sellerVehicleController.updateBookingStatus);

// // Verify OTP for booking confirmation
// router.post('/bookings/:bookingId/verify-otp', sellerVehicleController.verifyBookingOtp);

// // Update booking details
// router.put('/bookings/:bookingId', sellerVehicleController.updateBookingDetails);

// // Update vehicle handover meter reading
// router.put('/bookings/:bookingId/meter-reading/start', sellerVehicleController.updateStartMeterReading);

// // Update vehicle return meter reading and finalize trip
// router.put('/bookings/:bookingId/meter-reading/end', sellerVehicleController.updateEndMeterReading);

// // Get trip metrics and billing calculation
// router.get('/bookings/:bookingId/trip-metrics', sellerVehicleController.getTripMetrics);

// // Complete booking - vehicle dropoff
// router.post('/bookings/:bookingId/complete', sellerVehicleController.completeBooking);

// // ===== VEHICLE-SPECIFIC ROUTES (dynamic routes must come after specific paths) =====

// // Get last meter reading for a vehicle
// router.get('/:vehicleId/last-meter-reading', getLastMeterReading);

// // Get vehicle booking history
// router.get('/:vehicleId/bookings', sellerVehicleController.getVehicleBookingHistory);

// // Get vehicle maintenance history
// router.get('/:vehicleId/maintenance', sellerVehicleController.getVehicleMaintenanceHistory);

// // Add maintenance record
// router.post('/:vehicleId/maintenance', sellerVehicleController.addVehicleMaintenance);

// // Update maintenance record
// router.put('/:vehicleId/maintenance/:maintenanceId', sellerVehicleController.updateVehicleMaintenance);

// // Delete maintenance record
// router.delete('/:vehicleId/maintenance/:maintenanceId', sellerVehicleController.deleteVehicleMaintenance);

// // Get specific vehicle by ID
// router.get('/:vehicleId', sellerVehicleController.getVehicleById);

// // Create new vehicle
// router.post('/', vehicleUpload.array('images', 10), sellerVehicleController.createVehicle);

// // Update vehicle
// router.put('/:vehicleId', vehicleUpload.array('images', 5), sellerVehicleController.updateVehicle);

// // Delete vehicle
// router.delete('/:vehicleId', sellerVehicleController.deleteVehicle);

// // Toggle vehicle availability
// router.patch('/:vehicleId/toggle-availability', sellerVehicleController.toggleVehicleAvailability);

// // ===== ZONE MANAGEMENT =====

// // Get seller's service zones
// router.get('/zones', sellerVehicleController.getSellerZones);

// // Create or update seller's service zones
// router.post('/zones', sellerVehicleController.updateSellerZones);

// // Update specific zone
// router.put('/zones/:zoneId', sellerVehicleController.updateZone);

// // Delete specific zone
// router.delete('/zones/:zoneId', sellerVehicleController.deleteZone);

// module.exports = router;



const express = require('express');
const router = express.Router();
const sellerVehicleController = require('../../controllers/vehiclerentalcontrollers/sellerVehicleController');
const { changeSellerPassword, getSellerWorkers, createWorker, updateWorker, deleteWorker, resetWorkerPassword } = sellerVehicleController;
const sellerRevenueController = require('../../controllers/sellerRevenueController');
const { getAvailableVehicles, getLastMeterReading } = require('../../controllers/vehiclerentalcontrollers/sellerBookingController');
const { getDailyHisab } = require('../../controllers/vehiclerentalcontrollers/sellerDailyHisabController');
const { authenticate, authorize } = require('../../middlewares/auth');
const { vehicleUpload } = require('../../config/cloudinary');

// Apply authentication to all routes
router.use(authenticate);

// Apply seller authorization to all routes
router.use(authorize(['seller']));

// ===== DASHBOARD =====

// Get seller dashboard statistics
router.get('/dashboard', sellerVehicleController.getSellerDashboard);

// ===== DAILY HISAB =====

// Get daily transaction summary for a given date
// GET /api/seller/vehicles/daily-hisab?date=2026-03-22
router.get('/daily-hisab', getDailyHisab);

// ===== REVENUE ANALYTICS =====

// Get comprehensive revenue analytics
router.get('/revenue/analytics', sellerRevenueController.getRevenueAnalytics);

// Get monthly revenue comparison
router.get('/revenue/monthly', sellerRevenueController.getMonthlyComparison);

// Get seller profile (for settings/zones)
router.get('/profile', sellerVehicleController.getSellerProfile);

// Update seller profile (for settings/zones)
router.put('/profile', sellerVehicleController.updateSellerProfile);

// Change seller password
router.put('/profile/change-password', changeSellerPassword);

// ===== VEHICLE MANAGEMENT =====

// Get seller's vehicles
router.get('/', sellerVehicleController.getSellerVehicles);

// Get available vehicles for booking (time slot check)
router.get('/available', getAvailableVehicles);

// ===== BOOKING MANAGEMENT (must come before dynamic :vehicleId routes) =====

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

// Complete booking - vehicle dropoff
router.post('/bookings/:bookingId/complete', sellerVehicleController.completeBooking);

// ===== VEHICLE-SPECIFIC ROUTES (dynamic routes must come after specific paths) =====

// Get last meter reading for a vehicle
router.get('/:vehicleId/last-meter-reading', getLastMeterReading);

// Get vehicle booking history
router.get('/:vehicleId/bookings', sellerVehicleController.getVehicleBookingHistory);

// Get vehicle maintenance history
router.get('/:vehicleId/maintenance', sellerVehicleController.getVehicleMaintenanceHistory);

// Add maintenance record
router.post('/:vehicleId/maintenance', sellerVehicleController.addVehicleMaintenance);

// Update maintenance record
router.put('/:vehicleId/maintenance/:maintenanceId', sellerVehicleController.updateVehicleMaintenance);

// Delete maintenance record
router.delete('/:vehicleId/maintenance/:maintenanceId', sellerVehicleController.deleteVehicleMaintenance);

// Get specific vehicle by ID
router.get('/:vehicleId', sellerVehicleController.getVehicleById);

// Create new vehicle
router.post('/', vehicleUpload.array('images', 10), sellerVehicleController.createVehicle);

// Update vehicle
router.put('/:vehicleId', vehicleUpload.array('images', 5), sellerVehicleController.updateVehicle);

// Delete vehicle
router.delete('/:vehicleId', sellerVehicleController.deleteVehicle);

// Toggle vehicle availability
router.patch('/:vehicleId/toggle-availability', sellerVehicleController.toggleVehicleAvailability);

// ===== ZONE MANAGEMENT =====

// Get seller's service zones
router.get('/zones', sellerVehicleController.getSellerZones);

// Create or update seller's service zones
router.post('/zones', sellerVehicleController.updateSellerZones);

// Update specific zone
router.put('/zones/:zoneId', sellerVehicleController.updateZone);

// Delete specific zone
router.delete('/zones/:zoneId', sellerVehicleController.deleteZone);

// ===== WORKER MANAGEMENT =====

// Get all workers for this seller
router.get('/workers', getSellerWorkers);

// Create a new worker
router.post('/workers', createWorker);

// Update worker
router.put('/workers/:workerId', updateWorker);

// Delete/deactivate worker
router.delete('/workers/:workerId', deleteWorker);

// Reset worker password
router.put('/workers/:workerId/reset-password', resetWorkerPassword);

module.exports = router;