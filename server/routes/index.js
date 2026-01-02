// routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  sendOTP,
  verifyOTP,
  getProfile
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  body('referredBy')
    .optional()
    .isAlphanumeric()
    .withMessage('Invalid referral code')
], register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
  body('email')
    .notEmpty()
    .withMessage('Email or phone is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], login);

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP for phone verification
 * @access  Public
 */
router.post('/send-otp', [
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number')
], sendOTP);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and complete phone verification
 * @access  Public
 */
router.post('/verify-otp', [
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  body('otp')
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('Please provide a valid OTP')
], verifyOTP);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

module.exports = router;





