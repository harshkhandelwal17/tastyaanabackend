const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellergadgetController');
const { authenticate, authorize } = require('../middlewares/auth');
// const{upload} = require('../middlewares/upload'); // You'll need to create this
const { upload } = require('../config/cloudinary');
const { videoUpload } = require('../config/cloudinary'); // Import from cloudinary config

// All routes require seller authentication
router.use(authenticate);
router.use(authorize('seller'));

// Product routes
router.get('/products', sellerController.getSellerProducts);
router.post('/products', sellerController.createProduct);
router.put('/products/:id', sellerController.updateProduct);
router.delete('/products/:id', sellerController.deleteProduct);

// Image upload routes
router.post('/products/upload-images', upload.array('images', 10), sellerController.uploadProductImages);
router.post('/products/upload-videos', videoUpload.array('videos', 5), sellerController.uploadProductVideos);
router.delete('/products/delete-image/:publicId', sellerController.deleteProductImage);

// Category routes
router.get('/categories', sellerController.getCategories);
router.get('/gadget-category', sellerController.getOrCreateGadgetCategory);

module.exports = router;