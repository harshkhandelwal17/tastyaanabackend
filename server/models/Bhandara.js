const mongoose = require('mongoose');

const bhandaraSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  location: {
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  foodItems: [{
    type: String,
    trim: true
  }],
  dateTimeStart: {
    type: Date,
    required: true
  },
  dateTimeEnd: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.dateTimeStart;
      },
      message: 'End time must be after start time'
    }
  },
  organizerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  contact: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function(v) {
        // Only validate if contact is provided
        return !v || /^[6-9]\d{9}$/.test(v);
      },
      message: 'Please enter a valid 10-digit mobile number'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  adminNote: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // User feedback system
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  dislikes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalLikes: {
    type: Number,
    default: 0
  },
  totalDislikes: {
    type: Number,
    default: 0
  },
  trustScore: {
    type: Number,
    default: 0,
    min: -100,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for location-based queries (if adding geo features later)
bhandaraSchema.index({ 'location.lat': 1, 'location.lng': 1 });

// Index for date-based queries
bhandaraSchema.index({ dateTimeStart: 1, dateTimeEnd: 1 });

// Index for status queries
bhandaraSchema.index({ status: 1, isActive: 1 });

// Index for trust score and user feedback
bhandaraSchema.index({ trustScore: -1 });
bhandaraSchema.index({ 'likes.user': 1 });
bhandaraSchema.index({ 'dislikes.user': 1 });

// Method to calculate trust score
bhandaraSchema.methods.calculateTrustScore = function() {
  const total = this.totalLikes + this.totalDislikes;
  if (total === 0) return 0;
  
  // Calculate percentage: (likes - dislikes) / total * 100
  const score = ((this.totalLikes - this.totalDislikes) / total) * 100;
  this.trustScore = Math.round(Math.max(-100, Math.min(100, score)));
  return this.trustScore;
};

// Method to add like
bhandaraSchema.methods.addLike = function(userId) {
  // Remove from dislikes if exists
  this.dislikes = this.dislikes.filter(dislike => !dislike.user.equals(userId));
  
  // Add to likes if not already liked
  const alreadyLiked = this.likes.some(like => like.user.equals(userId));
  if (!alreadyLiked) {
    this.likes.push({ user: userId });
  }
  
  // Update counts
  this.totalLikes = this.likes.length;
  this.totalDislikes = this.dislikes.length;
  this.calculateTrustScore();
};

// Method to add dislike
bhandaraSchema.methods.addDislike = function(userId) {
  // Remove from likes if exists
  this.likes = this.likes.filter(like => !like.user.equals(userId));
  
  // Add to dislikes if not already disliked
  const alreadyDisliked = this.dislikes.some(dislike => dislike.user.equals(userId));
  if (!alreadyDisliked) {
    this.dislikes.push({ user: userId });
  }
  
  // Update counts
  this.totalLikes = this.likes.length;
  this.totalDislikes = this.dislikes.length;
  this.calculateTrustScore();
};

// Method to remove user's feedback
bhandaraSchema.methods.removeFeedback = function(userId) {
  this.likes = this.likes.filter(like => !like.user.equals(userId));
  this.dislikes = this.dislikes.filter(dislike => !dislike.user.equals(userId));
  
  // Update counts
  this.totalLikes = this.likes.length;
  this.totalDislikes = this.dislikes.length;
  this.calculateTrustScore();
};

// Update the updatedAt field before saving
bhandaraSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Bhandara', bhandaraSchema);