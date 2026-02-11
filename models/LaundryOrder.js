const mongoose = require('mongoose');

const laundryOrderSchema = new mongoose.Schema({
  // Order Info
  orderNumber: { 
    type: String, 
    unique: true, 
    required: true 
  },
  
  // References
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LaundryVendor', 
    required: true 
  },
  
  // Order Type & Delivery Speed
  orderType: { 
    type: String, 
    enum: ['one_time', 'subscription'], 
    default: 'one_time' 
  },
  deliverySpeed: {
    type: String,
    enum: ['quick', 'scheduled', 'subscription'],
    required: true,
    default: 'scheduled'
  },
  subscription: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LaundrySubscription' 
  },
  
  // Items
  items: [{
    category: { 
      type: String, 
      enum: ['topwear', 'bottomwear', 'home_textiles', 'others'], 
      required: true 
    },
    type: { type: String, required: true }, // shirt, jeans, bedsheet, shoe
    quantity: { type: Number, required: true, min: 1 },
    serviceType: { 
      type: String, 
      enum: ['wash_fold', 'wash_iron', 'dry_clean', 'iron_only', 'shoe_cleaning', 'folding_only'], 
      required: true 
    },
    // Pricing details
    pricingModel: {
      type: String,
      enum: ['per_piece', 'weight_based'],
      default: 'per_piece'
    },
    pricePerItem: { type: Number }, // for per-piece pricing
    pricePerKg: { type: Number }, // for weight-based pricing
    weight: { type: Number }, // individual item weight (kg)
    totalPrice: { type: Number, required: true },
    specialInstructions: { type: String, maxlength: 500 }
  }],
  
  // Weight & Count
  totalItems: { type: Number, required: true },
  estimatedWeight: { type: Number }, // kg
  actualWeight: { type: Number }, // kg (after pickup)
  
  // Pricing
  pricing: {
    subtotal: { type: Number, required: true },
    // Charges based on delivery speed
    pickupCharges: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 0 },
    speedSurcharge: { type: Number, default: 0 }, // for quick service
    expressSurcharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    subscriptionDiscount: { type: Number, default: 0 }, // if using subscription
    total: { type: Number, required: true },
    // Pricing breakdown
    breakdown: {
      perPieceTotal: { type: Number, default: 0 },
      weightBasedTotal: { type: Number, default: 0 }
    }
  },
  
  // Schedule
  schedule: {
    pickup: {
      date: { type: Date, required: true },
      timeSlot: { 
        type: String, 
        enum: ['morning', 'afternoon', 'evening', 'immediate'], 
        required: true 
      },
      timeRange: { type: String }, // "9 AM - 12 PM"
      address: {
        street: String,
        area: String,
        city: String,
        pincode: String,
        coordinates: [Number],
        landmark: String,
        contactName: String,
        contactPhone: String
      },
      actualTime: { type: Date },
      status: { 
        type: String, 
        enum: ['scheduled', 'completed', 'missed'], 
        default: 'scheduled' 
      },
      notes: { type: String }
    },
    
    delivery: {
      date: { type: Date, required: true },
      timeSlot: { 
        type: String, 
        enum: ['morning', 'afternoon', 'evening'], 
        required: true 
      },
      timeRange: { type: String },
      address: {
        street: String,
        area: String,
        city: String,
        pincode: String,
        coordinates: [Number],
        landmark: String,
        contactName: String,
        contactPhone: String
      },
      actualTime: { type: Date },
      status: { 
        type: String, 
        enum: ['scheduled', 'completed', 'missed'], 
        default: 'scheduled' 
      },
      notes: { type: String }
    }
  },
  
  // Status
  status: { 
    type: String, 
    enum: [
      'scheduled', 
      'picked_up', 
      'processing', 
      'quality_check', 
      'ready', 
      'out_for_delivery', 
      'delivered', 
      'cancelled'
    ], 
    default: 'scheduled' 
  },
  
  // Status History
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // Processing Details
  processing: {
    startTime: { type: Date },
    endTime: { type: Date },
    substatus: { 
      type: String, 
      enum: ['washing', 'drying', 'ironing', 'folding', 'packing'] 
    },
    issues: [{ 
      type: String, 
      description: String, 
      photo: String 
    }]
  },
  
  // Quality Check
  qualityCheck: {
    completed: { type: Boolean, default: false },
    checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedAt: { type: Date },
    issues: [{ 
      itemType: String, 
      issue: String, 
      action: String 
    }],
    photos: [{ type: String }],
    notes: { type: String }
  },
  
  // Payment
  payment: {
    method: { 
      type: String, 
      enum: ['cash', 'wallet', 'upi', 'card', 'subscription'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'], 
      default: 'pending' 
    },
    transactionId: { type: String },
    paidAmount: { type: Number },
    paidAt: { type: Date }
  },
  
  // Delivery Partner (if applicable)
  deliveryPartner: {
    pickupBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveryBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 1000 },
    photos: [{ type: String }],
    submittedAt: { type: Date }
  },
  
  // Special Instructions
  specialInstructions: { type: String, maxlength: 500 },
  
  // Cancellation
  cancellation: {
    reason: { type: String },
    cancelledBy: { type: String, enum: ['user', 'vendor', 'admin'] },
    cancelledAt: { type: Date },
    refundAmount: { type: Number },
    refundStatus: { 
      type: String, 
      enum: ['pending', 'processed', 'failed'] 
    }
  },
  
}, { timestamps: true });

// Indexes
laundryOrderSchema.index({ orderNumber: 1 });
laundryOrderSchema.index({ user: 1, createdAt: -1 });
laundryOrderSchema.index({ vendor: 1, status: 1 });
laundryOrderSchema.index({ status: 1 });
laundryOrderSchema.index({ 'schedule.pickup.date': 1 });
laundryOrderSchema.index({ 'schedule.delivery.date': 1 });

// Generate order number before saving (only if not already set)
laundryOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const count = await mongoose.model('LaundryOrder').countDocuments();
      this.orderNumber = `TY-LAU-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      // If countDocuments fails, generate a timestamp-based order number
      this.orderNumber = `TY-LAU-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

// Add status to history when status changes
laundryOrderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: `Status changed to ${this.status}`
    });
  }
  next();
});

module.exports = mongoose.model('LaundryOrder', laundryOrderSchema);