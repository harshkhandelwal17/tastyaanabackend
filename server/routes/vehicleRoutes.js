const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const vehicleBookingController = require('../controllers/vehicleBookingController');
const vehicleRefundController = require('../controllers/vehicleRefundController');
const bookingDocumentController = require('../controllers/bookingDocumentController');
const { authenticate } = require('../middlewares/auth');
const { vehicleUpload, documentUpload } = require('../config/cloudinary'); // Use vehicle-specific and document-specific Cloudinary configuration


// ===== VEHICLE ROUTES =====

// Public routes (no authentication required)
router.get('/public', vehicleController.getVehicles); // Get available vehicles for users
router.get('/public/shops', vehicleController.getVehicleShops); // Get shops with their vehicles
router.get('/public/types', vehicleController.getVehicleTypes); // Get vehicle types with counts
router.get('/public/filters', vehicleController.getFilterOptions); // Get all filter options

// Public booking lookup (for users to check booking status without auth)
router.get('/public/booking-lookup', vehicleBookingController.getBookingByLookup); // Get booking by booking ID + email/phone

// Handle invalid public endpoints - common frontend route patterns
router.get('/public/my-vehicle-bookings', (req, res) => {
  console.log('🔍 Incorrect API request intercepted:', req.originalUrl);
  console.log('🔍 Headers:', req.headers);
  console.log('🔍 User-Agent:', req.get('User-Agent'));

  res.status(400).json({
    success: false,
    message: 'This is a frontend route, not an API endpoint.',
    suggestion: 'Navigate to /my-vehicle-bookings in your frontend application instead of making an API request',
    debug: {
      requestedUrl: req.originalUrl,
      correctFrontendRoute: '/my-vehicle-bookings',
      authenticatedApiRoute: '/api/vehicles/bookings/my-bookings',
      publicLookupApiRoute: '/api/vehicles/public/booking-lookup?bookingId=VB123&email=user@example.com',
      note: 'Use the authenticated endpoint for logged-in users, or the public lookup for booking verification'
    }
  });
});

router.get('/public/bookings', (req, res) => {
  console.log('🔍 Incorrect API request intercepted:', req.originalUrl);

  res.status(400).json({
    success: false,
    message: 'Public bookings endpoint is not available. Please use authenticated booking endpoints.',
    suggestion: 'Use /api/vehicles/bookings/all with proper authentication',
    debug: {
      requestedUrl: req.originalUrl,
      correctApiRoute: '/api/vehicles/bookings/all (with authentication)'
    }
  });
});

// Catch-all for other potential frontend route conflicts
router.get('/public/:invalidRoute', (req, res, next) => {
  const invalidRoute = req.params.invalidRoute;
  const commonFrontendRoutes = [
    'my-bookings', 'my-orders', 'my-profile', 'dashboard', 'settings',
    'history', 'favorites', 'cart', 'checkout', 'account'
  ];

  if (commonFrontendRoutes.includes(invalidRoute)) {
    console.log('🔍 Potential frontend route accessed as API:', req.originalUrl);

    return res.status(400).json({
      success: false,
      message: `"${invalidRoute}" appears to be a frontend route, not an API endpoint.`,
      suggestion: `Navigate to /${invalidRoute} in your frontend application instead of making an API request`,
      debug: {
        requestedUrl: req.originalUrl,
        detectedPattern: 'frontend-route',
        correctFrontendRoute: `/${invalidRoute}`
      }
    });
  }

  // Continue to the original getVehicleById handler for valid vehicle IDs
  next();
});

router.post('/check-availability', vehicleController.checkAvailability); // Check availability
router.get('/public/:id', vehicleController.getVehicleById); // Get single vehicle details (must be last)

// Protected routes (authentication required) 
router.use(authenticate); // Apply auth middleware to all routes below

// ===== BILLING & REFUND ROUTES (Must be before generic vehicle routes) =====

// Refund management 
router.get('/refunds', vehicleRefundController.getAllRefunds); // Get all refunds with filters
router.get('/refunds/stats', vehicleRefundController.getRefundStats); // Get refund statistics 
router.get('/refunds/:id', vehicleRefundController.getRefundById); // Get single refund details
router.post('/bookings/:id/refund', vehicleRefundController.processRefund); // Process new refund
router.put('/refunds/:id/status', vehicleRefundController.updateRefundStatus); // Update refund status

// Extra charges and collections
router.post('/bookings/:id/extra-charges', vehicleRefundController.addExtraCharges); // Add extra charges
router.post('/bookings/:id/offline-collection', vehicleRefundController.recordOfflineCollection); // Record offline payment

// ===== BOOKING ROUTES =====

// Booking validation and calculation (no auth required for price checking)
router.post('/bookings/validate', vehicleBookingController.validateBookingDetails); // Validate booking details
router.post('/bookings/calculate', vehicleBookingController.validateBookingDetails); // Alias for validation

// Booking CRUD operations
router.get('/bookings/all', vehicleBookingController.getBookings); // Get all bookings
router.get('/bookings/my-bookings', vehicleBookingController.getUserBookings); // User's booking history
router.get('/bookings/:id', vehicleBookingController.getBookingById); // Get single booking
router.post('/bookings', vehicleBookingController.createBooking); // Create booking

// Booking status management
router.put('/bookings/:id/status', vehicleBookingController.updateBookingStatus); // Update booking status
router.put('/bookings/:id/approval', vehicleBookingController.approveBooking); // Approve/Deny booking request

// Payment routes
router.post('/bookings/payment/create-order', vehicleBookingController.createRazorpayOrder); // Create payment order
router.post('/bookings/payment/verify', vehicleBookingController.verifyPayment); // Verify payment

// Document upload routes
router.post('/bookings/documents/upload', documentUpload.any(), bookingDocumentController.uploadBookingDocuments); // Upload documents with any field names
router.put('/bookings/:id/documents', bookingDocumentController.updateBookingDocuments); // Update booking documents

// Vehicle return and verification routes
router.post('/bookings/:id/return', bookingDocumentController.markVehicleReturned); // Mark vehicle as returned

// Extension routes
router.post('/bookings/:id/request-extension', vehicleBookingController.requestExtension); // User requests extension
router.post('/bookings/:id/respond-extension', vehicleBookingController.respondToExtension); // Seller approves/rejects
router.post('/bookings/:id/verify-extension-payment', vehicleBookingController.verifyExtensionPayment); // Verify extension payment
router.post('/bookings/:id/recalculate-on-drop', vehicleBookingController.recalculateBillOnDrop); // Recalculate bill on vehicle return
router.get('/extensions/pending', vehicleBookingController.getPendingExtensions); // Get pending extensions for seller

// ===== VEHICLE ROUTES (Generic routes go last) =====

// Vehicle CRUD operations
router.get('/', vehicleController.getVehicles); // Get all vehicles with admin/seller filters
router.get('/:id', vehicleController.getVehicleById); // Get single vehicle
router.post('/', vehicleUpload.array('images', 10), vehicleController.createVehicle); // Create vehicle
router.put('/:id', vehicleUpload.array('images', 10), vehicleController.updateVehicle); // Update vehicle
router.delete('/:id', vehicleController.deleteVehicle); // Delete vehicle

// Vehicle analytics
router.get('/:id/analytics', vehicleController.getVehicleAnalytics); // Get vehicle analytics

module.exports = router;