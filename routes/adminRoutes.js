const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bhandara = require('../models/Bhandara');
const { authenticate,authorize } = require('../middlewares/auth');
const {
  getDailySubscriptionMeals,
  updateDailyMealStatus,
  exportDailyMeals,
  getDailyMealStats,
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getMealPlanById,
  toggleMealPlanStatus,
  getUserDailyMeals
} = require('../controllers/adminController');
// Import admin meal routes
const adminMealRoutes = require('./adminMealRoutes');

// Get all users for admin notification selection
router.get('/users',authenticate, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({}, 'name email role pushSubscriptions createdAt')
      .sort({ createdAt: -1 })
      .limit(1000); // Limit to prevent performance issues

    // Add subscription count for each user
    const usersWithSubscriptionCount = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscriptionCount: user.pushSubscriptions?.length || 0,
      hasSubscriptions: (user.pushSubscriptions?.length || 0) > 0,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      users: usersWithSubscriptionCount,
      total: usersWithSubscriptionCount.length,
      usersWithSubscriptions: usersWithSubscriptionCount.filter(u => u.hasSubscriptions).length
    });

  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get user statistics for admin dashboard
router.get('/user-stats',  authorize("admin"), async (req, res) => {
  try {
    const [
      totalUsers,
      usersWithSubscriptions,
      usersByRole,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ pushSubscriptions: { $exists: true, $not: { $size: 0 } } }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.find({}, 'name email createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        usersWithSubscriptions,
        subscriptionRate: totalUsers > 0 ? ((usersWithSubscriptions / totalUsers) * 100).toFixed(1) : 0,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentUsers
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
});

// Mount meal editing routes
router.use('/meal-edit', adminMealRoutes);


// Daily meals management routes
router.get('/daily-subscription-meals', authenticate, authorize("admin"), getDailySubscriptionMeals);
router.patch('/daily-meals/:mealId/status', authenticate, authorize("admin"), updateDailyMealStatus);
router.get('/daily-meals/export', authenticate, authorize("admin"), exportDailyMeals);
router.get('/daily-meals/stats', authenticate, authorize("admin"), getDailyMealStats);

// Meal Plans Management Routes
router.get('/meal-plans', authenticate, authorize("admin"), getMealPlans);
router.post('/meal-plans', authenticate, authorize("admin"), createMealPlan);
router.get('/meal-plans/:id', authenticate, authorize("admin"), getMealPlanById);
router.put('/meal-plans/:id', authenticate, authorize("admin"), updateMealPlan);
router.delete('/meal-plans/:id', authenticate, authorize("admin"), deleteMealPlan);
router.patch('/meal-plans/:id/toggle-status', authenticate, authorize("admin"), toggleMealPlanStatus);

// Add this temporary debug route to see your schema structure
router.get('/debug/meal-plan-schema', authenticate, authorize("admin"), async (req, res) => {
  try {
    // Get a sample meal plan to see the structure
    const sampleMealPlan = await MealPlan.findOne();
    
    if (sampleMealPlan) {
      res.json({
        success: true,
        sampleData: sampleMealPlan.toObject(),
        schemaFields: Object.keys(sampleMealPlan.toObject()),
        schemaDefinition: MealPlan.schema.paths
      });
    } else {
      res.json({
        success: true,
        message: 'No meal plans found',
        schemaDefinition: MealPlan.schema.paths
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's daily meals
router.get('/users/:userId/daily-meals', authenticate, authorize("admin"), getUserDailyMeals);

// =================== BHANDARA ADMIN ROUTES ===================

// Get all Bhandaras for admin (including pending ones)
router.get('/bhandaras', authenticate, authorize("admin"), async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    
    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const bhandaras = await Bhandara.find(query)
      .sort({ createdAt: -1 }) // Latest first
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('createdBy', 'name email phone')
      .lean();

    const total = await Bhandara.countDocuments(query);

    // Get counts by status
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      Bhandara.countDocuments({ status: 'pending' }),
      Bhandara.countDocuments({ status: 'approved' }),
      Bhandara.countDocuments({ status: 'rejected' })
    ]);

    res.json({
      success: true,
      data: bhandaras,
      total,
      hasMore: (parseInt(skip) + bhandaras.length) < total,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount
      }
    });
  } catch (error) {
    console.error('Error fetching Bhandaras for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Bhandaras',
      error: error.message
    });
  }
});

// Get Bhandara by ID for admin (any status)
router.get('/bhandaras/:id', authenticate, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const bhandara = await Bhandara.findById(id)
      .populate('createdBy', 'name email phone');

    if (!bhandara) {
      return res.status(404).json({
        success: false,
        message: 'Bhandara not found'
      });
    }

    res.json({
      success: true,
      data: bhandara
    });
  } catch (error) {
    console.error('Error fetching Bhandara for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Bhandara',
      error: error.message
    });
  }
});

// Approve Bhandara
router.put('/bhandaras/:id/approve', authenticate, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;

    const bhandara = await Bhandara.findByIdAndUpdate(
      id,
      { 
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        adminNote: adminNote || '',
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('createdBy', 'name email phone');

    if (!bhandara) {
      return res.status(404).json({
        success: false,
        message: 'Bhandara not found'
      });
    }

    res.json({
      success: true,
      message: 'Bhandara approved successfully',
      data: bhandara
    });
  } catch (error) {
    console.error('Error approving Bhandara:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving Bhandara',
      error: error.message
    });
  }
});

// Reject Bhandara
router.put('/bhandaras/:id/reject', authenticate, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, adminNote } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const bhandara = await Bhandara.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        rejectedBy: req.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason,
        adminNote: adminNote || '',
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('createdBy', 'name email phone');

    if (!bhandara) {
      return res.status(404).json({
        success: false,
        message: 'Bhandara not found'
      });
    }

    res.json({
      success: true,
      message: 'Bhandara rejected successfully',
      data: bhandara
    });
  } catch (error) {
    console.error('Error rejecting Bhandara:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting Bhandara',
      error: error.message
    });
  }
});

// Revert Bhandara status to pending
router.put('/bhandaras/:id/revert', authenticate, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const bhandara = await Bhandara.findByIdAndUpdate(
      id,
      { 
        status: 'pending',
        approvedBy: null,
        rejectedBy: null,
        approvedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        adminNote: null,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!bhandara) {
      return res.status(404).json({
        success: false,
        message: 'Bhandara not found'
      });
    }

    res.json({
      success: true,
      message: 'Bhandara reverted to pending status',
      data: bhandara
    });
  } catch (error) {
    console.error('Error reverting Bhandara status:', error);
    res.status(500).json({
      success: false,
      message: 'Error reverting Bhandara status',
      error: error.message
    });
  }
});

// Bulk approve Bhandaras
router.put('/bhandaras/bulk/approve', authenticate, authorize("admin"), async (req, res) => {
  try {
    const { ids, adminNote } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bhandara IDs array is required'
      });
    }

    const result = await Bhandara.updateMany(
      { _id: { $in: ids }, status: 'pending' },
      { 
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        adminNote: adminNote || '',
        updatedAt: Date.now()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} Bhandaras approved successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk approving Bhandaras:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk approving Bhandaras',
      error: error.message
    });
  }
});

// Delete Bhandara (soft delete by setting isActive to false)
router.delete('/bhandaras/:id', authenticate, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const bhandara = await Bhandara.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        deletedBy: req.user.id,
        deletedAt: new Date(),
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!bhandara) {
      return res.status(404).json({
        success: false,
        message: 'Bhandara not found'
      });
    }

    res.json({
      success: true,
      message: 'Bhandara deleted successfully',
      data: bhandara
    });
  } catch (error) {
    console.error('Error deleting Bhandara:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting Bhandara',
      error: error.message
    });
  }
});

// Get Bhandara statistics for admin dashboard
router.get('/bhandaras/stats/overview', authenticate, authorize("admin"), async (req, res) => {
  try {
    const [
      totalBhandaras,
      pendingBhandaras,
      approvedBhandaras,
      rejectedBhandaras,
      todaySubmissions,
      upcomingEvents
    ] = await Promise.all([
      Bhandara.countDocuments({ isActive: true }),
      Bhandara.countDocuments({ status: 'pending', isActive: true }),
      Bhandara.countDocuments({ status: 'approved', isActive: true }),
      Bhandara.countDocuments({ status: 'rejected', isActive: true }),
      Bhandara.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        },
        isActive: true
      }),
      Bhandara.countDocuments({
        status: 'approved',
        dateTimeStart: { $gte: new Date() },
        isActive: true
      })
    ]);

    res.json({
      success: true,
      stats: {
        total: totalBhandaras,
        pending: pendingBhandaras,
        approved: approvedBhandaras,
        rejected: rejectedBhandaras,
        todaySubmissions,
        upcomingEvents
      }
    });
  } catch (error) {
    console.error('Error fetching Bhandara stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Toggle Bhandara verification status
router.put('/bhandaras/:id/verify', authenticate, authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const updateData = {
      isVerified: !!isVerified,
      updatedAt: Date.now()
    };

    if (isVerified) {
      updateData.verifiedBy = req.user.id;
      updateData.verifiedAt = new Date();
    } else {
      updateData.verifiedBy = null;
      updateData.verifiedAt = null;
    }

    const bhandara = await Bhandara.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!bhandara) {
      return res.status(404).json({
        success: false,
        message: 'Bhandara not found'
      });
    }

    res.json({
      success: true,
      message: `Bhandara ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: bhandara
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating verification status',
      error: error.message
    });
  }
});

module.exports = router;