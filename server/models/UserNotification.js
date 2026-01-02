const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic user info
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Push notification subscription
  pushSubscription: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Notification preferences
  notificationEnabled: {
    type: Boolean,
    default: false
  },
  
  // Detailed notification settings
  notificationSettings: {
    orderUpdates: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: true
    },
    priceDrops: {
      type: Boolean,
      default: true
    },
    newProducts: {
      type: Boolean,
      default: true
    },
    cartReminders: {
      type: Boolean,
      default: true
    },
    general: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  
  // User segments for targeted notifications
  segments: [{
    type: String,
    enum: ['active', 'inactive', 'premium', 'new', 'cart_abandoned', 'high_value']
  }],
  
  // Last activity for engagement tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Notification statistics
  notificationStats: {
    totalReceived: {
      type: Number,
      default: 0
    },
    totalClicked: {
      type: Number,
      default: 0
    },
    lastNotificationAt: Date
  }
}, {
  timestamps: true
});

// Indexes for notification queries
userSchema.index({ notificationEnabled: 1, pushSubscription: 1 });
userSchema.index({ segments: 1 });
userSchema.index({ lastActivity: -1 });

// Method to update notification settings
userSchema.methods.updateNotificationSettings = function(settings) {
  this.notificationSettings = { ...this.notificationSettings, ...settings };
  return this.save();
};

// Method to subscribe to push notifications
userSchema.methods.subscribeToPush = function(subscription) {
  this.pushSubscription = subscription;
  this.notificationEnabled = true;
  return this.save();
};

// Method to unsubscribe from push notifications
userSchema.methods.unsubscribeFromPush = function() {
  this.pushSubscription = null;
  this.notificationEnabled = false;
  return this.save();
};

// Method to update user segments
userSchema.methods.updateSegments = function(segments) {
  this.segments = segments;
  return this.save();
};

// Method to update last activity
userSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Method to increment notification stats
userSchema.methods.incrementNotificationStats = function(clicked = false) {
  this.notificationStats.totalReceived += 1;
  if (clicked) {
    this.notificationStats.totalClicked += 1;
  }
  this.notificationStats.lastNotificationAt = new Date();
  return this.save();
};

// Static method to get users by segment
userSchema.statics.getUsersBySegment = function(segment) {
  const query = { notificationEnabled: true, pushSubscription: { $exists: true, $ne: null } };
  
  switch (segment) {
    case 'active':
      query.lastActivity = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }; // Last 7 days
      break;
    case 'inactive':
      query.lastActivity = { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; // Older than 30 days
      break;
    case 'new':
      query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }; // Created in last 7 days
      break;
    case 'cart_abandoned':
      // This would need to be implemented based on your cart logic
      query.segments = 'cart_abandoned';
      break;
    case 'premium':
      query.segments = 'premium';
      break;
    case 'high_value':
      query.segments = 'high_value';
      break;
  }
  
  return this.find(query);
};

// Static method to get notification statistics
userSchema.statics.getNotificationStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        subscribedUsers: {
          $sum: {
            $cond: [
              { $and: ['$notificationEnabled', { $ne: ['$pushSubscription', null] }] },
              1,
              0
            ]
          }
        },
        activeUsers: {
          $sum: {
            $cond: [
              { $gte: ['$lastActivity', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        },
        avgNotificationsReceived: { $avg: '$notificationStats.totalReceived' },
        avgNotificationsClicked: { $avg: '$notificationStats.totalClicked' }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);
