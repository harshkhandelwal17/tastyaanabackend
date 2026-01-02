const express = require('express');
const router = express.Router();
// const { protect, restrictTo,authenticate } = require('../middlewares/authMiddleware');
const hisaabController = require('../controllers/hisaabController');
const { authenticate, authorize } = require('../middlewares/auth');

// Protect all routes and restrict to sellers
router.use(authenticate);
// router.use(restrictTo('seller'));

// Get today's hisaab
router.get('/today', hisaabController.getTodaysHisaab);

// Create or update today's hisaab
router.post('/today', hisaabController.createOrUpdateHisaab);

// Add product to today's hisaab
router.post('/today/products', hisaabController.addProduct);

// Update product in today's hisaab
router.patch('/today/products/:productId', hisaabController.updateProduct);

// Delete product from today's hisaab
router.delete('/today/products/:productId', hisaabController.deleteProduct);

// Get hisaab by date range (must be before /:date route)
router.get('/range', hisaabController.getHisaabByDateRange);

// Get hisaab history with optional date range  
router.get('/history', hisaabController.getHisaabHistory);

// Get hisaab by date (must be last since it uses parameter)
router.get('/:date', hisaabController.getHisaabByDate);

module.exports = router;
