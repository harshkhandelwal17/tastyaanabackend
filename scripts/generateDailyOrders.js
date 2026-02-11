const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const DailyOrder = require('../models/DailyOrder');
const DailyMeal = require('../models/DailyMeal');
const { connectDB } = require('../config/database');
const moment = require('moment-timezone');

// Connect to database
connectDB();

/**
 * Generate daily orders for all active subscriptions
 * This should be run as a daily cron job
 */
async function generateDailyOrders() {
  try {
    console.log('Starting daily order generation...');
    
    // Get today's date at midnight in the local timezone
    const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
    const dayOfWeek = moment(today).format('dddd').toLowerCase();
    
    console.log(`Generating orders for: ${today} (${dayOfWeek})`);
    
    // Find all active subscriptions that should receive meals today
    const subscriptions = await Subscription.find({
      status: 'active',
      isActive: true,
      startDate: { $lte: today },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: today } }
      ],
      'deliveryDays.day': dayOfWeek
    }).populate('defaultMeal', 'name description price');
    
    console.log(`Found ${subscriptions.length} active subscriptions for today`);
    
    // Get today's default meals
    const dailyMeal = await DailyMeal.findOne({
      date: today
    });
    
    if (!dailyMeal) {
      throw new Error('No daily meal found for today');
    }
    
    // Process each subscription
    let ordersCreated = 0;
    let ordersSkipped = 0;
    
    for (const subscription of subscriptions) {
      try {
        // Check if subscription is paused for today
        if (subscription.pauseDates && subscription.pauseDates.some(
          pause => pause.startDate <= today && pause.endDate >= today
        )) {
          console.log(`Skipping paused subscription: ${subscription._id}`);
          ordersSkipped++;
          continue;
        }
        
        // Check if subscription has a skip for today
        const hasSkippedMeal = subscription.skippedMeals.some(
          skip => skip.date.toDateString() === today.toDateString()
        );
        
        if (hasSkippedMeal) {
          console.log(`Skipping subscription with skipped meal: ${subscription._id}`);
          ordersSkipped++;
          continue;
        }
        
        // Check if order already exists for today
        const existingOrder = await DailyOrder.findOne({
          subscription: subscription._id,
          date: today
        });
        
        if (existingOrder) {
          console.log(`Order already exists for subscription: ${subscription._id}`);
          continue;
        }
        
        // Create daily order
        const orderData = {
          user: subscription.user,
          subscription: subscription._id,
          date: today,
          status: 'pending',
          deliveryAddress: subscription.deliveryAddress,
          deliveryInstructions: subscription.deliveryInstructions,
          paymentStatus: 'pending',
          totalAmount: 0,
          items: []
        };
        
        // Process each shift (morning/evening)
        for (const shift of ['morning', 'evening']) {
          // Skip if subscription doesn't have this shift
          if (shift === 'morning' && !subscription.deliveryTiming.morning.enabled) continue;
          if (shift === 'evening' && !subscription.deliveryTiming.evening.enabled) continue;
          
          // Get the effective meal for this shift
          const mealInfo = await subscription.getMealForDelivery(today, shift);
          
          // Skip if no meal is available
          if (!mealInfo.mealPlan) {
            console.log(`No meal available for ${shift} shift in subscription: ${subscription._id}`);
            continue;
          }
          
          // Calculate item price
          const basePrice = mealInfo.mealPlan.price || 0;
          const addonPrice = mealInfo.customization?.addons?.reduce(
            (sum, addon) => sum + (addon.price * (addon.quantity || 1)), 0
          ) || 0;
          const extraItemPrice = mealInfo.customization?.extraItems?.reduce(
            (sum, item) => sum + (item.price * (item.quantity || 1)), 0
          ) || 0;
          
          const totalPrice = basePrice + addonPrice + extraItemPrice;
          
          // Add to order items
          orderData.items.push({
            shift,
            mealPlan: mealInfo.mealPlan._id,
            mealName: mealInfo.mealPlan.name,
            basePrice,
            addonPrice,
            extraItemPrice,
            totalPrice,
            quantity: 1,
            isCustomized: mealInfo.isCustomized,
            customizationId: mealInfo.customization?._id,
            preferences: mealInfo.preferences || {},
            addons: mealInfo.customization?.addons || [],
            extraItems: mealInfo.customization?.extraItems || [],
            specialInstructions: mealInfo.customization?.specialInstructions || ''
          });
          
          // Update order total
          orderData.totalAmount += totalPrice;
        }
        
        // Skip if no items to order
        if (orderData.items.length === 0) {
          console.log(`No items to order for subscription: ${subscription._id}`);
          ordersSkipped++;
          continue;
        }
        
        // Create the order
        const order = new DailyOrder(orderData);
        await order.save();
        
        console.log(`Created order ${order._id} for subscription: ${subscription._id}`);
        ordersCreated++;
        
      } catch (error) {
        console.error(`Error processing subscription ${subscription._id}:`, error);
        // Continue with next subscription even if one fails
      }
    }
    
    console.log(`Daily order generation completed. Created: ${ordersCreated}, Skipped: ${ordersSkipped}`);
    return {
      success: true,
      ordersCreated,
      ordersSkipped
    };
    
  } catch (error) {
    console.error('Error in generateDailyOrders:', error);
    throw error;
  } finally {
    // Close the database connection
    await mongoose.connection.close();
  }
}

// Run the script if called directly (for testing)
if (require.main === module) {
  generateDailyOrders()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = generateDailyOrders;
