const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middlewares/auth');
const {upload} = require('../middlewares/upload');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/plan/:planId', reviewController.getPlanReviews);

// Authenticated routes
router.post('/', 
  authenticate, 
  upload.array('images', 3), [
    body('orderId').isMongoId().withMessage('Valid order ID required'),
    body('type')
      .isIn(['meal-plan', 'custom-order', 'delivery', 'tiffin-service', 'product'])
      .withMessage('Invalid review type'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('title').trim().isLength({ max: 100 }).withMessage('Title too long'),
    body('comment').trim().isLength({ max: 1000 }).withMessage('Comment too long')
  ],
  reviewController.createReview
);

router.get('/my-reviews', authenticate, reviewController.getUserReviews);
router.put('/:id', 
  authenticate, 
  upload.array('newImages', 3), 
  reviewController.updateReview
);
router.delete('/:id', authenticate, reviewController.deleteReview);
router.put('/:id/helpful', authenticate, reviewController.markHelpful);

module.exports = router;