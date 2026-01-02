const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  address: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  phone: {
    type: String,
    required: true
  },
  mealType: {
    type: String,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  specialInstructions: String,
  status: {
    type: String,
    enum: ['pending', 'picked_up', 'out_for_delivery', 'delivered', 'failed'],
    default: 'pending'
  },
  deliveredAt: Date,
  deliveryNotes: String,
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
}, { _id: false });

const deliveryScheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening'],
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  deliveries: [deliveryItemSchema],
  estimatedDuration: {
    type: String,
    required: true
  },
  actualDuration: String,
  startTime: Date,
  endTime: Date,
  totalDistance: String,
  maxCapacity: {
    type: Number,
    default: 25
  },
  notes: String,
  optimizedRoute: [{
    order: Number,
    deliveryId: String,
    estimatedArrival: Date,
    actualArrival: Date
  }],
  routeUrl: String, // Google Maps route URL
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes for better performance
deliveryScheduleSchema.index({ driverId: 1, date: 1, shift: 1 }, { unique: true });
deliveryScheduleSchema.index({ date: 1, status: 1 });
deliveryScheduleSchema.index({ createdAt: -1 });

// Virtual for total deliveries count
deliveryScheduleSchema.virtual('totalDeliveries').get(function() {
  return this.deliveries.length;
});

// Virtual for completed deliveries count
deliveryScheduleSchema.virtual('completedDeliveries').get(function() {
  return this.deliveries.filter(d => d.status === 'delivered').length;
});

// Virtual for delivery progress percentage
deliveryScheduleSchema.virtual('progressPercentage').get(function() {
  if (this.deliveries.length === 0) return 0;
  return Math.round((this.completedDeliveries / this.totalDeliveries) * 100);
});

// Virtual for capacity utilization
deliveryScheduleSchema.virtual('capacityUtilization').get(function() {
  return Math.round((this.deliveries.length / this.maxCapacity) * 100);
});

// Methods
deliveryScheduleSchema.methods.startRoute = function() {
  this.status = 'in_progress';
  this.startTime = new Date();
  return this.save();
};

deliveryScheduleSchema.methods.completeRoute = function() {
  this.status = 'completed';
  this.endTime = new Date();
  
  // Calculate actual duration
  if (this.startTime) {
    const durationMs = this.endTime - this.startTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    this.actualDuration = `${hours}h ${minutes}m`;
  }
  
  return this.save();
};

deliveryScheduleSchema.methods.updateDeliveryStatus = function(deliveryId, status, notes = '') {
  const delivery = this.deliveries.id(deliveryId);
  if (delivery) {
    delivery.status = status;
    if (notes) delivery.deliveryNotes = notes;
    if (status === 'delivered') delivery.deliveredAt = new Date();
  }
  return this.save();
};

deliveryScheduleSchema.methods.getNextDelivery = function() {
  return this.deliveries.find(d => d.status === 'pending');
};

deliveryScheduleSchema.methods.getCurrentDelivery = function() {
  return this.deliveries.find(d => d.status === 'out_for_delivery');
};

// Statics
deliveryScheduleSchema.statics.getDriverScheduleForDate = function(driverId, date, shift = null) {
  let query = {
    driverId,
    date: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    }
  };
  
  if (shift) query.shift = shift;
  
  return this.find(query).populate('driverId', 'name phone email');
};

deliveryScheduleSchema.statics.getSchedulesInDateRange = function(startDate, endDate, filters = {}) {
  let query = {
    date: { $gte: startDate, $lte: endDate },
    ...filters
  };
  
  return this.find(query)
    .populate('driverId', 'name phone email location')
    .sort({ date: 1, shift: 1 });
};

deliveryScheduleSchema.statics.getDriverStats = async function(driverId, startDate, endDate) {
  const schedules = await this.find({
    driverId,
    date: { $gte: startDate, $lte: endDate }
  });

  const stats = {
    totalSchedules: schedules.length,
    completedSchedules: schedules.filter(s => s.status === 'completed').length,
    totalDeliveries: schedules.reduce((sum, s) => sum + s.deliveries.length, 0),
    completedDeliveries: schedules.reduce((sum, s) => sum + s.completedDeliveries, 0),
    averageDeliveriesPerRoute: 0,
    onTimePercentage: 0
  };

  if (stats.totalSchedules > 0) {
    stats.averageDeliveriesPerRoute = Math.round(stats.totalDeliveries / stats.totalSchedules);
  }

  if (stats.totalDeliveries > 0) {
    stats.onTimePercentage = Math.round((stats.completedDeliveries / stats.totalDeliveries) * 100);
  }

  return stats;
};

// Pre-save middleware
deliveryScheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-find middleware to populate driver info
deliveryScheduleSchema.pre(/^find/, function(next) {
  if (!this.getOptions().skipPopulate) {
    this.populate('driverId', 'name phone email location');
  }
  next();
});

const DeliverySchedule = mongoose.model('DeliverySchedule', deliveryScheduleSchema);

module.exports = DeliverySchedule;