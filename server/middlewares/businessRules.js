// middleware/businessRules.js
/**
 * Check subscription status before order creation
 */
exports.checkSubscriptionStatus = async (req, res, next) => {
    try {
      const { subscriptionId } = req.body;
      
      if (subscriptionId) {
        const Subscription = require('../models/Subscription');
        const subscription = await Subscription.findById(subscriptionId);
        
        if (!subscription) {
          return res.status(404).json({
            success: false,
            message: 'Subscription not found'
          });
        }
        
        if (subscription.status !== 'active') {
          return res.status(400).json({
            success: false,
            message: 'Subscription is not active'
          });
        }
        
        if (subscription.remainingDays <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Subscription has expired'
          });
        }
        
        req.subscription = subscription;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Check order timing restrictions
   */
  exports.checkOrderTiming = (req, res, next) => {
    const now = new Date();
    const currentHour = now.getHours();
    const { deliverySlot, deliveryDate } = req.body;
    
    const selectedDate = new Date(deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    // Check if ordering for today
    if (selectedDate.getTime() === today.getTime()) {
      if (deliverySlot === 'lunch' && currentHour >= 11) {
        return res.status(400).json({
          success: false,
          message: 'Lunch orders must be placed before 11 AM'
        });
      }
      
      if (deliverySlot === 'dinner' && currentHour >= 17) {
        return res.status(400).json({
          success: false,
          message: 'Dinner orders must be placed before 5 PM'
        });
      }
    }
    
    next();
  };
  
  /**
   * Check daily order limits
   */
  exports.checkDailyOrderLimit = async (req, res, next) => {
    try {
      const { deliveryDate } = req.body;
      const Order = require('../models/Order');
      
      const selectedDate = new Date(deliveryDate);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Check user's daily order count
      const userOrderCount = await Order.countDocuments({
        userId: req.userId,
        deliveryDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: { $nin: ['cancelled'] }
      });
      
      const maxOrdersPerDay = 5; // Business rule: max 5 orders per user per day
      
      if (userOrderCount >= maxOrdersPerDay) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${maxOrdersPerDay} orders allowed per day`
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
  
  /**
   * Validate delivery address
   */
  exports.validateDeliveryAddress = async (req, res, next) => {
    try {
      const { deliveryAddress } = req.body;
      
      if (!deliveryAddress) {
        // Use user's default address
        const user = req.user;
        if (!user.address || !user.address.street) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a delivery address'
          });
        }
        
        req.body.deliveryAddress = user.address;
      }
      
      // Validate pincode (basic validation for Indian pincodes)
      const pincode = deliveryAddress.pincode;
      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 6-digit pincode'
        });
      }
      
      // Check if we deliver to this pincode (business logic)
      const serviceablePincodes = [
        '452001', '452002', '452003', '452004', '452005', // Indore pincodes
        '452010', '452011', '452012', '452013', '452014',
        '452015', '452016', '452017', '452018', '452020'
      ];
      
      if (!serviceablePincodes.includes(pincode)) {
        return res.status(400).json({
          success: false,
          message: 'Sorry, we do not deliver to this pincode yet'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };