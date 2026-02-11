
// controllers/mealPlanController.js
const MealPlan = require('../models/MealPlan');
const Review = require('../models/Review');
const User = require('../models/User');
const AddOn = require("../models/AddOn");
const ExtraItem = require("../models/ExtraItem");
const mongoose = require("mongoose");
/**
 * Get all meal plans with filters and pagination
 */
exports.getAllMealPlans = async (req, res) => {
  try {
    const {
      tier,
      status = 'active',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = { status };

    if (req.query.seller || req.query.vendor) {
      const sellerId = req.query.seller || req.query.vendor;
      if (mongoose.Types.ObjectId.isValid(sellerId)) {
        filter.$or = [{ createdBy: sellerId }, { seller: sellerId }];
      }
    }

    if (tier) {
      filter.tier = tier;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // 5. Location Filtering (Unified Logic)
    const { lat, lng } = req.query;
    if (lat && lng) {
      const getNearbySellers = require('../utils/geoHelper').getNearbySellers;
      const nearbySellers = await getNearbySellers(lat, lng);
      // Note: getNearbySellers returns generic sellers. 
      // Tiffin sellers are a subset, but the filter.seller query below will 
      // primarily operate on the IDs returned.

      const nearbySellerIds = nearbySellers.map(u => u._id);

      // Merge with existing seller filter if exists
      if (filter.$or) {
        // Complex case: if we already have an OR for search, we need to AND it with location
        // We add it to the top-level AND
        filter.seller = { $in: nearbySellerIds };
      } else {
        filter.seller = { $in: nearbySellerIds };
      }
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
      .populate('createdBy', 'name email')
      .lean();

    // Get total count for pagination
    const total = await MealPlan.countDocuments(filter);

    // Calculate additional info for each plan
    const enrichedPlans = await Promise.all(
      mealPlans.map(async (plan) => {
        // Get recent reviews
        const recentReviews = await Review.find({ mealPlanId: plan._id })
          .sort({ createdAt: -1 })
          .limit(3)
          .populate('userId', 'name')
          .lean();

        return {
          ...plan,
          recentReviews,
          savings: {
            tenDays: plan.pricing.oneDay * 10 - plan.pricing.tenDays,
            thirtyDays: plan.pricing.oneDay * 30 - plan.pricing.thirtyDays
          }
        };
      })
    );

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
    console.error('Get meal plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plans',
      error: error.message
    });
  }
};

/**
 * Get meal plan by ID with detailed information including addons and extra items
 */
exports.getMealPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal plan ID'
      });
    }
    // Get meal plan with populated addons and extra items 
    const mealPlan = await MealPlan.findById(id)
      .populate('createdBy', 'name email')
      .populate({
        path: 'addons',
        match: { isActive: true },
        select: 'name description price appliesToAll'
      })
      .populate({
        path: 'extraitems',
        match: { isAvailable: true },
        select: 'name description price category'
      }).populate({
        path: 'replacements',
        select: 'name description price image items' // Adjust fields as needed
      })
      .lean();
    // console.log(mealPlan);
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Format the response
    const response = {
      ...mealPlan,
      addOns: mealPlan?.addons || [],
      extraItems: mealPlan?.extraitems || []
    };

    // Remove populated virtuals to avoid duplicate data
    delete response.__v;
    delete response.id;

    // Get reviews with pagination
    const reviews = await Review.find({ mealPlanId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name avatar')
      .lean();

    // Calculate detailed ratings
    const ratingStats = await Review.aggregate([
      { $match: { mealPlanId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          averageOverall: { $avg: '$ratings.overall' },
          averageTaste: { $avg: '$ratings.food.taste' },
          averageQuality: { $avg: '$ratings.food.quality' },
          averageQuantity: { $avg: '$ratings.food.quantity' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$ratings.overall'
          }
        }
      }
    ]);

    // Calculate rating distribution
    let distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (ratingStats.length > 0) {
      ratingStats[0].ratingDistribution.forEach(rating => {
        const rounded = Math.round(rating);
        distribution[rounded] = (distribution[rounded] || 0) + 1;
      });
    }

    // Calculate savings
    const savings = {
      tenDays: {
        amount: mealPlan.pricing.oneDay * 10 - mealPlan.pricing.tenDays,
        percentage: mealPlan.pricing.discountPercentage?.tenDays || 0
      },
      thirtyDays: {
        amount: mealPlan.pricing.oneDay * 30 - mealPlan.pricing.thirtyDays,
        percentage: mealPlan.pricing.discountPercentage?.thirtyDays || 0
      }
    };

    res.json({
      success: true,
      data: {
        mealPlan,
        reviews,
        ratingStats: ratingStats[0] || {
          averageOverall: 0,
          averageTaste: 0,
          averageQuality: 0,
          averageQuantity: 0,
          totalReviews: 0
        },
        ratingDistribution: distribution,
        savings
      }
    });

  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plan',
      error: error.message
    });
  }
};

/**
 * Create new meal plan (Admin only)
 */
exports.createMealPlan = async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const mealPlanData = {
      ...req.body,
      createdBy: req.userId
    };

    const mealPlan = new MealPlan(mealPlanData);
    await mealPlan.save();

    res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      data: mealPlan
    });

  } catch (error) {
    console.error('Create meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meal plan',
      error: error.message
    });
  }
};

/**
 * Update meal plan (Admin only)
 */
exports.updateMealPlan = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    const user = await User.findById(req.userId);
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const mealPlan = await MealPlan.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Meal plan updated successfully',
      data: mealPlan
    });

  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meal plan',
      error: error.message
    });
  }
};

/**
 * Get meal plan add-ons
 */
exports.getMealPlanAddOns = async (req, res) => {
  try {
    const { id } = req.params;

    const mealPlan = await MealPlan.findById(id);
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Return only the add-ons that are available
    const availableAddOns = mealPlan.addOns.filter(addOn => addOn.available);

    res.json({
      success: true,
      data: availableAddOns
    });

  } catch (error) {
    console.error('Get meal plan add-ons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plan add-ons',
      error: error.message
    });
  }
};

/**
 * Get extra items for a meal plan
 */
exports.getMealPlanExtraItems = async (req, res) => {
  try {
    const { id } = req.params;
    const mealPlan = await require('../models/MealPlan').findById(id).lean();
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: 'Meal plan not found' });
    }
    // Return extra items from the dedicated extraItems field
    const extraItems = (mealPlan.extraItems || []).filter(item => item.available);
    res.json({ success: true, data: { extraItems } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch extra items', error: error.message });
  }
};

/**
 * Get thali replacements for a meal plan
 */
exports.getMealPlanReplacements = async (req, res) => {
  try {
    const { id } = req.params;
    const mealPlan = await require('../models/MealPlan').findById(id).lean();
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: 'Meal plan not found' });
    }
    // Assuming thali replacements are stored in a field called 'replacements' (array of objects)
    const replacements = mealPlan.replacements || [];
    res.json({ success: true, data: { replacements } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch thali replacements', error: error.message });
  }
};

/**
 * Get skip meal limit from settings
 */
exports.getSkipMealLimit = async (req, res) => {
  try {
    // This would typically come from a settings/config collection
    const skipMealLimit = 4; // Default value, can be fetched from settings
    res.json({ success: true, data: { limit: skipMealLimit } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch skip meal limit', error: error.message });
  }
};

/**
 * Get replaceable thalis for a meal plan
 * This returns all available thalis that can be used as replacements
 */
exports.getReplaceableThalis = async (req, res) => {
  try {
    const { planId } = req.params;

    // Get the meal plan to check for restrictions
    const mealPlan = await MealPlan.findById(planId)
      .select('replacements allowedReplacements')
      .populate('replacements', 'name description price image')
      .lean();
    console.log(mealPlan.replacements);
    if (!mealPlan) {
      return res.status(404).json({ success: false, message: 'Meal plan not found' });
    }

    // If specific thalis are defined in the meal plan, return those
    if (mealPlan.replacements && mealPlan.replacements.length > 0) {
      return res.json({
        success: true,
        data: mealPlan.replacements
      });
    }

    // Otherwise, return all active thalis that are marked as replaceable
    // This is a fallback in case meal plan doesn't have specific thalis defined
    const replaceableThalis = await MealPlan.find({
      isActive: true,
      isReplaceable: true,
      _id: { $ne: planId } // Don't include the current meal plan
    })
      .select('name description price image items priceDifference')
      .lean();

    res.json({
      success: true,
      data: replaceableThalis
    });
  } catch (error) {
    console.error('Error fetching replaceable thalis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch replaceable thalis',
      error: error.message
    });
  }
};
