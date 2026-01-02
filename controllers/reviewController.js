const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const MealPlan = require('../models/MealPlan');
const mongoose = require('mongoose');

// ==================== PUBLIC ROUTES ====================

/**
 * @desc    Get reviews for a product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating, sortBy = 'createdAt' } = req.query;
    
    const query = { 
      product: new mongoose.Types.ObjectId(req.params.productId),
      isApproved: true
    };
    
    if (rating) query.rating = parseInt(rating);

    const sortOptions = {};
    if (sortBy === 'rating') sortOptions.rating = -1;
    else if (sortBy === 'helpful') sortOptions.helpfulVotes = -1;
    else sortOptions.createdAt = -1;

    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    const ratingDistribution = await Review.aggregate([
      { $match: query },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        ratingDistribution,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Get reviews for a meal plan
 * @route   GET /api/reviews/plan/:planId
 * @access  Public
 */
exports.getPlanReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ 
      mealPlan: req.params.planId,
      isApproved: true 
    })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching meal plan reviews',
      error: error.message
    });
  }
};

// ==================== AUTHENTICATED ROUTES ====================

/**
 * @desc    Get current user's reviews
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images')
      .populate('mealPlan', 'name images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Create new review
 * @route   POST /api/reviews
 * @access  Private
 */
exports.createReview = async (req, res) => {
  try {
    const { productId, mealPlanId, orderId, type, rating, title, comment } = req.body;

    // Verify purchase - allow reviews for confirmed, shipped, and delivered orders
    console.log("user id is ",req.user._id);
    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      userId: req.user._id,
      status: { $in: ['confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'shipped'] }

    });

    if (!order) {
      // Debug: Check what orders exist for this user and product
      const userOrders = await Order.find({
        user: req.user._id,
        'items.product': productId || mealPlanId
      }).select('_id status items');

      console.log('Debug - User orders for product:', {
        requestedOrderId: orderId,
        userOrders: userOrders.map(o => ({ id: o._id, status: o.status }))
      });

      return res.status(400).json({
        success: false,
        message: 'You can only review purchased items that have been confirmed, prepared, shipped, or delivered',
        debug: {
          requestedOrderId: orderId,
          availableOrders: userOrders.map(o => ({ id: o._id, status: o.status }))
        }
      });
    }

    // Check for existing review
    const existingReview = await Review.findOne({
      $or: [
        { product: productId, user: req.user._id },
        { mealPlan: mealPlanId, user: req.user._id }
      ]
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this item'
      });
    }

    // Create review
    const reviewData = {
      user: req.user._id,
      order: orderId,
      type,
      rating: parseInt(rating),
      title,
      comment,
      images: req.files?.map(file => `/uploads/${file.filename}`) || [],
      isVerified: true
    };

    // Set the appropriate reference based on type
    if (type === 'product') {
      reviewData.product = productId;
    } else if (type === 'meal-plan') {
      reviewData.mealPlan = mealPlanId;
    }

    const review = new Review(reviewData);
    await review.save();

    // Update product/plan rating
    const model = type === 'product' ? Product : MealPlan;
    const itemId = type === 'product' ? productId : mealPlanId;
    
    // Get all reviews for this product/plan (including the new one)
    const reviews = await Review.find({ 
      [type === 'product' ? 'product' : 'mealPlan']: itemId
    });
    
    console.log(`Found ${reviews.length} reviews for ${type} ${itemId}`);
    
    if (reviews.length > 0) {
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      console.log(`Updating ${type} ${itemId} with average rating: ${averageRating}, count: ${reviews.length}`);
      
      const updateResult = await model.findByIdAndUpdate(itemId, {
        'ratings.average': averageRating,
        'ratings.count': reviews.length,
        'reviewCount': reviews.length
      }, { new: true });
      
      console.log(`Updated ${type} result:`, updateResult);
    }

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

/**
 * @desc    Update review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
exports.updateReview = async (req, res) => {
  try {
    const { rating, title, comment, imagesToDelete = [] } = req.body;
    
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Process images
    let currentImages = review.images || [];
    
    // Remove images marked for deletion
    if (imagesToDelete.length > 0) {
      currentImages = currentImages.filter(
        img => !imagesToDelete.includes(img)
      );
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      currentImages = [...currentImages, ...newImages];
    }

    // Update review
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.images = currentImages;
    review.editedAt = new Date();

    await review.save();

    // Update product/plan rating after review update
    const model = review.type === 'product' ? Product : MealPlan;
    const itemId = review.product || review.mealPlan;
    
    if (itemId) {
      const reviews = await Review.find({ 
        [review.type === 'product' ? 'product' : 'mealPlan']: itemId
      });
      
      if (reviews.length > 0) {
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        await model.findByIdAndUpdate(itemId, {
          'ratings.average': averageRating,
          'ratings.count': reviews.length,
          'reviewCount': reviews.length
        });
      }
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update product/plan rating
    const model = review.type === 'product' ? Product : MealPlan;
    const itemId = review.product || review.mealPlan;
    
    if (itemId) {
      const reviews = await Review.find({ 
        [review.type === 'product' ? 'product' : 'mealPlan']: itemId
      });
      
      if (reviews.length > 0) {
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        await model.findByIdAndUpdate(itemId, {
          'ratings.average': averageRating,
          'ratings.count': reviews.length,
          'reviewCount': reviews.length
        });
      } else {
        // No reviews left, reset to default values
        await model.findByIdAndUpdate(itemId, {
          'ratings.average': 0,
          'ratings.count': 0,
          'reviewCount': 0
        });
      }
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

/**
 * @desc    Mark review as helpful
 * @route   PUT /api/reviews/:id/helpful
 * @access  Private
 */
exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulVotes: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking review as helpful',
      error: error.message
    });
  }
};
