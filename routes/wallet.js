// routes/wallet.js
const express = require('express');
const router = express.Router();
const {
  getWalletBalance,
  addMoneyToWallet,
  verifyWalletTopup,
  getWalletTransactions,
  transferMoney,
  generateWalletStatement,
  checkLowBalanceAlert,
  getAllWalletTransactions,
  manualWalletAdjustment,
  getWalletAnalytics
} = require('../controllers/walletTransactionController');

const { authenticate:auth, authorize:adminAuth } = require('../middlewares/auth');

// ============================================
// Wallet Management Routes
// ============================================

// Get wallet balance
router.get('/balance', auth, getWalletBalance);

// Add money to wallet
router.post('/add-money', auth, addMoneyToWallet);

// Verify wallet top-up payment
router.post('/verify-topup', auth, verifyWalletTopup);

// Get wallet transactions
router.get('/transactions', auth, getWalletTransactions);

// Transfer money to another user
router.post('/transfer', auth, transferMoney);

// Generate wallet statement
router.get('/statement', auth, generateWalletStatement);

// Check low balance alert
router.get('/low-balance-check', auth, checkLowBalanceAlert);

// ============================================
// Admin Routes
// ============================================

// Get all wallet transactions (Admin)
// router.get('/admin/transactions', auth, adminAuth, getAllWalletTransactions);

// Manual wallet adjustment (Admin)
router.post('/admin/adjust', auth, adminAuth, manualWalletAdjustment);

// Wallet analytics (Admin)
router.get('/admin/analytics', auth, adminAuth, getWalletAnalytics);

module.exports = router;