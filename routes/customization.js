const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  createCustomization,
  getSubscriptionCustomizations,
  updateCustomization,
  deleteCustomization,
  getCalendarCustomizations,
  createCustomizationPayment,
  verifyCustomizationPayment,
  getUserCustomizationHistory,
  syncThaliReplacements,
  checkInvalidPaymentStates,
  cleanupInvalidPaymentStates
} = require('../controllers/customizationController');
const {
  validateCreateCustomization,
  validateUpdateCustomization,
  validateGetCustomizations
} = require('../middleware/validators/customizationValidator');

// Protect all routes
router.use(authenticate);

// @desc    Create a new customization
// @route   POST /api/customizations
// @access  Private
router.post('/', validateCreateCustomization, createCustomization);

// @desc    Get customizations for a subscription
// @route   GET /api/subscriptions/:subscriptionId/customizations
// @access  Private
router.get('/subscriptions/:subscriptionId/customizations', validateGetCustomizations, getSubscriptionCustomizations);

// @desc    Get customizations for calendar view
// @route   GET /api/customizations/calendar
// @access  Private
router.get('/calendar', validateGetCustomizations, getCalendarCustomizations);

// @desc    Create payment order for customization
// @route   POST /api/customizations/:id/payment
// @access  Private
router.post('/:id/payment', createCustomizationPayment);

// @desc    Verify customization payment
// @route   POST /api/customizations/:id/verify-payment
// @access  Private
router.post('/:id/verify-payment', verifyCustomizationPayment);

// @desc    Update a customization
// @route   PUT /api/customizations/:id
// @access  Private
router.put('/:id', validateUpdateCustomization, updateCustomization);

// @desc    Delete a customization
// @route   DELETE /api/customizations/:id
// @access  Private
router.delete('/:id', deleteCustomization);

// @desc    Get user customization history
// @route   GET /api/customizations/history
// @access  Private
router.get('/history', getUserCustomizationHistory);

// @desc    Sync existing customizations with subscription's thaliReplacements
// @route   POST /api/customizations/sync-thali-replacements
// @access  Private
router.post('/sync-thali-replacements', syncThaliReplacements);

// @desc    Check for invalid payment states in customizations
// @route   GET /api/customizations/check-payment-states
// @access  Private
router.get('/check-payment-states', checkInvalidPaymentStates);

// @desc    Clean up invalid payment state customizations
// @route   POST /api/customizations/cleanup-invalid-payments
// @access  Private
router.post('/cleanup-invalid-payments', cleanupInvalidPaymentStates);

module.exports = router;
