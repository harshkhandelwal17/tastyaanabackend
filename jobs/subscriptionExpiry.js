const cron = require('node-cron');
const { updateExpiredSubscriptions } = require('../utils/subscriptionExpiry');

/**
 * Schedule subscription expiry checks
 * Runs daily at 1 AM to check for expired subscriptions
 * ONLY checks meal count - NO date-based expiry
 */
function startSubscriptionExpiryJob() {
  // Run every day at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('🕐 Running daily meal-count-based subscription expiry check...');
    try {
      const result = await updateExpiredSubscriptions();
      console.log('Daily meal-count subscription expiry check completed:', result);
    } catch (error) {
      console.error('Failed to run meal-count subscription expiry check:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust to your timezone
  });

  console.log('✅ Meal-count-based subscription expiry cron job scheduled (daily at 1 AM)');
}

/**
 * Run expiry check immediately (useful for testing)
 */
async function runExpiryCheckNow() {
  console.log('🔍 Running subscription expiry check immediately...');
  try {
    const result = await updateExpiredSubscriptions();
    console.log('Immediate subscription expiry check completed:', result);
    return result;
  } catch (error) {
    console.error('Failed to run immediate expiry check:', error);
    throw error;
  }
}

module.exports = {
  startSubscriptionExpiryJob,
  runExpiryCheckNow
};