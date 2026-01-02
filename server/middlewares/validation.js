const { body, validationResult } = require('express-validator');
const { isMongoId } = require('validator');

// ==================== CORE VALIDATORS ====================
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

const sanitizeBody = (allowedFields) => {
  return (req, res, next) => {
    const sanitized = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        sanitized[field] = req.body[field];
      }
    });
    
    req.body = sanitized;
    next();
  };
};

// ==================== VALIDATION RULES ====================
const userValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Valid Indian phone number required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and number'),
  handleValidationErrors
];

const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be 2-200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be 10-2000 characters'),
  body('category')
    .custom(isMongoId)
    .withMessage('Invalid category ID'),
  body('weightOptions')
    .isArray({ min: 1 })
    .withMessage('At least one weight option required'),
  body('weightOptions.*.weight')
    .notEmpty()
    .withMessage('Weight is required'),
  body('weightOptions.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be positive'),
  body('weightOptions.*.originalPrice')
    .isFloat({ min: 0 })
    .withMessage('Original price must be positive'),
  handleValidationErrors
];

const orderStatusValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  body('trackingNumber')
    .if(body('status').equals('shipped'))
    .notEmpty()
    .withMessage('Tracking number required when shipping'),
  handleValidationErrors
];

const promotionValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be 3-100 characters'),
  body('type')
    .isIn(['percentage', 'fixed_amount', 'bogo', 'free_shipping'])
    .withMessage('Invalid promotion type'),
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Value must be positive'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date required'),
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors
];

// ==================== MEAL-SPECIFIC VALIDATIONS ====================
const mealValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Meal name must be 3-100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be 10-500 characters'),
  body('category')
    .isIn(['veg', 'non-veg', 'vegan', 'jain'])
    .withMessage('Invalid meal category'),
  body('spiceLevel')
    .isIn(['mild', 'medium', 'hot'])
    .withMessage('Invalid spice level'),
  body('ingredients')
    .isArray({ min: 1 })
    .withMessage('At least one ingredient required'),
  handleValidationErrors
];









const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      errorCount: formattedErrors.length
    });
  }
  
  next();
};

/**
 * Custom validation for MongoDB ObjectId
 */
const isValidObjectId = (value) => {
  return /^[0-9a-fA-F]{24}$/.test(value);
};

/**
 * Custom validation for price format
 */
const isValidPrice = (value) => {
  return typeof value === 'number' && value >= 0 && Number.isFinite(value);
};

/**
 * Custom validation for phone number (Indian format)
 */
const isValidIndianPhone = (value) => {
  return /^[6-9]\d{9}$/.test(value);
};

/**
 * Custom validation for date ranges
 */
const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return start <= end && start <= new Date();
};

/**
 * Sanitize input data
 */
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeString(item) : sanitizeObject(item)
        );
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  req.body = sanitizeObject(req.body);
  next();
};

/**
 * Rate limiting validation
 */
const validateRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }
    
    const userRequests = requests.get(userId);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    userRequests.push(now);
    next();
  };
};

/**
 * File upload validation
 */
const validateFileUpload = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(); // No files to validate
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  for (const file of req.files) {
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type: ${file.originalname}. Only JPEG, PNG, GIF, and WebP are allowed.`
      });
    }

    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File too large: ${file.originalname}. Maximum size is 5MB.`
      });
    }
  }

  next();
};






module.exports = {
  // Core Middleware
  handleValidationErrors,
  sanitizeBody,
  
  // Validation Chains
  userValidation,
  productValidation,
  orderStatusValidation,
  promotionValidation,
  mealValidation,
   validate,
  sanitizeInput,
  validateRateLimit,
  validateFileUpload,
  isValidObjectId,
  isValidPrice,
  isValidIndianPhone,
  isValidDateRange,
  
  // Aliases (for backward compatibility)
  validateRequest: handleValidationErrors
};