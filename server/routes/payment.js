
const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  handlePaymentSuccess,
  handlePaymentFailure,
  getPaymentStatus,
  refundPayment,
  handleRazorpayWebhook
} = require('../controllers/paymentController1');
const { authenticate:authenticateUser, adminMiddleware:isAdmin } = require('../middlewares/auth');

// Create Razorpay order
router.post('/create-order', authenticateUser, createRazorpayOrder);

// Verify payment
router.post('/verify-payment', authenticateUser, handlePaymentSuccess);

// Handle payment failure
router.post('/payment-failed', authenticateUser, handlePaymentFailure);

// Get payment status
router.get('/status/:orderId', authenticateUser, getPaymentStatus);

// Refund payment (admin only)
router.post('/refund', authenticateUser, isAdmin, refundPayment);

// Webhook endpoint (no auth required)
router.post('/webhook', handleRazorpayWebhook);


module.exports = router;