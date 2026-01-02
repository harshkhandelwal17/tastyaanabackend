const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const Notification = require('../models/Notification');
const User = require('../models/User');
const vapidConfig = require('../config/vapid');

// Notification assets configuration
const NOTIFICATION_ASSETS = {
  // Main logo and badge
  logo: 'https://res.cloudinary.com/dcha7gy9o/image/upload/v1758483675/tastyaana_avwqpb.png',
  defaultBadge: 'https://res.cloudinary.com/dcha7gy9o/image/upload/v1758484105/tastyaana-removebg-preview_f8nmn2.png',
  
  // Icons for different notification types
  icons: {
    order: 'logo.png',
    shipping: 'logo.png',
    delivery: 'logo.png',
    cart: 'logo.png',
    general: 'https://res.cloudinary.com/dcha7gy9o/image/upload/v1758483675/tastyaana_avwqpb.png'
  },
  
  // Badges for different notification types
  badges: {
    order: 'logo.png',
    shipping: 'logo.png',
    delivery: 'logo.png',
    cart: 'logo.png',
    defaultBadge: 'https://res.cloudinary.com/dcha7gy9o/image/upload/v1758484105/tastyaana-removebg-preview_f8nmn2.png'
  }
};

// Import the proper authentication middleware
const { authenticate } = require('../middlewares/auth');

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  // console.log(req.headers);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // In production, verify JWT and check admin role
  req.admin = { id: 'admin_id_from_token' };
  next();
};

// Configure VAPID keys
webpush.setVapidDetails(
  vapidConfig.subject,
  vapidConfig.publicKey,
  vapidConfig.privateKey
);

// Subscribe user to notifications
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user._id; // Get userId from authenticated user
    console.log(req.body);
    if (!subscription) {
      return res.status(400).json({ message: 'Subscription is required' });
    }

    // Validate subscription object
    if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ 
        message: 'Invalid subscription object. Missing required properties: endpoint, keys.p256dh, or keys.auth' 
      });
    }

    console.log('Valid subscription received:', {
      endpoint: subscription.endpoint,
      hasKeys: !!subscription.keys,
      hasP256dh: !!subscription.keys?.p256dh,
      hasAuth: !!subscription.keys?.auth
    });

    // Update user's push subscription
    await User.findByIdAndUpdate(userId, {
      $push: { pushSubscriptions: subscription },
      notificationEnabled: true
    });

    res.json({ message: 'Successfully subscribed to notifications' });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({ message: 'Failed to subscribe to notifications' });
  }
});

// Unsubscribe user from notifications
router.post('/unsubscribe', authenticate, async (req, res) => {
  try {
    const userId = req.user._id; // Get userId from authenticated user

    // Remove user's push subscription
    await User.findByIdAndUpdate(userId, {
      $set: { pushSubscriptions: [] },
      notificationEnabled: false
    });

    res.json({ message: 'Successfully unsubscribed from notifications' });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    res.status(500).json({ message: 'Failed to unsubscribe from notifications' });
  }
});

// Send notification to specific user
router.post('/send-to-user', async (req, res) => {
  try {
    const { userId, notification } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.pushSubscription) {
      return res.status(404).json({ message: 'User not found or not subscribed' });
    }

    const payload = JSON.stringify(notification);

    await webpush.sendNotification(user.pushSubscription, payload);

    // Save notification to database
    await Notification.create({
      userId,
      title: notification.title,
      body: notification.body,
      type: notification.type || 'general',
      data: notification.data || {},
      status: 'sent',
      sentAt: new Date()
    });

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Send notification to all users
router.post('/broadcast', async (req, res) => {
  try {
    const { notification, targetSegment } = req.body;

    let users;
    if (targetSegment === 'all') {
      users = await User.find({ 
        notificationEnabled: true, 
        pushSubscription: { $exists: true, $ne: null } 
      });
    } else {
      // Add logic for different user segments
      users = await User.find({ 
        notificationEnabled: true, 
        pushSubscription: { $exists: true, $ne: null },
        // Add segment-specific criteria here
      });
    }

    const payload = JSON.stringify(notification);
    const results = [];

    for (const user of users) {
      try {
        await webpush.sendNotification(user.pushSubscription, payload);
        results.push({ userId: user._id, status: 'sent' });
      } catch (error) {
        console.error(`Failed to send notification to user ${user._id}:`, error);
        results.push({ userId: user._id, status: 'failed', error: error.message });
      }
    }

    // Save notification to database
    await Notification.create({
      title: notification.title,
      body: notification.body,
      type: notification.type || 'general',
      data: notification.data || {},
      status: 'sent',
      sentAt: new Date(),
      recipientCount: results.filter(r => r.status === 'sent').length,
      targetSegment: targetSegment || 'all'
    });

    res.json({ 
      message: 'Broadcast completed', 
      results: {
        total: users.length,
        sent: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ message: 'Failed to broadcast notification' });
  }
});

// Order confirmation notification
router.post('/order-confirmed', async (req, res) => {
  try {
    console.log(req.body);
    const { orderId, orderNumber, totalAmount, estimatedDelivery, items, customerName, subscription } = req.body;

    const notification = {
      title: 'Order Confirmed! 🎉',
      body: `Your order #${orderNumber} for ₹${totalAmount} has been confirmed`,
      icon: NOTIFICATION_ASSETS.icons.order,
      badge: NOTIFICATION_ASSETS.badges.order,
      tag: 'order-confirmed',
      requireInteraction: true,
      data: {
        type: 'order_confirmed',
        orderId,
        orderNumber,
        url: `/orders`
      },
      actions: [
        { action: 'view_order', title: 'View Order' },
        { action: 'track_order', title: 'Track Order' }
      ]
    };

    const payload = JSON.stringify(notification);
    // console.log("notification receiving data is : ", payload);
    await webpush.sendNotification(subscription, payload);

    res.json({ message: 'Order confirmation notification sent' });
  } catch (error) {
    console.error('Error sending order confirmation notification:', error);
    res.status(500).json({ message: 'Failed to send order confirmation notification' });
  }
});

// Order shipped notification
router.post('/order-shipped', async (req, res) => {
  try {
    const { orderId, orderNumber, trackingNumber, carrier, estimatedDelivery, subscription } = req.body;

    const notification = {
      title: 'Your Order is on the way! 🚚',
      body: `Order #${orderNumber} has been shipped. Tracking: ${trackingNumber}`,
      icon: NOTIFICATION_ASSETS.icons.shipping,
      badge: NOTIFICATION_ASSETS.badges.shipping,
      tag: 'order-shipped',
      requireInteraction: true,
      data: {
        type: 'order_shipped',
        orderId,
        orderNumber,
        trackingNumber,
        url: `/orders/${orderId}`
      },
      actions: [
        { action: 'track_order', title: 'Track Order' },
        { action: 'view_order', title: 'View Order' }
      ]
    };

    const payload = JSON.stringify(notification);
    await webpush.sendNotification(subscription, payload);

    res.json({ message: 'Order shipped notification sent' });
  } catch (error) {
    console.error('Error sending order shipped notification:', error);
    res.status(500).json({ message: 'Failed to send order shipped notification' });
  }
});

// Order delivered notification
router.post('/order-delivered', async (req, res) => {
  try {
    const { orderId, orderNumber, deliveredAt, subscription } = req.body;

    const notification = {
      title: 'Order Delivered! 📦',
      body: `Your order #${orderNumber} has been delivered successfully`,
      icon: NOTIFICATION_ASSETS.icons.delivery,
      badge: NOTIFICATION_ASSETS.badges.delivery,
      tag: 'order-delivered',
      requireInteraction: true,
      data: {
        type: 'order_delivered',
        orderId,
        orderNumber,
        deliveredAt,
        url: `/orders/${orderId}`
      },
      actions: [
        { action: 'rate_order', title: 'Rate Order' },
        { action: 'reorder', title: 'Reorder' }
      ]
    };

    const payload = JSON.stringify(notification);
    await webpush.sendNotification(subscription, payload);

    res.json({ message: 'Order delivered notification sent' });
  } catch (error) {
    console.error('Error sending order delivered notification:', error);
    res.status(500).json({ message: 'Failed to send order delivered notification' });
  }
});

// Cart reminder notification
router.post('/cart-reminder', async (req, res) => {
  try {
    const { cartId, itemsCount, totalAmount, lastActivity, subscription } = req.body;

    const notification = {
      title: 'Don\'t forget your items! 🛒',
      body: `You have ${itemsCount} items worth ₹${totalAmount} in your cart`,
      icon: NOTIFICATION_ASSETS.icons.cart,
      badge: NOTIFICATION_ASSETS.badges.cart,
      tag: 'cart-reminder',
      requireInteraction: false,
      data: {
        type: 'cart_reminder',
        cartId,
        url: '/cart'
      },
      actions: [
        { action: 'view_cart', title: 'View Cart' },
        { action: 'checkout', title: 'Checkout' }
      ]
    };

    const payload = JSON.stringify(notification);
    await webpush.sendNotification(subscription, payload);

    res.json({ message: 'Cart reminder notification sent' });
  } catch (error) {
    console.error('Error sending cart reminder notification:', error);
    res.status(500).json({ message: 'Failed to send cart reminder notification' });
  }
});

// Get notification history for admin
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ sentAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ message: 'Failed to fetch notification history' });
  }
});

// Send notification from admin panel
router.post('/send', authenticateAdmin, async (req, res) => {
  try {
    const { title, body, type, targetType, targetUsers, targetSegment, scheduled, scheduledTime, requireInteraction, actions, redirectUrl } = req.body;

    // Determine icon and badge based on notification type
    const notificationType = type ;
    const notificationIcon =  NOTIFICATION_ASSETS.icons.general;
    const notificationBadge =  NOTIFICATION_ASSETS.defaultBadge;

    const notification = {
      title,
      body,
      icon: notificationIcon,
      badge: notificationBadge,
      type: notificationType||'general',
      requireInteraction: Boolean(requireInteraction),
      actions: Array.isArray(actions) ? actions : [],
      data: { 
        type: notificationType,
        url: redirectUrl || '/',
        timestamp: new Date().toISOString()
      }
    };

    if (scheduled && scheduledTime) {
      // Schedule notification for later (you might want to use a job queue like Bull or Agenda)
      // For now, we'll send immediately
    }

    let users;
   if (targetType === 'all') {
  users = await User.find({ 
    "preferences.notifications.push": true, // only push-enabled
    pushSubscriptions: { $exists: true, $not: { $size: 0 } }
  });
} 
else if (targetType === 'segment') {
  // e.g., users with Hindi language and push enabled
  users = await User.find({ 
    "preferences.language": "hi",
    "preferences.notifications.push": true,
    pushSubscriptions: { $exists: true, $not: { $size: 0 } }
  });
} 
else if (targetType === 'specific') {
  users = await User.find({ 
    _id: { $in: targetUsers },
    "preferences.notifications.push": true,
    pushSubscriptions: { $exists: true, $not: { $size: 0 } }
  });
}

console.log("users are : ",users)
    const payload = JSON.stringify(notification);
    const results = [];

    for (const user of users) {
      try {
        // Check if user has valid push subscriptions (plural array)
        if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
          console.log(`User ${user._id} has no valid push subscriptions, skipping...`);
          results.push({ userId: user._id, status: 'skipped', reason: 'No valid subscriptions' });
          continue;
        }

        // Send to all user subscriptions
        let sentCount = 0;
        for (const subscription of user.pushSubscriptions) {
          // Validate subscription object
          if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
            console.log(`User ${user._id} has incomplete subscription data, skipping subscription...`);
            continue;
          }

          try {
            await webpush.sendNotification(subscription, payload);
            sentCount++;
            console.log(`Push notification sent to user ${user._id} subscription`);
          } catch (error) {
            console.error(`Failed to send notification to user ${user._id} subscription:`, error.message);
          }
        }

        if (sentCount > 0) {
          results.push({ userId: user._id, status: 'sent', subscriptionsSent: sentCount });
        } else {
          results.push({ userId: user._id, status: 'failed', reason: 'All subscriptions failed' });
        }
      } catch (error) {
        console.error(`Failed to process user ${user._id}:`, error);
        results.push({ userId: user._id, status: 'failed', error: error.message });
      }
    }

    // Save notification to database
    await Notification.create({
      title,
      body,
      type,
      data: { type },
      status: 'sent',
      sentAt: new Date(),
      recipientCount: results.filter(r => r.status === 'sent').length,
      targetType,
      targetSegment: targetSegment || 'all'
    });

    res.json({ 
      message: 'Notification sent successfully',
      results: {
        total: users.length,
        sent: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Get user notification settings
router.get('/user/notification-settings', authenticate, async (req, res) => {
  try {
    const userId = req.user._id; // Get userId from authenticated user
    const user = await User.findById(userId);
    
    res.json({ 
      settings: user.notificationSettings || {
        orderUpdates: true,
        promotions: true,
        priceDrops: true,
        newProducts: true,
        cartReminders: true,
        general: true,
        email: true,
        sms: false
      }
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Failed to fetch notification settings' });
  }
});

// Update user notification settings
router.post('/user/notification-settings', authenticate, async (req, res) => {
  try {
    const userId = req.user._id; // Get userId from authenticated user
    const { settings } = req.body;

    await User.findByIdAndUpdate(userId, {
      notificationSettings: settings
    });

    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

module.exports = router;
