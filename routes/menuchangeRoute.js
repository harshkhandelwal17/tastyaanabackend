// routes/menuChange.js
const express = require('express');
const { body } = require('express-validator');
const {
  getAvailableMealOptions,
  requestMealChange,
  processMenuChangePayment,
  getUserMenuChanges,
  cancelMenuChange,
  addAddonToMenuChange,
  removeAddonFromMenuChange
} = require('../controllers/menuchangeController');
const { authenticate } = require('../middlewares/auth');
//already chnaged the name 
const router = express.Router();

/**
 * @route   GET /api/menu-change/options
 * @desc    Get available meal change options
 * @access  Private
 */
router.get('/options', authenticate, getAvailableMealOptions);

/**
 * @route   POST /api/menu-change/request
 * @desc    Request meal change
 * @access  Private
 */
router.post('/request', authenticate, [
  body('changeDate')
    .isISO8601()
    .withMessage('Valid change date is required'),
  body('deliverySlot')
    .isIn(['lunch', 'dinner'])
    .withMessage('Valid delivery slot is required'),
  body('newTier')
    .optional()
    .isIn(['low', 'basic', 'premium'])
    .withMessage('Invalid meal tier'),
  body('customItems')
    .optional()
    .isArray()
    .withMessage('Custom items must be an array'),
  body('reason')
    .optional()
    .isIn(['upgrade', 'downgrade', 'dietary_preference', 'custom_request', 'other'])
    .withMessage('Invalid reason')
], requestMealChange);

/**
 * @route   POST /api/menu-change/:id/payment
 * @desc    Process payment for menu change
 * @access  Private
 */
router.post('/:id/payment', authenticate, [
  body('paymentMethod')
    .isIn(['razorpay', 'wallet'])
    .withMessage('Invalid payment method')
], processMenuChangePayment);

/**
 * @route   GET /api/menu-change/history
 * @desc    Get user's menu change history
 * @access  Private
 */
router.get('/history', authenticate, getUserMenuChanges);

/**
 * @route   DELETE /api/menu-change/:id
 * @desc    Cancel menu change request
 * @access  Private
 */
router.delete('/:id', authenticate, cancelMenuChange);

/**
 * @route   PUT /api/menu-change/:id/add-addon
 * @desc    Add an addon to a menu change request
 * @access  Private
 */
router.put('/:id/add-addon', authenticate, addAddonToMenuChange);

/**
 * @route   PUT /api/menu-change/:id/remove-addon
 * @desc    Remove an addon from a menu change request
 * @access  Private
 */
router.put('/:id/remove-addon', authenticate, removeAddonFromMenuChange);

module.exports = router;
