
// routes/restaurantBids.js
const express = require('express');
const { body } = require('express-validator');
const {
  createBid,
  getRequestBids,
  acceptBid,
  rejectBid,
  withdrawBid
} = require('../controllers/restaurantBidController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   POST /api/restaurant-bids
 * @desc    Create bid for custom request
 * @access  Private (Restaurant)
 */
router.post('/', authenticate, [
  body('requestId')
    .isMongoId()
    .withMessage('Valid request ID is required'),
  body('price')
    .isFloat({ min: 1 })
    .withMessage('Price must be positive'),
  body('deliveryTime')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Delivery time is required'),
  body('estimatedPreparationTime')
    .isInt({ min: 5, max: 180 })
    .withMessage('Preparation time must be between 5 and 180 minutes'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters')
], createBid);

/**
 * @route   GET /api/restaurant-bids/request/:requestId
 * @desc    Get bids for a specific request
 * @access  Private
 */
router.get('/request/:requestId', authenticate, getRequestBids);

/**
 * @route   PUT /api/restaurant-bids/:id/accept
 * @desc    Accept bid (Customer only)
 * @access  Private
 */
router.put('/:id/accept', authenticate, acceptBid);

/**
 * @route   PUT /api/restaurant-bids/:id/reject
 * @desc    Reject bid (Customer only)
 * @access  Private
 */
router.put('/:id/reject', authenticate, [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Rejection reason must not exceed 200 characters')
], rejectBid);

/**
 * @route   PUT /api/restaurant-bids/:id/withdraw
 * @desc    Withdraw bid (Restaurant only)
 * @access  Private (Restaurant)
 */
router.put('/:id/withdraw', authenticate, [
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Withdrawal reason must not exceed 200 characters')
], withdrawBid);

module.exports = router;