const mongoose = require('mongoose');
const DailyMealDelivery = require('../models/DailyMealDelivery');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const MealPlan = require('../models/MealPlan');
const moment = require('moment-timezone');

// ===================================================================
// SELLER DAILY MEAL DELIVERY MANAGEMENT
// ===================================================================

/**
 * Get seller's daily meal deliveries with filtering
 */
// const getSellerDailyDeliveries = async (req, res) => {
//   try {
//     const { sellerId } = req.params;
//     const {
//       date,
//       shift,
//       status = "active",
//       userId,
//       page = 1,
//       limit = 500
//     } = req.query;

//     // Build query
//     const query = { seller: sellerId };
//     console.log("seller id is : ",sellerId);
//     // Date filter
//     if (date) {
//       const startDate = moment(date).startOf('day').toDate();
//       const endDate = moment(date).endOf('day').toDate();
//       query.deliveryDate = { $gte: startDate, $lte: endDate };
//     } else {
//       // Default to today if no date specified
//       const today = moment().startOf('day').toDate();
//       const endOfDay = moment().endOf('day').toDate();
//       query.deliveryDate = { $gte: today, $lte: endOfDay };
//     }
    
//     // Shift filter
//     if (shift && ['morning', 'evening'].includes(shift)) {
//       query.shift = shift;
//     }
    
//     // Status filter
//     if (status) {
//       query.status = status;
//     }
    
//     // User filter
//     if (userId) {
//       query.user = userId;
//     }

//     const skip = (page - 1) * limit;
//     console.log("query is : ", query);
//     // Get deliveries with populated data
//     const deliveries = await DailyMealDelivery.find(query)
//       .populate('user', 'name phone address profileImage')
//       .populate('mealPlan', 'name image price category')
//       .populate('subscription', 'subscriptionId shift planType')
//       .sort({ deliveryDate: 1, shift: 1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const totalCount = await DailyMealDelivery.countDocuments(query);
    
//     // Group by shift for better organization
//     const groupedDeliveries = {
//       morning: deliveries.filter(d => d.shift === 'morning'),
//       evening: deliveries.filter(d => d.shift === 'evening')
//     };

//     res.status(200).json({
//       success: true,
//       data: {
//         deliveries: groupedDeliveries,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(totalCount / limit),
//           totalCount,
//           hasNext: page * limit < totalCount,
//           hasPrev: page > 1
//         },
//         summary: {
//           total: totalCount,
//           morning: groupedDeliveries.morning.length,
//           evening: groupedDeliveries.evening.length,
//           byStatus: await getDailyStatusSummary(sellerId, date)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('❌ Error fetching seller daily deliveries:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch daily deliveries',
//       error: error.message
//     });
//   }
// };

async function getSellerDailyDeliveries(req, res) {
  try {
    const { sellerId } = req.params;
    const {
      date,
      shift,
      status = "active",
      userId,
      page = 1,
      limit = 500,
    } = req.query;

    const deliveryDate = moment(date).startOf("day").toDate();
    console.log("Requested date:", deliveryDate);

    // 🔹 Lean = plain JS objects
    const subscriptions = await Subscription.find({
      // "items.seller": sellerId,
      isActive: true,
      status: status,
      startDate: { $lte: deliveryDate },
      endDate: { $gte: deliveryDate },
    }).lean();
    console.log("subscriptions are : ", subscriptions);
    const validDeliveries = [];

    for (const sub of subscriptions) {
      // 1. Check pause dates
      const isPaused = sub.pausedDates?.some((pause) =>
        moment(deliveryDate).isBetween(
          moment(pause.startDate),
          moment(pause.endDate),
          "day",
          "[]"
        )
      );
      console.log("is paused : ", isPaused);
      if (isPaused) continue;

      // 2. Check if today is allowed delivery day
      const todayDay = moment(deliveryDate).format("dddd").toLowerCase();
      const deliversToday = sub.deliverySettings?.deliveryDays?.some(
        (d) => d.day.toLowerCase() === todayDay 
      );
      console.log("is todayDay : ", todayDay);

      console.log("is deliversToday : ", deliversToday);

      if (!deliversToday) continue;

      // 3. Skipped meals
      // const skipped = sub.skippedMeals?.some(
      //   (s) =>
      //     moment(s.date).isSame(deliveryDate, "day") &&
      //     (s.shift === shift || s.shift === "both")
      // );
      // console.log("is skipped : ", skipped);

      // if (!skipped) continue;

      // 4. Shift check
      if (sub.shift !== "both" && sub.shift !== shift) continue;

      // 5. Remaining meals
      if (sub.mealCounts?.mealsRemaining <= 0) continue;

      // 6. Daily deductions
      // const deduction = sub.dailyDeductions?.find(
      //   (d) =>
      //     moment(d.date).isSame(deliveryDate, "day") &&
      //     (d.shift === shift || d.shift === "both")
      // );
      // console.log("is deduction : ", deduction);

      // if (deduction && deduction.status !== "deducted") continue;

      // ✅ Passed all checks
      validDeliveries.push({
        subscriptionId: sub._id?.toString(),
        user: sub.user?.toString(),
        items: sub,
          // // .filter((i) => i.seller.toString() === sellerId.toString())
          // .map((i) => ({
          //   ...i,
          //   // seller: i.seller?.toString(), // force plain string
          // })),
        shift,
        deliveryDate,
      });
    }

    // 🔹 Ensure safe JSON (no BSON circular)
    return res.status(200).json({
      success: true,
      total: validDeliveries.length,
      data: validDeliveries,
    });
  } catch (err) {
    console.error("Error in getSellerDailyDeliveries:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching seller deliveries",
      error: err.message,
    });
  }
}

module.exports = { getSellerDailyDeliveries };




/**
 * Update delivery status
 */
const updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, notes, deliveryImage } = req.body;
    const sellerId = req.user.id; // Assuming seller is authenticated

    const delivery = await DailyMealDelivery.findById(deliveryId);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery record not found'
      });
    }

    // Verify seller ownership
    if (delivery.seller.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this delivery'
      });
    }

    // Update delivery status and tracking
    const updateData = {
      status,
      updatedAt: new Date()
    };

    // Update seller actions
    if (status === 'ready') {
      updateData['sellerActions.markedReadyAt'] = new Date();
      updateData['sellerActions.markedReadyBy'] = sellerId;
      updateData['deliveryTracking.readyAt'] = new Date();
    } else if (status === 'delivered') {
      updateData['sellerActions.deliveryConfirmedAt'] = new Date();
      updateData['sellerActions.deliveryConfirmedBy'] = sellerId;
      updateData['deliveryTracking.deliveredAt'] = new Date();
      if (deliveryImage) {
        updateData['deliveryTracking.deliveryImage'] = deliveryImage;
      }
    } else if (status === 'preparing') {
      updateData['deliveryTracking.preparedAt'] = new Date();
    }

    if (notes) {
      updateData['sellerActions.notes'] = notes;
      updateData['deliveryTracking.deliveryNotes'] = notes;
    }

    const updatedDelivery = await DailyMealDelivery.findByIdAndUpdate(
      deliveryId,
      updateData,
      { new: true }
    ).populate('user', 'name phone')
     .populate('mealPlan', 'name');

    res.status(200).json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: updatedDelivery
    });

  } catch (error) {
    console.error('❌ Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery status',
      error: error.message
    });
  }
};

/**
 * Bulk update delivery statuses
 */
const bulkUpdateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryIds, status, notes } = req.body;
    const sellerId = req.user.id;

    if (!deliveryIds || !Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Delivery IDs are required'
      });
    }

    // Verify all deliveries belong to the seller
    const deliveries = await DailyMealDelivery.find({
      _id: { $in: deliveryIds },
      seller: sellerId
    });

    if (deliveries.length !== deliveryIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some deliveries do not belong to this seller'
      });
    }

    // Prepare bulk update
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (status === 'ready') {
      updateData['sellerActions.markedReadyAt'] = new Date();
      updateData['sellerActions.markedReadyBy'] = sellerId;
      updateData['deliveryTracking.readyAt'] = new Date();
    } else if (status === 'delivered') {
      updateData['sellerActions.deliveryConfirmedAt'] = new Date();
      updateData['sellerActions.deliveryConfirmedBy'] = sellerId;
      updateData['deliveryTracking.deliveredAt'] = new Date();
    }

    if (notes) {
      updateData['sellerActions.notes'] = notes;
    }

    const result = await DailyMealDelivery.updateMany(
      { _id: { $in: deliveryIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} deliveries to ${status}`,
      data: {
        updatedCount: result.modifiedCount,
        totalRequested: deliveryIds.length
      }
    });

  } catch (error) {
    console.error('❌ Error bulk updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update delivery status',
      error: error.message
    });
  }
};

/**
 * Get delivery details by ID
 */
const getDeliveryDetails = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    const delivery = await DailyMealDelivery.findById(deliveryId)
      .populate('user', 'name phone address profileImage')
      .populate('seller', 'name businessName phone')
      .populate('mealPlan', 'name image price description category')
      .populate('subscription', 'subscriptionId shift planType pricing');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: delivery
    });

  } catch (error) {
    console.error('❌ Error fetching delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery details',
      error: error.message
    });
  }
};

/**
 * Get seller's delivery statistics
 */
const getSellerDeliveryStats = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate && endDate) {
      dateQuery.deliveryDate = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    } else {
      // Default to current month
      dateQuery.deliveryDate = {
        $gte: moment().startOf('month').toDate(),
        $lte: moment().endOf('month').toDate()
      };
    }

    const stats = await DailyMealDelivery.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          ...dateQuery
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $in: ['$status', ['scheduled', 'preparing', 'ready', 'out_for_delivery']] }, 1, 0] }
          },
          notDeliveredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'not_delivered'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          skippedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: '$mealDetails.totalPrice'
          },
          morningDeliveries: {
            $sum: { $cond: [{ $eq: ['$shift', 'morning'] }, 1, 0] }
          },
          eveningDeliveries: {
            $sum: { $cond: [{ $eq: ['$shift', 'evening'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalDeliveries: 0,
      deliveredCount: 0,
      pendingCount: 0,
      notDeliveredCount: 0,
      cancelledCount: 0,
      skippedCount: 0,
      totalRevenue: 0,
      morningDeliveries: 0,
      eveningDeliveries: 0
    };

    // Calculate delivery rate
    result.deliveryRate = result.totalDeliveries > 0 
      ? ((result.deliveredCount / result.totalDeliveries) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error fetching delivery stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery statistics',
      error: error.message
    });
  }
};

/**
 * Helper function to get daily status summary
 */
const getDailyStatusSummary = async (sellerId, date) => {
  const query = { seller: sellerId };
  
  if (date) {
    const startDate = moment(date).startOf('day').toDate();
    const endDate = moment(date).endOf('day').toDate();
    query.deliveryDate = { $gte: startDate, $lte: endDate };
  }

  const summary = await DailyMealDelivery.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const statusCounts = {};
  summary.forEach(item => {
    statusCounts[item._id] = item.count;
  });

  return statusCounts;
};

/**
 * Create daily meal records for active subscriptions (called by cron job)
 */
const createDailyMealRecords = async (req, res) => {
  try {
    const { date, shift } = req.body;
    const targetDate = date ? moment(date).toDate() : moment().toDate();
    const targetShift = shift || 'morning';

    // Find active subscriptions for the target date and shift
    const subscriptions = await Subscription.find({
      isActive: true,
      'deliverySettings.startDate': { $lte: targetDate },
      endDate: { $gte: targetDate },
      $or: [
        { shift: targetShift },
        { shift: 'both' }
      ]
    }).populate('mealPlan', 'name image price createdBy')
     .populate('user', 'name phone address');

    const createdRecords = [];
    const errors = [];

    for (const subscription of subscriptions) {
      try {
        // Check if record already exists
        const existingRecord = await DailyMealDelivery.findOne({
          subscription: subscription._id,
          deliveryDate: {
            $gte: moment(targetDate).startOf('day').toDate(),
            $lte: moment(targetDate).endOf('day').toDate()
          },
          shift: targetShift
        });

        if (existingRecord) {
          continue; // Skip if already exists
        }

        // Create daily meal record
        const mealRecord = await DailyMealDelivery.createDailyMealRecord(
          subscription,
          targetDate,
          targetShift
        );

        createdRecords.push(mealRecord);

      } catch (error) {
        errors.push({
          subscriptionId: subscription.subscriptionId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Created ${createdRecords.length} daily meal records`,
      data: {
        created: createdRecords.length,
        errors: errors.length,
        errorDetails: errors
      }
    });

  } catch (error) {
    console.error('❌ Error creating daily meal records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create daily meal records',
      error: error.message
    });
  }
};

module.exports = {
  getSellerDailyDeliveries,
  updateDeliveryStatus,
  bulkUpdateDeliveryStatus,
  getDeliveryDetails,
  getSellerDeliveryStats,
  createDailyMealRecords,
  getSellerDailyDeliveries
};
