// utils/cronJobs.js
const DailyMeal = require('../models/DailyMeal');
const Subscription = require('../models/Subscription');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('./notificationService');

/**
 * Generate daily meals for the next day
 * Runs at 12 AM every day
 */
exports.generateDailyMeals = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Check if meal already exists for tomorrow
    const existingMeal = await DailyMeal.findOne({ date: tomorrow });
    if (existingMeal) {
      console.log('Daily meal already exists for', tomorrow.toDateString());
      return;
    }

    // Sample meal data - in production, this would come from a menu planning system
    const mealData = {
      date: tomorrow,
      meals: {
        low: {
          lunch: {
            items: [
              { name: 'Rice', description: '1 serving', quantity: '1 bowl' },
              { name: 'Dal', description: 'Yellow lentils', quantity: '1 bowl' },
              { name: 'Roti', description: 'Wheat flatbread', quantity: '2 pieces' },
              { name: 'Vegetable', description: 'Seasonal sabzi', quantity: '1 serving' }
            ],
            totalCalories: 400,
            price: 80
          },
          dinner: {
            items: [
              { name: 'Roti', description: 'Wheat flatbread', quantity: '3 pieces' },
              { name: 'Dal', description: 'Lentil curry', quantity: '1 bowl' },
              { name: 'Vegetable', description: 'Mixed vegetables', quantity: '1 serving' }
            ],
            totalCalories: 350,
            price: 70
          }
        },
        basic: {
          lunch: {
            items: [
              { name: 'Rice', description: 'Basmati rice', quantity: '1 bowl' },
              { name: 'Dal', description: 'Dal tadka', quantity: '1 bowl' },
              { name: 'Roti', description: 'Fresh roti', quantity: '2 pieces' },
              { name: 'Vegetable', description: 'Paneer curry', quantity: '1 serving' },
              { name: 'Pickle', description: 'Homemade pickle', quantity: '1 tbsp' }
            ],
            totalCalories: 550,
            price: 120
          },
          dinner: {
            items: [
              { name: 'Roti', description: 'Fresh roti', quantity: '3 pieces' },
              { name: 'Vegetable', description: 'Special curry', quantity: '1 serving' },
              { name: 'Dal', description: 'Dal makhani', quantity: '1 bowl' },
              { name: 'Salad', description: 'Fresh salad', quantity: '1 serving' }
            ],
            totalCalories: 500,
            price: 110
          }
        },
        premium: {
          lunch: {
            items: [
              { name: 'Basmati Rice', description: 'Premium basmati', quantity: '1 bowl' },
              { name: 'Dal', description: 'Dal makhani', quantity: '1 bowl' },
              { name: 'Roti', description: 'Butter roti', quantity: '3 pieces' },
              { name: 'Paneer', description: 'Paneer makhani', quantity: '1 serving' },
              { name: 'Raita', description: 'Cucumber raita', quantity: '1 bowl' },
              { name: 'Sweet', description: 'Gulab jamun', quantity: '1 piece' }
            ],
            totalCalories: 700,
            price: 180
          },
          dinner: {
            items: [
              { name: 'Roti', description: 'Butter naan', quantity: '2 pieces' },
              { name: 'Rice', description: 'Jeera rice', quantity: '1 bowl' },
              { name: 'Paneer', description: 'Shahi paneer', quantity: '1 serving' },
              { name: 'Dal', description: 'Dal makhani', quantity: '1 bowl' },
              { name: 'Dessert', description: 'Kheer', quantity: '1 bowl' }
            ],
            totalCalories: 650,
            price: 170
          }
        }
      },
      sundaySpecial: {
        isSpecialDay: tomorrow.getDay() === 0, // Sunday
        specialItems: tomorrow.getDay() === 0 ? [
          { name: 'Chole Bhature', description: 'Special Sunday treat', price: 80, category: 'main' },
          { name: 'Lassi', description: 'Sweet lassi', price: 30, category: 'beverage' }
        ] : [],
        extraCharges: tomorrow.getDay() === 0 ? 50 : 0,
        includedInPlan: false
      },
      nutritionalInfo: {
        low: { calories: 750, protein: '20g', carbs: '120g', fat: '15g' },
        basic: { calories: 1050, protein: '35g', carbs: '150g', fat: '25g' },
        premium: { calories: 1350, protein: '45g', carbs: '180g', fat: '35g' }
      },
      createdBy: null // System generated
    };

    const dailyMeal = new DailyMeal(mealData);
    await dailyMeal.save();

    console.log('✅ Daily meal generated for', tomorrow.toDateString());
  } catch (error) {
    console.error('❌ Error generating daily meal:', error);
  }
};

/**
 * Process auto-orders for active subscriptions
 * Runs at 6 AM every day
 */
exports.processAutoOrders = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active subscriptions with auto-order enabled
    const activeSubscriptions = await Subscription.find({
      status: 'active',
      autoOrder: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate('userId planId');

    console.log(`Processing auto-orders for ${activeSubscriptions.length} subscriptions`);

    for (const subscription of activeSubscriptions) {
      try {
        // Check if user has paused today
        const isPausedToday = subscription.pausedDays.some(pausedDay => {
          const pauseDate = new Date(pausedDay.date);
          pauseDate.setHours(0, 0, 0, 0);
          return pauseDate.getTime() === today.getTime();
        });

        if (isPausedToday) {
          console.log(`Skipping auto-order for user ${subscription.userId._id} - paused today`);
          continue;
        }

        // Create orders for each delivery slot
        const ordersToCreate = [];

        if (subscription.deliverySlots.lunch) {
          ordersToCreate.push({
            userId: subscription.userId._id,
            type: 'gkk',
            subscriptionId: subscription._id,
            items: [{
              name: `${subscription.planId.title} - Lunch`,
              quantity: 1,
              price: subscription.planId.pricing.oneDay / 2, // Half price for lunch
              category: 'main'
            }],
            deliveryDate: today,
            deliverySlot: 'lunch',
            totalAmount: subscription.planId.pricing.oneDay / 2,
            finalAmount: subscription.planId.pricing.oneDay / 2,
            paymentMethod: 'subscription',
            paymentStatus: 'paid',
            deliveryAddress: subscription.deliveryAddress || subscription.userId.address,
            cancelBefore: new Date(today.getTime() + 6 * 60 * 60 * 1000), // 6 AM
            isAutoOrder: true,
            status: 'confirmed'
          });
        }

        if (subscription.deliverySlots.dinner) {
          ordersToCreate.push({
            userId: subscription.userId._id,
            type: 'gkk',
            subscriptionId: subscription._id,
            items: [{
              name: `${subscription.planId.title} - Dinner`,
              quantity: 1,
              price: subscription.planId.pricing.oneDay / 2, // Half price for dinner
              category: 'main'
            }],
            deliveryDate: today,
            deliverySlot: 'dinner',
            totalAmount: subscription.planId.pricing.oneDay / 2,
            finalAmount: subscription.planId.pricing.oneDay / 2,
            paymentMethod: 'subscription',
            paymentStatus: 'paid',
            deliveryAddress: subscription.deliveryAddress || subscription.userId.address,
            cancelBefore: new Date(today.getTime() + 6 * 60 * 60 * 1000), // 6 AM
            isAutoOrder: true,
            status: 'confirmed'
          });
        }

        // Create orders
        for (const orderData of ordersToCreate) {
          const order = new Order(orderData);
          await order.save();

          // Send notification
          await createNotification({
            userId: subscription.userId._id,
            title: 'Auto-Order Created',
            message: `Your ${orderData.deliverySlot} meal has been automatically ordered for today.`,
            type: 'order',
            data: { orderId: order._id }
          });
        }

        // Update remaining days
        subscription.remainingDays = Math.max(0, subscription.remainingDays - 1);
        
        // Check if subscription should expire
        if (subscription.remainingDays <= 0) {
          subscription.status = 'completed';
          
          // Send completion notification
          await createNotification({
            userId: subscription.userId._id,
            title: 'Subscription Completed',
            message: 'Your meal subscription has completed. Consider renewing for continued service!',
            type: 'subscription',
            data: { subscriptionId: subscription._id }
          });
        }

        await subscription.save();

      } catch (orderError) {
        console.error(`Error processing auto-order for subscription ${subscription._id}:`, orderError);
      }
    }

    console.log('✅ Auto-order processing completed');

  } catch (error) {
    console.error('❌ Error processing auto-orders:', error);
  }
};



// utils/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send email
 */
exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"Tastyaana" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

/**
 * Send welcome email
 */
exports.sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to Tastyaana</h1>
      </div>
      
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Hello ${name}!</h2>
        
        <p style="color: #374151; line-height: 1.6;">
          Thank you for joining Tastyaana family! We're excited to bring you the taste of home-cooked meals with the convenience of modern delivery.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #f97316; margin-top: 0;">What's next?</h3>
          <ul style="color: #374151; line-height: 1.8;">
            <li>🍛 Browse our delicious meal plans</li>
            <li>📅 Check out this week's menu</li>
            <li>🛒 Place your first order</li>
            <li>🎯 Customize your preferences</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/meal-plans" 
             style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Start Ordering Now
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Need help? Reply to this email or contact us at <a href="tel:+919876543210">+91 98765-43210</a>
        </p>
      </div>
      
      <div style="background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>&copy; 2025 Tastyaana. All rights reserved.</p>
        <p>Made with ❤️ in India</p>
      </div>
    </div>
  `;

  return this.sendEmail({
    to: email,
    subject: 'Welcome to Tastyaana - Your Food Journey Begins! 🎉',
    html
  });
};

// utils/paymentService.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Process payment
 */
/**
 * Process payment
 */
exports.processPayment = async ({
  amount,
  currency = 'INR',
  method,
  userId,
  orderId,
  description
}) => {
  try {
    if (method === 'razorpay') {
      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt: `order_${Date.now()}`,
        notes: {
          userId,
          orderId: orderId?.toString(),
          description
        }
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      };
    }

    // Handle other payment methods here
    return {
      success: false,
      error: 'Payment method not supported'
    };

  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify Razorpay payment signature
 */
exports.verifyPaymentSignature = (paymentId, orderId, signature) => {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
};

// utils/otpService.js
/**
 * Generate OTP
 */




// .env file template
/*
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/ghar-ka-khana

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS Configuration (Optional)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=GHARKA

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Redis (Optional - for caching and sessions)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
*/

// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp'),
  ],
}

// // src/index.css
// @tailwind base;
// @tailwind components;
// @tailwind utilities;

// /* Custom styles */
// @layer base {
//   * {
//     @apply border-border;
//   }
  
//   body {
//     @apply bg-background text-foreground;
//     font-feature-settings: "rlig" 1, "calt" 1;
//   }
// }

// @layer components {
//   .btn {
//     @apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background;
//   }
  
//   .btn-primary {
//     @apply bg-orange-600 text-white hover:bg-orange-700;
//   }
  
//   .btn-secondary {
//     @apply bg-gray-200 text-gray-900 hover:bg-gray-300;
//   }
  
//   .card {
//     @apply rounded-lg border bg-card text-card-foreground shadow-sm;
//   }
  
//   .input {
//     @apply flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
//   }
// }

// @layer utilities {
//   .text-balance {
//     text-wrap: balance;
//   }
  
//   .line-clamp-2 {
//     display: -webkit-box;
//     -webkit-line-clamp: 2;
//     -webkit-box-orient: vertical;
//     overflow: hidden;
//   }
  
//   .line-clamp-3 {
//     display: -webkit-box;
//     -webkit-line-clamp: 3;
//     -webkit-box-orient: vertical;
//     overflow: hidden;
//   }
// }

// /* Custom scrollbar */
// ::-webkit-scrollbar {
//   width: 6px;
// }

// ::-webkit-scrollbar-track {
//   background: #f1f1f1;
// }

// ::-webkit-scrollbar-thumb {
//   background: #c1c1c1;
//   border-radius: 3px;
// }

// ::-webkit-scrollbar-thumb:hover {
//   background: #a8a8a8;
// }

// /* Loading animations */
// .skeleton {
//   @apply animate-pulse bg-gray-200 rounded;
// }

// .shimmer {
//   background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
//   background-size: 200% 100%;
//   animation: shimmer 1.5s infinite;
// }

// @keyframes shimmer {
//   0% {
//     background-position: -200% 0;
//   }
//   100% {
//     background-position: 200% 0;
//   }
// }

// /* Mobile responsive */
// @media (max-width: 768px) {
//   .container {
//     @apply px-4;
//   }
// }

// /* Print styles */
// @media print {
//   .no-print {
//     display: none !important;
//   }
  
//   .print-break {
//     page-break-after: always;
//   }
// }

// // README.md
// # 🏠 Ghar Ka Khana - Homestyle Food Delivery Platform

// A comprehensive food delivery platform built with Node.js, Express, React, and MongoDB, focusing on homestyle Indian meals with subscription-based ordering and custom food requests.

// ## ✨ Features

// ### 🍽️ Core Features
// - **Meal Subscription Plans**: Low Cost, Basic, and Premium tiers with 1, 10, and 30-day options
// - **Daily Fresh Menus**: Auto-generated daily meals with nutritional information
// - **Custom Food Ordering**: Bidding system for restaurants to fulfill custom requests
// - **Sunday Specials**: Weekly special meals and treats
// - **Tiffin Washing Service**: Eco-friendly tiffin return and wash service for 30-day plans

// ### 👥 User Features
// - **Smart Authentication**: JWT-based auth with OTP verification
// - **Personalized Preferences**: Dietary restrictions, spice levels, allergies management
// - **Wallet System**: Digital wallet with loyalty points and referral bonuses
// - **Real-time Tracking**: Live order status updates with delivery tracking
// - **Review System**: Comprehensive rating and review system for meals and service

// ### 🏪 Restaurant Features
// - **Bidding Dashboard**: Participate in custom food request auctions
// - **Order Management**: Track and manage incoming orders
// - **Menu Contribution**: Suggest items for daily menus
// - **Performance Analytics**: Track ratings, orders, and revenue

// ### 🛡️ Admin Features
// - **Super Admin Panel**: Complete platform oversight and management
// - **Order Management**: Process, track, and manage all orders
// - **User Management**: Handle user accounts, subscriptions, and support
// - **Analytics Dashboard**: Business intelligence and reporting tools
// - **Configuration Management**: System settings and business rules

// ## 🚀 Tech Stack

// ### Backend
// - **Node.js** with Express.js framework
// - **MongoDB** with Mongoose ODM
// - **JWT** for authentication
// - **Razorpay** for payment processing
// - **Socket.IO** for real-time updates
// - **Node-cron** for scheduled tasks
// - **Nodemailer** for email services
// - **Multer** for file uploads

// ### Frontend
// - **React 18** with functional components
// - **Redux Toolkit** with RTK Query for state management
// - **Tailwind CSS** for styling
// - **Framer Motion** for animations
// - **React Router** for navigation
// - **React Hot Toast** for notifications

// ### DevOps & Tools
// - **Winston** for logging
// - **Helmet** for security headers
// - **CORS** for cross-origin requests
// - **Express Rate Limiting** for API protection
// - **MongoDB Atlas** (production database)

// ## 📦 Installation & Setup

// ### Prerequisites
// - Node.js (v16 or higher)
// - MongoDB (v5 or higher)
// - npm or yarn package manager

// ### Backend Setup
// ```bash
// # Clone the repository
// git clone https://github.com/your-repo/ghar-ka-khana.git
// cd ghar-ka-khana

// # Install backend dependencies
// npm install

// # Create environment file
// cp .env.example .env
// # Edit .env with your configuration

// # Start MongoDB service
// mongod

// # Run the backend server
// npm run dev
// ```

// ### Frontend Setup
// ```bash
// # Navigate to frontend directory
// cd frontend

// # Install dependencies
// npm install

// # Start the development server
// npm start
// ```

// ### Environment Variables
// ```env
// # Server
// NODE_ENV=development
// PORT=5000
// FRONTEND_URL=http://localhost:3000

// # Database
// MONGODB_URI=mongodb://localhost:27017/ghar-ka-khana

// # JWT
// JWT_SECRET=your-super-secret-jwt-key

// # Razorpay
// RAZORPAY_KEY_ID=your_key_id
// RAZORPAY_KEY_SECRET=your_key_secret

// # Email
// SMTP_HOST=smtp.gmail.com
// SMTP_USER=your-email@gmail.com
// SMTP_PASS=your-app-password
// ```

// ## 📚 API Documentation

// ### Authentication Endpoints
// ```
// POST /api/auth/register      - User registration
// POST /api/auth/login         - User login
// POST /api/auth/send-otp      - Send OTP for verification
// POST /api/auth/verify-otp    - Verify OTP
// GET  /api/auth/profile       - Get user profile
// ```

// ### Meal Plans Endpoints
// ```
// GET  /api/mealplans          - Get all meal plans
// GET  /api/mealplans/:id      - Get meal plan by ID
// POST /api/mealplans          - Create meal plan (Admin)
// PUT  /api/mealplans/:id      - Update meal plan (Admin)
// ```

// ### Orders Endpoints
// ```
// POST /api/orders             - Create new order
// GET  /api/orders             - Get user orders
// PUT  /api/orders/:id/cancel  - Cancel order
// GET  /api/orders/:id/track   - Track order
// ```

// ### Subscriptions Endpoints
// ```
// POST /api/subscriptions           - Create subscription
// GET  /api/subscriptions           - Get user subscriptions
// PUT  /api/subscriptions/:id/pause - Pause subscription
// PUT  /api/subscriptions/:id/resume - Resume subscription
// ```

// ## 🏗️ Database Schema

// ### Key Collections
// - **users**: User accounts and preferences
// - **mealplans**: Available meal plan configurations
// - **subscriptions**: User meal subscriptions
// - **orders**: Individual order records
// - **dailymeals**: Daily menu configurations
// - **customrequests**: Custom food requests
// - **restaurantbids**: Restaurant bid responses
// - **reviews**: User reviews and ratings

// ## 🔄 Business Logic

// ### Subscription Flow
// 1. User selects meal plan and duration
// 2. Payment processing through Razorpay or wallet
// 3. Daily auto-order generation at 6 AM
// 4. Order fulfillment and delivery tracking
// 5. Automatic subscription renewal reminders

// ### Custom Order Flow
// 1. User creates custom food request
// 2. Broadcast to nearby restaurants
// 3. Restaurants submit competitive bids
// 4. User selects preferred bid
// 5. Order processing and delivery

// ### Loyalty System
// - Referral bonuses: ₹50 for referrer, ₹25 for new user
// - Loyalty points: 1% of order value
// - Wallet credits for cancellations and refunds

// ## 🛠️ Development Guidelines

// ### Code Structure
// ```
// backend/
// ├── controllers/     # Business logic handlers
// ├── models/         # Database schemas
// ├── routes/         # API route definitions
// ├── middleware/     # Custom middleware functions
// ├── utils/          # Helper functions
// └── server.js       # Application entry point

// frontend/
// ├── src/
// │   ├── components/  # Reusable UI components
// │   ├── pages/      # Route-based page components
// │   ├── store/      # Redux store and slices
// │   ├── hooks/      # Custom React hooks
// │   └── utils/      # Helper functions
// ```

// ### Contributing
// 1. Fork the repository
// 2. Create feature branch (`git checkout -b feature/amazing-feature`)
// 3. Commit changes (`git commit -m 'Add amazing feature'`)
// 4. Push to branch (`git push origin feature/amazing-feature`)
// 5. Open Pull Request

// ## 📈 Performance Optimizations

// - **Database Indexing**: Optimized queries for user data and orders
// - **Redis Caching**: Session management and frequently accessed data
// - **Image Optimization**: Compressed images with lazy loading
// - **Code Splitting**: React component lazy loading
// - **API Rate Limiting**: Protection against abuse

// ## 🔒 Security Features

// - **JWT Authentication**: Secure token-based authentication
// - **Input Validation**: Comprehensive request validation
// - **SQL Injection Prevention**: Mongoose ODM protection
// - **XSS Protection**: Content Security Policy headers
// - **Rate Limiting**: API endpoint protection
// - **HTTPS Enforcement**: Secure data transmission

// ## 📱 Mobile Responsiveness

// - Fully responsive design for all screen sizes
// - Mobile-first approach with Tailwind CSS
// - Touch-friendly interfaces
// - Optimized mobile navigation

// ## 🚀 Deployment

// ### Production Deployment
// ```bash
// # Build frontend
// npm run build

// # Start production server
// npm start
// ```

// ### Docker Deployment
// ```dockerfile
// # Dockerfile included for containerization
// docker build -t ghar-ka-khana .
// docker run -p 5000:5000 ghar-ka-khana
// ```

// ## 📞 Support

// For support and queries:
// - 📧 Email: support@gharkaknana.com
// - 📱 Phone: +91 98765-43210
// - 🌐 Website: https://gharkakhana.com

// ## 📄 License

// This project is licensed under the MIT License - see the LICENSE file for details.

// ---

// **Made with ❤️ in India** 🇮🇳