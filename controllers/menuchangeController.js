// controllers/menuChangeController.js
const MenuChange = require('../models/Menuchange');
const Order = require('../models/Order');
const Subscription = require('../models/Subscription');
const DailyMeal = require('../models/DailyMeal');
const User = require('../models/User');
const { processPayment } = require('../utils/paymentService');
const { createNotification } = require('../utils/notificationService');

/**
 * Get available meal options for change
 */
exports.getAvailableMealOptions = async (req, res) => {
  try {
    const { date, slot } = req.query;
    
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if date is today or tomorrow
    if (targetDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change meal for past dates'
      });
    }
    
    // Get daily meal for the date
    const dailyMeal = await DailyMeal.findOne({ date: targetDate });
    if (!dailyMeal) {
      return res.status(404).json({
        success: false,
        message: 'No menu available for this date'
      });
    }
    
    // Get user's active subscription
    const subscription = await Subscription.findOne({
      userId: req.userId,
      status: 'active',
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    }).populate('planId');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    // Build available options
    const availableOptions = {
      currentPlan: subscription.planId.tier,
      currentMeal: dailyMeal.meals[subscription.planId.tier][slot],
      availableChanges: {
        upgrades: [],
        downgrades: [],
        customItems: []
      }
    };
    
    // Add upgrade options
    if (subscription.planId.tier === 'low') {
      availableOptions.availableChanges.upgrades.push({
        tier: 'basic',
        meal: dailyMeal.meals.basic[slot],
        priceAdjustment: dailyMeal.meals.basic[slot].price - dailyMeal.meals.low[slot].price
      });
      availableOptions.availableChanges.upgrades.push({
        tier: 'premium',
        meal: dailyMeal.meals.premium[slot],
        priceAdjustment: dailyMeal.meals.premium[slot].price - dailyMeal.meals.low[slot].price
      });
    } else if (subscription.planId.tier === 'basic') {
      availableOptions.availableChanges.upgrades.push({
        tier: 'premium',
        meal: dailyMeal.meals.premium[slot],
        priceAdjustment: dailyMeal.meals.premium[slot].price - dailyMeal.meals.basic[slot].price
      });
      availableOptions.availableChanges.downgrades.push({
        tier: 'low',
        meal: dailyMeal.meals.low[slot],
        priceAdjustment: dailyMeal.meals.low[slot].price - dailyMeal.meals.basic[slot].price
      });
    } else if (subscription.planId.tier === 'premium') {
      availableOptions.availableChanges.downgrades.push({
        tier: 'basic',
        meal: dailyMeal.meals.basic[slot],
        priceAdjustment: dailyMeal.meals.basic[slot].price - dailyMeal.meals.premium[slot].price
      });
      availableOptions.availableChanges.downgrades.push({
        tier: 'low',
        meal: dailyMeal.meals.low[slot],
        priceAdjustment: dailyMeal.meals.low[slot].price - dailyMeal.meals.premium[slot].price
      });
    }
    
    // Add custom items (add-ons)
    const customItems = [
      { name: 'Extra Roti', price: 10, description: 'Additional wheat bread' },
      { name: 'Paneer Upgrade', price: 30, description: 'Upgrade dal to paneer curry' },
      { name: 'Sweet Dish', price: 25, description: 'Gulab jamun or kheer' },
      { name: 'Raita', price: 15, description: 'Fresh cucumber raita' },
      { name: 'Pickle', price: 8, description: 'Homemade pickle' },
      { name: 'Papad', price: 12, description: 'Crispy papad (2 pieces)' }
    ];
    
    availableOptions.availableChanges.customItems = customItems;
    
    // Calculate cutoff time (6 AM on the target date)
    const cutoffTime = new Date(targetDate);
    cutoffTime.setHours(6, 0, 0, 0);
    
    // If changing for today, check if it's before cutoff
    if (targetDate.getTime() === today.getTime() && new Date() >= cutoffTime) {
      return res.status(400).json({
        success: false,
        message: 'Menu change cutoff time has passed. Changes must be made before 6 AM.'
      });
    }
    
    availableOptions.cutoffTime = cutoffTime;
    availableOptions.canChange = new Date() < cutoffTime;
    
    res.json({
      success: true,
      data: availableOptions
    });
    
  } catch (error) {
    console.error('Get available meal options error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal options',
      error: error.message
    });
  }
};

/**
 * Request meal change
 */
exports.requestMealChange = async (req, res) => {
  try {
    const {
      changeDate,
      deliverySlot,
      newTier,
      customItems = [],
      reason = 'other',
      notes
    } = req.body;
    
    const targetDate = new Date(changeDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Validate date
    if (targetDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change meal for past dates'
      });
    }
    
    // Check cutoff time
    const cutoffTime = new Date(targetDate);
    cutoffTime.setHours(6, 0, 0, 0);
    
    if (new Date() >= cutoffTime) {
      return res.status(400).json({
        success: false,
        message: 'Menu change cutoff time has passed'
      });
    }
    
    // Get user's subscription
    const subscription = await Subscription.findOne({
      userId: req.userId,
      status: 'active',
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    }).populate('planId');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    // Get daily meal
    const dailyMeal = await DailyMeal.findOne({ date: targetDate });
    if (!dailyMeal) {
      return res.status(404).json({
        success: false,
        message: 'No menu available for this date'
      });
    }
    
    // Check if change request already exists
    const existingChange = await MenuChange.findOne({
      userId: req.userId,
      changeDate: targetDate,
      deliverySlot,
      status: { $in: ['pending', 'approved'] }
    });
    
    if (existingChange) {
      return res.status(400).json({
        success: false,
        message: 'A meal change request already exists for this date and slot'
      });
    }
    
    // Build original meal data
    const originalMeal = {
      planTier: subscription.planId.tier,
      items: dailyMeal.meals[subscription.planId.tier][deliverySlot].items,
      totalPrice: dailyMeal.meals[subscription.planId.tier][deliverySlot].price
    };
    
    // Build new meal data
    const newMeal = {
      planTier: newTier || subscription.planId.tier,
      items: newTier ? dailyMeal.meals[newTier][deliverySlot].items : originalMeal.items,
      totalPrice: newTier ? dailyMeal.meals[newTier][deliverySlot].price : originalMeal.totalPrice,
      customItems: customItems.map(item => ({
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: item.quantity || 1
      }))
    };
    
    // Add custom items price
    const customItemsTotal = customItems.reduce((total, item) => 
      total + (item.price * (item.quantity || 1)), 0
    );
    newMeal.totalPrice += customItemsTotal;
    
    // Create menu change request
    const menuChange = new MenuChange({
      userId: req.userId,
      subscriptionId: subscription._id,
      changeDate: targetDate,
      deliverySlot,
      originalMeal,
      newMeal,
      reason,
      notes,
      cutoffTime
    });
    
    // Calculate price adjustment
    menuChange.calculatePriceAdjustment();
    
    await menuChange.save();
    
    // Send notification
    await createNotification({
      userId: req.userId,
      title: 'Menu Change Request Submitted',
      message: `Your meal change request for ${targetDate.toDateString()} ${deliverySlot} has been submitted.`,
      type: 'order',
      data: { menuChangeId: menuChange._id }
    });
    
    res.status(201).json({
      success: true,
      message: 'Menu change request submitted successfully',
      data: menuChange
    });
    
  } catch (error) {
    console.error('Request meal change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request meal change',
      error: error.message
    });
  }
};

/**
 * Process payment for meal change (if required)
 */
exports.processMenuChangePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    
    const menuChange = await MenuChange.findById(id);
    if (!menuChange) {
      return res.status(404).json({
        success: false,
        message: 'Menu change request not found'
      });
    }
    
    if (menuChange.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    if (!menuChange.paymentRequired) {
      return res.status(400).json({
        success: false,
        message: 'No payment required for this change'
      });
    }
    
    if (menuChange.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }
    
    // Process payment
    if (paymentMethod === 'wallet') {
      const user = await User.findById(req.userId);
      if (user.wallet.balance < menuChange.priceAdjustment) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance'
        });
      }
      
      user.wallet.balance -= menuChange.priceAdjustment;
      user.wallet.transactions.push({
        amount: menuChange.priceAdjustment,
        type: 'debit',
        note: `Menu change payment for ${menuChange.changeDate.toDateString()}`,
        referenceId: `MENU_CHANGE_${menuChange._id}`
      });
      
      await user.save();
      
      menuChange.paymentStatus = 'paid';
      menuChange.transactionId = `WALLET_${Date.now()}`;
      
    } else {
      // Process external payment
      const paymentResult = await processPayment({
        amount: menuChange.priceAdjustment,
        currency: 'INR',
        method: paymentMethod,
        userId: req.userId,
        description: `Menu change payment for ${menuChange.changeDate.toDateString()}`
      });
      
      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: paymentResult.error
        });
      }
      
      menuChange.paymentStatus = 'paid';
      menuChange.transactionId = paymentResult.transactionId;
    }
    
    menuChange.status = 'approved';
    menuChange.processedAt = new Date();
    
    await menuChange.save();
    
    // Update the existing order if it exists
    const order = await Order.findOne({
      userId: req.userId,
      deliveryDate: menuChange.changeDate,
      deliverySlot: menuChange.deliverySlot,
      subscriptionId: menuChange.subscriptionId
    });
    
    if (order) {
      // Update order with new meal details
      order.items = menuChange.newMeal.items.map(item => ({
        name: item.name,
        quantity: 1,
        price: item.price || 0,
        category: 'main'
      }));
      
      // Add custom items
      if (menuChange.newMeal.customItems.length > 0) {
        order.items.push(...menuChange.newMeal.customItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: 'addon'
        })));
      }
      
      order.totalAmount = menuChange.newMeal.totalPrice;
      order.finalAmount = menuChange.newMeal.totalPrice;
      order.specialInstructions = `Menu changed: ${menuChange.reason}. ${menuChange.notes || ''}`;
      
      await order.save();
      menuChange.orderId = order._id;
      await menuChange.save();
    }
    
    // Send confirmation notification
    await createNotification({
      userId: req.userId,
      title: 'Menu Changed Successfully!',
      message: `Your meal for ${menuChange.changeDate.toDateString()} ${menuChange.deliverySlot} has been updated.`,
      type: 'order',
      data: { 
        menuChangeId: menuChange._id,
        orderId: order?._id 
      }
    });
    
    res.json({
      success: true,
      message: 'Menu change processed successfully',
      data: menuChange
    });
    
  } catch (error) {
    console.error('Process menu change payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

/**
 * Get user's menu change history
 */
exports.getUserMenuChanges = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const menuChanges = await MenuChange.find(filter)
      .populate('subscriptionId', 'planId')
      .populate('orderId', 'orderNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await MenuChange.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        menuChanges,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get user menu changes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu changes',
      error: error.message
    });
  }
};

/**
 * Cancel menu change request
 */
exports.cancelMenuChange = async (req, res) => {
  try {
    const { id } = req.params;
    
    const menuChange = await MenuChange.findById(id);
    if (!menuChange) {
      return res.status(404).json({
        success: false,
        message: 'Menu change request not found'
      });
    }
    
    if (menuChange.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    if (!['pending'].includes(menuChange.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel processed menu change'
      });
    }
    
    if (!menuChange.isWithinCutoff()) {
      return res.status(400).json({
        success: false,
        message: 'Cutoff time has passed'
      });
    }
    
    menuChange.status = 'rejected';
    menuChange.rejectionReason = 'Cancelled by user';
    menuChange.processedAt = new Date();
    
    await menuChange.save();
    
    // Process refund if payment was made
    if (menuChange.paymentStatus === 'paid') {
      const user = await User.findById(req.userId);
      user.wallet.balance += menuChange.priceAdjustment;
      user.wallet.transactions.push({
        amount: menuChange.priceAdjustment,
        type: 'credit',
        note: `Refund for cancelled menu change`,
        referenceId: `REFUND_MENU_${menuChange._id}`
      });
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Menu change cancelled successfully',
      data: menuChange
    });
    
  } catch (error) {
    console.error('Cancel menu change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel menu change',
      error: error.message
    });
  }
};

// Add an add-on to a pending menu change
exports.addAddonToMenuChange = async (req, res) => {
  const { id } = req.params;
  const { addon } = req.body; // { name, price, quantity }
  const menuChange = await MenuChange.findById(id);
  if (!menuChange) return res.status(404).json({ success: false, message: 'Menu change not found' });
  if (menuChange.status !== 'pending') return res.status(400).json({ success: false, message: 'Cannot modify after approval' });

  menuChange.newMeal.customItems = menuChange.newMeal.customItems || [];
  menuChange.newMeal.customItems.push(addon);
  menuChange.newMeal.totalPrice += addon.price * (addon.quantity || 1);
  await menuChange.save();
  res.json({ success: true, data: menuChange });
};

// Remove an add-on from a pending menu change
exports.removeAddonFromMenuChange = async (req, res) => {
  const { id } = req.params;
  const { addonName } = req.body;
  const menuChange = await MenuChange.findById(id);
  if (!menuChange) return res.status(404).json({ success: false, message: 'Menu change not found' });
  if (menuChange.status !== 'pending') return res.status(400).json({ success: false, message: 'Cannot modify after approval' });

  menuChange.newMeal.customItems = (menuChange.newMeal.customItems || []).filter(a => a.name !== addonName);
  // Recalculate totalPrice
  menuChange.newMeal.totalPrice = menuChange.newMeal.items.reduce((sum, item) => sum + item.price, 0)
    + menuChange.newMeal.customItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  await menuChange.save();
  res.json({ success: true, data: menuChange });
};

