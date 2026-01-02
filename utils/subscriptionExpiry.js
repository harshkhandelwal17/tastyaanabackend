const Subscription = require('../models/Subscription');
const moment = require('moment');

/**
 * Check and update expired subscriptions - ONLY based on meals remaining
 * Subscriptions expire ONLY when mealsRemaining is 0 or less
 */
async function updateExpiredSubscriptions() {
  try {
    console.log('🔍 Checking for subscriptions with no meals remaining...');
    
    // ONLY check subscriptions with no meals remaining (removed date-based expiry)
    const completedSubscriptions = await Subscription.find({
      status: { $in: ['active', 'paused'] },
      'mealCounts.mealsRemaining': { $lte: 0 }
    });
    
    console.log(`Found ${completedSubscriptions.length} subscriptions with no meals remaining`);
    
    let updatedCount = 0;
    
    for (const subscription of completedSubscriptions) {
      try {
        subscription.status = 'expired';
        subscription.isActive = false;
        await subscription.save();
        
        console.log(`✅ Expired subscription ${subscription.subscriptionId} (all meals delivered)`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Failed to update subscription ${subscription.subscriptionId}:`, error.message);
      }
    }
    
    console.log(`🎉 Updated ${updatedCount} completed subscriptions`);
    
    return {
      success: true,
      completedCount: completedSubscriptions.length,
      updatedCount
    };
    
  } catch (error) {
    console.error('❌ Error updating expired subscriptions:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if a specific subscription should be expired - ONLY based on meals remaining
 */
async function checkSubscriptionExpiry(subscriptionId) {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    // ONLY check meals remaining, ignore date-based expiry
    const isExpiredByMeals = subscription.mealCounts && subscription.mealCounts.mealsRemaining <= 0;
    
    if (isExpiredByMeals && subscription.status === 'active') {
      subscription.status = 'expired';
      subscription.isActive = false;
      await subscription.save();
      
      console.log(`✅ Subscription ${subscription.subscriptionId} marked as expired (no meals remaining)`);
      return { updated: true, reason: 'meals' };
    }
    
    return { updated: false };
    
  } catch (error) {
    console.error('❌ Error checking subscription expiry:', error);
    throw error;
  }
}

module.exports = {
  updateExpiredSubscriptions,
  checkSubscriptionExpiry
};