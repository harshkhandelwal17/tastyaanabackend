const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Check if we're in development mode (either explicitly set or localhost URL)
const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         process.env.BACKEND_URL?.includes('localhost') ||
         process.env.FRONTEND_URL?.includes('localhost') ||
         !process.env.NODE_ENV; // If NODE_ENV is not set, assume development
};

class EmailService {
  constructor() {
    try {
      this.transporter = nodemailer.createTransport({
        // Gmail configuration
        service: 'gmail',
        auth: {
          user:  'tastyaana@gmail.com',
          pass: 'wtywwtzqxjekflvn'
        }
      });

      // Test connection in development mode
      if (isDevelopmentMode()) {
        this.transporter.verify((error) => {
          if (error) {
            console.warn('⚠️  Email service connection failed, will use mock mode:', error.message);
            this.transporter = null; // Disable transporter to trigger mock mode
          } else {
            console.log('✅ Email service ready');
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to create email transporter:', error.message);
      this.transporter = null;
    }

    // Alternative SMTP configuration
    // this.transporter = nodemailer.createTransporter({
    //   host: process.env.SMTP_HOST || 'smtp.gmail.com',
    //   port: process.env.SMTP_PORT || 587,
    //   secure: false,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS
    //   }
    // });

    this.fromEmail = "Tastyaana <tastyaana@gmail.com>" ;
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(userEmail, order) {
    try {
      // Check if transporter is available
      if (!this.transporter) {
        console.error('❌ Email service not configured. Cannot send email.');
        
        // In development, just log the email content instead of failing
        if (isDevelopmentMode()) {
          console.log('📧 [DEV MODE] Order confirmation email that would be sent:');
          console.log(`To: ${userEmail}`);
          console.log(`Subject: 🍯 Order Confirmation - ${order.orderNumber} | Tastyaana`);
          console.log(`Order: #${order.orderNumber}, Amount: ₹${order.totalAmount}`);
          console.log('---');
          return { messageId: 'dev-mode-mock-id', accepted: [userEmail] };
        }
        
        throw new Error('Email service not configured. Please set up SMTP credentials.');
      }

      const emailTemplate = await this.generateOrderConfirmationTemplate(order);
      
      const mailOptions = {
        from: this.fromEmail,
        to: userEmail,
        subject: `🍯 Order Confirmation - ${order.orderNumber} | Tastyaana`,
        html: emailTemplate,
        // attachments: [
        //   {
        //     filename: 'react.svg.png',
        //     path: path.join(__dirname, '../../frontend/src/assets'),
        //     cid: 'logo'
        //   }
        // ]
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Order confirmation email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        console.error('🔐 Gmail authentication failed. Please check your email credentials.');
        console.error('💡 For Gmail, you might need to:');
        console.error('   1. Enable 2-factor authentication');
        console.error('   2. Generate an app password');
        console.error('   3. Use the app password instead of your regular password');
        console.error('   4. Ensure "Less secure app access" is disabled (use app passwords instead)');
      } else if (error.code === 'ECONNECTION') {
        console.error('🌐 Connection failed. Please check your SMTP settings.');
      }
      
      // In development mode, don't throw email errors to prevent order failures
      if (isDevelopmentMode()) {
        console.warn('⚠️  [DEV MODE] Email failed but continuing execution...');
        console.log('📧 [DEV MODE] Order confirmation email that failed to send:');
        console.log(`To: ${userEmail}`);
        console.log(`Subject: 🍯 Order Confirmation - ${order.orderNumber} | Tastyaana`);
        console.log(`Order: #${order.orderNumber}, Amount: ₹${order.totalAmount}`);
        console.log('---');
        return { messageId: 'dev-mode-failed-mock-id', accepted: [], error: error.message };
      }
      
      throw error;
    }
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(userEmail, order, previousStatus) {
    try {
      // Check if transporter is available
      if (!this.transporter) {
        if (isDevelopmentMode()) {
          console.log('📧 [DEV MODE] Order status update email that would be sent:');
          console.log(`To: ${userEmail}`);
          console.log(`Order: #${order.orderNumber}, Status: ${order.status}`);
          console.log('---');
          return { messageId: 'dev-mode-mock-id', accepted: [userEmail] };
        }
        throw new Error('Email service not configured.');
      }

      const emailTemplate = await this.generateStatusUpdateTemplate(order, previousStatus);
      
      const statusEmojis = {
        confirmed: '✅',
        processing: '👨‍🍳',
        shipped: '🚚',
        delivered: '📦',
        cancelled: '❌'
      };

      const mailOptions = {
        from: this.fromEmail,
        to: userEmail,
        subject: `${statusEmojis[order.status]} Order Update - ${order.orderNumber} | Sweet Bliss`,
        html: emailTemplate
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Order status update email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending order status update email:', error);
      
      // In development mode, don't throw email errors
      if (isDevelopmentMode()) {
        console.warn('⚠️  [DEV MODE] Email failed but continuing execution...');
        return { messageId: 'dev-mode-failed-mock-id', accepted: [], error: error.message };
      }
      
      throw error;
    }
  }

  /**
   * Send order cancellation email
   */
  async sendOrderCancellation(userEmail, order, reason) {
    try {
      const emailTemplate = await this.generateCancellationTemplate(order, reason);
      
      const mailOptions = {
        from: this.fromEmail,
        to: userEmail,
        subject: `❌ Order Cancelled - ${order.orderNumber} | Sweet Bliss`,
        html: emailTemplate
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Order cancellation email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending order cancellation email:', error);
      throw error;
    }
  }

  /**
   * Generate order confirmation email template
   */
  /**
   * Generate subscription confirmation email template
   */
  async generateSubscriptionConfirmationTemplate(subscription) {
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    };

    const deliveryDays = subscription.deliverySettings.deliveryDays
      .map(day => day.name)
      .join(', ');

    const deliveryTiming = Object.entries(subscription.deliveryTiming)
      .filter(([_, value]) => value.enabled)
      .map(([key, value]) => `${key} (${value.time})`)
      .join(', ');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Confirmed - Tastyaana</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center;">
          <img src="https://res.cloudinary.com/dcha7gy9o/image/upload/v1755843109/tastyaana_eb1vf3.png" alt="Tastyaana" style="height: 50px; margin-bottom: 15px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Subscription Confirmed! 🎉</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your Tastyaana subscription is now active</p>
        </div>

        <!-- Subscription Details -->
        <div style="padding: 30px;">
          <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0; font-size: 24px;">Subscription #${subscription.subscriptionId}</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              Started on ${formatDate(subscription.startDate)}
            </p>
          </div>

          <!-- Subscription Summary -->
          <div style="margin-bottom: 30px;
            <h3 style="color: #333; border-bottom: 2px solid #ff6b35; padding-bottom: 10px; margin-bottom: 20px;">Your Subscription Details</h3>
            
            <div style="display: flex; justify-content: space-between; margin: 15px 0;">
              <span style="font-weight: bold; color: #555;">Plan:</span>
              <span>${subscription.planType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin: 15px 0;">
              <span style="font-weight: bold; color: #555;">Duration:</span>
              <span>${subscription.duration} days</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin: 15px 0;">
              <span style="font-weight: bold; color: #555;">Delivery Days:</span>
              <span>${deliveryDays}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin: 15px 0;">
              <span style="font-weight: bold; color: #555;">Delivery Time:</span>
              <span>${deliveryTiming}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin: 15px 0;">
              <span style="font-weight: bold; color: #555;">Meals per day:</span>
              <span>${subscription.pricing.mealsPerDay}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin: 15px 0;">
              <span style="font-weight: bold; color: #555;">Total Meals:</span>
              <span>${subscription.pricing.totalMeals}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin: 15px 0;">
              <span style="font-weight: bold; color: #555;">Dietary Preference:</span>
              <span>${subscription.dietaryPreference.charAt(0).toUpperCase() + subscription.dietaryPreference.slice(1)}</span>
            </div>
          </div>

          <!-- Pricing Summary -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Pricing Summary</h3>
            
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Base Price (${subscription.pricing.totalMeals} meals × ₹${subscription.pricing.basePricePerMeal}):</span>
              <span>₹${subscription.pricing.planPrice}</span>
            </div>
            
            ${subscription.pricing.addOnsPrice > 0 ? `
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Add-ons:</span>
              <span>₹${subscription.pricing.addOnsPrice}</span>
            </div>
            ` : ''}
            
            ${subscription.pricing.customizationPrice > 0 ? `
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Customizations:</span>
              <span>₹${subscription.pricing.customizationPrice}</span>
            </div>
            ` : ''}
            
            <hr style="border: none; border-top: 2px solid #ff6b35; margin: 15px 0;">
            
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #ff6b35;">
              <span>Total Amount:</span>
              <span>₹${subscription.pricing.finalAmount}</span>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 10px;">
              Next billing date: ${formatDate(subscription.endDate)}
            </p>
          </div>
          
          <!-- Delivery Address -->
          <div style="margin: 30px 0;">
            <h3 style="color: #333; border-bottom: 2px solid #ff6b35; padding-bottom: 10px; margin-bottom: 15px;">Delivery Address</h3>
            <p style="margin: 5px 0; color: #555;">${subscription.deliveryAddress.street}</p>
            <p style="margin: 5px 0; color: #555;">${subscription.deliveryAddress.city}, ${subscription.deliveryAddress.state} ${subscription.deliveryAddress.pincode}</p>
            ${subscription.deliveryAddress.instructions ? `
            <p style="margin: 10px 0 0 0; color: #666; font-style: italic;">
              <strong>Delivery Instructions:</strong> ${subscription.deliveryAddress.instructions}
            </p>
            ` : ''}
          </div>
          
          <!-- Next Steps -->
          <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 30px 0 0 0;">
            <h3 style="margin: 0 0 15px 0; color: #2e7d32;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
              <li style="margin-bottom: 8px;">Your first meal will be delivered on <strong>${formatDate(subscription.nextDeliveryDate)}</strong></li>
              <li style="margin-bottom: 8px;">You can manage your subscription anytime from your account</li>
              <li style="margin-bottom: 8px;">Need to skip a day? You can skip up to ${subscription.skipSettings.maxSkipsPerMonth} days per month</li>
              <li>For any changes or assistance, reply to this email or call us at +91 1234567890</li>
            </ul>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 14px;">
            <p>Thank you for choosing Tastyaana! We're excited to serve you delicious meals.</p>
            <p>© ${new Date().getFullYear()} Tastyaana. All rights reserved.</p>
            <p style="margin-top: 20px;">
              <a href="https://tastyaana.com/contact" style="color: #ff6b35; text-decoration: none; margin: 0 10px;">Contact Us</a> | 
              <a href="https://tastyaana.com/terms" style="color: #ff6b35; text-decoration: none; margin: 0 10px;">Terms</a> | 
              <a href="https://tastyaana.com/privacy" style="color: #ff6b35; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate order confirmation email template
   */
  async generateOrderConfirmationTemplate(order) {
    console.log(order);
    if (order.subscriptionId) {
      return this.generateSubscriptionConfirmationTemplate(order);
    }
    
    const orderItems = order.items && order.items.map ? order.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 15px 0; vertical-align: top;">
          <div style="display: flex; align-items: center;">
            <img src="${item.image || ''}" alt="${item.name}" style="width: 60px; height: 60px; border-radius: 8px; margin-right: 15px; object-fit: cover;">
            <div>
              <h4 style="margin: 0; color: #333; font-size: 16px;">${item.name}</h4>
              <p style="margin: 5px 0; color: #666; font-size: 14px;">${item?.weight||item?.quantity} × ${item.quantity*item?.price}</p>
            </div>
          </div>
        </td>
        <td style="padding: 15px 0; text-align: right; vertical-align: top;">
          <p style="margin: 0; font-weight: bold; color: #e74c3c; font-size: 16px;">₹${item.price}</p>
          ${item.originalPrice > item.price ? `<p style="margin: 5px 0; color: #888; font-size: 14px; text-decoration: line-through;">₹${item.originalPrice}</p>` : ''}
        </td>
      </tr>
    `).join('') : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center;">
          <img src="https://res.cloudinary.com/dcha7gy9o/image/upload/v1755843109/tastyaana_eb1vf3.png" alt="Tastyaana" style="height: 50px; margin-bottom: 15px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Order Confirmed! </h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for choosing Tastyaana</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 30px;">
          <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0; font-size: 24px;">Order #${order.orderNumber}</h2>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>

          <!-- Order Items -->
          <h3 style="color: #333; border-bottom: 2px solid #ff6b35; padding-bottom: 10px; margin-bottom: 20px;">Your Order</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${orderItems}
          </table>

          <!-- Order Summary -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Order Summary</h3>
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
              <span>Subtotal:</span>
              <span>₹${order.subtotal}</span>
            </div>
            ${order.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #4CAF50;">
              <span>Discount:</span>
              <span>-₹${order.discountAmount}</span>
            </div>
            ` : ''}
               ${order?.taxes &&
  Object.entries(order.taxes).map(([key, value]) =>
    key !== "total" && value > 1 ? 
     ` <div key=${key} style="display: flex; justify-content: space-between; margin: 10px 0; ">
        <span>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
        <span>₹${value.toFixed(2)}</span>
      </div>`
    : ''
  ).join("")} 
            <hr style="border: none; border-top: 2px solid #ff6b35; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #ff6b35;">
              <span>Total:</span>
              <span>₹${order.totalAmount}</span>
            </div>
          </div>

          <!-- Delivery Information -->
          <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; border-left: 4px solid #2196F3;">
            <h3 style="margin: 0 0 15px 0; color: #1976D2;">Delivery Information</h3>
            <p style="margin: 5px 0; color: #333;"><strong>Address:</strong></p>
            <p style="margin: 5px 0; color: #666;">
              ${order.deliveryAddress.street}<br>
              ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}<br>
              Phone: ${order.userContactNo}
            </p>
            <p style="margin: 15px 0 5px 0; color: #333;"><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
            <p style="margin: 15px 0 5px 0; color: #333;"><strong>Delivery Slot:</strong> ${order.deliverySlot}</p>

            ${order?.estimatedDelivery ? `<p style="margin: 5px 0; color: #4CAF50;"><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}</p>` : ''}
          </div>

          ${order?.isGift && order?.giftMessage ? `
          <!-- Gift Message -->
          <div style="background: #fce4ec; padding: 20px; border-radius: 10px; border-left: 4px solid #e91e63; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #c2185b;">🎁 Gift Message</h3>
            <p style="margin: 0; color: #666; font-style: italic;">"${order.giftMessage}"</p>
          </div>
          ` : ''}

          <!-- Next Steps -->
          <div style="background: #fff3e0; padding: 20px; border-radius: 10px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #f57c00;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li style="margin: 8px 0;">We'll start preparing your order immediately</li>
              <li style="margin: 8px 0;">You'll receive tracking details once your order ships</li>
              <li style="margin: 8px 0;">Your order will be delivered fresh and ready to enjoy</li>
            </ul>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/track-order/${order.id}" style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Track Your Order</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; color: white; padding: 30px; text-align: center;">
          <h3 style="margin: 0 0 15px 0;">Tastyaana</h3>
          <p style="margin: 0; opacity: 0.8;">Where Every Bite Tells a Story</p>
          <p style="margin: 15px 0 0 0; opacity: 0.6; font-size: 14px;">
            Need help? Contact us at contact@tastyaana.com or call +91 9203338229
          </p>
          <div style="margin-top: 20px;">
           
            <a href="https://www.instagram.com/tastyaana?igsh=Y2VvZnVqbmx2MG5q" style="color: white; text-decoration: none; margin: 0 10px;">Instagram</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate order status update email template
   */
  async generateStatusUpdateTemplate(order, previousStatus) {
    const statusInfo = {
      confirmed: {
        title: 'Order Confirmed!',
        message: 'Great news! Your order has been confirmed and we\'re preparing your delicious sweets.',
        color: '#4CAF50',
        icon: '✅'
      },
      processing: {
        title: 'Preparing Your Sweets!',
        message: 'Our expert halwais are handcrafting your sweets with love and care.',
        color: '#ff9800',
        icon: '👨‍🍳'
      },
      shipped: {
        title: 'Your Order is on the Way!',
        message: 'Your fresh sweets have been shipped and are heading to your doorstep.',
        color: '#2196F3',
        icon: '🚚'
      },
      delivered: {
        title: 'Order Delivered!',
        message: 'Your sweet delights have been delivered. Enjoy every bite!',
        color: '#4CAF50',
        icon: '📦'
      }
    };

    const currentStatus = statusInfo[order.status] || statusInfo.confirmed;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        
        <!-- Header -->
        <div style="background: ${currentStatus.color}; padding: 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 15px;">${currentStatus.icon}</div>
          <h1 style="color: white; margin: 0; font-size: 28px;">${currentStatus.title}</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Order #${order.orderNumber}</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">${currentStatus.message}</p>
          
          ${order.trackingNumber ? `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1976D2;">Tracking Information</h3>
            <p style="margin: 0; color: #666;">Tracking Number: <strong>${order.trackingNumber}</strong></p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/track/${order.orderNumber}" style="background: ${currentStatus.color}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">View Order Details</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; opacity: 0.8;">Sweet Bliss - Traditional Indian Sweets</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate order cancellation email template
   */
  async generateCancellationTemplate(order, reason) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Cancelled</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        
        <!-- Header -->
        <div style="background: #f44336; padding: 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
          <h1 style="color: white; margin: 0; font-size: 28px;">Order Cancelled</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Order #${order.orderNumber}</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We're sorry to inform you that your order has been cancelled.
          </p>
          
          ${reason ? `
          <div style="background: #ffebee; padding: 20px; border-radius: 10px; border-left: 4px solid #f44336; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #c62828;">Reason for Cancellation</h3>
            <p style="margin: 0; color: #666;">${reason}</p>
          </div>
          ` : ''}

          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            If you paid online, your refund will be processed within 3-5 business days to your original payment method.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/products" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Continue Shopping</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; opacity: 0.8;">Sweet Bliss - Traditional Indian Sweets</p>
          <p style="margin: 10px 0 0 0; opacity: 0.6; font-size: 14px;">
            Questions? Contact us at support@sweetbliss.com
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Send driver email verification
   */
  async sendDriverEmailVerification(userEmail, driver, verificationToken) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/driver/verify-email?token=${verificationToken}`;
      const emailTemplate = await this.generateDriverVerificationTemplate(driver, verificationUrl);
      
      const mailOptions = {
        from: this.fromEmail,
        to: userEmail,
        subject: '🚗 Verify Your Driver Account - Tastyaana',
        html: emailTemplate
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Driver verification email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending driver verification email:', error);
      throw error;
    }
  }

  /**
   * Send driver welcome email
   */
  async sendDriverWelcome(userEmail, driver) {
    try {
      const emailTemplate = await this.generateDriverWelcomeTemplate(driver);
      
      const mailOptions = {
        from: this.fromEmail,
        to: userEmail,
        subject: '🎉 Welcome to Tastyaana Driver Network!',
        html: emailTemplate
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Driver welcome email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending driver welcome email:', error);
      throw error;
    }
  }

  /**
   * Generate driver email verification template
   */
  async generateDriverVerificationTemplate(driver, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Driver Account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2196F3, #1976D2); padding: 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 15px;">🚗</div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Verify Your Driver Account</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to Tastyaana Driver Network</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${driver.name}!</h2>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 20px;">
            Thank you for applying to become a delivery driver with Tastyaana! To complete your registration and start earning, please verify your email address.
          </p>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; border-left: 4px solid #2196F3; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1976D2;">Your Registration Details</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Name:</strong> ${driver.name}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${driver.email}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${driver.phone}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Vehicle:</strong> ${driver.vehicle.type} - ${driver.vehicle.number}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
              Verify Email Address
            </a>
          </div>

          <div style="background: #fff3e0; padding: 20px; border-radius: 10px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #f57c00;">Next Steps After Verification:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li style="margin: 8px 0;">Complete your profile with required documents</li>
              <li style="margin: 8px 0;">Wait for admin approval (usually 24-48 hours)</li>
              <li style="margin: 8px 0;">Start receiving delivery assignments</li>
              <li style="margin: 8px 0;">Begin earning with flexible schedules</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
            This verification link will expire in 24 hours. If you didn't create this account, please ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #333; color: white; padding: 30px; text-align: center;">
          <h3 style="margin: 0 0 15px 0;">Tastyaana Driver Network</h3>
          <p style="margin: 0; opacity: 0.8;">Delivering Delicious Food | Earning Opportunities</p>
          <p style="margin: 15px 0 0 0; opacity: 0.6; font-size: 14px;">
            Need help? Contact us at support@tastyaana.com or call customer support
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate driver welcome email template
   */
  async generateDriverWelcomeTemplate(driver) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Tastyaana Driver Network</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #4CAF50, #45a049); padding: 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Tastyaana!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your driver account is now verified</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #333; margin: 0 0 20px 0;">Congratulations ${driver.name}!</h2>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 20px;">
            Your email has been successfully verified! You're now part of the Tastyaana driver network. Our team will review your application and notify you once approved.
          </p>

          <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #2e7d32;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li style="margin: 8px 0;">Wait for admin approval (usually within 24-48 hours)</li>
              <li style="margin: 8px 0;">You'll receive a notification once approved</li>
              <li style="margin: 8px 0;">Complete any additional document verification if required</li>
              <li style="margin: 8px 0;">Start receiving delivery assignments</li>
            </ul>
          </div>

          <div style="background: #fff3e0; padding: 20px; border-radius: 10px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #f57c00;">Driver Benefits</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li style="margin: 8px 0;">💰 Competitive delivery fees and tips</li>
              <li style="margin: 8px 0;">⏰ Flexible working hours</li>
              <li style="margin: 8px 0;">📱 Easy-to-use driver app</li>
              <li style="margin: 8px 0;">🏆 Performance bonuses and incentives</li>
              <li style="margin: 8px 0;">🛡️ Insurance coverage during deliveries</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" style="background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Access Driver Portal
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; color: white; padding: 30px; text-align: center;">
          <h3 style="margin: 0 0 15px 0;">Tastyaana Driver Network</h3>
          <p style="margin: 0; opacity: 0.8;">Thank you for joining our delivery team!</p>
          <p style="margin: 15px 0 0 0; opacity: 0.6; font-size: 14px;">
            Questions? Contact us at drivers@tastyaana.com
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Send driver assignment notification
   */
  async sendDriverAssignmentNotification(driverEmail, orderDetails, driverName) {
    try {
      // Check if transporter is available
      if (!this.transporter) {
        if (isDevelopmentMode()) {
          console.log('📧 [DEV MODE] Driver assignment email that would be sent:');
          console.log(`To: ${driverEmail}`);
          console.log(`Driver: ${driverName}, Order: #${orderDetails.orderNumber}`);
          console.log('---');
          return { success: true, messageId: 'dev-mode-mock-id' };
        }
        return { success: false, error: 'Email service not configured' };
      }

      const emailTemplate = await this.generateDriverAssignmentTemplate(orderDetails, driverName);
      
      const mailOptions = {
        from: this.fromEmail,
        to: driverEmail,
        subject: `🚚 New Delivery Assignment - Order #${orderDetails.orderNumber} | Tastyaana`,
        html: emailTemplate
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Driver assignment email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending driver assignment email:', error);
      
      // In development mode, return success to not break workflow
      if (isDevelopmentMode()) {
        console.warn('⚠️  [DEV MODE] Email failed but continuing execution...');
        return { success: true, messageId: 'dev-mode-failed-mock-id', error: error.message };
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate driver assignment email template
   */
  async generateDriverAssignmentTemplate(orderDetails, driverName) {
    const deliveryAddress = orderDetails.deliveryAddress;
    const customerPhone = orderDetails.userContactNo || deliveryAddress?.phone;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>New Delivery Assignment</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🚚 New Delivery Assignment</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">You have a new order to deliver!</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px;">
            <p style="font-size: 18px; color: #333; margin: 0 0 25px 0;">Hello ${driverName},</p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 25px 0;">
              You have been assigned a new delivery! Please review the order details below and click "Accept Assignment" to confirm your availability.
            </p>

            <!-- Order Details -->
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; border-left: 4px solid #28a745; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #28a745;">📦 Order Details</h3>
              <p style="margin: 5px 0; color: #333;"><strong>Order Number:</strong> #${orderDetails.orderNumber}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Items:</strong> ${orderDetails.items?.length || 0} items</p>
            </div>

            <!-- Delivery Information -->
            <div style="background: #e3f2fd; padding: 25px; border-radius: 10px; border-left: 4px solid #2196F3; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1976D2;">📍 Delivery Information</h3>
              <p style="margin: 5px 0; color: #333;"><strong>Customer:</strong> ${deliveryAddress?.name || 'N/A'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Phone:</strong> ${customerPhone || 'N/A'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Address:</strong></p>
              <p style="margin: 5px 0; color: #666; padding-left: 15px;">
                ${deliveryAddress?.street || 'N/A'}<br>
                ${deliveryAddress?.city || 'N/A'}, ${deliveryAddress?.state || 'N/A'} - ${deliveryAddress?.zipCode || 'N/A'}
              </p>
            </div>

            <!-- Estimated Earnings -->
            <div style="background: #fff3e0; padding: 25px; border-radius: 10px; border-left: 4px solid #ff9800; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #f57c00;">💰 Estimated Earnings</h3>
              <p style="margin: 5px 0; color: #333; font-size: 18px;"><strong>₹${Math.ceil(orderDetails.totalAmount * 0.1)}</strong> (10% of order value)</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;">Plus tips and incentives</p>
            </div>

            <!-- Action Required -->
            <div style="background: #ffebee; padding: 25px; border-radius: 10px; border-left: 4px solid #f44336; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #d32f2f;">⚡ Action Required</h3>
              <p style="margin: 5px 0; color: #666;">
                Please respond within <strong>5 minutes</strong> to accept this delivery assignment. 
                If not accepted, the order will be reassigned to another driver.
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${process.env.FRONTEND_URL}/driver/dashboard" 
                 style="background: linear-gradient(135deg, #28a745, #20c997); 
                        color: white; 
                        padding: 15px 35px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        display: inline-block; 
                        margin: 0 10px 10px 0;
                        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                ✅ Accept Assignment
              </a>
              <br>
              <a href="${process.env.FRONTEND_URL}/driver/dashboard" 
                 style="background: #6c757d; 
                        color: white; 
                        padding: 12px 30px; 
                        text-decoration: none; 
                        border-radius: 20px; 
                        font-weight: bold; 
                        display: inline-block; 
                        margin: 10px 0;">
                📱 Open Driver App
              </a>
            </div>

            <!-- Important Notes -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0;">
              <h4 style="margin: 0 0 15px 0; color: #333;">📋 Important Notes:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li style="margin: 8px 0;">Check your vehicle and ensure you have enough fuel/charge</li>
                <li style="margin: 8px 0;">Contact customer if you can't find the address</li>
                <li style="margin: 8px 0;">Confirm payment method before delivery</li>
                <li style="margin: 8px 0;">Update order status in the app regularly</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #333; color: white; padding: 30px; text-align: center;">
            <h3 style="margin: 0 0 15px 0;">Tastyaana Delivery</h3>
            <p style="margin: 0; opacity: 0.8;">Delivering Sweet Moments</p>
            <p style="margin: 15px 0 0 0; opacity: 0.6; font-size: 14px;">
              Need help? Contact support at tastyaana@gmail.com or call +91 9876543210
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Test email connection
   */
  async testConnection() {
    try {
      if (!this.transporter) {
        console.log('Email service not configured');
        return false;
      }
      
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('💥 Email service error:', error.message);
      
      // Provide specific guidance for authentication errors
      if (error.code === 'EAUTH') {
        console.error('🔐 Gmail authentication failed. Please check your credentials.');
        console.error('💡 You may need to generate a new Gmail App Password.');
      }
      
      return false;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = {
  sendOrderConfirmation: emailService.sendOrderConfirmation.bind(emailService),
  sendOrderStatusUpdate: emailService.sendOrderStatusUpdate.bind(emailService),
  sendOrderCancellation: emailService.sendOrderCancellation.bind(emailService),
  sendDriverEmailVerification: emailService.sendDriverEmailVerification.bind(emailService),
  sendDriverWelcome: emailService.sendDriverWelcome.bind(emailService),
  sendDriverAssignmentNotification: emailService.sendDriverAssignmentNotification.bind(emailService),
  testConnection: emailService.testConnection.bind(emailService)
};