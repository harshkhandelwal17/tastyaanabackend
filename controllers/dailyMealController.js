const DailyMeal = require('../models/DailyMeal');
const MealRating = require('../models/MealPlan');
const { NotFoundError, BadRequestError } = require('../utils/errors');


/**
 * @desc    Add today's meal
 * @route   POST /api/dailymeals/today
 * @access  Private (Admin/Restaurant)
 */
exports.addTodaysMeal = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if meal already exists for today
    const existingMeal = await DailyMeal.findOne({ date: today });
    if (existingMeal) {
      return res.status(400).json({
        success: false,
        message: 'Meal for today already exists. Use PATCH to update instead.',
        existingMealId: existingMeal._id
      });
    }

    const {
      meals,
      sundaySpecial,
      images,
      nutritionalInfo,
      chefSpecial,
      availability,
      maxOrders,
      tags
    } = req.body;
    const restaurantId = req.user?.id || req.user?._id
    // Validate required fields
    if (!meals || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID and meals are required'
      });
    }

    // Create new daily meal
    const newDailyMeal = new DailyMeal({
      restaurantId,
      date: today,
      meals,
      sundaySpecial: sundaySpecial || {
        isSpecialDay: false,
        specialItems: [],
        extraCharges: 0,
        includedInPlan: false
      },
      images: images || [],
      nutritionalInfo: nutritionalInfo || {
        low: { calories: 0, protein: '0g', carbs: '0g', fat: '0g' },
        basic: { calories: 0, protein: '0g', carbs: '0g', fat: '0g' },
        premium: { calories: 0, protein: '0g', carbs: '0g', fat: '0g' }
      },
      chefSpecial: chefSpecial || {
        isChefSpecial: false,
        specialNote: '',
        chefName: ''
      },
      availability: availability || {
        low: true,
        basic: true,
        premium: true
      },
      maxOrders: maxOrders || 1000,
      currentOrders: 0,
      tags: tags || [],
      createdBy: req.user._id
    });

    const savedMeal = await newDailyMeal.save();

    res.status(201).json({
      success: true,
      message: 'Today\'s meal added successfully',
      data: savedMeal
    });

  } catch (error) {
    console.error('Error in addTodaysMeal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update daily meal
 * @route   PATCH /api/dailymeals/:id
 * @access  Private (Admin/Restaurant)
 */
exports.updateDailyMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the meal
    const existingMeal = await DailyMeal.findById(id);
    if (!existingMeal) {
      return res.status(404).json({
        success: false,
        message: 'Daily meal not found'
      });
    }

    // Check if user has permission to update this meal
    if (existingMeal.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this meal'
      });
    }

    // Remove fields that shouldn't be updated
    const fieldsToRemove = ['_id', 'date', 'createdAt', 'updatedAt'];
    fieldsToRemove.forEach(field => delete updateData[field]);

    // Update the meal
    const updatedMeal = await DailyMeal.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('restaurantId', 'name email');

    res.json({
      success: true,
      message: 'Daily meal updated successfully',
      data: updatedMeal
    });

  } catch (error) {
    console.error('Error in updateDailyMeal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get today's meal
 * @route   GET /api/meals/today
 * @access  Public
 */
exports.getTodaysMeal = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('Looking for meal on:', today);

    const meal = await DailyMeal.findOne({
      date: today
      // status: 'active'
    }).populate('meals', 'name description');

    console.log("Today's meal found:", meal);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'No meal found for today',
        date: today.toISOString().split('T')[0],
        suggestion: 'Please check back later or contact support'
      });
    }

    res.json({
      success: true,
      data: meal
    });
  } catch (error) {
    console.error('Error in getTodaysMeal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get all meals for today (from all vendors)
 * @route   GET /api/dailymeals/today/all
 * @access  Public
 */
exports.getAllTodaysMeals = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // console.log('Looking for all meals on:', today);

    const meals = await DailyMeal.find({
      date: today
    })
      .populate('restaurantId', 'name email address rating') // Populate vendor details
      .lean();

    // console.log(`Found ${meals.length} meals for today`);

    res.json({
      success: true,
      count: meals.length,
      data: meals
    });
  } catch (error) {
    console.error('Error in getAllTodaysMeals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get meal by date
 * @route   GET /api/meals/date/:date
 * @access  Public
 */
exports.getDailyMealByDate = async (req, res) => {
  const date = new Date(req.params.date);
  date.setHours(0, 0, 0, 0);

  const meal = await DailyMeal.findOne({
    date: date,
    status: 'active'
  }).populate('mealPlan', 'name description');

  if (!meal) {
    throw new NotFoundError('No meal found for this date');
  }

  res.json({
    success: true,
    data: meal
  });
};

/**
 * @desc    Get weekly menu
 * @route   GET /api/meals/weekly
 * @access  Public
 */
exports.getWeeklyMenu = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const meals = await DailyMeal.find({
    date: { $gte: today, $lte: weekEnd },
    status: 'active'
  })
    .populate('mealPlan', 'name description')
    .sort({ date: 1 });

  res.json({
    success: true,
    data: meals
  });
};

/**
 * @desc    Rate today's meal
 * @route   POST /api/meals/rate
 * @access  Private
 */
exports.rateDailyMeal = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingMeal = await DailyMeal.findOne({
    date: today,
    status: 'active'
  });

  if (!existingMeal) {
    throw new NotFoundError('No active meal found for today');
  }

  // Check if user already rated today's meal
  const existingRating = await MealRating.findOne({
    user: req.user._id,
    date: today
  });

  if (existingRating) {
    throw new BadRequestError('You have already rated today\'s meal');
  }

  const { rating, feedback } = req.body;

  const mealRating = new MealRating({
    user: req.user._id,
    meal: existingMeal._id,
    date: today,
    rating,
    feedback
  });

  await mealRating.save();

  // Update average rating in DailyMeal
  const ratings = await MealRating.find({ meal: existingMeal._id });
  const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  existingMeal.averageRating = averageRating;
  existingMeal.ratingCount = ratings.length;
  await existingMeal.save();

  res.status(201).json({
    success: true,
    data: mealRating
  });
};

/**
 * @desc    Add tomorrow's meal
 * @route   POST /api/dailymeals/tomorrow
 * @access  Private (Admin/Restaurant)
 */
exports.addTomorrowsMeal = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Check if meal already exists for tomorrow
    const existingMeal = await DailyMeal.findOne({ date: tomorrow });
    if (existingMeal) {
      return res.status(400).json({
        success: false,
        message: 'Meal for tomorrow already exists. Use PATCH to update instead.',
        existingMealId: existingMeal._id
      });
    }

    const {
      meals,
      sundaySpecial,
      images,
      nutritionalInfo,
      chefSpecial,
      availability,
      maxOrders,
      tags
    } = req.body;
    const restaurantId = req.user._id;
    // Validate required fields
    if (!meals || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID and meals are required'
      });
    }

    // Create new daily meal for tomorrow
    const newDailyMeal = new DailyMeal({
      restaurantId,
      date: tomorrow,
      meals,
      sundaySpecial: sundaySpecial || {
        isSpecialDay: false,
        specialItems: [],
        extraCharges: 0,
        includedInPlan: false
      },
      images: images || [],
      nutritionalInfo: nutritionalInfo || {
        low: { calories: 0, protein: '0g', carbs: '0g', fat: '0g' },
        basic: { calories: 0, protein: '0g', carbs: '0g', fat: '0g' },
        premium: { calories: 0, protein: '0g', carbs: '0g', fat: '0g' }
      },
      chefSpecial: chefSpecial || {
        isChefSpecial: false,
        specialNote: '',
        chefName: ''
      },
      availability: availability || {
        low: true,
        basic: true,
        premium: true
      },
      maxOrders: maxOrders || 1000,
      currentOrders: 0,
      tags: tags || [],
      createdBy: req.user._id
    });

    const savedMeal = await newDailyMeal.save();

    res.status(201).json({
      success: true,
      message: 'Tomorrow\'s meal added successfully',
      data: savedMeal
    });

  } catch (error) {
    console.error('Error in addTomorrowsMeal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get tomorrow's meal
 * @route   GET /api/dailymeals/tomorrow
 * @access  Public
 */
exports.getTomorrowsMeal = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    console.log('Looking for meal on:', tomorrow);

    const meal = await DailyMeal.findOne({
      date: tomorrow
      // status: 'active'
    }).populate('meals', 'name description');

    console.log("Tomorrow's meal found:", meal);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'No meal found for tomorrow',
        date: tomorrow.toISOString().split('T')[0],
        suggestion: 'Please check back later or contact support'
      });
    }

    res.json({
      success: true,
      data: meal
    });
  } catch (error) {
    console.error('Error in getTomorrowsMeal:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};