const express = require('express');
const router = express.Router();
const homepageController = require('../controllers/homepageController');

/**
 * @route   GET /api/homepage
 * @desc    Get all homepage data in one request
 * @access  Public
 */
router.get('/', homepageController.getHomepageData);

/**
 * @route   GET /api/homepage/featured-products
 * @desc    Get featured products for homepage
 * @access  Public
 */
router.get('/featured-products', homepageController.getFeaturedProducts);

/**
 * @route   GET /api/homepage/meal-plans
 * @desc    Get meal plans for homepage
 * @access  Public
 */
router.get('/meal-plans', homepageController.getHomepageMealPlans);

/**
 * @route   GET /api/homepage/categories
 * @desc    Get categories for homepage
 * @access  Public
 */
router.get('/categories', homepageController.getHomepageCategories);

/**
 * @route   GET /api/homepage/food-categories
 * @desc    Get food categories for food homepage (ONLY FOOD-RELATED)
 * @access  Public
 */
router.get('/food-categories', homepageController.getFoodCategories);

/**
 * @route   GET /api/homepage/todays-special
 * @desc    Get today's special meal
 * @access  Public
 */
router.get('/todays-special', homepageController.getTodaysSpecial);

/**
 * @route   GET /api/homepage/stats
 * @desc    Get homepage statistics
 * @access  Public
 */
router.get('/stats', homepageController.getHomepageStats);

/**
 * @route   GET /api/homepage/testimonials
 * @desc    Get customer testimonials
 * @access  Public
 */
router.get('/testimonials', homepageController.getTestimonials);

/**
 * @route   GET /api/homepage/hero-slides
 * @desc    Get hero slider data
 * @access  Public
 */
router.get('/hero-slides', homepageController.getHeroSlides);

/**
 * @route   GET /api/homepage/stores
 * @desc    Get stores/sellers for homepage
 * @access  Public
 */
router.get('/stores', homepageController.getStores);

/**
 * @route   GET /api/homepage/categories-with-sellers
 * @desc    Get categories with seller count
 * @access  Public
 */
router.get('/categories-with-sellers', homepageController.getCategoriesWithSellers);

/**
 * @route   GET /api/homepage/quick-actions
 * @desc    Get quick actions - popular products/categories
 * @access  Public
 */
router.get('/quick-actions', homepageController.getQuickActions);

/**
 * @route   GET /api/homepage/curated-collections
 * @desc    Get curated/spotlight collections
 * @access  Public
 */
router.get('/curated-collections', homepageController.getCuratedCollections);

/**
 * @route   GET /api/homepage/vendor-stories
 * @desc    Get vendor stories for food homepage
 * @access  Public
 */
router.get('/vendor-stories', homepageController.getVendorStories);

/**
 * @route   GET /api/homepage/food-banner
 * @desc    Get food homepage banner
 * @access  Public
 */
router.get('/food-banner', homepageController.getFoodBanner);

/**
 * @route   GET /api/homepage/trending-items
 * @desc    Get trending items for food homepage
 * @access  Public
 */
router.get('/trending-items', homepageController.getTrendingItems);

/**
 * @route   GET /api/homepage/food-restaurants
 * @desc    Get food restaurants with filters
 * @access  Public
 */
router.get('/food-restaurants', homepageController.getFoodRestaurants);

module.exports = router; 