const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const {authMiddleware, authenticate} = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get user's wishlist
router.get('/', wishlistController.getWishlist);

// Add item to wishlist
router.post('/', wishlistController.addToWishlist);

// Remove item from wishlist
router.delete('/:productId', wishlistController.removeFromWishlist);

// Check if product is in wishlist
router.get('/check/:productId', wishlistController.checkWishlist);

module.exports = router;