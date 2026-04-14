const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middlewares/auth');
const {
  getVehicleRentalSellers,
  getSellerOverview,
  getSellerBookingsAdmin,
  getSellerVehiclesAdmin,
  getSellerWorkersAdmin,
  getSellerIncomeAnalysis
} = require('../../controllers/vehiclerentalcontrollers/adminVehicleRentalController');

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// List all vehicle rental sellers
router.get('/sellers', getVehicleRentalSellers);

// Get single seller overview (stats + profile)
router.get('/sellers/:sellerId/overview', getSellerOverview);

// Get seller's bookings (admin view - can see deleted too)
router.get('/sellers/:sellerId/bookings', getSellerBookingsAdmin);

// Get seller's vehicles
router.get('/sellers/:sellerId/vehicles', getSellerVehiclesAdmin);

// Get seller's workers
router.get('/sellers/:sellerId/workers', getSellerWorkersAdmin);

// Get seller's income analysis
router.get('/sellers/:sellerId/income', getSellerIncomeAnalysis);

module.exports = router;