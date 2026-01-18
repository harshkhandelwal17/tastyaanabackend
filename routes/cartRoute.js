// CART ROUTES (routes/cartRoutes.js)
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middlewares/auth');

// All cart routes require authentication
router.post('/add', authenticate, cartController.addToCart);
router.delete('/clear', authenticate, cartController.clearCart);
router.delete('/:userId/clear', authenticate, cartController.clearCart); // Add compatibility route
// console.log("request coming ")
router.put('/:userId/item/:itemId/quantity', authenticate, cartController.updateQuantity);
router.delete('/:userId/item/:itemId', authenticate, cartController.deleteOneCart)
router.get('/', authenticate, cartController.getCart);

module.exports = router;