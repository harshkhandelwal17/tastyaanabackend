// // utils/notificationService.js
// const Notification = require('../models/Notification');
// const { sendEmail } = require('./emailService');
// const { sendSMS } = require('./smsService');

// /**
//  * Create and send notification
//  */
// exports.createNotification = async (notificationData) => {
//   try {
//     const notification = new Notification(notificationData);
//     await notification.save();

//     // Get user preferences for notification delivery
//     const User = require('../models/User');
//     const user = await User.findById(notificationData.userId);

//     if (!user) return;

//     // Send via different channels based on user preferences
//     const promises = [];

//     // In-app notification is always sent (already saved above)
//     notification.status = 'sent';
//     notification.deliveredAt = new Date();

//     // Email notification
//     if (notification.channels.email && user.notifications.email) {
//       promises.push(
//         sendEmail({
//           to: user.email,
//           subject: notification.title,
//           html: `
//             <h2>${notification.title}</h2>
//             <p>${notification.message}</p>
//             ${notification.actionUrl ? `<a href="${notification.actionUrl}" style="background: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${notification.actionText || 'View Details'}</a>` : ''}
//           `
//         }).catch(err => console.error('Email notification failed:', err))
//       );
//     }

//     // SMS notification
//     if (notification.channels.sms && user.notifications.sms) {
//       promises.push(
//         sendSMS({
//           to: user.phone,
//           message: `${notification.title}: ${notification.message}`
//         }).catch(err => console.error('SMS notification failed:', err))
//       );
//     }

//     await Promise.all(promises);
//     await notification.save();

//     return notification;

//   } catch (error) {
//     console.error('Error creating notification:', error);
//     throw error;
//   }
// };


const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./emailService');
const { sendSMS } = require('./smsService');
const webPush = require('web-push');

// Configure VAPID keys if available
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webPush.setVapidDetails(
      'mailto:support@tastyaana.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log('✅ Web Push configured successfully');
  } catch (err) {
    console.error('❌ Web Push configuration failed:', err.message);
  }
}

class NotificationService {
  /**
   * Create a new notification
   * @param {Object} notificationData - The notification data
   * @returns {Promise<Object>} Created notification
   */
  static async createNotification(notificationData) {
    try {
      const {
        userId,
        title,
        message,
        body,
        type,
        priority = 'normal',
        data = {},
        actionUrl,
        actionText,
        channels = { inApp: true },
        expiresAt,
        category = 'info'
      } = notificationData;

      // Use body if provided, otherwise use message for backward compatibility
      const notificationBody = body || message;

      // Validate required fields
      if (!userId || !title || !notificationBody || !type) {
        throw new Error('Missing required notification fields');
      }

      // Validate type enum
      const validTypes = [
        'general',
        'order_confirmed',
        'order_shipped',
        'order_delivered',
        'promotion',
        'cart_reminder',
        'new_product',
        'price_drop',
        'restock',
        'maintenance',
        'security',
        'order',
      ];

      if (!validTypes.includes(type)) {
        throw new Error(`Invalid notification type: ${type}. Valid types are: ${validTypes.join(', ')}`);
      }

      // Validate priority enum
      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        throw new Error(`Invalid priority: ${priority}. Valid priorities are: ${validPriorities.join(', ')}`);
      }

      // Get user preferences
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create notification
      const notification = new Notification({
        userId,
        title,
        body: notificationBody,
        type,
        priority,
        data: {
          ...data,
          actionUrl,
          actionText,
          channels: {
            inApp: channels.inApp !== false,
            email: channels.email && user.preferences?.notifications?.email,
            sms: channels.sms && user.preferences?.notifications?.sms,
            push: channels.push && user.preferences?.notifications?.push
          },
          expiresAt,
          category
        }
      });

      await notification.save();

      // Send via other channels if enabled
      await this.processNotificationChannels(notification, user);

      return notification;

    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  /**
   * Process notification through different channels
   * @param {Object} notification - The notification object
   * @param {Object} user - The user object
   */
  static async processNotificationChannels(notification, user) {
    try {
      // Check if user object is valid
      if (!user) {
        console.warn('No user provided for notification:', notification._id);
        return;
      }

      // Safely access notification channels with defaults
      const channels = notification.channels || {};

      // Send email notification if enabled and user has email
      if (channels.email && user.email) {
        try {
          await sendEmail({
            to: user.email,
            subject: notification.title,
            template: 'notification',
            data: {
              name: user.name || 'Customer',
              title: notification.title,
              message: notification.message,
              actionUrl: notification.actionUrl || '#',
              actionText: notification.actionText || 'View Details'
            }
          });
          notification.emailSentAt = new Date();
          await notification.save();
        } catch (emailError) {
          console.error('Email notification error:', emailError);
        }
      }

      // Send SMS notification if enabled and user has phone
      if (channels.sms && user.phone) {
        try {
          await sendSMS({
            to: user.phone,
            message: `${notification.title}: ${notification.message}`
          });

          notification.smsSentAt = new Date();
          await notification.save();
        } catch (smsError) {
          console.error('SMS notification error:', smsError);
        }
      }

      // Send push notification if enabled
      if (channels.push) {
        try {
          await this.sendPushNotification(user, notification);

          notification.pushSentAt = new Date();
          await notification.save();
        } catch (pushError) {
          console.error('Push notification error:', pushError);
        }
      }

    } catch (error) {
      console.error('Process notification channels error:', error);
    }
  }

  /**
   * Send push notification (placeholder - implement with your push service)
   * @param {Object} user - The user object
   * @param {Object} notification - The notification object
   */
  static async sendPushNotification(user, notification) {
    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    // Ensure VAPID keys are configured
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn('⚠️ VAPID keys not configured, skipping push notification');
      return;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body || notification.message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      url: notification.data?.actionUrl || '/', // Default to home if no action URL
      data: {
        ...notification.data,
        notificationId: notification._id
      }
    });

    console.log(`🚀 Sending Push Notification to ${user.pushSubscriptions.length} subscriptions for user ${user._id}`);

    const validSubscriptions = [];
    const promises = user.pushSubscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(sub, payload);
        validSubscriptions.push(sub); // Keep valid subscription
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired/invalid - don't add to validSubscriptions
          console.log('🗑️ Removing expired push subscription');
        } else {
          console.error('❌ Push notification error:', error.message);
          validSubscriptions.push(sub); // Keep potentially valid subscription on other errors
        }
      }
    });

    await Promise.all(promises);

    // Update user subscriptions if any were removed (cleanup expired tokens)
    if (validSubscriptions.length !== user.pushSubscriptions.length) {
      try {
        // Use updateOne to avoid validation issues on full save
        await User.updateOne(
          { _id: user._id },
          { $set: { pushSubscriptions: validSubscriptions } }
        );
        console.log(`🧹 Cleaned up push subscriptions for user ${user._id}`);
      } catch (err) {
        console.error('Error updating user push subscriptions:', err);
      }
    }
  }

  /**
   * Get notifications for a user
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Notifications and pagination info
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        isRead,
        priority,
        category
      } = options;

      const filter = { userId };

      if (type) filter.type = type;
      if (isRead !== undefined) filter.isRead = isRead;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.getUnreadCount(userId);

      return {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      };

    } catch (error) {
      console.error('Get user notifications error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Updated notification
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @param {String} userId - User ID
   * @returns {Promise<Number>} Number of updated notifications
   */
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID
   * @returns {Promise<Boolean>} Success status
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        userId
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Created notifications
   */
  static async sendBulkNotifications(userIds, notificationData) {
    try {
      const notifications = [];

      for (const userId of userIds) {
        try {
          const notification = await this.createNotification({
            ...notificationData,
            userId
          });
          notifications.push(notification);
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Send bulk notifications error:', error);
      throw error;
    }
  }

  /**
   * Send notification to all sellers
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Created notifications
   */
  static async notifyAllSellers(notificationData) {
    try {
      const sellers = await User.find({
        role: 'seller',
        isActive: true
      }).select('_id');

      const sellerIds = sellers.map(seller => seller._id);

      return await this.sendBulkNotifications(sellerIds, notificationData);
    } catch (error) {
      console.error('Notify all sellers error:', error);
      throw error;
    }
  }

  /**
   * Send notification to all admins
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Created notifications
   */
  static async notifyAllAdmins(notificationData) {
    try {
      const admins = await User.find({
        role: { $in: ['admin', 'super-admin'] },
        isActive: true
      }).select('_id');

      const adminIds = admins.map(admin => admin._id);

      return await this.sendBulkNotifications(adminIds, notificationData);
    } catch (error) {
      console.error('Notify all admins error:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications
   * @param {Number} daysOld - Days old to clean up (default: 30)
   * @returns {Promise<Number>} Number of deleted notifications
   */
  static async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      console.log(`Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Cleanup old notifications error:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   * @param {String} userId - User ID (optional, for user-specific stats)
   * @returns {Promise<Object>} Notification statistics
   */
  static async getNotificationStats(userId = null) {
    try {
      const filter = userId ? { userId } : {};

      const stats = await Notification.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: ['$isRead', 0, 1] } },
            byType: {
              $push: {
                type: '$type',
                isRead: '$isRead'
              }
            },
            byPriority: {
              $push: {
                priority: '$priority',
                isRead: '$isRead'
              }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          unread: 0,
          byType: {},
          byPriority: {}
        };
      }

      const result = stats[0];

      // Process type statistics
      result.byType = result.byType.reduce((acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = { total: 0, unread: 0 };
        }
        acc[item.type].total++;
        if (!item.isRead) acc[item.type].unread++;
        return acc;
      }, {});

      // Process priority statistics
      result.byPriority = result.byPriority.reduce((acc, item) => {
        if (!acc[item.priority]) {
          acc[item.priority] = { total: 0, unread: 0 };
        }
        acc[item.priority].total++;
        if (!item.isRead) acc[item.priority].unread++;
        return acc;
      }, {});

      return result;
    } catch (error) {
      console.error('Get notification stats error:', error);
      throw error;
    }
  }
}

// Export the service
module.exports = {
  NotificationService,
  createNotification: NotificationService.createNotification.bind(NotificationService),
  getUserNotifications: NotificationService.getUserNotifications.bind(NotificationService),
  markAsRead: NotificationService.markAsRead.bind(NotificationService),
  markAllAsRead: NotificationService.markAllAsRead.bind(NotificationService),
  deleteNotification: NotificationService.deleteNotification.bind(NotificationService),
  sendBulkNotifications: NotificationService.sendBulkNotifications.bind(NotificationService),
  notifyAllSellers: NotificationService.notifyAllSellers.bind(NotificationService),
  notifyAllAdmins: NotificationService.notifyAllAdmins.bind(NotificationService),
  cleanupOldNotifications: NotificationService.cleanupOldNotifications.bind(NotificationService),
  getNotificationStats: NotificationService.getNotificationStats.bind(NotificationService)
};