const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const User = require('../models/User');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const Product = require("../models/Product");
const couponController = {
  // ====== ADMIN ROUTES ======
  
  /**
   * Create a new coupon
   */
  createCoupon: async (req, res) => {
    try {
      const {
        code,
        description,
        discountType,
        discountValue,
        maxDiscount,
        minOrderAmount,
        maxUsage,
        maxUsagePerUser,
        startDate,
        endDate,
        applicableProducts,
        applicableCategories,
        applicableUsers,
        excludeUsers,
        // New fields for advanced targeting
        targeting,
        specialDiscount,
        priority,
        canStackWith,
        cannotStackWith,
        campaign
      } = req.body;

      // Validate required fields
      if (!code || !discountType || !discountValue || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: code, discountType, discountValue, startDate, endDate'
        });
      }

      // Check if coupon code already exists
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }

      // Create coupon
      const coupon = new Coupon({
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        maxDiscount,
        minOrderAmount: minOrderAmount || 0,
        maxUsage,
        maxUsagePerUser: maxUsagePerUser || 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        applicableProducts,
        applicableCategories,
        applicableUsers,
        excludeUsers,
        // New fields
        targeting,
        specialDiscount,
        priority: priority || 0,
        canStackWith,
        cannotStackWith,
        campaign,
        createdBy: req.user._id
      });

      await coupon.save();

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: coupon
      });

    } catch (error) {
      console.error('Error creating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating coupon',
        error: error.message
      });
    }
  },

  /**
   * Get all coupons (admin)
   */
  getAllCoupons: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const skip = (page - 1) * limit;

      let query = {};
      
      if (status) {
        if (status === 'active') {
          query.isActive = true;
          query.startDate = { $lte: new Date() };
          query.endDate = { $gte: new Date() };
        } else if (status === 'expired') {
          query.endDate = { $lt: new Date() };
        } else if (status === 'inactive') {
          query.isActive = false;
        }
      }

      if (search) {
        query.$or = [
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const coupons = await Coupon.find(query)
        .populate('createdBy', 'name email')
        .populate('applicableProducts', 'name')
        .populate('applicableCategories', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Coupon.countDocuments(query);

      res.json({
        success: true,
        data: {
          coupons,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });

    } catch (error) {
      console.error('Error fetching coupons:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching coupons',
        error: error.message
      });
    }
  },

  /**
   * Get coupon by ID
   */
  getCouponById: async (req, res) => {
    try {
      const { id } = req.params;

      const coupon = await Coupon.findById(id)
        .populate('createdBy', 'name email')
        .populate('applicableProducts', 'name price')
        .populate('applicableCategories', 'name')
        .populate('applicableUsers', 'name email')
        .populate('excludeUsers', 'name email');

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      // Get usage statistics
      const usageStats = await CouponUsage.aggregate([
        { $match: { couponId: mongoose.Types.ObjectId(id) } },
        {
          $group: {
            _id: null,
            totalUsage: { $sum: 1 },
            totalDiscount: { $sum: '$discountAmount' },
            avgOrderValue: { $avg: '$orderTotal' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          coupon,
          usageStats: usageStats[0] || { totalUsage: 0, totalDiscount: 0, avgOrderValue: 0 }
        }
      });

    } catch (error) {
      console.error('Error fetching coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching coupon',
        error: error.message
      });
    }
  },

  /**
   * Update coupon
   */
  updateCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated
      delete updateData.usedCount;
      delete updateData.createdBy;
      delete updateData.createdAt;

      const coupon = await Coupon.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      res.json({
        success: true,
        message: 'Coupon updated successfully',
        data: coupon
      });

    } catch (error) {
      console.error('Error updating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating coupon',
        error: error.message
      });
    }
  },

  /**
   * Delete coupon
   */
  deleteCoupon: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if coupon has been used
      const usageCount = await CouponUsage.countDocuments({ couponId: id });
      if (usageCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete coupon that has been used. Deactivate instead.'
        });
      }

      const coupon = await Coupon.findByIdAndDelete(id);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      res.json({
        success: true,
        message: 'Coupon deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting coupon',
        error: error.message
      });
    }
  },

  // ====== USER ROUTES ======

  /**
   * Get available coupons for user based on context
   */
  getAvailableCoupons: async (req, res) => {
    try {
      const { orderAmount, orderType, deliveryAddress, paymentMethod } = req.query;
      const userId = req.user._id;
      
      // Build query for active coupons
      const query = {
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        $or: [
          { maxUsage: null },
          { $expr: { $lt: ['$usedCount', '$maxUsage'] } }
        ]
      };
      
      // Add minimum order amount filter
      if (orderAmount) {
        query.minOrderAmount = { $lte: parseFloat(orderAmount) };
      }
      
      const coupons = await Coupon.find(query)
        .populate('applicableProducts', 'name price')
        .populate('applicableCategories', 'name')
        .populate('applicableUsers', 'name email')
        .populate('excludeUsers', 'name email')
        .sort({ priority: -1, createdAt: -1 });
      
      // Filter coupons based on user eligibility and context
      const availableCoupons = [];
      
      for (const coupon of coupons) {
        const orderData = {
          type: orderType,
          subtotal: parseFloat(orderAmount) || 0,
          deliveryAddress: deliveryAddress ? JSON.parse(deliveryAddress) : null,
          paymentMethod: paymentMethod
        };
        
        const canUse = await coupon.canUserUse(userId, orderData);
        if (canUse.canUse) {
          const discountResult = coupon.calculateDiscount(parseFloat(orderAmount) || 0);
          availableCoupons.push({
            ...coupon.toObject(),
            discountAmount: discountResult.discount,
            discountDetails: discountResult.details
          });
        }
      }
      
      res.json({
        success: true,
        data: availableCoupons,
        count: availableCoupons.length
      });
      
    } catch (error) {
      console.error('Error getting available coupons:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching available coupons'
      });
    }
  },

  /**
   * Validate coupon code
   */
  validateCoupon: async (req, res) => {
    try {
      const { code, orderAmount, orderItems, orderType, deliveryAddress, paymentMethod } = req.body;
      const userId = req.user._id;
      console.log("order items is :", orderItems);
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code is required'
        });
      }

      // Find coupon
      const coupon = await Coupon.findOne({ 
        code: code.toUpperCase(),
        isActive: true
      });

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Invalid coupon code'
        });
      }

      // Check if coupon is valid (dates, usage limits)
      if (!coupon.isValid) {
        const now = new Date();
        let reason = 'Coupon is not valid';
        
        if (!coupon.isActive) {
          reason = 'Coupon is not active';
        } else if (coupon.startDate > now) {
          reason = 'Coupon is not yet active';
        } else if (coupon.endDate < now) {
          reason = 'Coupon has expired';
        } else if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
          reason = 'Coupon usage limit exceeded';
        }
        
        return res.status(400).json({
          success: false,
          message: reason
        });
      }

      // Check if user can use this coupon with order context
      const orderData = {
        type: orderType,
        subtotal: orderAmount,
        deliveryAddress: deliveryAddress,
        paymentMethod: paymentMethod
      };
      
      const canUse = await coupon.canUserUse(userId, orderData);
      if (!canUse.canUse) {
        return res.status(400).json({
          success: false,
          message: canUse.reason
        });
      }










      // Validate applicable products and categories
if ((coupon.applicableProducts?.length || 0) > 0 || (coupon.applicableCategories?.length || 0) > 0) {
  const productIds = orderItems.map(item => item?.product?._id);

  // Fetch products with categories
  const products = await Product.find({ _id: { $in: productIds } }).populate('category');

  let productMatch = true;
  let categoryMatch = true;

  // If product restrictions exist → check
  if ((coupon.applicableProducts?.length || 0) > 0) {
    productMatch = products.some(p =>
      coupon.applicableProducts.some(cProd => cProd.equals(p._id))
    );
  }

  // If category restrictions exist → check
  if ((coupon.applicableCategories?.length || 0) > 0) {
    categoryMatch = products.some(p =>
      p.category && coupon.applicableCategories.some(cCat => cCat.equals(p.category._id))
    );
  }

  // If either restriction fails → invalidate
  if (!productMatch || !categoryMatch) {
    return res.status(400).json({
      success: false,
      message: 'This coupon is not applicable to the selected products or categories'
    });
  }
}








      // Calculate discount from coupon with order items
      const discountResult = coupon.calculateDiscount(orderAmount || 0, orderItems || []);
      if (discountResult.reason) {
        return res.status(400).json({
          success: false,
          message: discountResult.reason
        });
      }
      
      // Check if discount is zero (minimum order amount not met)
      if (discountResult.discount === 0 && (orderAmount || 0) < coupon.minOrderAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`
        });
      }

      res.json({
        success: true,
        message: 'Coupon is valid',
        data: {
          coupon: {
            id: coupon._id,
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxDiscount: coupon.maxDiscount,
            minOrderAmount: coupon.minOrderAmount,
            specialDiscount: coupon.specialDiscount,
            targeting: coupon.targeting
          },
          discount: discountResult.discount,
          discountDetails: discountResult.details,
          finalAmount: (orderAmount || 0) - discountResult.discount
        }
      });

    } catch (error) {
      console.error('Error validating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating coupon',
        error: error.message
      });
    }
  },

  /**
   * Get coupon usage history (Admin)
   */
  getCouponUsageHistory: async (req, res) => {
    try {
      const { id: couponId } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        startDate, 
        endDate 
      } = req.query;
      
      const skip = (page - 1) * limit;
      const query = { couponId };
      
      // Add date range filter if provided
      if (startDate || endDate) {
        query.usedAt = {};
        if (startDate) query.usedAt.$gte = new Date(startDate);
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          query.usedAt.$lte = endOfDay;
        }
      }

      // Get usage history with pagination
      const [usageHistory, total] = await Promise.all([
        CouponUsage.find(query)
          .populate('userId', 'name email phone')
          .populate('orderId', 'orderNumber totalAmount status')
          .sort({ usedAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        CouponUsage.countDocuments(query)
      ]);

      // Get coupon details
      const coupon = await Coupon.findById(couponId)
        .select('code description discountType discountValue maxUsage startDate endDate isActive')
        .lean();
console.log("coupan is : ",coupon);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }
      console.log("usages is : ", usageHistory);
      // Calculate usage statistics
      const totalUsed = await CouponUsage.countDocuments({ couponId });
      const usageRate = coupon.maxUsage ? (totalUsed / coupon.maxUsage) * 100 : 0;

      res.json({
        success: true,
        data: {
          coupon,
          usageHistory,
          statistics: {
            totalUsed,
            remaining: coupon.maxUsage ? coupon.maxUsage - totalUsed : null,
            usageRate: Math.min(100, Math.round(usageRate * 100) / 100) // Round to 2 decimal places, max 100%
          },
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching coupon usage history:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching coupon usage history',
        error: error.message
      });
    }
  },

  /**
   * Get user's coupon usage history
   */
  getUserCouponHistory: async (req, res) => {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const usageHistory = await CouponUsage.find({ userId })
        .populate('couponId', 'code description discountType discountValue')
        .populate('orderId', 'orderNumber totalAmount status')
        .sort({ usedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await CouponUsage.countDocuments({ userId });

      res.json({
        success: true,
        data: {
          usageHistory,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });

    } catch (error) {
      console.error('Error fetching coupon history:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching coupon history',
        error: error.message
      });
    }
  },

  /**
   * Get available coupons for user
   */
  getAvailableCoupons: async (req, res) => {
    try {
      const userId = req.user._id;
      const { orderAmount = 0 } = req.query;

      console.log('Getting available coupons for user:', userId, 'orderAmount:', orderAmount);

      const now = new Date();
      
      // Find active coupons that are valid
      const coupons = await Coupon.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
          { maxUsage: null },
          { $expr: { $lt: ['$usedCount', '$maxUsage'] } }
        ]
      }).sort({ createdAt: -1 });

      console.log('Found coupons:', coupons.length);

      const availableCoupons = [];

      for (const coupon of coupons) {
        try {
          // Check if user can use this coupon
          const canUse = await coupon.canUserUse(userId);
          console.log(`Coupon ${coupon.code} canUse:`, canUse);
          
          if (canUse.canUse) {
            // Calculate discount for this order amount
            const discountResult = coupon.calculateDiscount(parseFloat(orderAmount));
            
            availableCoupons.push({
              id: coupon._id,
              code: coupon.code,
              description: coupon.description,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              maxDiscount: coupon.maxDiscount,
              minOrderAmount: coupon.minOrderAmount,
              discount: discountResult.discount,
              finalAmount: parseFloat(orderAmount) - discountResult.discount,
              valid: discountResult.discount > 0
            });
          }
        } catch (couponError) {
          console.error(`Error processing coupon ${coupon.code}:`, couponError);
        }
      }

      console.log('Available coupons for user:', availableCoupons.length);

      res.json({
        success: true,
        data: availableCoupons
      });

    } catch (error) {
      console.error('Error fetching available coupons:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching available coupons',
        error: error.message
      });
    }
  },

  // ====== UTILITY FUNCTIONS ======

  /**
   * Apply coupon to order (internal use)
   */
  applyCouponToOrder: async (couponId, userId, orderId, orderAmount) => {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Find coupon
        const coupon = await Coupon.findById(couponId).session(session);
        if (!coupon) {
          throw new Error('Coupon not found');
        }

        // Check if user can use this coupon
        const canUse = await coupon.canUserUse(userId);
        if (!canUse.canUse) {
          throw new Error(canUse.reason);
        }

        // Calculate discount
        const discountResult = coupon.calculateDiscount(orderAmount);
        if (discountResult.reason) {
          throw new Error(discountResult.reason);
        }

        // Create usage record
        const couponUsage = new CouponUsage({
          couponId: coupon._id,
          userId: userId,
          orderId: orderId,
          discountAmount: discountResult.discount,
          orderTotal: orderAmount,
          couponCode: coupon.code
        });

        await couponUsage.save({ session });

        // Update coupon usage count
        await Coupon.findByIdAndUpdate(
          couponId,
          { 
            $inc: { usedCount: 1 },
            $set: { lastUsedAt: new Date() }
          },
          { session }
        );

        await session.commitTransaction();

        return {
          success: true,
          discount: discountResult.discount,
          couponCode: coupon.code
        };

      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

    } catch (error) {
      console.error('Error applying coupon to order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Remove coupon from order (internal use)
   */
  removeCouponFromOrder: async (orderId) => {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Find coupon usage
        const couponUsage = await CouponUsage.findOne({ orderId }).session(session);
        if (!couponUsage) {
          await session.abortTransaction();
          return { success: true, message: 'No coupon usage found' };
        }

        // Decrease coupon usage count
        await Coupon.findByIdAndUpdate(
          couponUsage.couponId,
          { $inc: { usedCount: -1 } },
          { session }
        );

        // Remove usage record
        await CouponUsage.findByIdAndDelete(couponUsage._id, { session });

        await session.commitTransaction();

        return {
          success: true,
          message: 'Coupon removed from order'
        };

      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

    } catch (error) {
      console.error('Error removing coupon from order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = couponController;
