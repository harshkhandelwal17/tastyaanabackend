const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const DailyMeal = require('../models/DailyMeal');
const User = require('../models/User');
const MealPlan = require('../models/MealPlan');
const SellerMealPlan = require('../models/SellerMealPlan');

/**
 * @desc    Get all sellers with their meal plans and subscription details
 * @route   GET /api/admin/meal-edit/sellers
 * @access  Private (Admin only)
 */
exports.getAllSellers = async (req, res) => {
  try {
    console.log('Getting all sellers with detailed meal plan and subscription data...');
    
    // Get all sellers (users with role 'seller' or who have created meal plans)
    const sellers = await User.find({
      $or: [
        { role: 'seller' },
        { _id: { $in: await MealPlan.distinct('seller') } }
      ]
    }).select('name email phone role createdAt businessName');

    // Get detailed data for each seller
    const sellersWithDetailedData = await Promise.all(
      sellers.map(async (seller) => {
        // Get all meal plans for this seller
        const mealPlans = await MealPlan.find({ seller: seller._id })
          .select('title tier pricing description _id')
          .sort({ createdAt: -1 });

        // Get subscription counts
        const totalSubscriptions = await Subscription.countDocuments({
          sellerId: seller._id
        });

        const activeSubscriptions = await Subscription.countDocuments({
          sellerId: seller._id,
          status: 'active'
        });

        // Group subscriptions by meal plan
        const mealPlanSubscriptions = await Promise.all(
          mealPlans.map(async (mealPlan) => {
            const planSubscriptions = await Subscription.countDocuments({
              sellerId: seller._id,
              mealPlan: mealPlan._id,
              status: 'active'
            });

            return {
              mealPlan,
              activeSubscriptions: planSubscriptions
            };
          })
        );

        return {
          ...seller.toObject(),
          totalSubscriptions,
          activeSubscriptions,
          mealPlansCount: mealPlans.length,
          mealPlans: mealPlanSubscriptions,
          hasActiveSubscriptions: activeSubscriptions > 0
        };
      })
    );

    res.status(200).json({
      success: true,
      data: sellersWithDetailedData,
      total: sellersWithDetailedData.length
    });

  } catch (error) {
    console.error('Error getting sellers with detailed data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sellers with detailed data',
      error: error.message
    });
  }
};

/**
 * @desc    Get subscriptions for a specific seller
 * @route   GET /api/admin/meal-edit/seller/:sellerId/subscriptions
 * @access  Private (Admin only)
 */
exports.getSellerSubscriptions = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status = 'active', page = 1, limit = 20 } = req.query;

    console.log(`Getting subscriptions for seller: ${sellerId}`);

    // Build filter
    const filter = { sellerId };
    if (status !== 'all') {
      filter.status = status;
    }

    // Get subscriptions with populated user and meal plan data
    const subscriptions = await Subscription.find(filter)
      .populate('user', 'name email phone')
      .populate('mealPlan', 'title tier pricing description')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Subscription.countDocuments(filter);

    // Add today's meal status for each subscription
    const subscriptionsWithMealStatus = subscriptions.map(sub => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const hasTodayMeal = sub.todayMeal && 
                          sub.todayMeal.date && 
                          new Date(sub.todayMeal.date).getTime() === today.getTime() &&
                          sub.todayMeal.isAvailable;

      return {
        ...sub,
        todayMealStatus: hasTodayMeal ? 'available' : 'not_set',
        todayMealItems: sub.todayMeal?.items || []
      };
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptions: subscriptionsWithMealStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting seller subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller subscriptions',
      error: error.message
    });
  }
};

/**
 * @desc    Get today's meal for a specific subscription
 * @route   GET /api/admin/meal-edit/subscription/:subscriptionId/today-meal
 * @access  Private (Admin only)
 */
exports.getSubscriptionTodayMeal = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId)
      .populate('user', 'name email')
      .populate('mealPlan', 'title tier')
      .select('todayMeal user mealPlan sellerId shift');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        subscription: {
          _id: subscription._id,
          user: subscription.user,
          mealPlan: subscription.mealPlan,
          shift: subscription.shift,
          todayMeal: subscription.todayMeal
        }
      }
    });

  } catch (error) {
    console.error('Error getting subscription today meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s meal',
      error: error.message
    });
  }
};

/**
 * @desc    Update today's meal for a specific subscription
 * @route   PUT /api/admin/meal-edit/subscription/:subscriptionId/today-meal
 * @access  Private (Admin only)
 */
exports.updateSubscriptionTodayMeal = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { items, mealType, isAvailable } = req.body;

    console.log(`Updating today's meal for subscription: ${subscriptionId}`);

    // Validate items array
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }

    // Validate each item structure
    const validItems = items.every(item => 
      item.name && typeof item.name === 'string'
    );

    if (!validItems) {
      return res.status(400).json({
        success: false,
        message: 'Each item must have at least a name field'
      });
    }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update today's meal
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    subscription.todayMeal = {
      items: items.map(item => ({
        name: item.name,
        description: item.description || '',
        quantity: item.quantity || '1 serving'
      })),
      mealType: mealType || subscription.shift === 'morning' ? 'lunch' : 'dinner',
      date: today,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      lastUpdated: new Date()
    };

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Today\'s meal updated successfully',
      data: {
        subscription: {
          _id: subscription._id,
          todayMeal: subscription.todayMeal
        }
      }
    });

  } catch (error) {
    console.error('Error updating subscription today meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update today\'s meal',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk update today's meal for all subscriptions of a seller
 * @route   PUT /api/admin/meal-edit/seller/:sellerId/bulk-update-today-meal
 * @access  Private (Admin only)
 */
exports.bulkUpdateSellerTodayMeal = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { mealsByTier } = req.body;

    console.log(`Bulk updating today's meals for seller: ${sellerId}`);

    // Validate input
    if (!mealsByTier || typeof mealsByTier !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'mealsByTier must be an object with tier keys (low, basic, premium)'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active subscriptions for this seller
    const subscriptions = await Subscription.find({
      sellerId,
      status: 'active'
    }).populate('mealPlan', 'tier');

    let updatedCount = 0;
    const updatePromises = subscriptions.map(async (subscription) => {
      const tier = subscription.mealPlan?.tier || 'basic';
      const mealData = mealsByTier[tier];

      if (mealData && Array.isArray(mealData.items)) {
        subscription.todayMeal = {
          items: mealData.items.map(item => ({
            name: item.name,
            description: item.description || '',
            quantity: item.quantity || '1 serving'
          })),
          mealType: mealData.mealType || (subscription.shift === 'morning' ? 'lunch' : 'dinner'),
          date: today,
          isAvailable: mealData.isAvailable !== undefined ? mealData.isAvailable : true,
          lastUpdated: new Date()
        };

        await subscription.save();
        updatedCount++;
      }
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `Successfully updated today's meals for ${updatedCount} subscriptions`,
      data: {
        updatedCount,
        totalSubscriptions: subscriptions.length
      }
    });

  } catch (error) {
    console.error('Error bulk updating seller today meals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update today\'s meals',
      error: error.message
    });
  }
};

/**
 * @desc    Get meal templates for a seller (based on their meal plans)
 * @route   GET /api/admin/meal-edit/seller/:sellerId/meal-templates
 * @access  Private (Admin only)
 */
exports.getSellerMealTemplates = async (req, res) => {
  try {
    const { sellerId } = req.params;

    console.log(`Getting meal templates for seller: ${sellerId}`);

    // Get meal plans for this seller
    const mealPlans = await MealPlan.find({ seller: sellerId })
      .select('title tier pricing includes description')
      .lean();

    // Get recent daily meals to use as templates
    const recentDailyMeals = await DailyMeal.find({
      restaurantId: sellerId,
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // Get available tiers dynamically
    const availableTiers = await SellerMealPlan.getAvailableTiers(sellerId);
    
    // Create dynamic default templates based on available tiers
    const defaultTemplatesByTier = {};
    
    for (const tier of availableTiers) {
      // Generate templates based on tier name or use generic templates
      const isBasic = tier.toLowerCase().includes('basic');
      const isPremium = tier.toLowerCase().includes('premium') || tier.toLowerCase().includes('delux');
      const isLow = tier.toLowerCase().includes('low') || tier.toLowerCase().includes('budget');
      
      if (isPremium) {
        defaultTemplatesByTier[tier] = {
          lunch: [
            { name: "Paneer Butter Masala", description: "Cottage cheese in rich tomato gravy", quantity: "1 bowl" },
            { name: "Saffron Rice", description: "Basmati rice with saffron", quantity: "1 plate" },
            { name: "Dal Makhani", description: "Creamy black lentils", quantity: "1 bowl" },
            { name: "Butter Naan", description: "Leavened bread with butter", quantity: "2 pieces" },
            { name: "Mix Raita", description: "Yogurt with vegetables", quantity: "1 bowl" }
          ],
          dinner: [
            { name: "Chicken Curry", description: "Spiced chicken gravy", quantity: "1 bowl" },
            { name: "Biryani Rice", description: "Aromatic spiced rice", quantity: "1 plate" },
            { name: "Palak Paneer", description: "Spinach with cottage cheese", quantity: "1 serving" },
            { name: "Garlic Naan", description: "Bread with garlic", quantity: "2 pieces" }
          ]
        };
      } else if (isLow) {
        defaultTemplatesByTier[tier] = {
          lunch: [
            { name: "Dal Rice", description: "Simple dal with rice", quantity: "1 plate" },
            { name: "Seasonal Vegetable", description: "Basic vegetable curry", quantity: "1 serving" },
            { name: "Chapati", description: "Wheat flatbread", quantity: "2 pieces" }
          ],
          dinner: [
            { name: "Khichdi", description: "Rice and lentil porridge", quantity: "1 bowl" },
            { name: "Curd", description: "Fresh yogurt", quantity: "1 small bowl" },
            { name: "Pickle", description: "Mixed pickle", quantity: "1 portion" }
          ]
        };
      } else {
        // Default to basic template for any other tier
        defaultTemplatesByTier[tier] = {
          lunch: [
            { name: "Dal Tadka", description: "Tempered yellow lentils", quantity: "1 bowl" },
            { name: "Basmati Rice", description: "Aromatic basmati rice", quantity: "1 plate" },
            { name: "Seasonal Sabzi", description: "Mixed vegetable curry", quantity: "1 serving" },
            { name: "Chapati", description: "Fresh wheat bread", quantity: "3 pieces" },
            { name: "Raita", description: "Cucumber yogurt salad", quantity: "1 small bowl" }
          ],
          dinner: [
            { name: "Rajma", description: "Kidney beans curry", quantity: "1 bowl" },
            { name: "Jeera Rice", description: "Cumin flavored rice", quantity: "1 plate" },
            { name: "Aloo Gobi", description: "Potato cauliflower curry", quantity: "1 serving" },
            { name: "Chapati", description: "Fresh wheat bread", quantity: "2 pieces" }
          ]
        };
      }
    }

    // Create templates based on meal plans and recent meals
    const templates = {
      mealPlans: mealPlans,
      recentMeals: recentDailyMeals,
      availableTiers: availableTiers,
      defaultTemplates: defaultTemplatesByTier
    };

    res.status(200).json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Error getting seller meal templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal templates',
      error: error.message
    });
  }
};

/**
 * @desc    Get subscriptions by meal plan ID for a seller
 * @route   GET /api/admin/meal-edit/seller/:sellerId/meal-plan/:mealPlanId/subscriptions
 * @access  Private (Admin only)
 */
exports.getSubscriptionsByMealPlan = async (req, res) => {
  try {
    const { sellerId, mealPlanId } = req.params;
    const { status = 'active', page = 1, limit = 20 } = req.query;

    console.log(`Getting subscriptions for seller: ${sellerId}, meal plan: ${mealPlanId}`);

    // Verify meal plan exists and belongs to seller
    const mealPlan = await MealPlan.findOne({ _id: mealPlanId, seller: sellerId });
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found for this seller'
      });
    }

    // Build filter
    const filter = { sellerId, mealPlan: mealPlanId };
    if (status !== 'all') {
      filter.status = status;
    }

    // Get subscriptions with populated user data
    const subscriptions = await Subscription.find(filter)
      .populate('user', 'name email phone')
      .populate('mealPlan', 'title tier pricing description')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Subscription.countDocuments(filter);

    // Add today's meal status for each subscription
    const subscriptionsWithMealStatus = subscriptions.map(sub => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const hasTodayMeal = sub.todayMeal && 
                          sub.todayMeal.date && 
                          new Date(sub.todayMeal.date).getTime() === today.getTime() &&
                          sub.todayMeal.isAvailable;

      return {
        ...sub,
        todayMealStatus: hasTodayMeal ? 'available' : 'not_set',
        todayMealItems: sub.todayMeal?.items || []
      };
    });

    res.status(200).json({
      success: true,
      data: {
        mealPlan,
        subscriptions: subscriptionsWithMealStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting subscriptions by meal plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions by meal plan',
      error: error.message
    });
  }
};

/**
 * @desc    Update daily meal for specific meal plan subscriptions
 * @route   PUT /api/admin/meal-edit/seller/:sellerId/meal-plan/:mealPlanId/daily-meal
 * @access  Private (Admin only)
 */
/**
 * @desc    Master meal plan update - Updates daily meal for all customers under a specific meal plan
 * @route   PUT /api/admin/meal-edit/seller/:sellerId/meal-plan/:mealPlanId/daily-meal
 * @access  Private (Admin only)
 * @note    This is the core functionality where admin can edit meals at meal plan level,
 *          and all customers with the same meal plan get automatically updated
 */
exports.updateMealPlanDailyMeal = async (req, res) => {
  try {
    const { sellerId, mealPlanId } = req.params;
    const { items, mealType, isAvailable, shift } = req.body;
    const adminId = req.user._id;
    const updateStartTime = new Date();

    console.log('🍽️  MASTER MEAL PLAN UPDATE INITIATED');
    console.log(`   📋 Seller ID: ${sellerId}`);
    console.log(`   📋 Meal Plan ID: ${mealPlanId}`);
    console.log(`   📋 Admin ID: ${adminId}`);
    console.log(`   📋 Target Shift: ${shift || 'ALL SHIFTS'}`);
    console.log(`   📋 Meal Type: ${mealType || 'AUTO-DETECT'}`);
    console.log(`   📋 Items Count: ${items?.length || 0}`);

    // Verify meal plan exists and belongs to seller
    const mealPlan = await MealPlan.findOne({ _id: mealPlanId, seller: sellerId })
      .populate('seller', 'businessName email');
    
    if (!mealPlan) {
      console.log('❌ Meal plan not found or access denied');
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found for this seller'
      });
    }

    console.log(`   ✅ Meal Plan Found: "${mealPlan.name}" (Tier: ${mealPlan.tier})`);
    console.log(`   ✅ Seller: ${mealPlan.seller.businessName}`);

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      console.log('❌ Invalid items array provided');
      return res.status(400).json({
        success: false,
        message: 'Meal items are required and must be a non-empty array'
      });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.name || !item.name.trim()) {
        console.log(`❌ Invalid item found: ${JSON.stringify(item)}`);
        return res.status(400).json({
          success: false,
          message: 'Each meal item must have a name'
        });
      }
    }

    console.log('   ✅ All meal items validated successfully');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active subscriptions for this meal plan
    const subscriptions = await Subscription.find({
      sellerId,
      mealPlan: mealPlanId,
      status: 'active'
    }).populate('user', 'name email phone');

    console.log(`   📊 Found ${subscriptions.length} active subscriptions for this meal plan`);

    if (subscriptions.length === 0) {
      console.log('⚠️  No active subscriptions found for this meal plan');
      return res.status(200).json({
        success: true,
        message: 'Meal plan updated but no active subscriptions found',
        data: {
          mealPlan,
          updatedSubscriptionCount: 0,
          totalSubscriptions: 0,
          shift: shift || 'all'
        }
      });
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const updatedSubscriptions = [];
    const failedUpdates = [];

    console.log('🔄 Starting customer subscription updates...');

    const updatePromises = subscriptions.map(async (subscription, index) => {
      try {
        // If shift is specified, only update subscriptions with that shift
        if (shift && subscription.shift !== shift && subscription.shift !== 'both') {
          console.log(`   ⏭️  Skipped subscription ${index + 1}: Shift mismatch (${subscription.shift} vs ${shift})`);
          skippedCount++;
          return;
        }

        const effectiveMealType = mealType || (subscription.shift === 'morning' ? 'lunch' : 'dinner');

        const mealData = {
          items: items.map(item => ({
            name: item.name.trim(),
            description: item.description || '',
            quantity: item.quantity || '1 serving'
          })),
          mealType: effectiveMealType,
          date: today,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
          lastUpdated: new Date(),
          sellerId: sellerId,
          tier: mealPlan.tier,
          shift: subscription.shift === 'both' ? subscription.startShift : subscription.shift,
          updatedBy: adminId,
          updateReason: 'Master meal plan update'
        };

        subscription.todayMeal = mealData;
        await subscription.save();

        updatedSubscriptions.push({
          subscriptionId: subscription._id,
          customerName: subscription.user?.name || 'Unknown',
          customerPhone: subscription.user?.phone || 'N/A',
          shift: subscription.shift,
          effectiveMealType,
          updatedAt: new Date()
        });

        console.log(`   ✅ Updated subscription ${index + 1}/${subscriptions.length}: ${subscription.user?.name || 'Unknown'} (${subscription.shift})`);
        updatedCount++;

      } catch (error) {
        console.error(`   ❌ Failed to update subscription ${index + 1}:`, error.message);
        failedUpdates.push({
          subscriptionId: subscription._id,
          customerName: subscription.user?.name || 'Unknown',
          error: error.message
        });
      }
    });

    await Promise.all(updatePromises);

    console.log(`📊 Subscription Update Summary:`);
    console.log(`   ✅ Successfully Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped (Shift Filter): ${skippedCount}`);
    console.log(`   ❌ Failed: ${failedUpdates.length}`);

    // Also update the SellerMealPlan for future subscriptions
    console.log('🔄 Updating SellerMealPlan template for future subscriptions...');
    
    const sellerMealPlan = await SellerMealPlan.getOrCreateSellerMealPlan(sellerId, mealPlan.tier);
    
    const mealUpdateData = {
      items: items.map(item => ({
        name: item.name.trim(),
        description: item.description || '',
        quantity: item.quantity || '1 serving'
      })),
      isAvailable: isAvailable !== undefined ? isAvailable : true
    };

    if (shift) {
      // Update specific shift
      mealUpdateData.mealType = mealType || (shift === 'morning' ? 'lunch' : 'dinner');
      await sellerMealPlan.updateShiftMeal(shift, mealUpdateData, adminId);
      console.log(`   ✅ Updated SellerMealPlan template for ${shift} shift`);
    } else {
      // Update both shifts if no specific shift mentioned
      const shifts = ['morning', 'evening'];
      for (const shiftType of shifts) {
        const shiftMealData = {
          ...mealUpdateData,
          mealType: mealType || (shiftType === 'morning' ? 'lunch' : 'dinner')
        };
        await sellerMealPlan.updateShiftMeal(shiftType, shiftMealData, adminId);
        console.log(`   ✅ Updated SellerMealPlan template for ${shiftType} shift`);
      }
    }

    const updateEndTime = new Date();
    const processingTime = updateEndTime - updateStartTime;

    console.log('🎉 MASTER MEAL PLAN UPDATE COMPLETED SUCCESSFULLY');
    console.log(`   ⏱️  Processing Time: ${processingTime}ms`);
    console.log(`   📊 Final Stats: ${updatedCount} updated, ${skippedCount} skipped, ${failedUpdates.length} failed`);

    // Prepare comprehensive response
    const responseData = {
      mealPlan: {
        id: mealPlan._id,
        name: mealPlan.name,
        tier: mealPlan.tier,
        seller: mealPlan.seller.businessName
      },
      updateSummary: {
        totalSubscriptions: subscriptions.length,
        updatedCount,
        skippedCount,
        failedCount: failedUpdates.length,
        processingTimeMs: processingTime
      },
      mealDetails: {
        items: items.map(item => ({
          name: item.name.trim(),
          description: item.description || '',
          quantity: item.quantity || '1 serving'
        })),
        mealType: mealType,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        shift: shift || 'all',
        updatedBy: adminId,
        updatedAt: updateEndTime
      },
      updatedSubscriptions,
      failedUpdates: failedUpdates.length > 0 ? failedUpdates : undefined
    };

    res.status(200).json({
      success: true,
      message: `Master meal plan update completed: ${updatedCount} subscriptions updated successfully${failedUpdates.length > 0 ? `, ${failedUpdates.length} failed` : ''}`,
      data: responseData
    });

  } catch (error) {
    console.error('💥 MASTER MEAL PLAN UPDATE FAILED:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update meal plan - Master update operation failed',
      error: error.message,
      details: 'Check server logs for complete error details'
    });
  }
};

/**
 * @desc    Get today's meal for a specific meal plan
 * @route   GET /api/admin/meal-edit/seller/:sellerId/meal-plan/:mealPlanId/daily-meal
 * @access  Private (Admin only)
 */
exports.getMealPlanDailyMeal = async (req, res) => {
  try {
    const { sellerId, mealPlanId } = req.params;
    const { shift } = req.query;

    console.log(`Getting daily meal for seller: ${sellerId}, meal plan: ${mealPlanId}, shift: ${shift}`);

    // Verify meal plan exists and belongs to seller
    const mealPlan = await MealPlan.findOne({ _id: mealPlanId, seller: sellerId });
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found for this seller'
      });
    }

    // Get SellerMealPlan for this tier
    const sellerMealPlan = await SellerMealPlan.findOne({
      sellerId,
      tier: mealPlan.tier
    });

    let mealData = null;
    if (sellerMealPlan && shift && sellerMealPlan.shiftMeals[shift]) {
      mealData = sellerMealPlan.shiftMeals[shift];
    } else if (sellerMealPlan) {
      mealData = sellerMealPlan.shiftMeals;
    }

    // Get sample subscription to see current meal status
    const sampleSubscription = await Subscription.findOne({
      sellerId,
      mealPlan: mealPlanId,
      status: 'active'
    }).select('todayMeal shift');

    res.status(200).json({
      success: true,
      data: {
        mealPlan,
        currentMeal: mealData,
        sampleSubscriptionMeal: sampleSubscription?.todayMeal,
        shift: shift || 'all'
      }
    });

  } catch (error) {
    console.error('Error getting meal plan daily meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily meal',
      error: error.message
    });
  }
};

/**
 * @desc    Get comprehensive meal management dashboard data
 * @route   GET /api/admin/meal-edit/dashboard
 * @access  Private (Admin only)
 */
exports.getMealManagementDashboard = async (req, res) => {
  try {
    console.log('Getting meal management dashboard data...');

    // Get overall statistics
    const totalSellers = await User.countDocuments({
      $or: [
        { role: 'seller' },
        { _id: { $in: await MealPlan.distinct('seller') } }
      ]
    });

    const totalMealPlans = await MealPlan.countDocuments({});
    const totalSubscriptions = await Subscription.countDocuments({});
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    // Get sellers with meal plans requiring attention (no meals set for today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sellersNeedingAttention = await User.aggregate([
      {
        $match: {
          $or: [
            { role: 'seller' },
            { _id: { $in: await MealPlan.distinct('seller') } }
          ]
        }
      },
      {
        $lookup: {
          from: 'mealplans',
          localField: '_id',
          foreignField: 'seller',
          as: 'mealPlans'
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'sellerId',
          as: 'subscriptions'
        }
      },
      {
        $addFields: {
          activeSubscriptions: {
            $size: {
              $filter: {
                input: '$subscriptions',
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          },
          subscriptionsWithoutTodayMeal: {
            $size: {
              $filter: {
                input: '$subscriptions',
                cond: {
                  $and: [
                    { $eq: ['$$this.status', 'active'] },
                    {
                      $or: [
                        { $not: { $ifNull: ['$$this.todayMeal', false] } },
                        { $eq: ['$$this.todayMeal.isAvailable', false] },
                        { $ne: [{ $dateToString: { format: '%Y-%m-%d', date: '$$this.todayMeal.date' } }, { $dateToString: { format: '%Y-%m-%d', date: today } }] }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $match: {
          $and: [
            { activeSubscriptions: { $gt: 0 } },
            { subscriptionsWithoutTodayMeal: { $gt: 0 } }
          ]
        }
      },
      {
        $project: {
          name: 1,
          businessName: 1,
          email: 1,
          mealPlansCount: { $size: '$mealPlans' },
          activeSubscriptions: 1,
          subscriptionsWithoutTodayMeal: 1
        }
      }
    ]);

    // Get recent meal updates
    const recentUpdates = await SellerMealPlan.find({})
      .populate('sellerId', 'name businessName')
      .sort({ 'shiftMeals.morning.lastUpdated': -1, 'shiftMeals.evening.lastUpdated': -1 })
      .limit(10)
      .select('sellerId tier shiftMeals');

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalSellers,
          totalMealPlans,
          totalSubscriptions,
          activeSubscriptions
        },
        sellersNeedingAttention,
        recentUpdates,
        todayDate: today
      }
    });

  } catch (error) {
    console.error('Error getting meal management dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

/**
 * @desc    Debug method to check seller's meal plans and subscriptions
 * @route   GET /api/admin/meal-edit/seller/:sellerId/debug
 * @access  Private (Admin only)
 */
exports.debugSellerData = async (req, res) => {
  try {
    const { sellerId } = req.params;
    console.log(`[DEBUG] Checking data for seller: ${sellerId}`);

    // Check if seller exists
    const seller = await User.findById(sellerId).select('name email businessName role');
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Get all meal plans for this seller
    const mealPlans = await MealPlan.find({ seller: sellerId })
      .select('title tier pricing description _id')
      .lean();

    // Get all subscriptions for this seller
    const subscriptions = await Subscription.find({ sellerId })
      .populate('mealPlan', 'title tier')
      .select('user status shift startDate endDate mealPlan')
      .lean();

    // Get existing SellerMealPlan records
    const sellerMealPlans = await SellerMealPlan.find({ sellerId })
      .select('tier shiftMeals stats')
      .lean();

    // Extract unique tiers from meal plans
    const tiersFromMealPlans = [...new Set(mealPlans.map(plan => plan.tier))].filter(t => t);
    
    // Extract unique tiers from subscriptions
    const tiersFromSubscriptions = [...new Set(subscriptions.map(sub => sub.mealPlan?.tier))].filter(t => t);

    const debugInfo = {
      seller,
      mealPlans: {
        count: mealPlans.length,
        data: mealPlans,
        tiers: tiersFromMealPlans
      },
      subscriptions: {
        count: subscriptions.length,
        data: subscriptions.slice(0, 5), // Limit to first 5 for readability
        totalCount: subscriptions.length,
        tiers: tiersFromSubscriptions,
        byStatus: subscriptions.reduce((acc, sub) => {
          acc[sub.status] = (acc[sub.status] || 0) + 1;
          return acc;
        }, {})
      },
      sellerMealPlans: {
        count: sellerMealPlans.length,
        data: sellerMealPlans
      },
      analysis: {
        hasBasicTier: tiersFromMealPlans.includes('basic'),
        availableTiers: tiersFromMealPlans,
        mealPlansExist: mealPlans.length > 0,
        subscriptionsExist: subscriptions.length > 0,
        sellerMealPlansExist: sellerMealPlans.length > 0
      }
    };

    console.log(`[DEBUG] Seller ${sellerId} analysis:`, debugInfo.analysis);

    res.status(200).json({
      success: true,
      data: debugInfo
    });

  } catch (error) {
    console.error('[DEBUG] Error checking seller data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch debug data',
      error: error.message
    });
  }
};

/**
 * @desc    Create default meal plans for a seller if they don't exist
 * @route   POST /api/admin/meal-edit/seller/:sellerId/create-default-plans
 * @access  Private (Admin only)
 */
exports.createDefaultMealPlans = async (req, res) => {
  try {
    const { sellerId } = req.params;
    console.log(`Creating default meal plans for seller: ${sellerId}`);

    // Check if seller exists
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Check existing meal plans
    const existingPlans = await MealPlan.find({ seller: sellerId });
    console.log(`Seller has ${existingPlans.length} existing meal plans`);

    if (existingPlans.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Seller already has meal plans',
        data: existingPlans
      });
    }

    // Create default meal plans
    const defaultPlans = [
      {
        title: 'Basic Meal Plan',
        tier: 'basic',
        pricing: { oneDay: 75, tenDays: 700, thirtyDays: 2000 },
        description: 'Basic daily meals with essential nutrition',
        includes: ['Dal', 'Rice', 'Vegetable', 'Chapati']
      },
      {
        title: 'Premium Meal Plan',
        tier: 'premium',
        pricing: { oneDay: 120, tenDays: 1100, thirtyDays: 3200 },
        description: 'Premium meals with variety and special items',
        includes: ['Paneer/Special Dal', 'Basmati Rice', 'Special Vegetable', 'Butter Naan', 'Raita']
      },
      {
        title: 'Budget Meal Plan',
        tier: 'low',
        pricing: { oneDay: 50, tenDays: 450, thirtyDays: 1300 },
        description: 'Budget-friendly nutritious meals',
        includes: ['Simple Dal', 'Rice', 'Seasonal Vegetable']
      }
    ];

    const createdPlans = [];
    for (const planData of defaultPlans) {
      const mealPlan = new MealPlan({
        ...planData,
        seller: sellerId
      });
      await mealPlan.save();
      createdPlans.push(mealPlan);
      console.log(`Created meal plan: ${planData.title} (${planData.tier})`);
    }

    // Create corresponding SellerMealPlan records
    for (const plan of createdPlans) {
      await SellerMealPlan.getOrCreateSellerMealPlan(sellerId, plan.tier);
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdPlans.length} default meal plans for seller`,
      data: createdPlans
    });

  } catch (error) {
    console.error('Error creating default meal plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create default meal plans',
      error: error.message
    });
  }
};

/**
 * @desc    Get available tiers for a seller
 * @route   GET /api/admin/meal-edit/seller/:sellerId/tiers
 * @access  Private (Admin only)
 */
exports.getSellerAvailableTiers = async (req, res) => {
  try {
    const { sellerId } = req.params;
    console.log(`Getting available tiers for seller: ${sellerId}`);

    // Get available tiers from MealPlan collection
    const availableTiers = await SellerMealPlan.getAvailableTiers(sellerId);
    
    // Get meal plans grouped by tier
    const mealPlansByTier = await SellerMealPlan.getMealPlansByTier(sellerId);
    
    // Get subscription counts for each tier
    const tiersWithCounts = await Promise.all(
      availableTiers.map(async (tier) => {
        const mealPlans = mealPlansByTier[tier] || [];
        const mealPlanIds = mealPlans.map(plan => plan._id);
        
        const totalSubscriptions = await Subscription.countDocuments({
          sellerId,
          mealPlan: { $in: mealPlanIds }
        });
        
        const activeSubscriptions = await Subscription.countDocuments({
          sellerId,
          mealPlan: { $in: mealPlanIds },
          status: 'active'
        });
        
        return {
          tier,
          mealPlans: mealPlans.length,
          totalSubscriptions,
          activeSubscriptions,
          mealPlanDetails: mealPlans
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        availableTiers,
        tiersWithDetails: tiersWithCounts,
        totalTiers: availableTiers.length
      }
    });

  } catch (error) {
    console.error('Error getting seller available tiers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available tiers',
      error: error.message
    });
  }
};

/**
 * @desc    Get seller meal plans with subscription details
 * @route   GET /api/admin/meal-edit/seller/:sellerId/meal-plans
 * @access  Private (Admin only)
 */
exports.getSellerMealPlans = async (req, res) => {
  try {
    const { sellerId } = req.params;
    console.log(`Getting meal plans for seller: ${sellerId}`);

    // Get all actual meal plans for this seller from MealPlan collection
    const mealPlans = await MealPlan.find({ seller: sellerId })
      .select('title tier pricing description imageUrls includes _id')
      .sort({ createdAt: -1 });

    if (mealPlans.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No meal plans found for this seller'
      });
    }

    // For each meal plan, get subscription details and current meal configuration
    const mealPlansWithDetails = await Promise.all(
      mealPlans.map(async (mealPlan) => {
        // Find subscriptions for this specific meal plan
        const subscriptions = await Subscription.find({
          sellerId,
          mealPlan: mealPlan._id
        })
          .populate('user', 'name email phone')
          .select('user status shift startDate endDate todayMeal mealPlan')
          .sort({ createdAt: -1 });

        // Count active subscriptions for this meal plan
        const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;

        // Get or create SellerMealPlan for this tier
        let sellerMealPlan = null;
        try {
          sellerMealPlan = await SellerMealPlan.findOne({
            sellerId,
            tier: mealPlan.tier
          });
          
          if (!sellerMealPlan) {
            sellerMealPlan = await SellerMealPlan.getOrCreateSellerMealPlan(sellerId, mealPlan.tier);
          }
        } catch (error) {
          console.error(`Error getting seller meal plan for tier ${mealPlan.tier}:`, error);
        }

        return {
          ...mealPlan.toObject(),
          subscriptions,
          activeSubscriptionCount: activeSubscriptions,
          totalSubscriptionCount: subscriptions.length,
          currentMealConfiguration: sellerMealPlan?.shiftMeals || null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: mealPlansWithDetails,
      totalMealPlans: mealPlans.length,
      sellerId
    });

  } catch (error) {
    console.error('Error getting seller meal plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller meal plans',
      error: error.message
    });
  }
};

/**
 * @desc    Update seller meal plan by tier (dynamic tier validation)
 * @route   PUT /api/admin/meal-edit/seller/:sellerId/tier/:tier/meal
 * @access  Private (Admin only)
 */
exports.updateSellerMealPlanByTier = async (req, res) => {
  try {
    const { sellerId, tier } = req.params;
    const { items, mealType, isAvailable } = req.body;
    const adminId = req.user._id;

    console.log(`Updating meal plan for seller: ${sellerId}, tier: ${tier}`);

    // Dynamically validate tier - check if seller has meal plans with this tier
    const mealPlansWithTier = await MealPlan.find({ seller: sellerId, tier });
    console.log(`Found ${mealPlansWithTier.length} meal plans for seller ${sellerId} with tier ${tier}`);
    
    if (mealPlansWithTier.length === 0) {
      // Let's check what tiers are available for this seller
      const availableTiers = await MealPlan.distinct('tier', { seller: sellerId });
      console.log(`Available tiers for seller ${sellerId}:`, availableTiers);
      
      return res.status(400).json({
        success: false,
        message: `No meal plans found for tier "${tier}". Available tiers: ${availableTiers.join(', ')}`,
        availableTiers
      });
    }

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Meal items are required and must be a non-empty array'
      });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.name || !item.name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Each meal item must have a name'
        });
      }
    }

    // Get or create seller meal plan
    const sellerMealPlan = await SellerMealPlan.getOrCreateSellerMealPlan(sellerId, tier);

    // Update the meal plan
    await sellerMealPlan.updateTodayMeal({
      items: items.map(item => ({
        name: item.name.trim(),
        description: item.description || '',
        quantity: item.quantity || '1 serving'
      })),
      mealType: mealType || 'lunch',
      isAvailable: isAvailable !== undefined ? isAvailable : true
    }, adminId);

    // Get updated plan with populated data
    const updatedPlan = await SellerMealPlan.findOne({ sellerId, tier })
      .populate('sellerId', 'name email');

    // Count affected subscriptions
    const mealPlans = await MealPlan.find({ seller: sellerId, tier });
    const mealPlanIds = mealPlans.map(plan => plan._id);
    
    const affectedSubscriptions = await Subscription.countDocuments({
      sellerId,
      mealPlan: { $in: mealPlanIds },
      status: 'active'
    });

    res.status(200).json({
      success: true,
      data: updatedPlan,
      affectedSubscriptions,
      message: `Meal updated for ${affectedSubscriptions} active subscriptions`
    });

  } catch (error) {
    console.error('Error updating seller meal plan by tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meal plan',
      error: error.message
    });
  }
};

/**
 * @desc    Update seller meal plan by tier and shift (dynamic tier validation)
 * @route   PUT /api/admin/meal-edit/seller/:sellerId/tier/:tier/shift/:shift/meal
 * @access  Private (Admin only)
 */
exports.updateSellerMealPlanByTierAndShift = async (req, res) => {
  try {
    const { sellerId, tier, shift } = req.params;
    const { items, mealType, isAvailable } = req.body;
    const adminId = req.user._id;

    console.log(`Updating meal plan for seller: ${sellerId}, tier: ${tier}, shift: ${shift}`);

    // Dynamically validate tier - check if seller has meal plans with this tier
    const mealPlansWithTier = await MealPlan.find({ seller: sellerId, tier });
    console.log(`Found ${mealPlansWithTier.length} meal plans for seller ${sellerId} with tier ${tier}`);
    
    if (mealPlansWithTier.length === 0) {
      // Let's check what tiers are available for this seller
      const availableTiers = await MealPlan.distinct('tier', { seller: sellerId });
      console.log(`Available tiers for seller ${sellerId}:`, availableTiers);
      
      return res.status(400).json({
        success: false,
        message: `No meal plans found for tier "${tier}". Available tiers: ${availableTiers.join(', ')}`,
        availableTiers
      });
    }

    // Validate shift
    if (!['morning', 'evening'].includes(shift)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shift. Must be morning or evening'
      });
    }

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Meal items are required and must be a non-empty array'
      });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.name || !item.name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Each meal item must have a name'
        });
      }
    }

    // Get or create seller meal plan
    const sellerMealPlan = await SellerMealPlan.getOrCreateSellerMealPlan(sellerId, tier);

    // Update the shift-specific meal plan
    await sellerMealPlan.updateShiftMeal(shift, {
      items: items.map(item => ({
        name: item.name.trim(),
        description: item.description || '',
        quantity: item.quantity || '1 serving'
      })),
      mealType: mealType || (shift === 'morning' ? 'lunch' : 'dinner'),
      isAvailable: isAvailable !== undefined ? isAvailable : true
    }, adminId);

    // Get updated plan with populated data
    const updatedPlan = await SellerMealPlan.findOne({ sellerId, tier })
      .populate('sellerId', 'name email');

    // Count affected subscriptions for this shift
    const mealPlans = await MealPlan.find({ seller: sellerId, tier });
    const mealPlanIds = mealPlans.map(plan => plan._id);
    
    const affectedSubscriptions = await Subscription.countDocuments({
      sellerId,
      mealPlan: { $in: mealPlanIds },
      status: 'active',
      startShift: shift
    });

    res.status(200).json({
      success: true,
      data: updatedPlan,
      affectedSubscriptions,
      shift,
      message: `${shift} shift meal updated for ${affectedSubscriptions} active subscriptions`
    });

  } catch (error) {
    console.error('Error updating seller meal plan by tier and shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shift meal plan',
      error: error.message
    });
  }
};

/**
 * @desc    Get seller meal plan by tier and shift (dynamic tier validation)
 * @route   GET /api/admin/meal-edit/seller/:sellerId/tier/:tier/shift/:shift
 * @access  Private (Admin only)
 */
exports.getSellerMealPlanByTierAndShift = async (req, res) => {
  try {
    const { sellerId, tier, shift } = req.params;

    console.log(`Getting meal plan for seller: ${sellerId}, tier: ${tier}, shift: ${shift}`);

    // Dynamically validate tier - check if seller has meal plans with this tier
    const mealPlansWithTier = await MealPlan.find({ seller: sellerId, tier });
    console.log(`Found ${mealPlansWithTier.length} meal plans for seller ${sellerId} with tier ${tier}`);
    
    if (mealPlansWithTier.length === 0) {
      // Let's check what tiers are available for this seller
      const availableTiers = await MealPlan.distinct('tier', { seller: sellerId });
      console.log(`Available tiers for seller ${sellerId}:`, availableTiers);
      
      return res.status(400).json({
        success: false,
        message: `No meal plans found for tier "${tier}". Available tiers: ${availableTiers.join(', ')}`,
        availableTiers
      });
    }

    if (!['morning', 'evening'].includes(shift)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shift. Must be morning or evening'
      });
    }

    // Get or create seller meal plan
    const sellerMealPlan = await SellerMealPlan.getOrCreateSellerMealPlan(sellerId, tier);
    
    // Get shift-specific meal data
    const shiftMeal = sellerMealPlan.shiftMeals?.[shift] || {
      items: [],
      mealType: shift === 'morning' ? 'lunch' : 'dinner',
      isAvailable: true
    };

    // Count subscriptions for this shift
    const mealPlans = await MealPlan.find({ seller: sellerId, tier });
    const mealPlanIds = mealPlans.map(plan => plan._id);
    
    const shiftSubscriptions = await Subscription.countDocuments({
      sellerId,
      mealPlan: { $in: mealPlanIds },
      status: 'active',
      startShift: shift
    });

    res.status(200).json({
      success: true,
      data: {
        sellerId,
        tier,
        shift,
        meal: shiftMeal,
        subscriptionCount: shiftSubscriptions,
        sellerName: sellerMealPlan.sellerId?.name || 'Unknown'
      }
    });

  } catch (error) {
    console.error('Error getting seller meal plan by tier and shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift meal plan',
      error: error.message
    });
  }
};
