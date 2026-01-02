// PRODUCT ROUTES (routes/productRoutes.js)
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middlewares/auth');
const { productValidation, validateRequest } = require('../middlewares/validation');
const {upload} = require('../middlewares/upload');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/categories', productController.getProductCategories);
router.get('/:id', productController.getProduct);

// Grocery specific routes
router.get('/grocery/products', productController.getGroceryProducts);
router.get('/grocery/products/:id', productController.getGroceryProduct);
router.get('/grocery/categories', productController.getGroceryCategories);

// Protected routes (Admin/Seller)
router.post('/', 
  authenticate, 
  authorize('admin', 'seller'), 
  upload.array('images', 5),
  productValidation, 
  validateRequest, 
  productController.createProduct
);
router.put('/:id', 
  authenticate, 
  authorize('admin', 'seller'), 
  upload.array('images', 5),
  productController.updateProduct
);
router.delete('/:id', 
  authenticate, 
  authorize('admin', 'seller'), 
  productController.deleteProduct
);

module.exports = router;