// const nodemailer = require('nodemailer');
// const moment = require('moment');

// // ==================== EMAIL CONFIGURATION ====================

// const transporter = nodemailer.createTransporter({
//   host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//   port: process.env.EMAIL_PORT || 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// // ==================== NOTIFICATION TEMPLATES ====================

// const emailTemplates = {
//   orderPlaced: (order, vendor) => ({
//     subject: `Order Confirmed - ${order.orderNumber}`,
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2 style="color: #4CAF50;">🧺 Order Confirmed!</h2>
//         <p>Dear Customer,</p>
//         <p>Your laundry order has been successfully placed.</p>
        
//         <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
//           <h3 style="margin-top: 0;">Order Details</h3>
//           <p><strong>Order Number:</strong> ${order.orderNumber}</p>
//           <p><strong>Vendor:</strong> ${vendor.name}</p>
//           <p><strong>Total Items:</strong> ${order.totalItems}</p>
//           <p><strong>Total Amount:</strong> ₹${order.pricing.total}</p>
//         </div>
        
//         <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
//           <h3 style="margin-top: 0;">📅 Schedule</h3>
//           <p><strong>Pickup:</strong> ${moment(order.schedule.pickup.date).format('DD MMM YYYY')}, ${order.schedule.pickup.timeRange}</p>
//           <p><strong>Delivery:</strong> ${moment(order.schedule.delivery.date).format('DD MMM YYYY')}, ${order.schedule.delivery.timeRange}</p>
//         </div>
        
//         <p>You can track your order anytime from your dashboard.</p>
//         <p>Thank you for choosing Tastyaana!</p>
//       </div>
//     `
//   }),

//   statusUpdate: (order, newStatus) => ({
//     subject: `Order ${newStatus.replace('_', ' ').toUpperCase()} - ${order.orderNumber}`,
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2 style="color: #2196F3;">📦 Order Status Update</h2>
//         <p>Dear Customer,</p>
//         <p>Your order <strong>${order.orderNumber}</strong> status has been updated.</p>
        
//         <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
//           <h2 style="color: #4CAF50; margin: 0;">${newStatus.replace('_', ' ').toUpperCase()}</h2>
//         </div>
        
//         ${newStatus === 'delivered' ? `
//           <p>Your laundry has been delivered! We hope you're satisfied with our service.</p>
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${process.env.APP_URL}/orders/${order._id}/feedback" 
//                style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
//               Rate Your Experience
//             </a>
//           </div>
//         ` : ''}
        
//         <p>Track your order: <a href="${process.env.APP_URL}/orders/${order._id}/track">Click here</a></p>
//       </div>
//     `
//   }),

//   subscriptionCreated: (subscription, vendor) => ({
//     subject: `Subscription Activated - ${subscription.plan.name}`,
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2 style="color: #9C27B0;">🎉 Subscription Activated!</h2>
//         <p>Dear Customer,</p>
//         <p>Your ${subscription.plan.name} with ${vendor.name} is now active.</p>
        
//         <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
//           <h3 style="margin-top: 0;">Plan Details</h3>
//           <p><strong>Plan:</strong> ${subscription.plan.name}</p>
//           <p><strong>Price:</strong> ₹${subscription.plan.price}/month</p>
//           <p><strong>Max Weight:</strong> ${subscription.plan.maxWeight || 'Unlimited'} kg/month</p>
//           <p><strong>Valid Till:</strong> ${moment(subscription.period.endDate).format('DD MMM YYYY')}</p>
//         </div>
        
//         <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
//           <h3 style="margin-top: 0;">✨ Benefits</h3>
//           <ul>
//             ${subscription.plan.features.unlimitedPickups ? '<li>Unlimited pickups</li>' : ''}
//             ${subscription.plan.features.freeDryClean ? `<li>${subscription.plan.features.freeDryClean} free dry clean items/month</li>` : ''}
//             ${subscription.plan.features.priority ? '<li>Priority service</li>' : ''}
//             ${subscription.plan.features.vipSupport ? '<li>VIP customer support</li>' : ''}
//           </ul>
//         </div>
        
//         <p>Start scheduling your pickups from the dashboard!</p>
//       </div>
//     `
//   }),

//   subscriptionRenewal: (subscription) => ({
//     subject: `Subscription Renewal Reminder`,
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2 style="color: #FF9800;">🔄 Renewal Reminder</h2>
//         <p>Dear Customer,</p>
//         <p>Your subscription will renew on <strong>${moment(subscription.period.nextRenewalDate).format('DD MMM YYYY')}</strong>.</p>
        
//         <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
//           <p><strong>Plan:</strong> ${subscription.plan.name}</p>
//           <p><strong>Amount:</strong> ₹${subscription.plan.price}</p>
//           <p><strong>Auto-renewal:</strong> ${subscription.billing.autoRenewal ? 'Enabled' : 'Disabled'}</p>
//         </div>
        
//         ${!subscription.billing.autoRenewal ? `
//           <p style="color: #f44336;"><strong>Note:</strong> Auto-renewal is disabled. Please renew manually to continue enjoying uninterrupted service.</p>
//         ` : ''}
        
//         <p>Manage your subscription: <a href="${process.env.APP_URL}/subscriptions/${subscription._id}">Click here</a></p>
//       </div>
//     `
//   }),

//   pickupReminder: (order, vendor) => ({
//     subject: `Pickup Scheduled Tomorrow - ${order.orderNumber}`,
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2 style="color: #FF5722;">⏰ Pickup Reminder</h2>
//         <p>Dear Customer,</p>
//         <p>This is a reminder that your laundry pickup is scheduled for <strong>tomorrow</strong>.</p>
        
//         <div style="background: #fbe9e7; padding: 15px; border-radius: 8px; margin: 20px 0;">
//           <p><strong>Order:</strong> ${order.orderNumber}</p>
//           <p><strong>Date:</strong> ${moment(order.schedule.pickup.date).format('DD MMM YYYY')}</p>
//           <p><strong>Time:</strong> ${order.schedule.pickup.timeRange}</p>
//           <p><strong>Address:</strong> ${order.schedule.pickup.address.street}, ${order.schedule.pickup.address.area}</p>
//         </div>
        
//         <p><strong>Please keep your laundry ready!</strong></p>
//         <p>Contact: ${vendor.phone}</p>
//       </div>
//     `
//   })
// };

// // ==================== SMS TEMPLATES ====================

// const smsTemplates = {
//   orderPlaced: (order) => 
//     `Tastyaana: Order ${order.orderNumber} placed successfully. Pickup on ${moment(order.schedule.pickup.date).format('DD MMM')} between ${order.schedule.pickup.timeRange}. Track: ${process.env.APP_URL}/orders/${order._id}`,

//   statusUpdate: (order, status) => 
//     `Tastyaana: Order ${order.orderNumber} is now ${status.replace('_', ' ').toUpperCase()}. Track: ${process.env.APP_URL}/orders/${order._id}`,

//   pickupReminder: (order) => 
//     `Tastyaana: Pickup reminder for order ${order.orderNumber} tomorrow between ${order.schedule.pickup.timeRange}. Please keep laundry ready.`,

//   delivered: (order) => 
//     `Tastyaana: Order ${order.orderNumber} delivered! Rate your experience: ${process.env.APP_URL}/orders/${order._id}/feedback`
// };

// // ==================== NOTIFICATION FUNCTIONS ====================

// /**
//  * Send email notification
//  */
// exports.sendEmail = async (to, template, data) => {
//   try {
//     if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//       console.log('Email credentials not configured');
//       return { success: false, message: 'Email not configured' };
//     }

//     const emailContent = emailTemplates[template](data);

//     const mailOptions = {
//       from: `"Tastyaana Laundry" <${process.env.EMAIL_USER}>`,
//       to,
//       subject: emailContent.subject,
//       html: emailContent.html
//     };

//     const info = await transporter.sendMail(mailOptions);

//     console.log('✅ Email sent:', info.messageId);
//     return { success: true, messageId: info.messageId };

//   } catch (error) {
//     console.error('❌ Email error:', error.message);
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Send SMS notification (Mock - integrate with SMS gateway)
//  */
// exports.sendSMS = async (phone, template, data) => {
//   try {
//     const message = smsTemplates[template](data);

//     // TODO: Integrate with SMS gateway (Twilio, MSG91, etc.)
//     console.log(`📱 SMS to ${phone}: ${message}`);

//     // Mock response
//     return { success: true, message: 'SMS sent successfully' };

//   } catch (error) {
//     console.error('❌ SMS error:', error.message);
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Send push notification (Mock - integrate with FCM/OneSignal)
//  */
// exports.sendPushNotification = async (userId, title, body, data) => {
//   try {
//     // TODO: Integrate with Firebase Cloud Messaging or OneSignal
//     console.log(`🔔 Push to user ${userId}:`, { title, body, data });

//     // Mock response
//     return { success: true, message: 'Push notification sent' };

//   } catch (error) {
//     console.error('❌ Push notification error:', error.message);
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Send multi-channel notification
//  */
// exports.sendNotification = async (user, type, data) => {
//   const results = {};

//   // Email
//   if (user.email && user.preferences?.notifications?.email !== false) {
//     results.email = await exports.sendEmail(user.email, type, data);
//   }

//   // SMS
//   if (user.phone && user.preferences?.notifications?.sms !== false) {
//     results.sms = await exports.sendSMS(user.phone, type, data);
//   }

//   // Push
//   if (user._id && user.preferences?.notifications?.push !== false) {
//     const pushData = {
//       order: type,
//       orderId: data.order?._id || data.subscription?._id
//     };
//     results.push = await exports.sendPushNotification(
//       user._id,
//       `Tastyaana Laundry`,
//       smsTemplates[type](data),
//       pushData
//     );
//   }

//   return results;
// };

// /**
//  * Schedule pickup reminder (1 day before)
//  */
// exports.schedulePickupReminder = async (order, user, vendor) => {
//   try {
//     const pickupDate = moment(order.schedule.pickup.date);
//     const reminderDate = pickupDate.subtract(1, 'day');

//     // Check if reminder date is in future
//     if (reminderDate.isAfter(moment())) {
//       // TODO: Use job scheduler (Bull, Agenda) to schedule
//       console.log(`⏰ Pickup reminder scheduled for ${reminderDate.format('DD MMM YYYY')}`);
      
//       // Mock: In production, add to job queue
//       // await reminderQueue.add('pickup-reminder', {
//       //   orderId: order._id,
//       //   userId: user._id,
//       //   vendorId: vendor._id
//       // }, {
//       //   delay: reminderDate.diff(moment())
//       // });
//     }

//     return { success: true };
//   } catch (error) {
//     console.error('Error scheduling reminder:', error.message);
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Send order status update notification
//  */
// exports.notifyOrderStatus = async (order, newStatus) => {
//   try {
//     const User = require('../models/User');
//     const LaundryVendor = require('../models/LaundryVendor');

//     const user = await User.findById(order.user);
//     const vendor = await LaundryVendor.findById(order.vendor);

//     if (!user) {
//       return { success: false, message: 'User not found' };
//     }

//     await exports.sendNotification(user, 'statusUpdate', { order, newStatus, vendor });

//     return { success: true };
//   } catch (error) {
//     console.error('Error sending status notification:', error.message);
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Send subscription renewal reminder
//  */
// exports.notifySubscriptionRenewal = async (subscriptionId) => {
//   try {
//     const LaundrySubscription = require('../models/LaundrySubscription');
//     const User = require('../models/User');

//     const subscription = await LaundrySubscription.findById(subscriptionId)
//       .populate('vendor', 'name');

//     if (!subscription) {
//       return { success: false, message: 'Subscription not found' };
//     }

//     const user = await User.findById(subscription.user);

//     if (!user) {
//       return { success: false, message: 'User not found' };
//     }

//     await exports.sendNotification(user, 'subscriptionRenewal', { subscription });

//     return { success: true };
//   } catch (error) {
//     console.error('Error sending renewal reminder:', error.message);
//     return { success: false, error: error.message };
//   }
// };

// /**
//  * Batch send notifications to multiple users
//  */
// exports.sendBulkNotification = async (userIds, type, data) => {
//   try {
//     const User = require('../models/User');
//     const users = await User.find({ _id: { $in: userIds } });

//     const results = [];

//     for (const user of users) {
//       const result = await exports.sendNotification(user, type, data);
//       results.push({ userId: user._id, result });
//     }

//     return { success: true, results };
//   } catch (error) {
//     console.error('Error sending bulk notifications:', error.message);
//     return { success: false, error: error.message };
//   }
// };

// module.exports = exports;