// models/DailyOrder.js
const mongoose = require('mongoose');

const dailyOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening'],
    required: true
  },
  orderType: {
    type: String,
    enum: ['subscription', 'normal'],
    default: 'subscription'
  },
  // Preparation and delivery timing
  preparationTime: {
    type: Date,
    required: true
  },
  preparationStartTime: Date,
  preparationCompletedTime: Date,
  
  // Assignment and delivery
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  
  // Meal details
  mealPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan'
  },
  planType: String,
  isCustomized: {
    type: Boolean,
    default: false
  },
  
  // Address
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: { lat: Number, lng: Number },
    instructions: String
  },
  
  // Status and tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'assigned', 'picked_up', 'delivered', 'cancelled', 'not_prepared','active','delayed','cancelled'],
    default: 'pending'
  },
  
  // Delay tracking
  isDelayed: {
    type: Boolean,
    default: false
  },
  delayedAt: Date,
  delayReason: String,
  delayType: {
    type: String,
    // enum: ['seller', 'driver', 'both','null'],
    default: null
  },
  penaltyAmount: {
    type: Number,
    default: 0
  },
  // Additional timing fields for delay calculation
  readyForPickupAt: Date,
  preparingAt: Date,
  notes: String,
  // Morning meal details (if applicable to user's plan)
  morning: {
    mealType: {
      type: String,
      enum: ['default', 'customized'],
      default: 'default'
    },
    // For default meals - reference to DailyMeal
    dailyMealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyMeal'
    },
    // For customized meals - detailed customization data
    customization: {
      notes: String,
      spiceLevel: {
        type: String,
        enum: ['mild', 'medium', 'hot', 'extra-hot'],
        default: 'medium'
      },
      preferences: {
        noOnion: { type: Boolean, default: false },
        noGarlic: { type: Boolean, default: false },
        specialInstructions: String
      },
      extraItems: [{
        name: String,
        quantity: Number,
        price: Number,
        category: String
      }],
      mealReplacement: {
        replacementId: String,
        name: String,
        price: Number,
        category: String
      },
      dietaryPreference: {
        type: String,
        enum: ['vegetarian', 'vegan', 'non-vegetarian', 'jain', 'regular'],
        default: 'vegetarian'
      },
      customizations: [String], // Array of customization options like ['no-onions', 'less-spicy']
      quantity: {
        type: Number,
        default: 1,
        min: 1
      },
      timing: {
        type: String,
        enum: ['morning', 'evening', 'office', 'evening-thali'],
        default: 'morning'
      },
      totalExtraCost: {
        type: Number,
        default: 0
      },
      paymentAmount: {
        type: Number,
        default: 0
      },
      paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
      }
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled','active'],
      default: 'pending'
    },
    deliveredAt: Date,
    feedback: {
      rating: Number,
      comment: String,
      submittedAt: Date
    }
  },
  // Evening meal details (if applicable to user's plan)
  evening: {
    mealType: {
      type: String,
      enum: ['default', 'customized'],
      default: 'default'
    },
    // For default meals - reference to DailyMeal
    dailyMealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyMeal'
    },
    // For customized meals - detailed customization data
    customization: {
      notes: String,
      spiceLevel: {
        type: String,
        enum: ['mild', 'medium', 'hot', 'extra-hot'],
        default: 'medium'
      },
      preferences: {
        noOnion: { type: Boolean, default: false },
        noGarlic: { type: Boolean, default: false },
        specialInstructions: String
      },
      extraItems: [{
        name: String,
        quantity: Number,
        price: Number,
        category: String
      }],
      mealReplacement: {
        replacementId: String,
        name: String,
        price: Number,
        category: String
      },
      dietaryPreference: {
        type: String,
        enum: ['vegetarian', 'vegan', 'non-vegetarian', 'jain', 'regular'],
        default: 'vegetarian'
      },
      customizations: [String], // Array of customization options like ['no-onions', 'less-spicy']
      quantity: {
        type: Number,
        default: 1,
        min: 1
      },
      timing: {
        type: String,
        enum: ['morning', 'evening', 'office', 'evening-thali'],
        default: 'evening'
      },
      totalExtraCost: {
        type: Number,
        default: 0
      },
      paymentAmount: {
        type: Number,
        default: 0
      },
      paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
      }
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled','active'],
      default: 'pending'
    },
    deliveredAt: Date,
    feedback: {
      rating: Number,
      comment: String,
      submittedAt: Date
    }
  },
  // Overall order status
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'],
    default: 'pending'
  },
  // Total extra cost for the day (morning + evening)
  totalExtraCost: {
    type: Number,
    default: 0
  },
  // Total payment amount for the day
  totalPaymentAmount: {
    type: Number,
    default: 0
  },
  // Overall payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  // Seller notes
  sellerNotes: String,
  // Customer notes
  customerNotes: String,
  // Delivery details
  deliveryDetails: {
    address: String,
    contactNumber: String,
    deliveryInstructions: String,
    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Compound index to ensure one order per user per date per subscription
dailyOrderSchema.index({ userId: 1, subscriptionId: 1, date: 1 }, { unique: true });

// Index for efficient querying
dailyOrderSchema.index({ userId: 1, date: 1 });
dailyOrderSchema.index({ subscriptionId: 1, date: 1 });
dailyOrderSchema.index({ date: 1, orderStatus: 1 });

// Method to check if order has any customizations
dailyOrderSchema.methods.hasCustomizations = function() {
  return (this.morning && this.morning.mealType === 'customized') ||
         (this.evening && this.evening.mealType === 'customized');
};

// Method to get total extra cost
dailyOrderSchema.methods.getTotalExtraCost = function() {
  let total = 0;
  if (this.morning && this.morning.customization) {
    total += this.morning.customization.totalExtraCost || 0;
  }
  if (this.evening && this.evening.customization) {
    total += this.evening.customization.totalExtraCost || 0;
  }
  return total;
};

// Method to check if payment is required
dailyOrderSchema.methods.requiresPayment = function() {
  return this.getTotalExtraCost() > 0;
};

// Method to update order status
dailyOrderSchema.methods.updateStatus = async function(newStatus, mealType = null) {
  let isMealDelivered = false;
  
  if (mealType === 'morning' && this.morning) {
    // Only process if status is changing to delivered
    if (newStatus === 'delivered' && this.morning.status !== 'delivered') {
      this.morning.status = newStatus;
      this.morning.deliveredAt = new Date();
      isMealDelivered = true;
    } else {
      this.morning.status = newStatus;
    }
  } else if (mealType === 'evening' && this.evening) {
    // Only process if status is changing to delivered
    if (newStatus === 'delivered' && this.evening.status !== 'delivered') {
      this.evening.status = newStatus;
      this.evening.deliveredAt = new Date();
      isMealDelivered = true;
    } else {
      this.evening.status = newStatus;
    }
  } else {
    this.orderStatus = newStatus;
  }
  
  // Save the order first
  await this.save();
  
  // If a meal was just marked as delivered, update the subscription
  if (isMealDelivered && this.subscriptionId) {
    try {
      const Subscription = mongoose.model('Subscription');
      await Subscription.findByIdAndUpdate(
        this.subscriptionId,
        { 
          $inc: { 
            'mealCounts.mealsDelivered': 1,
            'mealCounts.mealsRemaining': -1 
          } 
        },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating subscription meal count:', error);
      // Don't fail the request, just log the error
    }
  }
  
  return this;
};

// Instance methods for status management
dailyOrderSchema.methods.updateOrderStatus = async function(newStatus, notes) {
  this.status = newStatus;
  
  if (newStatus === 'preparing' && !this.preparationStartTime) {
    this.preparationStartTime = new Date();
  }
  
  if (newStatus === 'ready_for_pickup' && !this.preparationCompletedTime) {
    this.preparationCompletedTime = new Date();
  }
  
  if (newStatus === 'picked_up' && !this.pickedUpAt) {
    this.pickedUpAt = new Date();
  }
  
  if (newStatus === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
    
    // Update subscription meal count
    try {
      const Subscription = mongoose.model('Subscription');
      await Subscription.findByIdAndUpdate(
        this.subscriptionId,
        { 
          $inc: { 
            'mealCounts.mealsDelivered': 1,
            'mealCounts.mealsRemaining': -1 
          } 
        }
      );
    } catch (error) {
      console.error('Error updating subscription meal count:', error);
    }
  }
  
  // Check for delays
  if (this.preparationTime && newStatus !== 'delivered' && newStatus !== 'cancelled') {
    const now = new Date();
    const delayThreshold = new Date(this.preparationTime.getTime() + 25 * 60 * 1000); // 25 minutes
    
    if (now > delayThreshold && !this.isDelayed) {
      this.isDelayed = true;
      this.delayedAt = new Date();
      this.delayReason = notes || 'Preparation/delivery exceeded time limit';
      this.penaltyAmount = 100; // 100% penalty as mentioned
    }
  }
  
  return await this.save();
};

// Method to assign driver
dailyOrderSchema.methods.assignDriver = async function(driverId) {
  if (this.deliveryPartner||this.assignedDriver) {
    throw new Error('Order already assigned to a driver');
  }
  
  this.deliveryPartner = driverId;
  this.assignedAt = new Date();
  this.status = 'assigned';
  
  return await this.save();
};

// Check if order is ready for pickup
dailyOrderSchema.methods.isReadyForPickup = function() {
  return this.status === 'ready_for_pickup';
};

// Check if order is delayed
dailyOrderSchema.methods.checkDelay = function() {
  if (!this.preparationTime || this.status === 'delivered' || this.status === 'cancelled') {
    return false;
  }
  
  const now = new Date();
  const delayThreshold = new Date(this.preparationTime.getTime() + 25 * 60 * 1000);
  
  return now > delayThreshold;
};

// Static method to get today's tiffin list for vendor
dailyOrderSchema.statics.getTodayTiffinList = async function(vendorId, shift) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return await this.find({
    vendorId: vendorId,
    date: { $gte: today, $lt: tomorrow },
    shift: shift,
    orderType: 'subscription'
  }).populate([
    { path: 'subscriptionId', select: 'subscriptionId planType' },
    { path: 'mealPlan', select: 'title' },
    { path: 'deliveryPartner', select: 'name phone' },
    { path: 'userId', select: 'name phone' }
  ]).sort({ preparationTime: 1 });
};

// Static method to get delayed orders for penalty tracking
dailyOrderSchema.statics.getDelayedOrders = async function(vendorId) {
  return await this.find({
    vendorId: vendorId,
    isDelayed: true,
    status: { $nin: ['delivered', 'cancelled'] }
  }).populate([
    { path: 'subscriptionId', select: 'subscriptionId planType' },
    { path: 'mealPlan', select: 'title' },
    { path: 'userId', select: 'name phone' }
  ]).sort({ delayedAt: -1 });
};

// Static method for driver order acceptance
dailyOrderSchema.statics.acceptOrdersByDriver = async function(driverId, orderIds) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find available orders
    const availableOrders = await this.find({
      _id: { $in: orderIds },
      deliveryPartner: null,
      status: 'ready_for_pickup'
    }).session(session);
    
    if (availableOrders.length === 0) {
      throw new Error('No available orders found');
    }
    
    // Assign all orders to the driver
    const assignedOrders = [];
    for (const order of availableOrders) {
      order.deliveryPartner = driverId;
      order.assignedAt = new Date();
      order.status = 'assigned';
      await order.save({ session });
      assignedOrders.push(order);
    }
    
    await session.commitTransaction();
    return assignedOrders;
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = mongoose.model('DailyOrder', dailyOrderSchema); 