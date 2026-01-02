
// CATEGORY ROUTES (routes/categoryRoutes.js)
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/:slug', categoryController.getCategoryWithProducts);
router.get('/', categoryController.getAllCategories);

// Admin routes
router.post('/', authenticate, authorize('admin'), categoryController.createCategory);

module.exports = router;
