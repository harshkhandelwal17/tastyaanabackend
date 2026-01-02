const mongoose = require('mongoose');

const slotTimingSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxOrders: {
    type: Number,
    default: 100,
    min: 1
  },
  orderCount: {
    type: Number,
    default: 0
  },
  deliveryCharge: {
    type: Number,
    default:0
  },
  allowsQuickOrder:
  {
    type: Boolean,
    default: true
  },
quickOrderCharge: {
  type: Number,
  default:20
},
  allowsScheduledOrder: {
    type: Boolean,
    default:true
  }
  ,
  maxAdvanceBookingDays: {
    type: Number,
    default:7
}
});

const categorySlotSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  dayOfWeek: {
    type: Number, // 0-6 (Sunday-Saturday)
    required: true,
    min: 0,
    max: 6
  },
  dayName: {
    type: String,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  slots: [slotTimingSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index to ensure one slot configuration per category per day
categorySlotSchema.index({ category: 1, dayOfWeek: 1 }, { unique: true });

// Pre-save hook to ensure dayName matches dayOfWeek
categorySlotSchema.pre('save', function(next) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (this.dayName !== days[this.dayOfWeek]) {
    this.dayName = days[this.dayOfWeek];
  }
  next();
});

// Method to check if a slot is available
categorySlotSchema.methods.isSlotAvailable = function(startTime, endTime) {
  const slot = this.slots.find(s => 
    s.startTime === startTime && 
    s.endTime === endTime && 
    s.isActive &&
    (s.orderCount < (s.maxOrders || 100))
  );
  return !!slot;
};

// Method to increment order count for a slot
categorySlotSchema.methods.incrementOrderCount = function(startTime, endTime) {
  const slot = this.slots.find(s => s.startTime === startTime && s.endTime === endTime);
  if (slot) {
    slot.orderCount = (slot.orderCount || 0) + 1;
    return true;
  }
  return false;
};

module.exports = mongoose.model('CategorySlot', categorySlotSchema);
