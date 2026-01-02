
// routes/upload.js
const express = require('express');
const { authenticate, checkRole } = require('../middlewares/auth');
const { uploadProductImages, uploadSingleImage, handleImageUpload } = require('../controllers/uploadController');

const router = express.Router();

// Upload product images (sellers only)
router.post('/product-images', 
  authenticate, 
  checkRole(['seller']), 
  uploadProductImages, 
  handleImageUpload
);

// Upload single image (profile, logo, etc.)
router.post('/image', 
  authenticate, 
  uploadSingleImage, 
  handleImageUpload
);

module.exports = router;
