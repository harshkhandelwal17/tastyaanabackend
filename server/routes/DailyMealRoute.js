// routes/dailyMeals.js
const express = require('express');
const {
  getTodaysMeal,
  getDailyMealByDate,
  getWeeklyMenu,
  rateDailyMeal,
  addTodaysMeal,
  updateDailyMeal,
  addTomorrowsMeal,
  getTomorrowsMeal
} = require('../controllers/dailyMealController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   GET /api/dailymeals/test
 * @desc    Test endpoint to verify route is working
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Daily meals route is working!',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/dailymeals/today
 * @desc    Add today's meal
 * @access  Private (Admin/Restaurant)
 */
router.post('/today', authenticate, addTodaysMeal);

/**
 * @route   POST /api/dailymeals/tomorrow
 * @desc    Add tomorrow's meal
 * @access  Private (Admin/Restaurant)
 */
router.post('/tomorrow', authenticate, addTomorrowsMeal);

/**
 * @route   PATCH /api/dailymeals/:id
 * @desc    Update daily meal
 * @access  Private (Admin/Restaurant)
 */
router.patch('/:id', authenticate, updateDailyMeal);

/**
 * @route   GET /api/dailymeals/today
 * @desc    Get today's meal
 * @access  Public
 */
router.get('/today', getTodaysMeal);

/**
 * @route   GET /api/dailymeals/tomorrow
 * @desc    Get tomorrow's meal
 * @access  Public
 */
router.get('/tomorrow', getTomorrowsMeal);

/**
 * @route   GET /api/dailymeals/date/:date
 * @desc    Get meal by specific date
 * @access  Public
 */
router.get('/date/:date', getDailyMealByDate);

/**
 * @route   GET /api/dailymeals/weekly
 * @desc    Get weekly menu
 * @access  Public
 */
router.get('/weekly', getWeeklyMenu);

/**
 * @route   POST /api/dailymeals/:id/rate
 * @desc    Rate daily meal
 * @access  Private
 */
router.post('/:id/rate', authenticate, rateDailyMeal);

module.exports = router;