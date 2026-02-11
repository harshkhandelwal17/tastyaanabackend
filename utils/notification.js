
// utils/notifications.js
const Notification = require('../models/Notification');

const sendNotification = async (recipientId, type, title, message, data = {}) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      data
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

const sendBulkNotifications = async (recipients, type, title, message, data = {}) => {
  try {
    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      type,
      title,
      message,
      data
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
  }
};

module.exports = { sendNotification, sendBulkNotifications };