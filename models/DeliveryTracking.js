const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: [
      'order_placed',
      'payment_confirmed', 
      'preparing',
      'ready_for_pickup',
      'assigned',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'delayed',
      'on-the-way'
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: mongoose.Schema.Types.Mixed
  },
  estimatedTime: {
    type: String
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const deliveryTrackingSchema = new mongoose.Schema({
  // orderId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Order',
  //   required: true,
  //   unique: true
  // },
  orderId:{
    type:String,
    required:true
  },
  status: {
    type: String,
    required: true,
    enum: [
      'order_placed',
      'payment_confirmed',
      'preparing', 
      'ready_for_pickup',
      'assigned',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'delayed',
      'reached'
    ],
    default: 'order_placed'
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  timeline: [timelineSchema],
  currentLocation: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    },
    heading: {
      type: Number
    },
    speed: {
      type: Number
    }
  },
  deliveryAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  estimatedDeliveryTime: {
    type: String
  },
  actualDeliveryTime: {
    type: Date
  },
  lastLocationUpdate: {
    type: Date
  },
  deliveryNotes: {
    type: String
  },
  deliveryProof: {
    type: String // URL to delivery proof image
  },
  assignedCategory: {
    type: String,
    enum: ['food', 'vegetable', 'sweets', 'stationary', 'general','grocery'],
    default: 'general'
  }
}, {
  timestamps: true
});

// Index for efficient queries
deliveryTrackingSchema.index({ orderId: 1 });
deliveryTrackingSchema.index({ driverId: 1 });
deliveryTrackingSchema.index({ status: 1 });
deliveryTrackingSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });

// Method to add timeline entry
deliveryTrackingSchema.methods.addTimelineEntry = function(status, description, location = null, estimatedTime = null) {
  this.timeline.push({
    status,
    description,
    location,
    estimatedTime,
    completed: true,
    timestamp: new Date()
  });
  this.status = status;
  return this.save();
};

// Method to update location
deliveryTrackingSchema.methods.updateLocation = function(lat, lng, heading = null, speed = null) {
  this.currentLocation = { lat, lng };
  if (heading !== null) this.currentLocation.heading = heading;
  if (speed !== null) this.currentLocation.speed = speed;
  this.lastLocationUpdate = new Date();
  return this.save();
};

// Static method to get active deliveries
deliveryTrackingSchema.statics.getActiveDeliveries = function() {
  return this.find({
    status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] }
  })
  .populate('orderId', 'totalAmount createdAt userId')
  .populate('driverId', 'name phone rating driverProfile avatar role')
  .sort({ createdAt: -1 });
};

// Static method to get deliveries by driver
deliveryTrackingSchema.statics.getDeliveriesByDriver = function(driverId) {
  return this.find({ driverId })
    .populate('orderId', 'totalAmount createdAt')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('DeliveryTracking', deliveryTrackingSchema);
