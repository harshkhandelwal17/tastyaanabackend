const cron = require('node-cron');
const moment = require('moment-timezone');
const Subscription = require('../models/Subscription');
const DailyOrder = require('../models/DailyOrder');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');
const Driver = require('../models/Driver');
const nodemailer = require('nodemailer');
const { sendNotification } = require('../utils/notificationService');
const {sendDriverEmailNotificationForTiffin} = require("../utils/driverNotificationService");

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Create daily subscription orders 2 hours before preparation time
 * Morning: 6:00 AM (for 8:00 AM preparation)
 * Evening: 5:00 PM (for 7:00 PM preparation)
 */
class DailySubscriptionOrderService {
  
  // Morning orders creation (runs at 6:00 AM)
  static async createMorningOrders() {
    try {
      console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Starting morning subscription order creation...`);
      
      const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
      const morningPreparationTime = moment().tz('Asia/Kolkata').hour(8).minute(0).second(0).toDate();
      
      await this.createSubscriptionOrders(today, 'morning', morningPreparationTime);
      
    } catch (error) {
      console.error('Error creating morning subscription orders:', error);
    }
  }
  
  // Evening orders creation (runs at 5:00 PM)
  static async createEveningOrders() {
    try {
      console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Starting evening subscription order creation...`);
      
      const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
      const eveningPreparationTime = moment().tz('Asia/Kolkata').hour(19).minute(0).second(0).toDate();
      
      await this.createSubscriptionOrders(today, 'evening', eveningPreparationTime);
      
    } catch (error) {
      console.error('Error creating evening subscription orders:', error);
    }
  }
  
  static async createSubscriptionOrders(date, shift, preparationTime) {
    try {
      // Find all active subscriptions that have meals for this shift
      const activeSubscriptions = await Subscription.find({
        status: 'active',
        // startDate: { $lte: date },
        endDate: { $gte: date },
        $or: [
          { shift: shift },
          { shift: 'both' }
        ]
      }).populate([
        { path: 'user', select: 'name email phone deliveryAddress' },
        { path: 'mealPlan', select: 'title pricing shifts preparationTime seller' }
      ]);

      console.log(`Found ${activeSubscriptions.length} active subscriptions for ${shift} shift`);

      const ordersToCreate = [];
      const notifications = [];

      for (const subscription of activeSubscriptions) {
        try {
          // Check if meal is skipped for this date and shift
          const isSkipped = subscription.skippedMeals.some(skip => 
            moment(skip.date).isSame(date, 'day') && skip.shift === shift
          );

          if (isSkipped) {
            console.log(`Skipping order for subscription ${subscription.subscriptionId} - meal marked as skipped`);
            continue;
          }

          // Check if order already exists for this subscription, date, and shift
          const existingOrder = await DailyOrder.findOne({
            subscriptionId: subscription._id,
            date: date,
            shift: shift
          });

          if (existingOrder) {
            console.log(`Order already exists for subscription ${subscription.subscriptionId} on ${moment(date).format('YYYY-MM-DD')} ${shift}`);
            continue;
          }

          // Get meal details for this subscription
          const mealDetails = await subscription.getMealForDelivery(date, shift);
          
          // Create order data
          const orderData = {
            subscriptionId: subscription._id,
            userId: subscription.user._id,
            vendorId: subscription.mealPlan.seller , // Assuming vendor info is available
            date: date,
            shift: shift,
            preparationTime: preparationTime,
            status: 'pending',
            mealPlan: mealDetails.mealPlan,
            isCustomized: mealDetails.isCustomized,
            customization: mealDetails.customization || null,
            deliveryAddress: subscription.user.deliveryAddress || subscription.deliveryAddress,
            planType: subscription.planType,
            createdAt: new Date(),
            deliveryPartner: null,
            orderType: 'subscription'
          };

          ordersToCreate.push(orderData);
            try {
              // Get all available drivers (not assigned to any order)
              const availableDrivers = await User.find({
                isActive: true,
                'driverProfile.isOnline': true,
                role:'delivery'
              });
          
              if (availableDrivers.length === 0) {
                console.log('No available drivers for normal order notification');
                return;
              }
          
              console.log(`Notifying ${availableDrivers.length} drivers about new order ${orderData}`);
          
              // Send email and browser notifications to all available drivers
              for (const driver of availableDrivers) {
                try {
                  // Send email notification
                  if (driver.email) {
                    await sendDriverEmailNotificationForTiffin(driver, orderData);
                  }
          
                  // Send browser notification
                  // await sendNotification({
                  //   userId: driver._id,
                  //   title: `New Order Available - ${order.orderNumber}`,
                  //   message: `New order worth ₹${order.totalAmount} available for pickup`,
                  //   type: 'new_order',
                  //   data: {
                  //     orderId: order._id,
                  //     orderNumber: order.orderNumber,
                  //     totalAmount: order.totalAmount,
                  //     deliveryAddress: order.deliveryAddress,
                  //     preparationDeadline: order.preparationDeadline
                  //   }
                  // });
          
                  console.log(`Notification sent to driver: ${driver.email || driver.name}`);
          
                } catch (error) {
                  console.error(`Error notifying driver ${driver.email || driver.name}:`, error);
                }
              }
          
            } catch (error) {
              console.error('Error notifying drivers about normal order:', error);
            }

          // Prepare notification for drivers
          // notifications.push({
          // //   type: 'new_subscription_order',
          // //   shift: shift,
          // //   preparationTime: preparationTime,
          // //   orderData: orderData
          // // });

        } catch (error) {
          console.error(`Error processing subscription ${subscription.subscriptionId}:`, error);
        }
      }

      // Bulk create orders
      if (ordersToCreate.length > 0) {
        const createdOrders = await DailyOrder.insertMany(ordersToCreate);
        console.log(`Created ${createdOrders.length} daily subscription orders for ${shift} shift`);

        // Send notifications to drivers
        await this.notifyDriversAboutNewOrders(createdOrders, shift);

        // Update subscription meal counts
        for (const order of createdOrders) {
          await Subscription.findByIdAndUpdate(
            order.subscriptionId,
            { 
              $inc: { 'mealCounts.mealsRemaining': -1 },
              lastOrderDate: date
            }
          );
        }

        return createdOrders;
      }

      return [];

    } catch (error) {
      console.error('Error in createSubscriptionOrders:', error);
      throw error;
    }
  }

  static async notifyDriversAboutNewOrders(orders, shift) {
    try {
      // Get all available drivers
      const availableDrivers = await Driver.find({
        status: 'active',
        isAvailable: true,
        shifts: { $in: [shift, 'both'] }
      });

      if (availableDrivers.length === 0) {
        console.log(`No available drivers for ${shift} shift`);
        return;
      }

      const orderSummary = {
        shift: shift,
        totalOrders: orders.length,
        areas: [...new Set(orders.map(order => order.deliveryAddress?.area || 'Unknown'))],
        preparationTime: orders[0]?.preparationTime
      };

      // Send email notifications to all available drivers
      for (const driver of availableDrivers) {
        try {
          // Send email notification
          if (driver.email) {
            await this.sendDriverEmailNotification(driver, orderSummary);
          }

          // Send browser notification (if driver is online)
          await sendNotification({
            userId: driver._id,
            title: `New Subscription Orders - ${shift.charAt(0).toUpperCase() + shift.slice(1)} Shift`,
            message: `${orderSummary.totalOrders} new tiffin orders available for pickup`,
            type: 'subscription_orders',
            data: orderSummary
          });

        } catch (error) {
          console.error(`Error notifying driver ${driver.email}:`, error);
        }
      }

    } catch (error) {
      console.error('Error notifying drivers:', error);
    }
  }

  static async sendDriverEmailNotification(driver, orderSummary) {
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
        <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
            🚚 New Tiffin Orders Available!
          </h2>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #34495e;">Order Summary:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li><strong>Shift:</strong> ${orderSummary.shift.charAt(0).toUpperCase() + orderSummary.shift.slice(1)}</li>
              <li><strong>Total Orders:</strong> ${orderSummary.totalOrders}</li>
              <li><strong>Preparation Time:</strong> ${moment(orderSummary.preparationTime).format('h:mm A')}</li>
              <li><strong>Delivery Areas:</strong> ${orderSummary.areas.join(', ')}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.DRIVER_DASHBOARD_URL}" 
               style="background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accept Orders
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">
            First come, first served! Log in to your dashboard to accept these orders.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Tastyaana Delivery" <${process.env.EMAIL_USER}>`,
      to: driver.email,
      subject: `New Tiffin Orders - ${orderSummary.shift.charAt(0).toUpperCase() + orderSummary.shift.slice(1)} Shift (${orderSummary.totalOrders} orders)`,
      html: emailTemplate
    });
  }

  // Method to handle driver order acceptance
  static async assignOrderToDriver(orderId, driverId) {
    try {
      const order = await DailyOrder.findById(orderId);
      if (!order || order.deliveryPartner||order.assignedDriver) {
        return { success: false, message: 'Order not available for assignment' };
      }

      // Assign order to driver
      order.deliveryPartner = driverId;
      // order.status = 'assigned';
      order.assignedAt = new Date();
      await order.save();

      // Update driver availability if needed
      await User.findByIdAndUpdate(driverId, {
        $push: { currentOrders: orderId },
        lastActiveAt: new Date()
      });

      return { success: true, message: 'Order assigned successfully', order };

    } catch (error) {
      console.error('Error assigning order to driver:', error);
      return { success: false, message: 'Error assigning order' };
    }
  }

  // Utility method to check for delayed orders
  static async checkDelayedOrders() {
    try {
      const now = new Date();
      
      // Find orders that are overdue (preparation time + 25 minutes buffer)
      const delayedOrders = await DailyOrder.find({
        status: { $nin: ['delivered', 'cancelled'] },
        preparationTime: { $lt: new Date(now.getTime() - 25 * 60 * 1000) },
        isDelayed: { $ne: true }
      });

      for (const order of delayedOrders) {
        // Mark order as delayed
        order.isDelayed = true;
        order.delayedAt = new Date();
        order.delayReason = 'Preparation time exceeded';
        await order.save();

        // Create penalty record (implement penalty logic as needed)
        // This could be integrated with your penalty system
      }

      if (delayedOrders.length > 0) {
        console.log(`Marked ${delayedOrders.length} orders as delayed`);
      }

    } catch (error) {
      console.error('Error checking delayed orders:', error);
    }
  }
}

// Function to initialize cron jobs (to be called after database connection)
const initializeCronJobs = () => {
  console.log('Initializing daily subscription order cron jobs...');
  
  // Morning orders: Run at 11:32 AM IST every day
  cron.schedule('32 11 * * *', () => {
    DailySubscriptionOrderService.createMorningOrders();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Evening orders: Run at 6:32 PM IST every day  
  cron.schedule('32 18 * * *', () => {
    DailySubscriptionOrderService.createEveningOrders();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Check for delayed orders every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    DailySubscriptionOrderService.checkDelayedOrders();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('Daily subscription order cron jobs scheduled successfully');
};

module.exports = { DailySubscriptionOrderService, initializeCronJobs };
