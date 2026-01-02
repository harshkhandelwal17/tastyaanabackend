// controllers/SellerMealPlanController.js
const MealPlan = require('../models/MealPlan');
const { validationResult } = require('express-validator');

/**
 * Get all meal plans for the authenticated seller
 */
exports.getSellerMealPlans = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status = 'active'
    } = req.query;

    const sellerId = req.user._id;

    // Build filter object
    const filter = { 
      createdBy: sellerId,
      status 
    };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const mealPlans = await MealPlan.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await MealPlan.countDocuments(filter);

    // Calculate additional info for each plan
    const enrichedPlans = mealPlans.map(plan => ({
      ...plan,
      savings: {
        tenDays: plan.pricing.oneDay * 10 - plan.pricing.tenDays,
        thirtyDays: plan.pricing.oneDay * 30 - plan.pricing.thirtyDays
      }
    }));

    res.json({
      success: true,
      data: {
        mealPlans: enrichedPlans,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get seller meal plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plans',
      error: error.message
    });
  }
};

/**
 * Get specific meal plan by ID for the authenticated seller
 */
exports.getSellerMealPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const mealPlan = await MealPlan.findOne({
      _id: id,
      createdBy: sellerId
    }).lean();

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Calculate savings
    const enrichedPlan = {
      ...mealPlan,
      savings: {
        tenDays: mealPlan.pricing.oneDay * 10 - mealPlan.pricing.tenDays,
        thirtyDays: mealPlan.pricing.oneDay * 30 - mealPlan.pricing.thirtyDays
      }
    };

    res.json({
      success: true,
      data: enrichedPlan
    });

  } catch (error) {
    console.error('Get seller meal plan by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plan',
      error: error.message
    });
  }
};

/**
 * Create new meal plan
 */
exports.createSellerMealPlan = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const sellerId = req.user._id;
    const mealPlanData = {
      ...req.body,
      createdBy: sellerId,
      status: 'active'
    };

    // Create the meal plan
    const newMealPlan = new MealPlan(mealPlanData);
    await newMealPlan.save();

    // Calculate savings
    const enrichedPlan = {
      ...newMealPlan.toObject(),
      savings: {
        tenDays: newMealPlan.pricing.oneDay * 10 - newMealPlan.pricing.tenDays,
        thirtyDays: newMealPlan.pricing.oneDay * 30 - newMealPlan.pricing.thirtyDays
      }
    };

    res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      data: enrichedPlan
    });

  } catch (error) {
    console.error('Create seller meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meal plan',
      error: error.message
    });
  }
};

/**
 * Update meal plan
 */
exports.updateSellerMealPlan = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const sellerId = req.user._id;
    const updateData = req.body;

    // Find and update the meal plan
    const updatedMealPlan = await MealPlan.findOneAndUpdate(
      {
        _id: id,
        createdBy: sellerId
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedMealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Calculate savings
    const enrichedPlan = {
      ...updatedMealPlan.toObject(),
      savings: {
        tenDays: updatedMealPlan.pricing.oneDay * 10 - updatedMealPlan.pricing.tenDays,
        thirtyDays: updatedMealPlan.pricing.oneDay * 30 - updatedMealPlan.pricing.thirtyDays
      }
    };

    res.json({
      success: true,
      message: 'Meal plan updated successfully',
      data: enrichedPlan
    });

  } catch (error) {
    console.error('Update seller meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meal plan',
      error: error.message
    });
  }
};

/**
 * Delete meal plan
 */
exports.deleteSellerMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    // Find and delete the meal plan
    const deletedMealPlan = await MealPlan.findOneAndDelete({
      _id: id,
      createdBy: sellerId
    });

    if (!deletedMealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Meal plan deleted successfully'
    });

  } catch (error) {
    console.error('Delete seller meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meal plan',
      error: error.message
    });
  }
};




