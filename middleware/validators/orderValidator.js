const { body, validationResult } = require('express-validator');

// Validation rules for creating a laundry order
const orderValidationRules = () => [
  body('vendorId')
    .notEmpty()
    .withMessage('Vendor ID is required.')
    .isMongoId()
    .withMessage('Invalid vendor ID format.'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required.'),
  
  body('items.*.type')
    .notEmpty()
    .withMessage('Item type is required for each item.')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Item type must be a non-empty string.'),
  
  body('items.*.category')
    .notEmpty()
    .withMessage('Item category is required.')
    .isIn(['topwear', 'bottomwear', 'home_textiles', 'others'])
    .withMessage('Invalid item category.'),
  
  body('items.*.serviceType')
    .notEmpty()
    .withMessage('Service type is required for each item.')
    .isIn(['wash_fold', 'wash_iron', 'dry_clean', 'iron_only', 'shoe_cleaning', 'folding_only'])
    .withMessage('Invalid service type.'),
  
  body('items.*.quantity')
    .notEmpty()
    .withMessage('Item quantity is required.')
    .isInt({ min: 1, max: 100 })
    .withMessage('Item quantity must be between 1 and 100.'),
  
  body('items.*.totalPrice')
    .notEmpty()
    .withMessage('Item total price is required.')
    .isFloat({ min: 0 })
    .withMessage('Item total price must be a positive number.'),
  
  // Weight-based pricing validation
  body('items.*.weight')
    .optional()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Item weight must be between 0.1 and 50 kg.'),
  
  body('items.*.pricePerKg')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price per kg must be a positive number.'),
  
  body('items.*.pricePerItem')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price per item must be a positive number.'),

  body('paymentMethod')
    .optional()
    .isIn(['cash', 'wallet', 'upi', 'card', 'subscription'])
    .withMessage('Invalid payment method.'),
  
  body('payment.method')
    .optional()
    .isIn(['cash', 'wallet', 'upi', 'card', 'subscription'])
    .withMessage('Invalid payment method.'),

  body('pickup')
    .isObject()
    .withMessage('Pickup details are required.'),
  
  body('pickup.date')
    .notEmpty()
    .withMessage('Pickup date is required.')
    .isISO8601()
    .withMessage('Valid pickup date required (ISO 8601 format).'),
  
  body('pickup.timeSlot')
    .optional()
    .isIn(['morning', 'afternoon', 'evening', 'immediate'])
    .withMessage('Invalid pickup time slot.'),
  
  body('pickup.address')
    .isObject()
    .withMessage('Pickup address is required.'),
  
  body('pickup.address.street')
    .notEmpty()
    .withMessage('Street address is required.')
    .isString()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters.'),
  
  body('pickup.address.pincode')
    .notEmpty()
    .withMessage('Pincode is required.')
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be exactly 6 digits.'),
  
  body('pickup.address.contactName')
    .notEmpty()
    .withMessage('Contact name is required.')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Contact name must be between 2 and 50 characters.'),
  
  body('pickup.address.contactPhone')
    .notEmpty()
    .withMessage('Contact phone is required.')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Contact phone must be a valid 10-digit Indian mobile number.'),

  body('delivery')
    .optional()
    .isObject()
    .withMessage('Delivery details must be an object.'),
  
  body('delivery.date')
    .optional()
    .isISO8601()
    .withMessage('Valid delivery date required (ISO 8601 format).'),
  
  body('delivery.timeSlot')
    .optional()
    .isIn(['morning', 'afternoon', 'evening'])
    .withMessage('Invalid delivery time slot.'),

  body('specialInstructions')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instructions must be a string up to 500 characters.'),

  body('subscriptionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid subscription ID format.'),

  body('deliverySpeed')
    .notEmpty()
    .withMessage('Delivery speed is required.')
    .isIn(['quick', 'scheduled', 'subscription'])
    .withMessage('Delivery speed must be one of: quick, scheduled, subscription.')
];

// Middleware to send validation errors
const validateOrder = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  orderValidationRules,
  validateOrder
};