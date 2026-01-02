// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Add user info to request
    req.userId = user._id;
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: error.message
    });
  }
};

/**
 * Role-based access control middleware
 * Checks if user has required role
 */
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient privileges.'
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Adds user info if token is provided, but doesn't fail if not
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.userId = user._id;
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};












// // middleware/webhook.js
// const crypto = require('crypto');

// /**
//  * Verify Razorpay webhook signature
//  */
// exports.verifyRazorpayWebhook = (req, res, next) => {
//   try {
//     const signature = req.get('X-Razorpay-Signature');
//     const body = JSON.stringify(req.body);
    
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
//       .update(body)
//       .digest('hex');
    
//     if (signature !== expectedSignature) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid webhook signature'
//       });
//     }
    
//     next();
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: 'Webhook verification failed',
//       error: error.message
//     });
//   }
// };

// /**
//  * Parse webhook payload
//  */
// exports.parseWebhookPayload = (req, res, next) => {
//   try {
//     const { event, payload } = req.body;
    
//     req.webhookEvent = event;
//     req.webhookPayload = payload;
    
//     next();
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: 'Invalid webhook payload',
//       error: error.message
//     });
//   }
// }; 'error' and below to 'error.log'
//     new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
//     // Write all logs with level '