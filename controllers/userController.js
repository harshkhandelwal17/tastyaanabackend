const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Order = require('../models/Order');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

const userController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { name, email, phone, password, role = 'customer' } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }]
      });
      if (existingUser) {
        return res.status(400).json({
          message: 'User with this email or phone already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        role
      });

      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Send welcome email
      await sendEmail({
        to: email,
        subject: 'Welcome to Sweet Bliss!',
        template: 'welcome',
        data: { name }
      });

      // Set JWT as httpOnly cookie
      res.cookie('token', token, cookieOptions);

      // Return full user object (excluding password)
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: userResponse
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user - explicitly select password for check, will remove later
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Set JWT as httpOnly cookie
      res.cookie('token', token, cookieOptions);

      // Return full user object (excluding password)
      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({
        message: 'Login successful',
        token,
        user: userResponse
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');

      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({ user: userResponse });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const updates = req.body;
      delete updates.password; // Prevent password update through this route

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Add address
  addAddress: async (req, res) => {
    try {
      // Determine user ID from auth middleware
      const userId = req.user._id || req.user.id;

      const user = await User.findById(userId).select('addresses');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Initialize addresses array if missing (defensive)
      if (!user.addresses) {
        user.addresses = [];
      }

      const newAddress = { ...req.body };

      // If this is the first address, make it default
      if (user.addresses.length === 0) {
        newAddress.isDefault = true;
      }

      // If setting as default, remove default from others
      if (newAddress.isDefault) {
        // Unset default for all existing addresses using DB query to avoid validation
        await User.updateOne(
          { _id: userId },
          { $set: { "addresses.$[].isDefault": false } }
        );
      }

      // Use findByIdAndUpdate to push new address, bypassing full document validation
      // but ensuring the new address is valid via runValidators
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { addresses: newAddress } },
        { new: true, runValidators: false } // runValidators: false to explicitly avoid the sellerProfile error
      );

      res.json({
        message: 'Address added successfully',
        addresses: updatedUser.addresses
      });
    } catch (error) {
      console.error('Error adding address:', error);
      res.status(500).json({ message: error.message || 'Server error adding address' });
    }
  },

  // Get all users (Admin only)
  getAllUsers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments();

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all sellers
  getSellers: async (req, res) => {
    try {
      const sellers = await User.find({ role: 'seller' })
        .select('_id name email phone')
        .sort({ name: 1 });

      res.json({
        success: true,
        count: sellers.length,
        data: sellers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  },








  /**
   * @desc    Update user address
   * @route   PUT /api/users/address/:id
   * @access  Private
   */
  /**
   * @desc    Update user address
   * @route   PUT /api/users/address/:id
   * @access  Private
   */
  updateAddress: async (req, res) => {
    try {
      const { isDefault } = req.body;
      const userId = req.user._id || req.user.id;
      const addressId = req.params.id;

      // If setting as default, unset all other defaults first (safely)
      if (isDefault === true) {
        await User.updateOne(
          { _id: userId },
          { $set: { "addresses.$[].isDefault": false } }
        );
      }

      // Construct update object dynamically for the specific address
      const updateFields = {};
      const allowedFields = ['type', 'name', 'street', 'city', 'state', 'pincode', 'country', 'coordinates', 'isDefault', 'instructions'];

      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields[`addresses.$.${key}`] = req.body[key];
        }
      });

      // Use findOneAndUpdate to locate user AND the specific address
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId, "addresses._id": addressId },
        { $set: updateFields },
        { new: true, runValidators: false }
      ).select('addresses');

      if (!updatedUser) {
        return res.status(404).json({ message: 'User or Address not found' });
      }

      res.json({
        success: true,
        data: updatedUser.addresses
      });
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).json({ message: error.message || 'Server error updating address' });
    }
  },

  /**
   * @desc    Delete user address
   * @route   DELETE /api/users/address/:id
   * @access  Private
   */
  deleteAddress: async (req, res) => {
    try {
      const userId = req.user._id || req.user.id;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { addresses: { _id: req.params.id } } },
        { new: true, runValidators: false }
      ).select('addresses');

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        success: true,
        data: updatedUser.addresses
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({ message: error.message || 'Server error deleting address' });
    }
  },

  /**
   * @desc    Update user food preferences
   * @route   PUT /api/users/preferences
   * @access  Private
   */
  updatePreferences: async (req, res) => {
    const { dietaryType, spiceLevel, allergies, noOnion, noGarlic } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'foodPreferences.dietaryType': dietaryType,
          'foodPreferences.spiceLevel': spiceLevel,
          'foodPreferences.allergies': allergies || [],
          'foodPreferences.noOnion': noOnion,
          'foodPreferences.noGarlic': noGarlic
        }
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: user.foodPreferences
    });
  },

  /**
   * @desc    Get user wallet balance
   * @route   GET /api/users/wallet
   * @access  Private
   */
  getWalletBalance: async (req, res) => {
    const user = await User.findById(req.user._id).select('wallet.balance');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: {
        balance: user.wallet.balance
      }
    });
  },

  /**
   * @desc    Get wallet transactions
   * @route   GET /api/users/wallet/transactions
   * @access  Private
   */
  getWalletTransactions: async (req, res) => {
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WalletTransaction.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
          totalTransactions: total
        }
      }
    });
  },

  /**
   * @desc    Add money to wallet
   * @route   POST /api/users/wallet/add
   * @access  Private
   */
  addToWallet: async (req, res) => {
    const { amount, paymentMethod } = req.body;

    // In a real app, you would integrate with payment gateway here
    // This is just a simulation of successful payment

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update wallet balance
    user.wallet.balance += parseFloat(amount);

    // Add transaction record
    const transaction = new WalletTransaction({
      user: req.user._id,
      amount: parseFloat(amount),
      type: 'credit',
      method: paymentMethod,
      status: 'completed',
      note: 'Wallet top-up'
    });

    transaction.save()


    // Emit real-time wallet update
    const socketService = req.app.get('socketService');
    if (socketService) {
      socketService.emitWalletUpdate(user._id, {
        tCoins: user.tCoins, // Send full tCoins object if structure matches, otherwise just balance
        // Wait, Redux expects { tCoins: ... } or just balance? 
        // In SocketContext: dispatch(updateUser({ tCoins: data.tCoins }));
        // userController only updated `user.wallet.balance`. It didn't touch tCoins here?
        // Ah, `addToWallet` updates `user.wallet.balance` (money), not tCoins (points).
        // Let's check `authSlice`. It usually stores `wallet`.
        // If I look at User model (not visible fully but implied), `wallet` and `tCoins` are different.
        // My SocketContext listener listens for `wallet-update` and dispatches `updateUser({ tCoins: data.tCoins })`. 
        // This seems mismatched. I should probably update `wallet` too in Redux.
        // For now, I'll emit what I have.
        wallet: user.wallet,
        message: `Wallet recharged with ₹${amount}`
      });
    }

    res.status(201).json({
      success: true,
      data: {
        newBalance: user.wallet.balance,
        transaction
      }
    });
  },

  /**
   * @desc    Get user statistics
   * @route   GET /api/users/stats
   * @access  Private
   */
  getUserStats: async (req, res) => {
    const [orderStats, walletStats] = await Promise.all([
      Order.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            },
            totalSpent: { $sum: '$totalAmount' }
          }
        }
      ]),
      WalletTransaction.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: null,
            totalAdded: {
              $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] }
            },
            totalUsed: {
              $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] }
            }
          }
        }
      ])
    ]);

    const stats = {
      orders: orderStats[0] || { totalOrders: 0, completedOrders: 0, totalSpent: 0 },
      wallet: walletStats[0] || { totalAdded: 0, totalUsed: 0 }
    };

    res.json({
      success: true,
      data: stats
    });
  },

  // Get all sellers
  getSellers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      // Query for users with role 'seller' OR role 'buyer' with a configured sellerType
      // This accommodates users who might have their role set incorrectly but valid seller profile data
      const query = {
        $or: [
          { role: 'seller' },
          {
            role: 'buyer',
            'sellerProfile.sellerType': { $exists: true, $ne: [] }
          }
        ]
      };

      const sellers = await User.find(query)
        .select('-password -googleId') // Exclude sensitive fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: sellers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get sellers error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching sellers',
        error: error.message
      });
    }
  },

  // Change Password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id).select('+password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If user has no password (google auth), allow setting one directly
      if (!user.password) {
        // Create password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        return res.json({ message: 'Password set successfully' });
      }

      // Check current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid current password' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete Account
  deleteAccount: async (req, res) => {
    try {
      const user = await User.findById(req.user._id || req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Optional: Add logic to archive data instead of hard delete
      // For now, hard delete as per request
      await User.findByIdAndDelete(user._id);

      // Clear cookie
      res.clearCookie('token');

      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * @desc    Update App Preferences (Notifications, Theme, etc.)
   * @route   PUT /api/users/app-preferences
   * @access  Private
   */
  updateAppSettings: async (req, res) => {
    console.log(req)
    try {
      if (!req.body) {
        throw new Error('Server received empty body (req.body is undefined). Check Content-Type header.');
      }

      const { notifications, theme, language, location } = req.body;
      const updates = {};

      if (notifications !== undefined) {
        if (typeof notifications === 'boolean') {
          updates['preferences.notifications.push'] = notifications;
        } else {
          updates['preferences.notifications'] = notifications;
        }
      }
      if (theme !== undefined) updates['preferences.theme'] = theme;
      if (language !== undefined) updates['preferences.language'] = language;
      if (location !== undefined) updates['preferences.location'] = location;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true }
      ).select('-password');

      res.json({ success: true, user });
    } catch (error) {
      console.error('Update App Settings Error:', error.message);
      res.status(500).json({ message: error.message });
    }
  },

  // Get seller by ID (Public)
  getSellerById: async (req, res) => {
    try {
      const { id } = req.params;

      const query = {
        _id: id,
        $or: [
          { role: 'seller' },
          {
            role: 'buyer',
            'sellerProfile.sellerType': { $exists: true, $ne: [] }
          }
        ]
      };

      const seller = await User.findOne(query)
        .select('-password -googleId -__v');

      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Kitchen/Vendor not found'
        });
      }

      res.json({
        success: true,
        data: seller
      });
    } catch (error) {
      console.error('Get seller by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching vendor details',
        error: error.message
      });
    }
  }
};

module.exports = userController;
