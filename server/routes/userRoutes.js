const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');
const { userValidation, validateRequest } = require('../middlewares/validation');
const { upload } = require('../middlewares/upload');

// ==================== PUBLIC ROUTES ====================
router.post('/register', 
  userValidation, 
  validateRequest, 
  userController.register
);

router.post('/login', 
  userController.login
);

// ==================== PROTECTED USER ROUTES ====================
// Get all sellers (for dropdowns)
router.get('/sellers', userController.getSellers);

// Profile Management
router.get('/profile', 
  authenticate, 
  userController.getProfile
);

router.put('/profile', 
  authenticate,
  upload.single('avatar'), [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2-50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('phone')
      .optional()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Valid Indian phone number required'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Valid date required (YYYY-MM-DD)')
  ],
  userController.updateProfile
);

// Address Management
router.post('/address', 
  authenticate, [
    body('type')
      .optional()
      .isIn(['home', 'work', 'other'])
      .withMessage('Invalid address type'),
    body('street')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Street must be 5-200 characters'),
    body('pincode')
      .matches(/^\d{6}$/)
      .withMessage('6-digit pincode required')
  ],
  userController.addAddress
);

// router.put('/address/:id', 
//   authenticate, [
//     body('isDefault')
//       .optional()
//       .isBoolean()
//       .withMessage('isDefault must be boolean')
//   ],
//   userController.updateAddress
// );

// // Food Preferences
// router.put('/preferences', 
//   authenticate, [
//     body('dietaryType')
//       .optional()
//       .isIn(['vegetarian', 'non-vegetarian', 'vegan', 'jain'])
//       .withMessage('Invalid dietary type'),
//     body('spiceLevel')
//       .optional()
//       .isIn(['low', 'medium', 'high'])
//       .withMessage('Invalid spice level'),
//     body('allergies.*')
//       .optional()
//       .isString()
//       .withMessage('Allergy must be text')
//   ],
//   userController.updatePreferences
// );

// // Wallet Management
// router.get('/wallet', 
//   authenticate,
//   userController.getWalletBalance
// );

// router.get('/wallet/transactions', 
//   authenticate, [
//     body('limit')
//       .optional()
//       .isInt({ min: 1, max: 100 })
//       .withMessage('Limit must be 1-100'),
//     body('page')
//       .optional()
//       .isInt({ min: 1 })
//       .withMessage('Page must be positive number')
//   ],
//   userController.getWalletTransactions
// );

// router.post('/wallet/add', 
//   authenticate, [
//     body('amount')
//       .isFloat({ min: 1, max: 10000 })
//       .withMessage('Amount must be ₹1-₹10,000'),
//     body('paymentMethod')
//       .isIn(['razorpay', 'card', 'upi', 'netbanking'])
//       .withMessage('Invalid payment method')
//   ],
//   userController.addToWallet
// );

// // User Statistics
// router.get('/stats', 
//   authenticate,
//   userController.getUserStats
// );

// ==================== ADMIN ROUTES ====================
router.get('/all', 
  authenticate, 
  authorize('admin'), [
    body('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be 1-100'),
    body('role')
      .optional()
      .isIn(['buyer', 'seller', 'delivery'])
      .withMessage('Invalid role filter')
  ],
  userController.getAllUsers
);

// Get all sellers (public route for now, can be made protected if needed)
router.get('/sellers', 
  userController.getSellers
);

module.exports = router;
// // USER ROUTES (routes/userRoutes.js)
// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const { authenticate, authorize } = require('../middleware/auth');
// const { userValidation, validateRequest } = require('../middleware/validation');

// // Public routes
// router.post('/register', userValidation, validateRequest, userController.register);
// router.post('/login', userController.login);

// // Protected routes
// router.get('/profile', authenticate, userController.getProfile);
// router.put('/profile', authenticate, userController.updateProfile);
// router.post('/address', authenticate, userController.addAddress);

// // Admin routes
// router.get('/all', authenticate, authorize('admin'), userController.getAllUsers);

// module.exports = router;








// // routes/users.js
// const express = require('express');
// const { body } = require('express-validator');
// const {
//   updateProfile,
//   updatePreferences,
//   getWalletTransactions,
//   addToWallet,
//   updateAddress,
//   getUserStats
// } = require('../controllers/userController');
// const { authenticate } = require('../middleware/auth');
// const upload = require('../middleware/upload');

// const router = express.Router();

// /**
//  * @route   PUT /api/users/profile
//  * @desc    Update user profile
//  * @access  Private
//  */
// router.put('/profile', authenticate, upload.single('avatar'), [
//   body('name')
//     .optional()
//     .trim()
//     .isLength({ min: 2, max: 50 })
//     .withMessage('Name must be between 2 and 50 characters'),
//   body('email')
//     .optional()
//     .isEmail()
//     .normalizeEmail()
//     .withMessage('Please provide a valid email'),
//   body('phone')
//     .optional()
//     .matches(/^[6-9]\d{9}$/)
//     .withMessage('Please provide a valid Indian phone number')
// ], updateProfile);

// /**
//  * @route   PUT /api/users/preferences
//  * @desc    Update user food preferences
//  * @access  Private
//  */
// router.put('/preferences', authenticate, [
//   body('spiceLevel')
//     .optional()
//     .isIn(['low', 'medium', 'high'])
//     .withMessage('Spice level must be low, medium, or high'),
//   body('dietaryType')
//     .optional()
//     .isIn(['vegetarian', 'non-vegetarian', 'vegan', 'jain'])
//     .withMessage('Invalid dietary type'),
//   body('noOnion')
//     .optional()
//     .isBoolean()
//     .withMessage('No onion preference must be boolean'),
//   body('noGarlic')
//     .optional()
//     .isBoolean()
//     .withMessage('No garlic preference must be boolean')
// ], updatePreferences);

// /**
//  * @route   GET /api/users/wallet/transactions
//  * @desc    Get wallet transactions
//  * @access  Private
//  */
// router.get('/wallet/transactions', authenticate, getWalletTransactions);

// /**
//  * @route   POST /api/users/wallet/add
//  * @desc    Add money to wallet
//  * @access  Private
//  */
// router.post('/wallet/add', authenticate, [
//   body('amount')
//     .isFloat({ min: 1, max: 10000 })
//     .withMessage('Amount must be between ₹1 and ₹10,000'),
//   body('paymentMethod')
//     .isIn(['razorpay', 'card', 'upi'])
//     .withMessage('Invalid payment method')
// ], addToWallet);

// /**
//  * @route   PUT /api/users/address
//  * @desc    Update delivery address
//  * @access  Private
//  */
// router.put('/address', authenticate, [
//   body('street')
//     .trim()
//     .isLength({ min: 5, max: 200 })
//     .withMessage('Street address must be between 5 and 200 characters'),
//   body('city')
//     .trim()
//     .isLength({ min: 2, max: 50 })
//     .withMessage('City must be between 2 and 50 characters'),
//   body('state')
//     .trim()
//     .isLength({ min: 2, max: 50 })
//     .withMessage('State must be between 2 and 50 characters'),
//   body('pincode')
//     .matches(/^\d{6}$/)
//     .withMessage('Pincode must be 6 digits'),
//   body('coordinates.lat')
//     .optional()
//     .isFloat({ min: -90, max: 90 })
//     .withMessage('Invalid latitude'),
//   body('coordinates.lng')
//     .optional()
//     .isFloat({ min: -180, max: 180 })
//     .withMessage('Invalid longitude')
// ], updateAddress);

// /**
//  * @route   GET /api/users/stats
//  * @desc    Get user statistics
//  * @access  Private
//  */
// router.get('/stats', authenticate, getUserStats);

// module.exports = router;
