
// routes/customRequests.js
const { authenticate } = require("../middlewares/auth");
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createCustomRequest,
  getUserCustomRequests,
  getActiveRequests,
  cancelCustomRequest,
  addAddonToCustomRequest,
  removeAddonFromCustomRequest
} = require('../controllers/customeRequestController');
// const { authenticate } = require('../middleware

    
    /**
     * @route   POST /api/custom-requests
     * @desc    Create custom meal request
     * @access  Private
     */
    router.post('/', authenticate, [
      body('dishName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Dish name must be between 2 and 100 characters'),
      body('quantity')
        .isInt({ min: 1, max: 10 })
        .withMessage('Quantity must be between 1 and 10'),
      body('category')
        .isIn(['north-indian', 'south-indian', 'chinese', 'continental', 'street-food', 'dessert', 'beverage', 'other'])
        .withMessage('Invalid category'),
      body('deliveryDate')
        .isISO8601()
        .withMessage('Valid delivery date is required'),
      body('deliverySlot')
        .isIn(['lunch', 'dinner', 'anytime'])
        .withMessage('Invalid delivery slot'),
      body('budget.preferred')
        .optional()
        .isFloat({ min: 1 })
        .withMessage('Budget must be positive'),
      body('broadcastRadius')
        .optional()
        .isInt({ min: 1, max: 25 })
        .withMessage('Broadcast radius must be between 1 and 25 km')
    ], createCustomRequest);
    
    /**
     * @route   GET /api/custom-requests
     * @desc    Get user's custom requests
     * @access  Private
     */
    router.get('/', authenticate, getUserCustomRequests);
    
    /**
     * @route   GET /api/custom-requests/active
     * @desc    Get active custom requests for restaurants
     * @access  Private (Restaurant)
     */
    router.get('/active', authenticate, getActiveRequests);
    
    /**
     * @route   PUT /api/custom-requests/:id/cancel
     * @desc    Cancel custom request
     * @access  Private
     */
    router.put('/:id/cancel', authenticate, cancelCustomRequest);

    /**
     * @route   PUT /api/custom-requests/:id/add-addon
     * @desc    Add addon to custom request
     * @access  Private
     */
    router.put('/:id/add-addon', authenticate, addAddonToCustomRequest);

    /**
     * @route   PUT /api/custom-requests/:id/remove-addon
     * @desc    Remove addon from custom request
     * @access  Private
     */
    router.put('/:id/remove-addon', authenticate, removeAddonFromCustomRequest);
    
    module.exports = router;
    