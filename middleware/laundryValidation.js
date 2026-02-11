const { body, validationResult } = require('express-validator');
const { orderValidationRules, validateOrder } = require('./validators/orderValidator');

// Subscription validators used by laundry routes
const subscriptionValidationRules = () => [
  body('vendorId')
    .notEmpty()
    .withMessage('Vendor ID is required.')
    .isMongoId()
    .withMessage('Invalid vendor ID format.'),
  body('planId')
    .notEmpty()
    .withMessage('Plan ID is required.')
    .isString()
    .withMessage('Plan ID must be a string.'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD format).'),
  body('paymentMethod')
    .optional()
    .isIn(['cod', 'online', 'wallet', 'upi', 'card', 'subscription'])
    .withMessage('Invalid payment method.'),
  // Optional preferences payload for future expansion
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object.'),
];

const validateSubscription = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error. Please check your input.',
      errors: errors.array() 
    });
  }
  next();
};

module.exports = {
  // Re-export order validators to keep a single entry point
  orderValidationRules,
  validateOrder,
  // Subscription validators
  subscriptionValidationRules,
  validateSubscription,
};
