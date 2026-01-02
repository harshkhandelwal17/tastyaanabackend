const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  getAdminDailyDeliveries,
  getDeliveryStats,
  getDeliveryFilters,
  adminSkipMeal,
  adminCustomizeMeal,
  updateDeliveryStatus,
  getDeliveryDetails,
  testAdminDelivery
} = require('../controllers/adminDeliveryController');

/**
 * @desc    Test endpoint
 * @route   GET /api/admin/deliveries/test
 * @access  Public (for testing)
 */
router.get('/test', testAdminDelivery);

/**
 * @desc    Get all daily deliveries with filtering (temporarily without auth for testing)
 * @route   GET /api/admin/deliveries/no-auth-test
 * @access  Public (for testing)
 */
router.get('/no-auth-test', (req, res, next) => {
  console.log('🔥 Admin delivery route hit!', req.url, req.query);
  next();
}, getAdminDailyDeliveries);

/**
 * @desc    Get all daily deliveries with filtering
 * @route   GET /api/admin/deliveries
 * @access  Private (Admin only)
 */
router.get('/', [
  authenticate,
  authorize(['admin'])
], (req, res, next) => {
  console.log('🔥 Admin delivery route hit!', req.url, req.query);
  next();
}, getAdminDailyDeliveries);

/**
 * @desc    Get delivery statistics
 * @route   GET /api/admin/deliveries/stats
 * @access  Private (Admin only)
 */
router.get('/stats', [
  authenticate,
  authorize(['admin'])
], async (req, res) => {
  try {
    const { date, zone, driverId, sellerId } = req.query;
    
    // Build filter based on query params
    const filter = {};
    if (date && date !== 'all') {
      const moment = require('moment-timezone');
      const startDate = moment.tz(date, 'Asia/Kolkata').startOf('day').toDate();
      const endDate = moment.tz(date, 'Asia/Kolkata').endOf('day').toDate();
      filter.date = { $gte: startDate, $lte: endDate };
    }
    if (zone && zone !== 'all') filter.zone = zone;
    if (driverId && driverId !== 'all') filter.driverId = new require('mongoose').Types.ObjectId(driverId);
    if (sellerId && sellerId !== 'all') {
      // This would require a more complex aggregation
      // For now, we'll handle it in the main stats function
    }
    
    const { getDeliveryStats } = require('../controllers/adminDeliveryController');
    const stats = await getDeliveryStats(filter);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting delivery stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery stats',
      error: error.message
    });
  }
});

/**
 * @desc    Get filter options for admin deliveries
 * @route   GET /api/admin/deliveries/filters
 * @access  Private (Admin only)
 */
router.get('/filters', [
  authenticate,
  authorize(['admin'])
], getDeliveryFilters);

/**
 * @desc    Get delivery details
 * @route   GET /api/admin/deliveries/:deliveryId
 * @access  Private (Admin only)
 */
router.get('/:deliveryId', [
  authenticate,
  authorize(['admin'])
], getDeliveryDetails);

/**
 * @desc    Admin skip meal for user by subscription
 * @route   POST /api/admin/deliveries/subscriptions/:subscriptionId/skip
 * @access  Private (Admin only)
 */
router.post('/subscriptions/:subscriptionId/skip', [
  authenticate,
  authorize(['admin'])
], adminSkipMeal);

/**
 * @desc    Admin skip meal for user
 * @route   POST /api/admin/deliveries/:deliveryId/skip
 * @access  Private (Admin only)
 */
router.post('/:deliveryId/skip', [
  authenticate,
  authorize(['admin'])
], adminSkipMeal);

/**
 * @desc    Admin customize meal for user
 * @route   POST /api/admin/deliveries/:deliveryId/customize
 * @access  Private (Admin only)
 */
router.post('/:deliveryId/customize', [
  authenticate,
  authorize(['admin'])
], adminCustomizeMeal);

/**
 * @desc    Update delivery status
 * @route   PUT /api/admin/deliveries/:deliveryId/status
 * @access  Private (Admin only)
 */
router.put('/:deliveryId/status', [
  authenticate,
  authorize(['admin'])
], updateDeliveryStatus);

/**
 * @desc    Bulk update delivery status
 * @route   PUT /api/admin/deliveries/bulk/status
 * @access  Private (Admin only)
 */
router.put('/bulk/status', [
  authenticate,
  authorize(['admin'])
], async (req, res) => {
  try {
    const { deliveryIds, status, notes = '', notifyUsers = true } = req.body;
    
    if (!deliveryIds || !Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Delivery IDs are required'
      });
    }
    
    const validStatuses = ['pending', 'delivered', 'skipped', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const DailyMealDelivery = require('../models/DailyMealDelivery');
    const { createNotification } = require('../utils/notificationService');
    const moment = require('moment-timezone');
    
    // Update all deliveries
    const updateData = {
      status: status,
      notes: notes
    };
    
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }
    
    const result = await DailyMealDelivery.updateMany(
      { _id: { $in: deliveryIds } },
      updateData
    );
    
    // Send notifications if requested
    if (notifyUsers) {
      try {
        const deliveries = await DailyMealDelivery.find({ _id: { $in: deliveryIds } })
          .populate({
            path: 'subscriptionId',
            populate: {
              path: 'user',
              select: '_id name'
            }
          })
          .select('date shift subscriptionId');
        
        const notifications = deliveries
          .filter(d => d.subscriptionId?.user)
          .map(delivery => {
            const dateStr = moment.tz(delivery.date, 'Asia/Kolkata').format('YYYY-MM-DD');
            return createNotification({
              userId: delivery.subscriptionId.user._id,
              type: 'general',
              title: `Delivery ${status.charAt(0).toUpperCase() + status.slice(1)}`,
              message: `Your ${delivery.shift} meal for ${dateStr} is now ${status}${notes ? `. Note: ${notes}` : ''}`,
              data: {
                deliveryId: delivery._id,
                subscriptionId: delivery.subscriptionId._id,
                date: dateStr,
                shift: delivery.shift,
                status: status
              }
            });
          });
        
        await Promise.allSettled(notifications);
      } catch (notificationError) {
        console.error('Error sending bulk notifications:', notificationError);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} deliveries updated successfully`,
      data: {
        updatedCount: result.modifiedCount,
        totalRequested: deliveryIds.length,
        status: status
      }
    });
    
  } catch (error) {
    console.error('Error bulk updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery status',
      error: error.message
    });
  }
});

/**
 * @desc    Bulk skip meals
 * @route   POST /api/admin/deliveries/bulk/skip
 * @access  Private (Admin only)
 */
router.post('/bulk/skip', [
  authenticate,
  authorize(['admin'])
], async (req, res) => {
  try {
    const { deliveryIds, reason = 'Bulk admin skip', notifyUsers = true } = req.body;
    
    if (!deliveryIds || !Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Delivery IDs are required'
      });
    }
    
    const DailyMealDelivery = require('../models/DailyMealDelivery');
    const Subscription = require('../models/Subscription');
    const { createNotification } = require('../utils/notificationService');
    const moment = require('moment-timezone');
    
    // Get deliveries with subscription and user data
    const deliveries = await DailyMealDelivery.find({ _id: { $in: deliveryIds } })
      .populate({
        path: 'subscriptionId',
        populate: {
          path: 'user',
          select: '_id name email'
        }
      });
    
    const updatePromises = deliveries.map(async (delivery) => {
      if (delivery.status === 'skipped') {
        return { success: false, deliveryId: delivery._id, message: 'Already skipped' };
      }
      
      try {
        // Update delivery
        delivery.status = 'skipped';
        delivery.notes = reason;
        delivery.skippedAt = new Date();
        delivery.skippedBy = 'admin';
        await delivery.save();
        
        // Update subscription
        const subscription = delivery.subscriptionId;
        const skipEntry = {
          date: delivery.date,
          shift: delivery.shift,
          reason: reason,
          skippedAt: new Date(),
          skippedBy: 'admin'
        };
        
        if (!subscription.skipMeals) {
          subscription.skipMeals = [];
        }
        subscription.skipMeals.push(skipEntry);
        await subscription.save();
        
        // Send notification
        if (notifyUsers && subscription.user) {
          const skipDate = moment.tz(delivery.date, 'Asia/Kolkata').format('YYYY-MM-DD');
          await createNotification({
            userId: subscription.user._id,
            type: 'general',
            title: 'Meal Skipped',
            message: `Your ${delivery.shift} meal for ${skipDate} has been skipped. Reason: ${reason}`,
            data: {
              subscriptionId: subscription._id,
              deliveryId: delivery._id,
              date: skipDate,
              shift: delivery.shift
            }
          });
        }
        
        return { success: true, deliveryId: delivery._id };
      } catch (error) {
        console.error(`Error skipping delivery ${delivery._id}:`, error);
        return { success: false, deliveryId: delivery._id, error: error.message };
      }
    });
    
    const results = await Promise.allSettled(updatePromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    res.status(200).json({
      success: true,
      message: `${successCount} meals skipped successfully`,
      data: {
        successCount,
        totalRequested: deliveryIds.length,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
      }
    });
    
  } catch (error) {
    console.error('Error bulk skipping meals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip meals',
      error: error.message
    });
  }
});

module.exports = router;