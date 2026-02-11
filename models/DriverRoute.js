const mongoose = require('mongoose');

// Schema for individual delivery stops in a driver's route
const deliveryStopSchema = new mongoose.Schema({
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    name: String,
    phone: String,
    street: String,
    city: String,
    area: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  mealDetails: {
    items: [String],
    specialInstructions: String,
    thaliCount: { type: Number, default: 1 }
  },
  sequenceNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'delivered', 'failed', 'skipped'],
    default: 'pending'
  },
  estimatedArrival: Date,
  actualArrival: Date,
  deliveryNotes: String,
  deliveryProof: String, // URL to delivery proof image
  completedAt: Date
});

// Main driver route schema for daily delivery management
const driverRouteSchema = new mongoose.Schema({
  driverId: {
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
    enum: ['morning', 'evening',"both"],
    required: true
  },
  serviceArea: {
    type: String,
    required: true
  },
  maxCapacity: {
    type: Number,
    default: 50
  },
  currentLoad: {
    type: Number,
    default: 0
  },
  stops: [deliveryStopSchema],
  routeStatus: {
    type: String,
    enum: ['pending', 'active', 'completed', 'paused'],
    default: 'pending'
  },
  startTime: Date,
  endTime: Date,
  estimatedDuration: String, // e.g., "2 hours 30 minutes"
  actualDuration: Number, // in minutes
  averageTimePerStop: {
    type: Number,
    default: 8 // minutes per stop
  },
  completedStops: {
    type: Number,
    default: 0
  },
  totalStops: {
    type: Number,
    default: 0
  },
  currentStopIndex: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true
});

// Compound index for efficient queries
driverRouteSchema.index({ driverId: 1, date: 1, shift: 1 });
driverRouteSchema.index({ serviceArea: 1, shift: 1 });
driverRouteSchema.index({ routeStatus: 1 });

// Method to add a delivery stop
driverRouteSchema.methods.addStop = function(stopData) {
  const sequenceNumber = this.stops.length + 1;
  const newStop = {
    ...stopData,
    sequenceNumber,
    estimatedArrival: this.calculateEstimatedArrival(sequenceNumber)
  };
  
  this.stops.push(newStop);
  this.currentLoad += stopData.mealDetails?.thaliCount || 1;
  this.totalStops = this.stops.length;
  
  return this.save();
};

// Method to reorder stops manually
driverRouteSchema.methods.reorderStops = function(newOrder) {
  if (newOrder.length !== this.stops.length) {
    throw new Error('Invalid reorder: stop count mismatch');
  }
  
  // Create new ordered stops array
  const reorderedStops = newOrder.map((stopId, index) => {
    const stop = this.stops.find(s => s._id.toString() === stopId.toString());
    if (!stop) {
      throw new Error(`Stop not found: ${stopId}`);
    }
    
    stop.sequenceNumber = index + 1;
    stop.estimatedArrival = this.calculateEstimatedArrival(index + 1);
    return stop;
  });
  
  this.stops = reorderedStops;
  return this.save();
};

// Method to mark stop as completed
driverRouteSchema.methods.completeStop = function(stopId, deliveryData = {}) {
  const stop = this.stops.find(s => s._id.toString() === stopId.toString());
  if (!stop) {
    throw new Error('Stop not found');
  }
  
  if (stop.status === 'delivered') {
    throw new Error('Stop already completed');
  }
  
  stop.status = 'delivered';
  stop.completedAt = new Date();
  stop.actualArrival = new Date();
  stop.deliveryNotes = deliveryData.notes;
  stop.deliveryProof = deliveryData.proofUrl;
  
  this.completedStops += 1;
  this.currentStopIndex = Math.max(this.currentStopIndex, stop.sequenceNumber);
  
  // Update ETAs for remaining stops
  this.updateRemainingETAs();
  
  // Check if all stops completed
  if (this.completedStops === this.totalStops) {
    this.routeStatus = 'completed';
    this.endTime = new Date();
    this.actualDuration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  
  return this.save();
};

// Method to calculate estimated arrival time
driverRouteSchema.methods.calculateEstimatedArrival = function(sequenceNumber) {
  const baseTime = this.startTime || new Date();
  const estimatedMinutes = (sequenceNumber - 1) * this.averageTimePerStop;
  return new Date(baseTime.getTime() + estimatedMinutes * 60 * 1000);
};

// Method to update ETAs for remaining stops
driverRouteSchema.methods.updateRemainingETAs = function() {
  const now = new Date();
  const completedStops = this.stops.filter(s => s.status === 'delivered').length;
  
  // Update average time per stop based on actual performance
  if (completedStops > 0 && this.startTime) {
    const elapsedMinutes = (now - this.startTime) / (1000 * 60);
    this.averageTimePerStop = Math.round(elapsedMinutes / completedStops);
  }
  
  // Update ETAs for remaining stops
  this.stops.forEach(stop => {
    if (stop.status === 'pending') {
      const remainingStopsAhead = stop.sequenceNumber - completedStops - 1;
      const estimatedMinutes = remainingStopsAhead * this.averageTimePerStop;
      stop.estimatedArrival = new Date(now.getTime() + estimatedMinutes * 60 * 1000);
    }
  });
};

// Method to get current stop details
driverRouteSchema.methods.getCurrentStop = function() {
  return this.stops.find(s => 
    s.sequenceNumber === this.currentStopIndex + 1 && 
    s.status === 'pending'
  );
};

// Method to get route progress
driverRouteSchema.methods.getRouteProgress = function() {
  return {
    totalStops: this.totalStops,
    completedStops: this.completedStops,
    currentStopIndex: this.currentStopIndex,
    progressPercentage: this.totalStops > 0 ? Math.round((this.completedStops / this.totalStops) * 100) : 0,
    estimatedTimeRemaining: this.calculateRemainingTime(),
    currentStop: this.getCurrentStop()
  };
};

// Method to calculate remaining delivery time
driverRouteSchema.methods.calculateRemainingTime = function() {
  const remainingStops = this.totalStops - this.completedStops;
  const estimatedMinutes = remainingStops * this.averageTimePerStop;
  return Math.max(estimatedMinutes, 0);
};

// Static method to find available drivers for area and shift
driverRouteSchema.statics.findAvailableDrivers = async function(serviceArea, shift, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    serviceArea,
    shift,
    date: { $gte: startOfDay, $lte: endOfDay },
    $expr: { $lt: ['$currentLoad', '$maxCapacity'] }
  })
  .populate('driverId', 'name phone rating driverProfile')
  .sort({ currentLoad: 1 }); // Sort by lowest load first
};

// Static method to assign delivery to best available driver
driverRouteSchema.statics.assignToOptimalDriver = async function(deliveryData) {
  const { serviceArea, shift, date } = deliveryData;
  
  const availableDrivers = await this.findAvailableDrivers(serviceArea, shift, date);
  
  if (availableDrivers.length === 0) {
    // No available driver, assign to default driver or create new route
    return this.assignToDefaultDriver(deliveryData);
  }
  
  // Choose driver with lowest current load
  const selectedDriver = availableDrivers[0];
  await selectedDriver.addStop(deliveryData);
  
  return selectedDriver;
};

// Static method to assign to default driver
driverRouteSchema.statics.assignToDefaultDriver = async function(deliveryData) {
  const { shift, date } = deliveryData;
  const defaultDriverId = await this.getDefaultDriver();
  
  let defaultRoute = await this.findOne({
    driverId: defaultDriverId,
    date: { 
      $gte: new Date(date).setHours(0, 0, 0, 0),
      $lte: new Date(date).setHours(23, 59, 59, 999)
    },
    shift
  });
  
  if (!defaultRoute) {
    defaultRoute = await this.create({
      driverId: defaultDriverId,
      date: new Date(date),
      shift,
      serviceArea: 'default',
      maxCapacity: 100, // Default driver has higher capacity
      stops: []
    });
  }
  
  await defaultRoute.addStop(deliveryData);
  return defaultRoute;
};

// Static method to get default driver ID
driverRouteSchema.statics.getDefaultDriver = async function() {
  const User = mongoose.model('User');
  const defaultDriver = await User.findOne({ 
    role: 'delivery',
    'driverProfile.isDefaultDriver': true 
  });
  
  if (!defaultDriver) {
    throw new Error('No default driver configured');
  }
  
  return defaultDriver._id;
};

module.exports = mongoose.model('DriverRoute', driverRouteSchema);