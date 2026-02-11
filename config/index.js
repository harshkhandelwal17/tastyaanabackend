// // routes/auth.js
// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { auth } = require('../middleware/auth');

// const router = express.Router();

// // Register seller
// router.post('/register', async (req, res) => {
//   try {
//     const { name, email, password, role = 'seller', sellerInfo } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User with this email already exists' });
//     }

//     // Create user
//     const user = new User({
//       name,
//       email,
//       password,
//       role,
//       sellerInfo: role === 'seller' ? sellerInfo : undefined
//     });

//     await user.save();

// // routes/auth.js
// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { auth } = require('../middleware/auth');

// const router = express.Router();

// // Register seller
// router.post('/register', async (req, res) => {
//   try {
//     const { name, email, password, role = 'seller', sellerInfo } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User with this email already exists' });
//     }

//     // Create user
//     const user = new User({
//       name,
//       email,
//       password,
//       role,
//       sellerInfo: role === 'seller' ? sellerInfo : undefined
//     });

//     await user.save();

//     // Generate JWT token
//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.status(201).json({
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         isVerified: user.isVerified
//       }
//     });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// Login
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid email or password' });
//     }

//     // Check password
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid email or password' });
//     }

//     // Check if account is active
//     if (!user.isActive) {
//       return res.status(400).json({ message: 'Account is deactivated' });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '7d' }
//     );

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         isVerified: user.isVerified,
//         sellerInfo: user.sellerInfo
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Refresh token
router.post('/refresh', auth, async (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;










// controllers/uploadController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads', req.user.role);
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

exports.uploadProductImages = upload.array('images', 5);

exports.uploadSingleImage = upload.single('image');

// Image upload endpoint
exports.handleImageUpload = async (req, res) => {
  try {
    if (!req.files && !req.file) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = req.files || [req.file];
    const imageUrls = files.map(file => ({
      url: `/uploads/${req.user.role}/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size
    }));

    res.json({
      message: 'Images uploaded successfully',
      images: imageUrls
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// routes/upload.js
const express = require('express');
const { auth, checkRole } = require('../middleware/auth');
const { uploadProductImages, uploadSingleImage, handleImageUpload } = require('../controllers/uploadController');

const router = express.Router();

// Upload product images (sellers only)
router.post('/product-images', 
  auth, 
  checkRole(['seller']), 
  uploadProductImages, 
  handleImageUpload
);

// Upload single image (profile, logo, etc.)
router.post('/image', 
  auth, 
  uploadSingleImage, 
  handleImageUpload
);

module.exports = router;







// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html, text) => {
  try {
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'E-commerce'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
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

module.exports = { sendEmail, emailTemplates };











// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};

module.exports = errorHandler;

// middleware/validation.js
const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Product validation rules
const productValidation = [
  body('title')
    .notEmpty()
    .withMessage('Product title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  handleValidationErrors
];

// Order status validation
const orderStatusValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  
  body('trackingNumber')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Tracking number must be between 3 and 50 characters'),
  
  handleValidationErrors
];

// Promotion validation
const promotionValidation = [
  body('title')
    .notEmpty()
    .withMessage('Promotion title is required'),
  
  body('type')
    .isIn(['percentage', 'fixed_amount', 'bogo', 'free_shipping'])
    .withMessage('Invalid promotion type'),
  
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Promotion value must be positive'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date'),
  
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  productValidation,
  orderStatusValidation,
  promotionValidation,
  handleValidationErrors
};

// cron/jobs.js
const cron = require('node-cron');
const { generateDailyAnalytics } = require('../utils/analytics');
const { sendEmail, emailTemplates } = require('../utils/email');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Generate daily analytics for all sellers (runs at 1 AM daily)
//corn task for running analytics for the day .. harsh 
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

console.log('Cron jobs initialized');

// package.json dependencies
/*
{
  "name": "ecommerce-seller-panel",
  "version": "1.0.0",
  "description": "E-commerce seller panel backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "socket.io": "^4.7.2",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.4",
    "express-validator": "^7.0.1",
    "node-cron": "^3.0.2",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.8.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2"
  }
}
*/

// .env template
/*
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# App Configuration
APP_NAME=E-commerce Platform
CLIENT_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
*/