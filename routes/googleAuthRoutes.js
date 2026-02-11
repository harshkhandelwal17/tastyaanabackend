// routes/googleAuthRoutes.js
const express = require('express');
const router = express.Router();
const googleAuthController = require('../controllers/googleAuthController');
const { authenticate } = require('../middleware/auth');

// @route   POST /api/auth/google
// @desc    Google Sign In/Sign Up with ID token
// @access  Public
router.post('/google', googleAuthController.googleAuth);

// @route   POST /api/auth/google/callback
// @desc    Process OAuth callback
// @access  Public
router.post('/google/callback', googleAuthController.googleAuthCallback);

// @route   DELETE /api/auth/google/unlink
// @desc    Unlink Google Account
// @access  Private
router.delete('/google/unlink', authenticate, googleAuthController.unlinkGoogle);

// @route   POST /api/auth/set-password
// @desc    Set password for Google users
// @access  Private
router.post('/set-password', authenticate, googleAuthController.setPassword);

module.exports = router;