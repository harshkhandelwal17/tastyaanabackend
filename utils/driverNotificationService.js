const User = require('../models/User');
const nodemailer = require('nodemailer');
const { sendNotification } = require('./notificationService');
const moment = require('moment-timezone');
const MealPlan = require('../models/MealPlan');
// Create email transporter
const transporter = nodemailer.createTransport({
   service: 'gmail',
      auth: {
        user:  'tastyaana@gmail.com',
        pass: 'evuvbiguzmavkkch'
      }
});

/**
 * Notify all available drivers about new normal orders
 */
const notifyDriversAboutNormalOrder = async (order) => {
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

    console.log(`Notifying ${availableDrivers.length} drivers about new order ${order.orderNumber}`);

    // Send email and browser notifications to all available drivers
    for (const driver of availableDrivers) {
      try {
        // Send email notification
        if (driver.email) {
          await sendDriverEmailNotification(driver, order);
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
};

/**
 * Send email notification to driver about new order
 */
const sendDriverEmailNotificationForTiffin = async (driver, order) => {
  let orderItems = "";
 
  // If it's a subscription order with a defaultMeal → use includes
  if (order.defaultMeal) {
    const mealPlan = await MealPlan.findById(order.defaultMeal).lean();
    console.log(mealPlan);
    if (mealPlan?.includes?.length) {
      orderItems = mealPlan.includes
        .map(item => `${item.name} x ${item.quantity} ${item.unit || ''}`)
        .join(', ');
    }
  }

  // Otherwise fallback to normal items
  if (!orderItems && order.items?.length) {
    orderItems = order.items
      .map(item => `${item.name} x ${item.quantity}`)
      .join(', ');
  }

  const estimatedPickupTime = moment().add(25, 'minutes').format('h:mm A');

  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
          🛵 New Order Available!
        </h2>
        
        <div style="background: #e8f4fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #34495e;">Order Details:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #555;">
            <li><strong>Order Number:</strong> ${order.orderNumber}</li>
            <li><strong>Total Amount:</strong> ₹${order.totalAmount}</li>
            <li><strong>Items:</strong> ${orderItems}</li>
            <li><strong>Estimated Pickup:</strong> ${estimatedPickupTime}</li>
            <li><strong>Delivery Area:</strong> ${order.deliveryAddress?.area || 'N/A'}</li>
          </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-weight: bold;">
            ⏰ Orders must be prepared within 25 minutes to avoid penalties
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DRIVER_DASHBOARD_URL || 'http://localhost:5173/driver/dashboard'}" 
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Accept Order
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">
          First come, first served! Log in to your dashboard to accept this order.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Tastyaana Delivery" <${process.env.EMAIL_USER}>`,
    to: driver.email,
    subject: `New Order Available - ${order.orderNumber} (₹${order.totalAmount})`,
    html: emailTemplate
  });
};


const sendDriverEmailNotification = async (driver, order) => {
  const orderItems = order.items.map(item => 
    `${item.name} x ${item.quantity}`
  ).join(', ');

  const estimatedPickupTime = moment().add(25, 'minutes').format('h:mm A');

  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
          🛵 New Order Available!
        </h2>
        
        <div style="background: #e8f4fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #34495e;">Order Details:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #555;">
            <li><strong>Order Number:</strong> ${order.orderNumber}</li>
            <li><strong>Total Amount:</strong> ₹${order.totalAmount}</li>
            <li><strong>Items:</strong> ${orderItems}</li>
            <li><strong>Estimated Pickup:</strong> ${estimatedPickupTime}</li>
            <li><strong>Delivery Area:</strong> ${order.deliveryAddress?.area || 'N/A'}</li>
          </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-weight: bold;">
            ⏰ Orders must be prepared within 25 minutes to avoid penalties
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DRIVER_DASHBOARD_URL || 'http://localhost:5173/driver/dashboard'}" 
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Accept Order
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">
          First come, first served! Log in to your dashboard to accept this order.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Tastyaana Delivery" <${process.env.EMAIL_USER}>`,
    to: driver.email,
    subject: `New Order Available - ${order.orderNumber} (₹${order.totalAmount})`,
    html: emailTemplate
  });
};
/**
 * Assign order to driver when they accept it
 */
const assignOrderToDriver = async (orderId, driverId) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findById(orderId);
    
    if (!order || order.deliveryPartner) {
      return { success: false, message: 'Order not available for assignment' };
    }

    // Note: Removed 25-minute time limit check to allow drivers to accept orders anytime
    // The penalty logic is handled separately in the order models and controllers

    // Assign order to driver
    order.deliveryPartner = driverId;
    // order.status = 'confirmed';
    order.assignedAt = new Date();
    await order.save();

    // Update driver availability
    await User.findByIdAndUpdate(driverId, {
      $push: { currentOrders: orderId },
      lastActiveAt: new Date()
    });

    console.log(`Order ${order.orderNumber} assigned to driver ${driverId}`);

    return { success: true, message: 'Order assigned successfully', order };

  } catch (error) {
    console.error('Error assigning order to driver:', error);
    return { success: false, message: 'Error assigning order' };
  }
};

/**
 * Send bulk tiffin assignment notification to driver
 */
const sendDriverEmailNotificationForBulkTiffin = async (driver, orderSummary) => {
  const orderList = orderSummary.orders
    .map(order => `• Subscription ${order.subscriptionId} (${order.preparationTime})`)
    .join('<br>');

  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px; text-align: center;">
          🍱 Bulk Tiffin Assignment
        </h2>
        
        <div style="background: #e8f4fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #34495e;">Assignment Details:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #555;">
            <li><strong>Shift:</strong> ${orderSummary.shift.charAt(0).toUpperCase() + orderSummary.shift.slice(1)}</li>
            <li><strong>Total Orders:</strong> ${orderSummary.totalOrders}</li>
            <li><strong>Assigned by:</strong> ${orderSummary.sellerName}</li>
            <li><strong>Date:</strong> ${moment().format('DD MMM YYYY')}</li>
          </ul>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #495057;">Orders Assigned:</h4>
          <div style="color: #666; font-size: 14px; line-height: 1.6;">
            ${orderList}
          </div>
        </div>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 0; color: #155724; font-weight: bold;">
            ✅ You have been assigned ${orderSummary.totalOrders} tiffin orders for pickup and delivery.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.DRIVER_DASHBOARD_URL || 'http://localhost:5173/driver/dashboard'}" 
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Dashboard
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">
          Please check your dashboard to see all assigned orders and delivery details.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Tastyaana Delivery" <tastyaana@gmail.com>`,
    to: driver.email,
    subject: `Bulk Tiffin Assignment - ${orderSummary.totalOrders} orders (${orderSummary.shift.charAt(0).toUpperCase() + orderSummary.shift.slice(1)} shift)`,
    html: emailTemplate
  });
};

module.exports = {
  notifyDriversAboutNormalOrder,
  sendDriverEmailNotification,
  sendDriverEmailNotificationForTiffin,
  sendDriverEmailNotificationForBulkTiffin,
  assignOrderToDriver
};