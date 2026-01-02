
// cron/jobs.js
const cron = require('node-cron');
const { generateDailyAnalytics } = require('../utils/analytics');
const { sendEmail, emailTemplates } = require('../utils/email');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const MealPlan = require('../models/MealPlan');
const { processDailyDeductions } = require('../controllers/subscriptionController');

// ============================================
// ============================================
// Daily deduction cron job removed as per requirement
// Subscription deductions will be handled differently
// ============================================
// Export Functions
// ============================================
module.exports = {
  // Daily deduction cron removed
};

// Generate daily analytics for all sellers (runs at 1 AM daily)
cron.schedule('0 1 * * *', async () => {
  console.log('Running daily analytics generation...');
  
  try {
    const sellers = await User.find({ role: 'seller', isActive: true });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (const seller of sellers) {
      await generateDailyAnalytics(seller._id, yesterday);
    }
    
    console.log(`Daily analytics generated for ${sellers.length} sellers`);
  } catch (error) {
    console.error('Error generating daily analytics:', error);
  }
});

// Check for low stock products (runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('Checking for low stock products...');
  
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      isActive: true
    }).populate('seller', 'name email');
    
    for (const product of lowStockProducts) {
      const { subject, html, text } = emailTemplates.lowStock(product);
      // await sendEmail(product.seller.email, subject, html, text);
    }
    
    console.log(`Low stock alerts sent for ${lowStockProducts.length} products`);
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
});

// Clean up old notifications (runs daily at 2 AM)
cron.schedule('0 2 * * *', async () => {
  console.log('Cleaning up old notifications...');
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    });
    
    console.log(`Deleted ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error('Error cleaning notifications:', error);
  }
});

// Update seller ratings (runs daily at 3 AM)
cron.schedule('0 3 * * *', async () => {
  console.log('Updating seller ratings...');
  
  try {
    const sellers = await User.find({ role: 'seller', isActive: true });
    
    for (const seller of sellers) {
      // Calculate average rating from completed orders
      const ratingStats = await Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.seller': seller._id, 'items.status': 'delivered' } },
        { $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }}
      ]);
      
      if (ratingStats.length > 0) {
        await User.findByIdAndUpdate(seller._id, {
          'sellerInfo.rating': Math.round(ratingStats[0].averageRating * 10) / 10,
          'sellerInfo.totalRatings': ratingStats[0].totalRatings
        });
      }
    }
    
    console.log(`Updated ratings for ${sellers.length} sellers`);
  } catch (error) {
    console.error('Error updating seller ratings:', error);
  }
});

// GKK Auto-Order: Generate daily meal orders for active subscriptions (runs at 7 AM daily)
cron.schedule('0 7 * * *', async () => {
  console.log('Running GKK auto-order generation...');
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const isSunday = today.getDay() === 0;

    // Find all active, autoOrder subscriptions with remainingDays > 0
    const subscriptions = await Subscription.find({
      status: 'active',
      autoOrder: true,
      remainingDays: { $gt: 0 }
    });

    for (const sub of subscriptions) {
      // Check if today is paused
      const isPaused = sub.pausedDays && sub.pausedDays.some(p => {
        const d = new Date(p.date); d.setHours(0,0,0,0);
        return d.getTime() === today.getTime();
      });
      if (isPaused) continue;

      // Check if order already exists for today
      const existingOrder = await Order.findOne({
        userId: sub.userId,
        subscriptionId: sub._id,
        orderDate: today
      });
      if (existingOrder) continue;

      // Fetch meal plan
      const mealPlan = await MealPlan.findById(sub.planId);
      if (!mealPlan) continue;

      // Determine per-day price
      let perDayPrice = 0;
      if (sub.totalDays >= 30 && mealPlan.pricing.thirtyDays) {
        perDayPrice = mealPlan.pricing.thirtyDays / 30;
      } else if (sub.totalDays >= 10 && mealPlan.pricing.tenDays) {
        perDayPrice = mealPlan.pricing.tenDays / 10;
      } else {
        perDayPrice = mealPlan.pricing.oneDay;
      }

      // Populate items from meal plan includes
      const items = (mealPlan.includes || []).map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: 0, // base price included in plan
        category: 'main',
        customizations: []
      }));

      // Create new order
      const order = new Order({
        userId: sub.userId,
        type: 'gkk',
        subscriptionId: sub._id,
        isAutoOrder: true,
        isPartOfSubscription: true,
        status: 'pending',
        orderDate: today,
        specialSunday: isSunday,
        paymentMethod: 'subscription',
        paymentStatus: 'paid',
        subtotal: perDayPrice,
        totalAmount: perDayPrice,
        items,
        customizationCharges: { items: [], total: 0 },
      });
      await order.save();

      // Decrement remainingDays
      sub.remainingDays = Math.max(0, sub.remainingDays - 1);
      await sub.save();
    }
    console.log(`GKK auto-orders generated for ${subscriptions.length} subscriptions`);
  } catch (error) {
    console.error('Error generating GKK auto-orders:', error);
  }
});

console.log('Cron jobs initialized');
