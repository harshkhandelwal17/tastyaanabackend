const { check, validationResult } = require('express-validator');
const moment = require('moment-timezone');

// Common validation rules
const customizationRules = [
  check('subscriptionId', 'Subscription ID is required')
    .notEmpty()
    .isMongoId()
    .withMessage('Invalid subscription ID'),
    
  check('type')
    .isIn(['permanent', 'temporary', 'one-time'])
    .withMessage('Invalid customization type'),
    
  check('dietaryPreference')
    .optional()
    .isIn(['vegetarian', 'vegan', 'non-vegetarian', 'jain', 'regular'])
    .withMessage('Invalid dietary preference'),
    
  check('spiceLevel')
    .optional()
    .isIn(['mild', 'medium', 'hot', 'extra-hot'])
    .withMessage('Invalid spice level'),
    
  check('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
    
  check('preferences.noOnion')
    .optional()
    .isBoolean()
    .withMessage('noOnion must be a boolean'),
    
  check('preferences.noGarlic')
    .optional()
    .isBoolean()
    .withMessage('noGarlic must be a boolean'),
    
  check('preferences.specialInstructions')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Special instructions must be less than 500 characters'),
    
  check('addons')
    .optional()
    .isArray()
    .withMessage('Add-ons must be an array'),
    
  check('addons.*')
    .isObject()
    .withMessage('Each add-on must be an object'),
    
  check('addons.*.item')
    .optional()
    .isMongoId()
    .withMessage('Invalid add-on ID'),
    
  check('addons.*.id')
    .optional()
    .isMongoId()
  
    
    
    .withMessage('Invalid add-on ID'),
    
  check('addons.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Add-on quantity must be at least 1'),
    
  check('extraItems')
    .optional()
    .isArray()
    .withMessage('Extra items must be an array'),
    
  check('extraItems.*.item')
    .isMongoId()
    .withMessage('Invalid extra item ID'),
    
  check('extraItems.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Extra item quantity must be at least 1'),
    
  check('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Rules for one-time customizations
const oneTimeCustomizationRules = [
  check('date')
    .exists()
    .withMessage('Date is required for one-time customizations')
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)')
    .custom((date) => {
      const selectedDate = moment.utc(date).startOf('day');
      const today = moment.utc().startOf('day');
      
      if (selectedDate.isBefore(today)) {
        throw new Error('Cannot create customization for past dates');
      }
      
      // Check if date is within 30 days
      const maxDate = today.clone().add(30, 'days');
      if (selectedDate.isAfter(maxDate)) {
        throw new Error('Customizations can only be made up to 30 days in advance');
      }
      console.log("one time ... ");
      return true;
    }),
    
  check('shift')
    .exists()
    .withMessage('Shift is required for one-time customizations')
    .isIn(['morning', 'evening'])
    .withMessage('Invalid shift. Must be morning or evening')
];

// Rules for date-range customizations
const dateRangeCustomizationRules = [
  check('dates')
    .exists()
    .withMessage('Dates array is required for date-range customizations')
    .isArray({ min: 1 })
    .withMessage('At least one date is required')
    .custom((dates) => {
      const today = moment.utc().startOf('day');
      const maxDate = today.clone().add(30, 'days');
      
      for (const dateObj of dates) {
        if (!dateObj.date || !moment(dateObj.date).isValid()) {
          throw new Error('Invalid date in dates array');
        }
        
        const selectedDate = moment.utc(dateObj.date).startOf('day');
        
        if (selectedDate.isBefore(today)) {
          throw new Error('Cannot create customization for past dates');
        }
        
        if (selectedDate.isAfter(maxDate)) {
          throw new Error('Customizations can only be made up to 30 days in advance');
        }
        
        if (!dateObj.shift || !['morning', 'evening'].includes(dateObj.shift)) {
          throw new Error('Invalid shift in dates array. Must be morning or evening');
        }
      }
      
      return true;
    })
];

// Rules for permanent customizations
const permanentCustomizationRules = [
  check('shift')
    .exists()
    .withMessage('Shift is required for permanent customizations')
    .isIn(['morning', 'evening'])
    .withMessage('Invalid shift. Must be morning or evening'),
    
  check('startsAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)')
    .custom((startsAt, { req }) => {
      if (startsAt) {
        const startDate = moment.utc(startsAt).startOf('day');
        const today = moment.utc().startOf('day');
        
        if (startDate.isBefore(today)) {
          throw new Error('Start date cannot be in the past');
        }
        
        if (req.body.endsAt) {
          const endDate = moment.utc(req.body.endsAt).startOf('day');
          if (endDate.isBefore(startDate)) {
            throw new Error('End date cannot be before start date');
          }
        }
      }
      
      return true;
    }),
    
  check('endsAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format. Use ISO 8601 format (YYYY-MM-DD)')
];

// Validation middleware for creating customizations
exports.validateCreateCustomization = [
  ...customizationRules,
  (req, res, next) => {
    const { type } = req.body;
    
    console.log("one time customization is creating...", type);
    
    // Add type-specific validation rules based on customization type
    let additionalRules = [];
    
    if (type === 'one-time') {
      additionalRules = oneTimeCustomizationRules;
    } else if (type === 'temporary') {
      additionalRules = dateRangeCustomizationRules;
    } else if (type === 'permanent') {
      additionalRules = permanentCustomizationRules;
    }
    
    console.log("Additional validation rules applied for type:", type);
    next();
  },
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors found:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    console.log("Validation passed, proceeding to controller...");
    next();
  }
];

// Validation middleware for updating customizations
exports.validateUpdateCustomization = [
  check('status')
    .optional()
    .isIn(['pending', 'confirmed', 'rejected', 'cancelled'])
    .withMessage('Invalid status'),
    
  check('reasonForRejection')
    .if((value, { req }) => req.body.status === 'rejected')
    .notEmpty()
    .withMessage('Reason for rejection is required when status is rejected')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation for getting customizations
exports.validateGetCustomizations = [
  check('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format. Use ISO 8601 format (YYYY-MM-DD)'),
    
  check('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format. Use ISO 8601 format (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < req.query.startDate) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    }),
    
  check('status')
    .optional()
    .isIn(['pending', 'confirmed', 'rejected', 'cancelled'])
    .withMessage('Invalid status'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
