const cron = require('node-cron');
const moment = require('moment');
const LaundryOrder = require('../models/LaundryOrder');
const LaundrySubscription = require('../models/LaundrySubscription');
const notificationService = require('../services/notificationService');

// ==================== JOB 1: PICKUP REMINDERS ====================

/**
 * Send pickup reminders 1 day before scheduled pickup
 * Runs every day at 6 PM
 */
const sendPickupReminders = cron.schedule('0 18 * * *', async () => {
  try {
    console.log('🔄 Running pickup reminder job...');

    const tomorrow = moment().add(1, 'day').startOf('day');
    const dayAfterTomorrow = moment().add(2, 'days').startOf('day');

    // Find orders with pickup scheduled for tomorrow
    const orders = await LaundryOrder.find({
      'schedule.pickup.date': {
        $gte: tomorrow.toDate(),
        $lt: dayAfterTomorrow.toDate()
      },
      status: 'scheduled'
    }).populate('user vendor');

    console.log(`📦 Found ${orders.length} orders for reminder`);

    for (const order of orders) {
      await notificationService.sendNotification(
        order.user,
        'pickupReminder',
        { order, vendor: order.vendor }
      );
    }

    console.log('✅ Pickup reminders sent successfully');
  } catch (error) {
    console.error('❌ Error in pickup reminder job:', error.message);
  }
});

// ==================== JOB 2: SUBSCRIPTION RENEWAL ====================

/**
 * Check and renew subscriptions
 * Runs every day at 12 AM
 */
const renewSubscriptions = cron.schedule('0 0 * * *', async () => {
  try {
    console.log('🔄 Running subscription renewal job...');

    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');

    // Find subscriptions expiring today
    const expiring = await LaundrySubscription.find({
      status: 'active',
      'period.nextRenewalDate': {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      }
    }).populate('user vendor');

    console.log(`📋 Found ${expiring.length} subscriptions for renewal`);

    for (const subscription of expiring) {
      if (subscription.billing.autoRenewal) {
        // Auto-renew
        try {
          // TODO: Process payment via payment gateway
          
          // Reset usage
          subscription.resetMonthlyUsage();

          // Update period
          subscription.period.startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          subscription.period.endDate = endDate;
          subscription.period.nextRenewalDate = endDate;

          // Update billing
          subscription.billing.lastPayment = {
            amount: subscription.plan.price,
            date: new Date(),
            status: 'success'
          };

          await subscription.save();

          console.log(`✅ Renewed subscription ${subscription._id}`);

          // Send confirmation
          await notificationService.sendNotification(
            subscription.user,
            'subscriptionRenewed',
            { subscription }
          );

        } catch (error) {
          console.error(`❌ Error renewing ${subscription._id}:`, error.message);
          
          // If payment fails, expire subscription
          subscription.status = 'expired';
          await subscription.save();

          // Notify user
          await notificationService.sendNotification(
            subscription.user,
            'subscriptionExpired',
            { subscription }
          );
        }
      } else {
        // Expire subscription if auto-renewal disabled
        subscription.status = 'expired';
        await subscription.save();

        console.log(`⏸️ Expired subscription ${subscription._id} (auto-renewal disabled)`);

        // Notify user
        await notificationService.sendNotification(
          subscription.user,
          'subscriptionExpired',
          { subscription }
        );
      }
    }

    console.log('✅ Subscription renewal job completed');
  } catch (error) {
    console.error('❌ Error in subscription renewal job:', error.message);
  }
});

// ==================== JOB 3: SUBSCRIPTION RENEWAL REMINDERS ====================

/**
 * Send renewal reminders 3 days before expiry
 * Runs every day at 9 AM
 */
const sendRenewalReminders = cron.schedule('0 9 * * *', async () => {
  try {
    console.log('🔄 Running renewal reminder job...');

    const threeDaysFromNow = moment().add(3, 'days').startOf('day');
    const fourDaysFromNow = moment().add(4, 'days').startOf('day');

    // Find subscriptions expiring in 3 days
    const expiring = await LaundrySubscription.find({
      status: 'active',
      'period.nextRenewalDate': {
        $gte: threeDaysFromNow.toDate(),
        $lt: fourDaysFromNow.toDate()
      }
    }).populate('user vendor');

    console.log(`📋 Found ${expiring.length} subscriptions expiring soon`);

    for (const subscription of expiring) {
      await notificationService.sendNotification(
        subscription.user,
        'subscriptionRenewal',
        { subscription }
      );
    }

    console.log('✅ Renewal reminders sent successfully');
  } catch (error) {
    console.error('❌ Error in renewal reminder job:', error.message);
  }
});

// ==================== JOB 4: USAGE ALERTS ====================

/**
 * Send usage alerts when subscription quota is low
 * Runs every day at 8 PM
 */
const sendUsageAlerts = cron.schedule('0 20 * * *', async () => {
  try {
    console.log('🔄 Running usage alert job...');

    const activeSubscriptions = await LaundrySubscription.find({
      status: 'active'
    }).populate('user');

    console.log(`📋 Checking ${activeSubscriptions.length} active subscriptions`);

    for (const subscription of activeSubscriptions) {
      subscription.calculateRemaining();

      const { weightRemaining, dryCleanRemaining } = subscription.usage.currentMonth;
      const maxWeight = subscription.plan.maxWeight;

      // Alert if weight usage > 80%
      if (maxWeight && weightRemaining < maxWeight * 0.2) {
        await notificationService.sendNotification(
          subscription.user,
          'weightAlert',
          { subscription }
        );
        console.log(`⚠️ Sent weight alert for subscription ${subscription._id}`);
      }

      // Alert if dry clean quota is running low
      if (dryCleanRemaining && dryCleanRemaining <= 1) {
        await notificationService.sendNotification(
          subscription.user,
          'dryCleanAlert',
          { subscription }
        );
        console.log(`⚠️ Sent dry clean alert for subscription ${subscription._id}`);
      }
    }

    console.log('✅ Usage alerts sent successfully');
  } catch (error) {
    console.error('❌ Error in usage alert job:', error.message);
  }
});

// ==================== JOB 5: AUTO-COMPLETE DELIVERED ORDERS ====================

/**
 * Auto-complete orders that were delivered 7 days ago
 * Runs every day at 2 AM
 */
const autoCompleteOrders = cron.schedule('0 2 * * *', async () => {
  try {
    console.log('🔄 Running auto-complete job...');

    const sevenDaysAgo = moment().subtract(7, 'days').toDate();

    // Find delivered orders without feedback
    const orders = await LaundryOrder.find({
      status: 'delivered',
      'schedule.delivery.actualTime': { $lte: sevenDaysAgo },
      'feedback.rating': { $exists: false }
    });

    console.log(`📦 Found ${orders.length} orders to auto-complete`);

    for (const order of orders) {
      // Mark as completed (no action needed, just log)
      console.log(`✅ Auto-completed order ${order.orderNumber}`);
    }

    console.log('✅ Auto-complete job finished');
  } catch (error) {
    console.error('❌ Error in auto-complete job:', error.message);
  }
});

// ==================== JOB 6: CLEANUP CANCELLED ORDERS ====================

/**
 * Archive cancelled orders older than 90 days
 * Runs once a week on Sunday at 3 AM
 */
const cleanupCancelledOrders = cron.schedule('0 3 * * 0', async () => {
  try {
    console.log('🔄 Running cleanup job...');

    const ninetyDaysAgo = moment().subtract(90, 'days').toDate();

    const result = await LaundryOrder.updateMany(
      {
        status: 'cancelled',
        'cancellation.cancelledAt': { $lte: ninetyDaysAgo }
      },
      {
        $set: { isArchived: true }
      }
    );

    console.log(`🗑️ Archived ${result.modifiedCount} cancelled orders`);
    console.log('✅ Cleanup job completed');
  } catch (error) {
    console.error('❌ Error in cleanup job:', error.message);
  }
});

// ==================== JOB 7: VENDOR METRICS UPDATE ====================

/**
 * Update vendor performance metrics
 * Runs every day at 1 AM
 */
const updateVendorMetrics = cron.schedule('0 1 * * *', async () => {
  try {
    console.log('🔄 Running vendor metrics update...');

    const LaundryVendor = require('../models/LaundryVendor');
    const { calculateVendorMetrics } = require('../utils/laundryHelpers');

    const vendors = await LaundryVendor.find({ isActive: true });

    console.log(`🏪 Updating metrics for ${vendors.length} vendors`);

    for (const vendor of vendors) {
      const metrics = await calculateVendorMetrics(vendor._id);
      
      // Update vendor stats
      vendor.totalOrders = metrics.totalOrders;
      vendor.rating = metrics.avgRating;
      vendor.totalReviews = metrics.completedOrders; // Assuming all completed orders have reviews

      await vendor.save();

      console.log(`✅ Updated metrics for ${vendor.name}`);
    }

    console.log('✅ Vendor metrics updated successfully');
  } catch (error) {
    console.error('❌ Error updating vendor metrics:', error.message);
  }
});

// ==================== JOB 8: SEND MONTHLY REPORTS ====================

/**
 * Send monthly usage reports to subscribed users
 * Runs on 1st of every month at 10 AM
 */
const sendMonthlyReports = cron.schedule('0 10 1 * *', async () => {
  try {
    console.log('🔄 Running monthly report job...');

    const activeSubscriptions = await LaundrySubscription.find({
      status: 'active'
    }).populate('user vendor');

    console.log(`📊 Generating reports for ${activeSubscriptions.length} subscriptions`);

    for (const subscription of activeSubscriptions) {
      // Get last month's usage
      const lastMonth = subscription.usage.history[subscription.usage.history.length - 1];

      if (lastMonth) {
        const report = {
          month: lastMonth.month,
          pickups: lastMonth.pickupsCompleted,
          items: lastMonth.itemsCleaned,
          weight: lastMonth.weightUsed,
          savings: 0 // Calculate based on pay-per-use pricing
        };

        // Send email with report
        // TODO: Create email template for monthly report
        console.log(`📧 Sent monthly report to ${subscription.user.email}`);
      }
    }

    console.log('✅ Monthly reports sent successfully');
  } catch (error) {
    console.error('❌ Error sending monthly reports:', error.message);
  }
});

// ==================== START ALL JOBS ====================

const startAllJobs = () => {
  console.log('🚀 Starting all cron jobs...');
  
  sendPickupReminders.start();
  renewSubscriptions.start();
  sendRenewalReminders.start();
  sendUsageAlerts.start();
  autoCompleteOrders.start();
  cleanupCancelledOrders.start();
  updateVendorMetrics.start();
  sendMonthlyReports.start();

  console.log('✅ All cron jobs started successfully');
};

const stopAllJobs = () => {
  console.log('🛑 Stopping all cron jobs...');
  
  sendPickupReminders.stop();
  renewSubscriptions.stop();
  sendRenewalReminders.stop();
  sendUsageAlerts.stop();
  autoCompleteOrders.stop();
  cleanupCancelledOrders.stop();
  updateVendorMetrics.stop();
  sendMonthlyReports.stop();

  console.log('✅ All cron jobs stopped');
};

module.exports = {
  startAllJobs,
  stopAllJobs,
  sendPickupReminders,
  renewSubscriptions,
  sendRenewalReminders,
  sendUsageAlerts,
  autoCompleteOrders,
  cleanupCancelledOrders,
  updateVendorMetrics,
  sendMonthlyReports
};