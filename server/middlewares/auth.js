// // server/middleware/auth.js
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const checkRole = (roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Access denied' });
//     }
//     next();
//   };
// };
// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
//     console.log(token)
//     if (!token) {
//       return res.status(401).json({ message: 'No token provided' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
//     const user = await User.findById(decoded.id);
//     console.log(user)
//     if (!user) {
//       return res.status(401).json({ message: 'User not found' });
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({ message: 'Account blocked' });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// const adminMiddleware = (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Admin access required' });
//   }
//   next();
// };




// const authenticate = async (req, res, next) => {
//   try {
//     const token = req?.cookies?.token || req?.header('Authorization')?.replace('Bearer ', '');
//     // console.log("req headers",req.headers)
//     // console.log("req cookies",req.cookies)
//     console.log(req.header('Authorization'))
//     if (!token) {
//       console.error("No token provided");
//       return res.status(401).json({ message: 'Access denied. No token provided.' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
//     const user = await User.findById(decoded.id).select('-password');
//     if (!user) {
//       console.error("Invalid token");
//       return res.status(401).json({ message: 'Invalid token.' });
//     } 
//     req.user = user;
//     console.log("usr data",user)
//     next();
//   } catch (error) {
//     console.error("Authentication error:", error);
//     res.status(401).json({ message: 'Invalid token.' });
//   }
// };

// // Authorization middleware
// const authorize = (roles) => {
//   return (req, res, next) => {

//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ 
//         message: 'Access denied. Insufficient permissions.' 
//       });
//     }
//     next();
//   };
// };

// // module.exports = { authenticate, authorize };

// module.exports = { authMiddleware, adminMiddleware ,authenticate, authorize,checkRole};










// // const jwt = require('jsonwebtoken');
// // const User = require('../models/User');

// // // Authentication middleware
// // const authenticate = async (req, res, next) => {
// //   try {
// //     const token = req.header('Authorization')?.replace('Bearer ', '');
// //     if (!token) {
// //       return res.status(401).json({ message: 'Access denied. No token provided.' });
// //     }

// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// //     const user = await User.findById(decoded.id).select('-password');
// //     if (!user) {
// //       return res.status(401).json({ message: 'Invalid token.' });
// //     }

// //     req.user = user;
// //     next();
// //   } catch (error) {
// //     res.status(401).json({ message: 'Invalid token.' });
// //   }
// // };

// // // Authorization middleware
// // const authorize = (...roles) => {
// //   return (req, res, next) => {
// //     if (!roles.includes(req.user.role)) {
// //       return res.status(403).json({ 
// //         message: 'Access denied. Insufficient permissions.' 
// //       });
// //     }
// //     next();
// //   };
// // };

// // module.exports = { authenticate, authorize };



// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Main authentication middleware - checks for valid JWT token
 * Supports both Authorization header and cookies
 */
const authenticate = async (req, res, next) => {
  try {
    // Try to get token from Authorization header (case-insensitive), then cookies
    let token = null;
    
    // Check Authorization header (case-insensitive)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim();
    }
    
    // Fallback to cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
    
    console.log('Token found:', !!token);
    console.log('Auth header:', !!authHeader);
    console.log('Cookies token:', !!req.cookies?.token);
    
    if (!token) {
      console.error("No token provided");
      console.error("Request headers:", Object.keys(req.headers));
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
    
    // Check if token has expired (JWT library should handle this, but let's add extra validation)
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      console.error("Token has expired");
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired. Please login again.' 
      });
    }
    
    // Get user from database (excluding password)
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.error("User not found for token");
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token - user not found.' 
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account has been deactivated.' 
      });
    }

    // Check if user is blocked (using your existing field)
    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false,
        message: 'Account has been blocked.' 
      });
    }

    // Add user to request object
    req.user = user;
    console.log("User authenticated:", user.email, "Role:", user.role);
    next();
    
  } catch (error) {
    console.error("Authentication error:", error.message);
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token has expired. Please login again.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format.' 
      });
    }
    
    res.status(401).json({ 
      success: false,
      message: 'Authentication failed.' 
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token present
 * Useful for endpoints that work for both authenticated and non-authenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive && !user.isBlocked) {
          req.user = user;
        }
      } catch (error) {
        // Don't fail the request if token is invalid in optional auth
        console.log('Optional auth - token invalid:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Role-based authorization middleware
 * Usage: authorize(['admin', 'seller'])
 */
const authorize = (roles) => {
  return (req, res, next) => {
    // console.log(req.user);
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required for this action.' 
      });
    }

    // Convert single role to array for consistency
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};

/**
 * Admin-only middleware (shorthand for common use case)
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required.' 
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required.' 
    });
  }

  next();
};

/**
 * Super admin only middleware
 */
const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required.' 
    });
  }

  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Super admin access required.' 
    });
  }

  next();
};

/**
 * Check if user has Google account linked
 */
const requireGoogleAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required.' 
    });
  }

  if (!req.user.googleId) {
    return res.status(400).json({ 
      success: false,
      message: 'Google account not linked to this profile.',
      requireGoogleLink: true
    });
  }

  next();
};

/**
 * Check if user has password set (useful for Google-only users)
 */
const requirePassword = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required.' 
    });
  }

  if (!req.user.password) {
    return res.status(400).json({ 
      success: false,
      message: 'Password required. Please set a password first.',
      requirePassword: true
    });
  }

  next();
};

/**
 * Seller authorization (for marketplace features)
 */
const sellerAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required.' 
    });
  }

  if (!['seller', 'admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false,
      message: 'Seller access required.' 
    });
  }

  next();
};

/**
 * Delivery personnel authorization
 */
const deliveryAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required.' 
    });
  }

  if (!['delivery', 'admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false,
      message: 'Delivery personnel access required.' 
    });
  }

  next();
};

/**
 * Account ownership verification
 * Ensures user can only access their own data (unless admin)
 */
const verifyOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required.' 
    });
  }

  // Admin and super-admin can access any data
  if (['admin', 'super-admin'].includes(req.user.role)) {
    return next();
  }

  // Check if user is trying to access their own data
  const userId = req.params.userId || req.params.id || req.body.userId;
  
  if (userId && userId !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. You can only access your own data.' 
    });
  }

  next();
};

// Export all middleware functions
module.exports = {
  // Main authentication
  authenticate,
  optionalAuth,
  
  // Authorization
  authorize,
  adminOnly,
  superAdminOnly,
  sellerAuth,
  deliveryAuth,
  verifyOwnership,
  
  // Google Auth specific
  requireGoogleAuth,
  requirePassword,
  
  // Legacy support (keeping your existing function names)
  authMiddleware: authenticate,
  adminMiddleware: adminOnly,
  checkRole: authorize
};
