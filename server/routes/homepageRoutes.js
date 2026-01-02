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

module.exports = router; 