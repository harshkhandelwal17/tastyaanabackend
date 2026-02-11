/**
 * Script to update delivery tracking status to 'pending' for today's morning shift
 * Date: November 26, 2025
 * 
 * This script will:
 * 1. Find all active subscriptions with morning or both shifts
 * 2. Update their delivery tracking status to 'pending' for today's morning shift
 * 3. Reset delivery timestamps and driver assignments if needed
 */

const mongoose = require('mongoose');
const connect = require('../config/database');
const Subscription = require('../models/Subscription');

/**
 * Get current date in Indian timezone (IST) in YYYY-MM-DD format
 */
function getIndianDate() {
  const now = new Date();
  const indianTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // IST is UTC+5:30
  return indianTime.toISOString().split('T')[0];
}

/**
 * Parse a date string and create a proper Indian timezone date at midnight
 */
function parseIndianDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  const utcDate = new Date(date.getTime() - (5.5 * 60 * 60 * 1000));
  return utcDate;
}

/**
 * Main function to update morning shift deliveries to pending
 */
async function updateMorningShiftToPending() {
  try {
    console.log('🚀 Starting morning shift delivery status update...');
    
    // Get today's date in Indian timezone
    const todayIST = getIndianDate();
    const targetDate = parseIndianDate(todayIST);
    
    console.log(`📅 Target date (IST): ${todayIST}`);
    console.log(`📅 Target date (UTC): ${targetDate.toISOString()}`);
    
    // First, let's check all active subscriptions to see what we have
    const allActiveSubscriptions = await Subscription.find({ status: 'active' });
    console.log(`📊 Total active subscriptions: ${allActiveSubscriptions.length}`);
    
    // Find all active subscriptions that have morning or both shifts
    const subscriptions = await Subscription.find({
      status: 'active'
      // Remove the shift filter for now to see all active subscriptions
    });
    
    console.log(`📦 Found ${subscriptions.length} active subscriptions to check`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const subscription of subscriptions) {
      try {
        console.log(`🔍 Checking subscription ${subscription._id} (${subscription.subscriptionId || 'No ID'}) - Shift: ${subscription.shift}`);
        
        // Check if delivery tracking exists for today's morning shift
        const existingDelivery = subscription.deliveryTracking?.find(track => {
          // Convert stored date to Indian timezone for comparison
          const trackDate = new Date(track.date);
          const indianTrackDate = new Date(trackDate.getTime() + (5.5 * 60 * 60 * 1000));
          const trackDateStr = indianTrackDate.toISOString().split('T')[0];
          
          console.log(`  📅 Checking delivery: ${trackDateStr} vs ${todayIST}, Shift: ${track.shift}, Status: ${track.status}`);
          
          return trackDateStr === todayIST && (track.shift === 'morning' || track.shift === 'both');
        });
        
        if (existingDelivery) {
          // Update existing delivery tracking to pending
          const updateResult = await Subscription.findOneAndUpdate(
            { 
              _id: subscription._id,
              'deliveryTracking._id': existingDelivery._id
            },
            {
              $set: {
                'deliveryTracking.$.status': 'pending',
                'deliveryTracking.$.updatedAt': new Date()
              },
              $unset: {
                'deliveryTracking.$.deliveredAt': '',
                'deliveryTracking.$.deliveredBy': ''
              }
            },
            { new: true }
          );
          
          if (updateResult) {
            console.log(`✅ Updated delivery tracking for subscription ${subscription._id} (${subscription.subscriptionId || 'No ID'})`);
            updatedCount++;
          }
        } else {
          // Skip creating new entries - only update existing ones
          console.log(`⚠️ No existing delivery tracking found for today's morning shift - subscription ${subscription._id} (${subscription.subscriptionId || 'No ID'})`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating subscription ${subscription._id}:`, error.message);
        skippedCount++;
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`✅ Updated existing deliveries: ${updatedCount}`);
    console.log(`⚠️ Skipped (no existing delivery): ${skippedCount}`);
    console.log(`📦 Total processed: ${updatedCount + skippedCount}`);
    console.log('\n🎉 Morning shift delivery update completed!');
    
  } catch (error) {
    console.error('❌ Error during morning shift update:', error);
  }
}

/**
 * Run the script
 */
async function runScript() {
  try {
    await connect();
    await updateMorningShiftToPending();
  } catch (error) {
    console.error('❌ Script execution failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script if executed directly
if (require.main === module) {
  console.log('🌅 Morning Shift Delivery Status Update Script');
  console.log('===========================================');
  runScript();
}

module.exports = { updateMorningShiftToPending };