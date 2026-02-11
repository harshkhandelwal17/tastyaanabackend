// utils/broadcastManager.js
const Broadcast = require('../models/Broadcast');
const User = require('../models/User');
const { sendSMS } = require("./smsService");
const {sendEmail}=require("./email");
const webpush = require('web-push');
const vapidConfig = require('../config/vapid');

// Configure VAPID keys
webpush.setVapidDetails(
  vapidConfig.subject,
  vapidConfig.publicKey,
  vapidConfig.privateKey
);

// Send push notification to a user
const sendPushNotification = async (userId, notificationData) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      console.log(`User ${userId} has no push subscriptions`);
      return;
    }

    // Create proper JSON payload
    const payload = JSON.stringify({
      title: notificationData.title,
      body: notificationData.body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'admin-notification',
      requireInteraction: false,
      data: {
        url: '/',
        timestamp: new Date().toISOString(),
        type: 'admin'
      }
    });

    // Send to all user subscriptions
    for (const subscription of user.pushSubscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
        console.log(`Push notification sent to user ${userId}`);
      } catch (error) {
        console.error(`Failed to send push notification to user ${userId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
};

const sendBroadcast = async (broadcastId) => {
  try {
    const broadcast = await Broadcast.findById(broadcastId);
    if (!broadcast) throw new Error('Broadcast not found');

    broadcast.status = 'sending';
    await broadcast.save();

    // Get target audience
    const recipients = await getRecipients(broadcast);
    
    broadcast.statistics.totalRecipients = recipients.length;
    await broadcast.save();

    const results = {
      delivered: 0,
      failed: 0
    };

    // Send notifications based on type
    for (const user of recipients) {
      try {
        switch (broadcast.type) {
          case 'email':
            await sendEmail(user.email, broadcast.title, broadcast.message);
            break;
          case 'sms':
            if (user.phone) {
              await sendSMS(user.phone, broadcast.message);
            }
            break;
          case 'push':
            await sendPushNotification(user._id, {
              title: broadcast.title,
              body: broadcast.message
            });
            break;
          case 'notification':
            // In-app notification
            await createInAppNotification(user._id, broadcast);
            break;
        }
        results.delivered++;
      } catch (error) {
        console.error(`Failed to send to user ${user._id}:`, error);
        results.failed++;
      }
    }

    broadcast.status = 'sent';
    broadcast.sentAt = new Date();
    broadcast.statistics.delivered = results.delivered;
    broadcast.statistics.failed = results.failed;
    await broadcast.save();

    return broadcast;
  } catch (error) {
    const broadcast = await Broadcast.findById(broadcastId);
    if (broadcast) {
      broadcast.status = 'failed';
      await broadcast.save();
    }
    throw error;
  }
};

const getRecipients = async (broadcast) => {
  let query = {};

  switch (broadcast.audience) {
    case 'all':
      query = { isActive: true };
      break;
    case 'customers':
      query = { role: 'customer', isActive: true };
      break;
    case 'sellers':
      query = { role: 'seller', isActive: true };
      break;
    case 'admins':
      query = { role: { $in: ['admin', 'superadmin'] }, isActive: true };
      break;
    case 'custom':
      if (broadcast.customAudience.userIds.length > 0) {
        query._id = { $in: broadcast.customAudience.userIds };
      } else {
        if (broadcast.customAudience.roles.length > 0) {
          query.role = { $in: broadcast.customAudience.roles };
        }
        // Add more custom audience filters as needed
      }
      break;
  }

  return await User.find(query).select('_id name email phone role');
};

const createInAppNotification = async (userId, broadcast) => {
  const Notification = require('../models/Notification');
  
  const notification = new Notification({
    recipient: userId,
    type: 'system',
    title: broadcast.title,
    message: broadcast.message,
    data: {
      broadcastId: broadcast._id,
      type: 'broadcast'
    }
  });

  await notification.save();
  return notification;
};

module.exports = { sendBroadcast, getRecipients, sendPushNotification };