// routes/payments.js
const express = require('express');
const { body } = require('express-validator');
const {
  createRazorpayOrder,
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  processRefund,
  getPaymentStatus
} = require('../controllers/paymentController1');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay payment order
 * @access  Private
 */
router.post('/create-order', authenticate, [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be positive'),
  body('currency')
    .optional()
    .isIn(['INR'])
    .withMessage('Currency must be INR'),
  body('receipt')
    .optional()
    .trim()
    .isLength({ max: 40 })
    .withMessage('Receipt must not exceed 40 characters')
], createRazorpayOrder);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment signature
 * @access  Private
 */
router.post('/verify', authenticate, [
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Payment ID is required'),
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Payment signature is required')
], verifyPayment);

/**
 * @route   GET /api/payments/history
 * @desc    Get payment history
 * @access  Private
 */
router.get('/history', authenticate, getPaymentHistory);

/**
 * @route   POST /api/payments/refund
 * @desc    Process refund (Admin only)
 * @access  Private (Admin)
 */

router.post('/refund', authenticate, authorize('admin', 'superadmin'), [
  body('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Refund amount must be positive'),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Refund reason must be between 5 and 200 characters')
], processRefund);

/**
 * @route   GET /api/payments/status/:orderId
 * @desc    Get payment status for an order
 * @access  Private
 */
router.get('/status/:orderId', authenticate, getPaymentStatus);

module.exports = router;