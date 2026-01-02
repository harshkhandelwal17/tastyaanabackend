const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Delivery Notification Service
 * Handles sending notifications for delivery updates
 */

/**
 * Send notification when a delivery is completed
 * @param {Object} deliveryData - Delivery information
 * @param {Object} driverData - Driver information
 */
exports.sendDeliveryCompletedNotification = async (deliveryData, driverData) => {
  try {
    console.log('Sending delivery completed notifications for:', deliveryData._id);

    // Notification to User
    await createNotification({
      userId: deliveryData.user._id,
      type: 'order_delivered',
      title: 'Meal Delivered Successfully! 🚚',
      body: `Your ${deliveryData.shift} meal "${deliveryData.displayMealName || deliveryData.mealPlan?.name}" has been delivered successfully by ${driverData.name}.`,
      data: {
        deliveryId: deliveryData._id,
        subscriptionId: deliveryData.subscriptionId,
        shift: deliveryData.shift,
        deliveredAt: deliveryData.deliveredAt,
        driverName: driverData.name,
        mealName: deliveryData.displayMealName || deliveryData.mealPlan?.name
      },
      priority: 'high',
      channels: ['push', 'email'] // Send via both push and email
    });

    // Notification to Admin users
    const adminUsers = await User.find({ role: 'admin' });
    
    for (const admin of adminUsers) {
      await createNotification({
        userId: admin._id,
        type: 'general',
        title: 'Delivery Completed',
        body: `Delivery completed for ${deliveryData.user.name} - ${deliveryData.shift} meal "${deliveryData.displayMealName || deliveryData.mealPlan?.name}" delivered by ${driverData.name}.`,
        data: {
          deliveryId: deliveryData._id,
          subscriptionId: deliveryData.subscriptionId,
          userId: deliveryData.user._id,
          userName: deliveryData.user.name,
          shift: deliveryData.shift,
          deliveredAt: deliveryData.deliveredAt,
          driverName: driverData.name,
          mealName: deliveryData.displayMealName || deliveryData.mealPlan?.name
        },
        priority: 'normal',
        channels: ['push', 'dashboard'] // Admin gets dashboard notification
      });
    }

    // Notification to Seller (meal provider)
    if (deliveryData.seller?._id) {
      await createNotification({
        userId: deliveryData.seller._id,
        type: 'delivery_completed_seller',
        title: 'Your Meal Delivered',
        message: `Your ${deliveryData.shift} meal "${deliveryData.displayMealName || deliveryData.mealPlan?.name}" has been delivered to ${deliveryData.user.name}.`,
        data: {
          deliveryId: deliveryData._id,
          subscriptionId: deliveryData.subscriptionId,
          customerName: deliveryData.user.name,
          shift: deliveryData.shift,
          deliveredAt: deliveryData.deliveredAt,
          mealName: deliveryData.displayMealName || deliveryData.mealPlan?.name
        },
        priority: 'normal',
        channels: ['push', 'dashboard']
      });
    }

    console.log('All delivery completion notifications sent successfully');

  } catch (error) {
    console.error('Error sending delivery completion notifications:', error);
    // Don't throw error as notifications are not critical to delivery process
  }
};

/**
 * Send notification when delivery encounters an issue
 * @param {Object} deliveryData - Delivery information
 * @param {Object} driverData - Driver information  
 * @param {String} issueType - Type of issue (e.g., 'customer_unavailable', 'address_issue')
 * @param {String} notes - Additional notes about the issue
 */
exports.sendDeliveryIssueNotification = async (deliveryData, driverData, issueType, notes) => {
  try {
    console.log('Sending delivery issue notifications for:', deliveryData._id);

    // Notification to User
    await createNotification({
      userId: deliveryData.user._id,
      type: 'general',
      title: 'Delivery Update Required',
      body: `There was an issue with your ${deliveryData.shift} meal delivery. Our driver ${driverData.name} will contact you shortly. Issue: ${notes}`,
      data: {
        deliveryId: deliveryData._id,
        subscriptionId: deliveryData.subscriptionId,
        shift: deliveryData.shift,
        issueType: issueType,
        notes: notes,
        driverName: driverData.name,
        driverPhone: driverData.phone
      },
      priority: 'high',
      channels: ['push', 'sms']
    });

    // Notification to Admin
    const adminUsers = await User.find({ role: 'admin' });
    
    for (const admin of adminUsers) {
      await createNotification({
        userId: admin._id,
        type: 'general',
        title: 'Delivery Issue Reported',
        body: `Delivery issue for ${deliveryData.user.name} - ${deliveryData.shift} meal. Driver: ${driverData.name}. Issue: ${issueType}`,
        data: {
          deliveryId: deliveryData._id,
          subscriptionId: deliveryData.subscriptionId,
          userId: deliveryData.user._id,
          userName: deliveryData.user.name,
          shift: deliveryData.shift,
          issueType: issueType,
          notes: notes,
          driverName: driverData.name,
          driverPhone: driverData.phone
        },
        priority: 'high',
        channels: ['push', 'dashboard']
      });
    }

  } catch (error) {
    console.error('Error sending delivery issue notifications:', error);
  }
};

/**
 * Helper function to create a notification record
 * @param {Object} notificationData - Notification details
 */
async function createNotification(notificationData) {
  try {
    const notification = new Notification({
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data || {},
      priority: notificationData.priority || 'normal',
      channels: notificationData.channels || ['push'],
      status: 'pending',
      createdAt: new Date(),
      scheduledFor: new Date() // Send immediately
    });

    await notification.save();
    
    // TODO: Integrate with actual notification sending service
    // This could trigger push notifications, emails, SMS, etc.
    
    console.log(`Notification created for user ${notificationData.userId}: ${notificationData.title}`);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Send customization reminder notification
 * @param {Object} userData - User information
 * @param {Object} subscriptionData - Subscription details
 * @param {Date} deliveryDate - Upcoming delivery date
 */
exports.sendCustomizationReminderNotification = async (userData, subscriptionData, deliveryDate) => {
  try {
    await createNotification({
      userId: userData._id,
      type: 'general',
      title: 'Customize Your Upcoming Meal',
      body: `Don't forget to customize your ${subscriptionData.shift} meal for ${deliveryDate.toLocaleDateString()}. Customize now to get exactly what you want!`,
      data: {
        subscriptionId: subscriptionData._id,
        deliveryDate: deliveryDate,
        shift: subscriptionData.shift
      },
      priority: 'medium',
      channels: ['push']
    });
  } catch (error) {
    console.error('Error sending customization reminder:', error);
  }
};

module.exports = {
  sendDeliveryCompletedNotification: exports.sendDeliveryCompletedNotification,
  sendDeliveryIssueNotification: exports.sendDeliveryIssueNotification,
  sendCustomizationReminderNotification: exports.sendCustomizationReminderNotification
};