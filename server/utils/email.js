
// utils/email.js
const nodemailer = require('nodemailer');

// Check if email credentials are configured
const isEmailConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

// Check if we're in development mode (either explicitly set or localhost URL)
const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         process.env.BACKEND_URL?.includes('localhost') ||
         process.env.FRONTEND_URL?.includes('localhost') ||
         !process.env.NODE_ENV; // If NODE_ENV is not set, assume development
};

// Create transporter with proper error handling
const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email service not configured properly. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables.');
    
    // In development, return a mock transporter that logs instead of sending
    if (isDevelopmentMode()) {
      console.log('📧 Running in development mode - emails will be logged instead of sent');
      return null;
    }
    
    return null;
  }

  try {

    console.log(process.env.SMTP_USER, process.env.SMTP_PASS);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // For development only
      }
    });

    // Test connection in development mode
    if (isDevelopmentMode()) {
      transporter.verify((error) => {
        if (error) {
          console.warn('⚠️  Email service connection failed, will use mock mode:', error.message);
        } else {
          console.log('✅ Email service ready');
        }
      });
    }

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

const transporter = createTransporter();

const sendEmail = async (to, subject, html, text) => {
  try {
    if (!transporter) {
      console.error('❌ Email service not configured. Cannot send email.');
      
      // In development, just log the email content instead of failing
      if (isDevelopmentMode()) {
        console.log('📧 [DEV MODE] Email that would be sent:');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Text: ${text}`);
        console.log('---');
        return { messageId: 'dev-mode-mock-id', accepted: [to] };
      }
      
      throw new Error('Email service not configured. Please set up SMTP credentials.');
    }

    const mailOptions = {
      from: `"Tastyaana" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('💥 Email send error:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed. Please check your email credentials.');
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
      console.log('📧 [DEV MODE] Email that failed to send:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log('---');
      return { messageId: 'dev-mode-failed-mock-id', accepted: [], error: error.message };
    }
    
    throw error;
  }
};

// Email templates
const emailTemplates = {
  newOrder: (orderData) => ({
    subject: `New Order Received - #${orderData.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Order Notification</h2>
        <p>You have received a new order:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> #${orderData.orderNumber}</p>
          <p><strong>Customer:</strong> ${orderData.customer.name}</p>
          <p><strong>Total Amount:</strong> ₹${orderData.totalAmount}</p>
          <p><strong>Items:</strong> ${orderData.items.length}</p>
        </div>
        <p>Please log in to your seller panel to manage this order.</p>
      </div>
    `,
    text: `New order #${orderData.orderNumber} received from ${orderData.customer.name}. Total: ₹${orderData.totalAmount}`
  }),

  orderStatusUpdate: (orderData, status) => ({
    subject: `Order Status Updated - #${orderData.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Status Update</h2>
        <p>Your order status has been updated:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>Order Number:</strong> #${orderData.orderNumber}</p>
          <p><strong>New Status:</strong> ${status.toUpperCase()}</p>
          ${orderData.trackingNumber ? `<p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>` : ''}
        </div>
      </div>
    `,
    text: `Order #${orderData.orderNumber} status updated to ${status}`
  }),

  lowStock: (productData) => ({
    subject: `Low Stock Alert - ${productData.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Low Stock Alert</h2>
        <p>One of your products is running low on stock:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>Product:</strong> ${productData.title}</p>
          <p><strong>Current Stock:</strong> ${productData.stock} units</p>
          <p><strong>Threshold:</strong> ${productData.lowStockThreshold} units</p>
        </div>
        <p>Please restock this item to avoid stockouts.</p>
      </div>
    `,
    text: `Low stock alert: ${productData.title} - ${productData.stock} units remaining`
  })
};

module.exports = { sendEmail, emailTemplates, isEmailConfigured };
