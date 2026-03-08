const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User who received the notification (optional for broadcast notifications)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // Notification content
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  body: {
    type: String,
    required: true,
    trim: true
  },
  
  // Notification type
  type: {
    type: String,
    required: true,
    enum: [
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
      'order'
    ],
    default: 'general'
  },
  
  // Additional data for the notification
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Notification status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'scheduled'],
    default: 'pending'
  },
  
  // When the notification was sent
  sentAt: {
    type: Date,
    default: Date.now
  },
  
  // When the notification was delivered (if applicable)
  deliveredAt: {
    type: Date
  },
  
  // When the notification was clicked (if applicable)
  clickedAt: {
    type: Date
  },
  
  // Target information for broadcast notifications
  targetType: {
    type: String,
    enum: ['all', 'segment', 'specific'],
    default: 'all'
  },
  
  targetSegment: {
    type: String,
    enum: ['all', 'active', 'inactive', 'premium', 'new', 'cart_abandoned'],
    default: 'all'
  },
  
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Number of recipients (for broadcast notifications)
  recipientCount: {
    type: Number,
    default: 0
  },
  
  // Number of successful deliveries
  deliveredCount: {
    type: Number,
    default: 0
  },
  
  // Number of clicks
  clickCount: {
    type: Number,
    default: 0
  },
  
  // Error information if notification failed
  error: {
    message: String,
    code: String,
    timestamp: Date
  },
  
  // Scheduling information
  scheduledFor: {
    type: Date
  },
  
  // Notification priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Whether the notification requires user interaction
  requireInteraction: {
    type: Boolean,
    default: false
  },
  
  // Action buttons for the notification
  actions: [{
    action: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    icon: String
  }],
  
  // Campaign information (for marketing notifications)
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  
  // A/B testing information
  variant: {
    type: String,
    default: 'A'
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, sentAt: -1 });
notificationSchema.index({ type: 1, sentAt: -1 });
notificationSchema.index({ status: 1, sentAt: -1 });
notificationSchema.index({ targetType: 1, targetSegment: 1 });
notificationSchema.index({ scheduledFor: 1 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.sentAt.getTime();
});

// Method to mark notification as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  this.deliveredCount += 1;
  return this.save();
};

// Method to mark notification as clicked
notificationSchema.methods.markAsClicked = function() {
  this.clickedAt = new Date();
  this.clickCount += 1;
  return this.save();
};

// Method to mark notification as failed
notificationSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = {
    message: error.message,
    code: error.code,
    timestamp: new Date()
  };
  return this.save();
};

// Static method to get notification statistics
notificationSchema.statics.getStats = async function(startDate, endDate) {
  const match = {};
  if (startDate) match.sentAt = { $gte: startDate };
  if (endDate) match.sentAt = { ...match.sentAt, $lte: endDate };

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        totalRecipients: { $sum: '$recipientCount' },
        totalDelivered: { $sum: '$deliveredCount' },
        totalClicks: { $sum: '$clickCount' }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    totalRecipients: 0,
    totalDelivered: 0,
    totalClicks: 0
  };
};

// Static method to get notifications by type
notificationSchema.statics.getByType = function(type, limit = 50) {
  return this.find({ type })
    .sort({ sentAt: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ sentAt: -1 })
    .limit(limit);
};

// Static method to cleanup old notifications
notificationSchema.statics.cleanup = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    sentAt: { $lt: cutoffDate },
    status: { $in: ['sent', 'delivered', 'failed'] }
  });
  
  return result.deletedCount;
};

module.exports = mongoose.model('Notification', notificationSchema);