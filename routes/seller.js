// routes/seller.js
const   router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const MealPlan = require('../models/MealPlan');
// const sellerAuth = require('../middleware/sellerAuth');
const { body, param, query } = require('express-validator');
const {
  getDashboard,
  getProducts,
  getOrders,
  getThaliOrders,
  getOrderById,
  updateOrderStatus,
  generateOrderInvoice,
  getMealPlans,
  getAnalytics,
   markOrderAsViewed,
  getNotifications,
  markNotificationRead,
  getCategories,
  toggleShopShutdown,
  updateProductPrice,
  bulkUpdateWeightPrices,
  bulkUpdatePrices,
  getSellerProfile,
  updateSellerProfile,
  getShopStatus,
  updateSellerPassword,
  updatePricesForCategory,
  getSubscriptionOrders,
  markOrderReady,
  getDelayedOrders
  } = require('../controllers/sellerController')
  const sellerController = require('../controllers/sellerController')
  const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getMealPlan,
  getInventoryAlerts
} = require('../controllers/sellerProductController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { upload ,singleUpload,multiUpload} = require('../middlewares/upload');

// Apply authentication and seller authorization to all routes
router.use(authenticate);
router.use(authorize(['seller', 'admin']));
router.put("/profile",authenticate, updateSellerProfile);
// Seller Profile Routes
router.route('/profile')
  .get(getSellerProfile)    // GET /api/seller/profile
  .put(updateSellerProfile); // PUT /api/seller/profile

// Seller Avatar Upload
router.post('/upload-avatar',
  // Disable body parsing for this route to let multer handle it
  (req, res, next) => {
    // Skip body parsing for multipart/form-data
    if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
      return next();
    }
    next();
  },

  singleUpload('avatar'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded or invalid file format'
        });
      }
        console.log(req);
      // Return the file path or URL
      const fileUrl = `/uploads/${req.file.filename}`; // Adjust path as needed
      
      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        filePath: fileUrl
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading avatar',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Seller Password Update
router.put('/update-password', updateSellerPassword);

/**
 * @route   GET /api/seller/dashboard
 * @desc    Get seller dashboard statistics
 * @access  Private (Seller)
 */
router.get('/dashboard', getDashboard);

/**
 * @route   GET /api/seller/products
 * @desc    Get seller products with filtering and pagination
 * @access  Private (Seller)
 */
router.get('/products', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'all'])
    .withMessage('Status must be active, inactive, or all'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'title', 'price', 'stock', 'ratings.average','name'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  validate
], getProducts);

/**
 * @route   GET /api/seller/orders
 * @desc    Get seller orders with filtering and pagination
 * @access  Private (Seller)
 */
router.get('/orders', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled', 'all'])
    .withMessage('Invalid status'),
  query('type')
    .optional()
    .isIn(['gkk', 'custom', 'addon', 'sunday-special', 'product', 'all'])
    .withMessage('Invalid order type'),
  query('customized')
    .optional()
    .isIn(['true', 'false', 'all'])
    .withMessage('Customized must be true, false, or all'),
  query('date')
    .optional()
    .isIn(['today', 'yesterday', '7d', '30d', 'all'])
    .withMessage('Invalid date filter'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'totalAmount', 'status', 'deliveryDate'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  validate
], getOrders);

/**
 * @route   GET /api/seller/thali-orders
 * @desc    Get thali orders only (for seller ID 68af25f91cf5e34b4cbc47ad)
 * @access  Private (Seller)
 */
router.get('/thali-orders', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled', 'all'])
    .withMessage('Invalid status'),
  query('date')
    .optional()
    .isIn(['today', 'yesterday', '7d', '30d', 'all'])
    .withMessage('Invalid date filter'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'totalAmount', 'status', 'deliveryDate'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  validate
], getThaliOrders);

/**
 * @route   GET /api/seller/subscription-orders
 * @desc    Get seller subscription orders with filtering and pagination
 * @access  Private (Seller)
 */
router.get('/subscription-orders', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled', 'all'])
    .withMessage('Invalid status'),
  query('date')
    .optional()
    .isIn(['today', 'yesterday', '7d', '30d', 'all'])
    .withMessage('Invalid date filter'),
  query('shift')
    .optional()
    .isIn(['morning', 'evening', 'all'])
    .withMessage('Invalid shift filter'),
  validate
], getSubscriptionOrders);

/**
 * @route   GET /api/seller/orders/:id
 * @desc    Get single order by ID for seller
 * @access  Private (Seller)
 */
router.get('/orders/:id', [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),
  validate
], getOrderById);

/**
 * @route   GET /api/seller/orders/:id/invoice
 * @desc    Generate and download invoice for order
 * @access  Private (Seller)
 */
router.get('/orders/:id/invoice', [
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),
  validate
], generateOrderInvoice);

/**
 * @route   PUT /api/seller/orders/:orderId/status
 * @desc    Update order status for seller's items
 * @access  Private (Seller)
 */
router.put('/orders/:orderId/status', [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('status')
    .isIn(['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  validate
], updateOrderStatus);

/**
 * @route   PUT /api/seller/orders/:orderId/mark-viewed
 * @desc    Mark order as viewed by seller (removes NEW tag)
 * @access  Private (Seller)
 */
router.put('/orders/:orderId/mark-viewed', [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  validate
], markOrderAsViewed);

/**
 * @route   PUT /api/seller/orders/:orderId/mark-ready
 * @desc    Mark order as ready for handover (Restaurant Ready)
 * @access  Private (Seller)
 */
router.put('/orders/:orderId/mark-ready', [
  param('orderId')
    .isMongoId()
    .withMessage('Invalid order ID'),
  validate
], markOrderReady);

/**
 * @route   GET /api/seller/orders/delayed
 * @desc    Get delayed orders for seller dashboard
 * @access  Private (Seller)
 */
router.get('/orders/delayed', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
], getDelayedOrders);
/**
 * @route   GET /api/seller/meal-plans
 * @desc    Get seller meal plans with filtering and pagination
 * @access  Private (Seller)
 */
router.get('/meal-plans', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'coming-soon', 'all'])
    .withMessage('Invalid status'),
  query('tier')
    .optional()
    .isIn(['low', 'basic', 'premium', 'all'])
    .withMessage('Invalid tier'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'title', 'tier', 'ratings.average'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  validate
], getMealPlans);

/**
 * @route   GET /api/seller/analytics
 * @desc    Get seller analytics data
 * @access  Private (Seller)
 */
router.get('/analytics', [
  query('period')
    .optional()
    .isIn(['today', '7d', '30d', '90d', 'custom'])
    .withMessage('Invalid period'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  validate
], getAnalytics);

/**
 * @route   GET /api/seller/notifications
 * @desc    Get seller notifications
 * @access  Private (Seller)
 */
router.get('/notifications', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('isRead')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isRead must be true or false'),
  query('type')
    .optional()
    .isIn(['order', 'payment', 'delivery', 'product', 'meal_change', 'subscription', 'promotion', 'system', 'tiffin-service', 'bid', 'all'])
    .withMessage('Invalid notification type'),
  validate
], getNotifications);

/**
 * @route   PUT /api/seller/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private (Seller)
 */
router.put('/notifications/:id/read', [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID'),
  validate
], markNotificationRead);


/**
 * @route   POST /api/seller/products
 * @desc    Create new product
 * @access  Private (Seller)
 */
router.post('/products', multiUpload('images', 5), [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  validate
], createProduct);


/**
 * @route   GET /api/seller/categories
 * @desc    Fetch categories
 * @access  Private (Seller)
 */
 
router.get('/categories',getCategories);


/**
 * @route   DELETE /api/seller/product/:id
 * @desc    Hard delete products
 * @access  Private (Seller)
 */


router.delete('/product/:id',deleteProduct);

/**
 * @route   PUT /api/seller/products/:id
 * @desc    Update products
 * @access  Private (Seller)
 */

router.put('/products/:id', multiUpload('images', 5), updateProduct);



// Update prices for specific category

router.patch('/update-category-prices', authenticate,sellerController.updatePricesForCategory);

// Toggle shop shutdown status
router.patch(
  '/toggle-shutdown', 
  authenticate, 
  toggleShopShutdown
);
 router.get('/profile', authenticate, getSellerProfile);
router.patch(
  '/:id/price',
  authenticate,updateProductPrice
);



router.get('/shop-status', authenticate, getShopStatus);

/**
 * @route   PUT /api/seller/update-password
 * @desc    Update seller password
 * @access  Private (Seller)
 */
router.put('/update-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validate
], updateSellerPassword);

// Bulk update regular prices
router.patch('/bulk-update-prices', authenticate, bulkUpdatePrices);

// Bulk update weight option prices
router.patch('/bulk-update-weight-prices', authenticate, bulkUpdateWeightPrices);




















router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { price, discount, stock, weightOptions } = req.body;
    const sellerId = req.user.id;

    // First get the current product to check its category
    const currentProduct = await Product.findOne({
      _id: req.params.id,
      seller: sellerId
    });
     console.log("product ",currentProduct)
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found or not authorized",
      });
    }

    // Build update object
    const updateData = {};
    if (price !== undefined) updateData.price = price;
    if (discount !== undefined) updateData.discount = discount;
    if (stock !== undefined) updateData.stock = stock;
    if (weightOptions !== undefined) updateData.weightOptions = weightOptions;
// console.log("Update Data:", currentProduct);
    // Special handling for category "6882f8f15b1ba9254864dfe7"
      // Additional validation for this category
      // if (price !== undefined && price < 50) {
      //   return res.status(400).json({
      //     success: false, 
      //     message: "Price must be at least 50 for this category",
      //   });
      // }

      // Ensure weight options are provided for this category
      if (weightOptions === undefined || weightOptions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Weight options are required for this category",
        });
      }

      // Additional update for this category
      updateData.$set = {
        ...updateData.$set,
        isVerified: true, // Auto-verify products in this category
        lastVerifiedAt: new Date()
      };
    

      // Add price history if price changed
      if (price !== undefined) {
        updateData.$push = {
          priceHistory: {
            date: new Date(),
            price: price,
          },
        };
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: req.params.id, seller: sellerId },
        updateData,
        { new: true, runValidators: true }
      );
 
      res.json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
});

/**
 * @route   PUT /api/seller/update-password
 * @desc    Update seller password
 * @access  Private (Seller)
 */
router.put('/update-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validate
], updateSellerPassword);

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const sellerProfileController = require('../controllers/sellerProfileController');
// const auth = require('../middleware/auth');
// const sellerAuth = require('../middleware/sellerAuth');

// // Update store status
// router.patch('/store-status', [auth, sellerAuth], sellerProfileController.updateStoreStatus);

// // Get seller profile
// router.get('/profile', [auth, sellerAuth], sellerProfileController.getSellerProfile);

// // Update seller profile
// router.put('/profile', [auth, sellerAuth], sellerProfileController.updateSellerProfile);

// // Update operating hours
// router.patch('/operating-hours', [auth, sellerAuth], sellerProfileController.updateOperatingHours);

// // Update delivery settings
// router.patch('/delivery-settings', [auth, sellerAuth], sellerProfileController.updateDeliverySettings);

// module.exports = router;









// const express = require('express');
// const router = express.Router();
// const productController = require('../controllers/productController');
// const auth = require('../middleware/auth');
// const sellerAuth = require('../middleware/sellerAuth');

// // Get all products for seller
// router.get('/seller', [auth, sellerAuth], productController.getSellerProducts);

// // Create new product
// router.post('/', [auth, sellerAuth], productController.createProduct);

// // Get single product
// router.get('/:id', [auth, sellerAuth], productController.getProduct);

// // Update product
// router.put('/:id', [auth, sellerAuth], productController.updateProduct);

// // Delete product
// router.delete('/:id', [auth, sellerAuth], productController.deleteProduct);

// // Toggle product status
// router.patch('/:id/status', [auth, sellerAuth], productController.toggleProductStatus);

// // Update stock
// Seller products routes
// router.get('/products', getSellerProducts);

// router.patch('/:id/stock', [auth, sellerAuth], productController.updateStock);

// // Get low stock products
// router.get('/seller/low-stock', [auth, sellerAuth], productController.getLowStockProducts);

// // Bulk update prices
// router.patch('/bulk-price-update', [auth, sellerAuth], productController.bulkUpdatePrices);

// module.exports = router;