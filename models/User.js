// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
// //   // ===== Core Identity =====
// //   name: {
// //     type: String,
// //     required: true,
// //     trim: true,
// //     maxlength: 100
// //   },
// //   email: {
// //     type: String,
// //     required: true,
// //     unique: true,
// //     lowercase: true,
// //     trim: true
// //   },
// //   phone: {
// //     type: String,
// //     required: true,
// //     unique: true,
// //     trim: true
// //   },
// //   password: {
// //     type: String,
// //     required: function() { return !this.googleId; },
// //     minlength: 6
// //   },
// //   googleId: {
// //     type: String,
// //     unique: true,
// //     sparse: true
// //   },

// //   // ===== Profile Details =====
// //   avatar: {
// //     type: String,
// //     default: null
// //   },
// //   dateOfBirth: Date,
// //   gender: {
// //     type: String,
// //     enum: ['male', 'female', 'other']
// //   },

// //   // ===== Roles & Status =====
// //   role: {
// //     type: String,
// //     enum: ['buyer', 'admin', 'seller', 'delivery', 'super-admin'],
// //     default: 'buyer'
// //   },
// //   rating:{
// //     type:Number,
// //     required:function(){
// //       return this.role==="seller";
// //     }
// //   },
// //   capacity_per_day:{
// //     type:Number,
// //     default:false
// //   },
// //   isActive: {
// //     type: Boolean,
// //     default: true
// //   },
// //   isEmailVerified: {
// //     type: Boolean,
// //     default: false
// //   },
// //   isPhoneVerified: {
// //     type: Boolean,
// //     default: false
// //   },

// //   // ===== Addresses (Enhanced) =====
// //   addresses: [{
// //     type: {
// //       type: String,
// //       enum: ['home', 'work', 'other'],
// //       default: 'home'
// //     },
// //     name: String,
// //     street: String,
// //     city: String,
// //     state: String,
// //     pincode: String,
// //     country: {
// //       type: String,
// //       default: 'India'
// //     },
// //     coordinates: {
// //       lat: Number,
// //       lng: Number
// //     },
// //     isDefault: {
// //       type: Boolean,
// //       default: false
// //     },
// //     instructions: String
// //   }],

// //   // ===== Wallet & Loyalty =====
// //   wallet: {
// //     balance: {
// //       type: Number,
// //       default: 0
// //     },
// //     transactions: [{
// //       amount: Number,
// //       type: {
// //         type: String,
// //         enum: ['credit', 'debit']
// //       },
// //       note: String,
// //       timestamp: {
// //         type: Date,
// //         default: Date.now
// //       },
// //       isActive: {
// //         type: Boolean,
// //         default: true
// //       },
// //       lastTopUp: Date,
// //       referenceId: String,
// //       currency: {
// //         type: String,
// //         default: 'INR'
// //       },
// //     }]
// //   },
// //   loyaltyPoints: {
// //     type: Number,
// //     default: 0
// //   },

// //   // ===== Food Preferences (GKK Specific) =====
// //   foodPreferences: {
// //     dietaryType: {
// //       type: String,
// //       enum: ['vegetarian', 'non-vegetarian', 'vegan', 'jain'],
// //       default: 'vegetarian'
// //     },
// //     spiceLevel: {
// //       type: String,
// //       enum: ['low', 'medium', 'high'],
// //       default: 'medium'
// //     },
// //     allergies: [String],
// //     restrictions: {
// //       noOnion: { type: Boolean, default: false },
// //       noGarlic: { type: Boolean, default: false }
// //     },
// //     favoriteItems: [{
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'Meal'
// //     }]
// //   },

// //   // ===== Referral System =====
// //   referralCode: {
// //     type: String,
// //     unique: true
// //   },
// //   referredBy: String,
// //   referralCount: {
// //     type: Number,
// //     default: 0
// //   },

// //   // ===== Security =====
// //   lastLogin: Date,
// //   loginAttempts: {
// //     type: Number,
// //     default: 0
// //   },
// //   lockUntil: Date,

// //   // ===== Preferences =====
// //   preferences: {
// //     theme: {
// //       type: String,
// //       enum: ['light', 'dark'],
// //       default: 'light'
// //     },
// //     language: {
// //       type: String,
// //       enum: ['en', 'hi', 'mr'],
// //       default: 'en'
// //     },
// //     currency: {
// //       type: String,
// //       default: 'INR'
// //     },
// //     notifications: {
// //       email: { type: Boolean, default: true },
// //       sms: { type: Boolean, default: true },
// //       push: { type: Boolean, default: true }
// //     }
// //   }
// // }, {
// //   timestamps: true
// // });

// // // ===== Pre-save Hooks =====
// // userSchema.pre('save', async function(next) {
// //   // Password hashing
// //   if (this.isModified('password')) {
// //     this.password = await bcrypt.hash(this.password, 12);
// //   }

// //   // Generate referral code if new user
// //   if (this.isNew && !this.referralCode) {
// //     this.referralCode = this.name.substring(0, 4).toUpperCase() + 
// //                        Math.random().toString(36).substring(2, 8).toUpperCase();
// //   }

// //   next();
// // });

// // // ===== Methods =====
// // userSchema.methods.comparePassword = async function(candidatePassword) {
// //   return bcrypt.compare(candidatePassword, this.password);
// // };

// // userSchema.methods.getDefaultAddress = function() {
// //   return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
// // };

// // module.exports = mongoose.model('User', userSchema);



// // models/User.js (Fixed for Google Auth)
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   // ===== Core Identity =====
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 100
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   phone: {
//     type: Number,
//     trim: true,
//     sparse: true, // Allows multiple null values
//   },
//   password: {
//     type: String,
//     required: function() { 
//       // Password is required only if user doesn't have Google account
//       return !this.googleId; 
//     },
//     minlength: 6
//   },
//   googleId: {
//     type: String,
//     unique: true,
//     sparse: true // This allows multiple null values
//   },

//   // ===== Profile Details =====
//   avatar: {
//     type: String,
//     default: null
//   },
//   dateOfBirth: Date,
//   gender: {
//     type: String,
//     enum: ['male', 'female', 'other']
//   },

//   // ===== Roles & Status =====
//   role: {
//     type: String,
//     enum: ['buyer', 'admin', 'seller', 'delivery', 'super-admin'],
//     default: 'buyer'
//   },
//   rating:{
//     type: Number,
//     default: function(){
//       return this.role === "seller" ? 0 : undefined;
//     }
//   },
//   capacity_per_day:{
//     type: Number,
//     default: 0
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   isBlocked: {
//     type: Boolean,
//     default: false
//   },
//   isEmailVerified: {
//     type: Boolean,
//     default: false
//   },
//   isPhoneVerified: {
//     type: Boolean,
//     default: false
//   },

//   // ===== Addresses (Enhanced) =====
//   addresses: [{
//     type: {
//       type: String,
//       enum: ['home', 'work', 'other'],
//       default: 'home'
//     },
//     name: String,
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: {
//       type: String,
//       default: 'India'
//     },
//     coordinates: {
//       lat: Number,
//       lng: Number
//     },
//     isDefault: {
//       type: Boolean,
//       default: false
//     },
//     instructions: String
//   }],

//   // ===== Wallet & Loyalty =====
//   wallet: {
//     balance: {
//       type: Number,
//       default: 0
//     },
//     transactions: [{
//       amount: Number,
//       type: {
//         type: String,
//         enum: ['credit', 'debit']
//       },
//       note: String,
//       timestamp: {
//         type: Date,
//         default: Date.now
//       },
//       isActive: {
//         type: Boolean,
//         default: true
//       },
//       lastTopUp: Date,
//       referenceId: String,
//       currency: {
//         type: String,
//         default: 'INR'
//       },
//     }]
//   },
//   loyaltyPoints: {
//     type: Number,
//     default: 0
//   },

//   // ===== Food Preferences (GKK Specific) =====
//   foodPreferences: {
//     dietaryType: {
//       type: String,
//       enum: ['vegetarian', 'non-vegetarian', 'vegan', 'jain'],
//       default: 'vegetarian'
//     },
//     spiceLevel: {
//       type: String,
//       enum: ['low', 'medium', 'high'],
//       default: 'medium'
//     },
//     allergies: [String],
//     restrictions: {
//       noOnion: { type: Boolean, default: false },
//       noGarlic: { type: Boolean, default: false }
//     },
//     favoriteItems: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Meal'
//     }]
//   },

//   // ===== Referral System =====
//   referralCode: {
//     type: String,
//     unique: true,
//     sparse: true
//   },
//   referredBy: String,
//   referralCount: {
//     type: Number,
//     default: 0
//   },

//   // ===== Security =====
//   lastLogin: Date,
//   loginAttempts: {
//     type: Number,
//     default: 0
//   },
//   lockUntil: Date,

//   // ===== Preferences =====
//   preferences: {
//     theme: {
//       type: String,
//       enum: ['light', 'dark'],
//       default: 'light'
//     },
//     language: {
//       type: String,
//       enum: ['en', 'hi', 'mr'],
//       default: 'en'
//     },
//     currency: {
//       type: String,
//       default: 'INR'
//     },
//     notifications: {
//       email: { type: Boolean, default: true },
//       sms: { type: Boolean, default: true },
//       push: { type: Boolean, default: true }
//     }
//   }
// }, {
//   timestamps: true
// });

// // ===== Indexes for better performance =====
// userSchema.index({ email: 1 });
// userSchema.index({ googleId: 1 });
// userSchema.index({ referralCode: 1 });

// // ===== Pre-save Hooks =====
// userSchema.pre('save', async function(next) {
//   // Password hashing
//   if (this.isModified('password') && this.password) {
//     try {
//       const salt = await bcrypt.genSalt(12);
//       this.password = await bcrypt.hash(this.password, salt);
//     } catch (error) {
//       return next(error);
//     }
//   }

//   // Generate referral code if new user
//   if (this.isNew && !this.referralCode) {
//     this.referralCode = this.name.substring(0, 4).toUpperCase() + 
//                        Math.random().toString(36).substring(2, 8).toUpperCase();
//   }

//   // Set email verification to true if Google user
//   if (this.googleId && this.isModified('googleId')) {
//     this.isEmailVerified = true;
//   }

//   next();
// });

// // ===== Methods =====
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   if (!this.password) {
//     return false; // Google users without password can't login with password
//   }
//   return bcrypt.compare(candidatePassword, this.password);
// };

// userSchema.methods.getDefaultAddress = function() {
//   return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
// };

// userSchema.methods.canLoginWithPassword = function() {
//   return !!this.password;
// };

// userSchema.methods.hasGoogleAccount = function() {
//   return !!this.googleId;
// };

// userSchema.methods.toJSON = function() {
//   const userObject = this.toObject();
//   delete userObject.password; // Never return password in JSON
//   return userObject;
// };

// // ===== Static Methods =====
// userSchema.statics.findByEmail = function(email) {
//   return this.findOne({ email: email.toLowerCase() });
// };

// userSchema.statics.findByGoogleId = function(googleId) {
//   return this.findOne({ googleId });
// };

// userSchema.statics.createGoogleUser = async function(googleData) {
//   const { googleId, email, name, avatar, isEmailVerified, role = 'buyer' } = googleData;

//   const user = new this({
//     name,
//     email: email.toLowerCase(), // Generate random phone
//     googleId,
//     role,
//     avatar,
//     isEmailVerified: isEmailVerified || false,
//     lastLogin: new Date()
//   });

//   return await user.save();
// };

// module.exports = mongoose.model('User', userSchema);



// models/User.js 
// (Fixed for Google Auth)
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   // ===== Core Identity =====
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 100
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true,
//     trim: true
//   },
//   phone: {
//     type: Number,
//     trim: true,
//     sparse: true, // Allows multiple null values
//   },
//   password: {
//     type: String,
//     required: function() { 
//       // Password is required only if user doesn't have Google account
//       return !this.googleId; 
//     },
//     minlength: 6
//   },
//   googleId: {
//     type: String,
//     unique: true,
//     sparse: true // This allows multiple null values
//   },

//   // ===== Profile Details =====
//   avatar: {
//     type: String,
//     default: null
//   },
//   dateOfBirth: Date,
//   gender: {
//     type: String,
//     enum: ['male', 'female', 'other']
//   },

//   // ===== Roles & Status =====
//   role: {
//     type: String,
//     enum: ['buyer', 'admin', 'seller', 'delivery', 'super-admin'],
//     default: 'buyer'
//   },
//   rating:{
//     type: Number,
//     default: function(){
//       return this.role === "seller" ? 0 : undefined;
//     }
//   },
//   capacity_per_day:{
//     type: Number,
//     default: 0
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   isBlocked: {
//     type: Boolean,
//     default: false
//   },
//   isEmailVerified: {
//     type: Boolean,
//     default: false
//   },
//   isPhoneVerified: {
//     type: Boolean,
//     default: false
//   },

//   // ===== Addresses (Enhanced) =====
//   addresses: [{
//     type: {
//       type: String,
//       enum: ['home', 'work', 'other'],
//       default: 'home'
//     },
//     name: String,
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: {
//       type: String,
//       default: 'India'
//     },
//     coordinates: {
//       lat: Number,
//       lng: Number
//     },
//     isDefault: {
//       type: Boolean,
//       default: false
//     },
//     instructions: String
//   }],

//   // ===== Wallet & Loyalty =====
//   wallet: {
//     balance: {
//       type: Number,
//       default: 0
//     },
//     transactions: [{
//       amount: Number,
//       type: {
//         type: String,
//         enum: ['credit', 'debit']
//       },
//       note: String,
//       timestamp: {
//         type: Date,
//         default: Date.now
//       },
//       isActive: {
//         type: Boolean,
//         default: true
//       },
//       lastTopUp: Date,
//       referenceId: String,
//       currency: {
//         type: String,
//         default: 'INR'
//       },
//     }]
//   },
//   loyaltyPoints: {
//     type: Number,
//     default: 0
//   },

//   // ===== Food Preferences (GKK Specific) =====
//   foodPreferences: {
//     dietaryType: {
//       type: String,
//       enum: ['vegetarian', 'non-vegetarian', 'vegan', 'jain'],
//       default: 'vegetarian'
//     },
//     spiceLevel: {
//       type: String,
//       enum: ['low', 'medium', 'high'],
//       default: 'medium'
//     },
//     allergies: [String],
//     restrictions: {
//       noOnion: { type: Boolean, default: false },
//       noGarlic: { type: Boolean, default: false }
//     },
//     favoriteItems: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Meal'
//     }]
//   },

//   // ===== Referral System =====
//   referralCode: {
//     type: String,
//     unique: true,
//     sparse: true
//   },
//   referredBy: String,
//   referralCount: {
//     type: Number,
//     default: 0
//   },

//   // ===== Security =====
//   lastLogin: Date,
//   loginAttempts: {
//     type: Number,
//     default: 0
//   },
//   lockUntil: Date,

//   // ===== Preferences =====
//   preferences: {
//     theme: {
//       type: String,
//       enum: ['light', 'dark'],
//       default: 'light'
//     },
//     language: {
//       type: String,
//       enum: ['en', 'hi', 'mr'],
//       default: 'en'
//     },
//     currency: {
//       type: String,
//       default: 'INR'
//     },
//     notifications: {
//       email: { type: Boolean, default: true },
//       sms: { type: Boolean, default: true },
//       push: { type: Boolean, default: true }
//     }
//   }
// }, {
//   timestamps: true
// });

// // ===== Indexes for better performance =====
// userSchema.index({ email: 1 });
// userSchema.index({ googleId: 1 });
// userSchema.index({ referralCode: 1 });

// // ===== Pre-save Hooks =====
// userSchema.pre('save', async function(next) {
//   // Password hashing
//   if (this.isModified('password') && this.password) {
//     try {
//       const salt = await bcrypt.genSalt(12);
//       this.password = await bcrypt.hash(this.password, salt);
//     } catch (error) {
//       return next(error);
//     }
//   }

//   // Generate referral code if new user
//   if (this.isNew && !this.referralCode) {
//     this.referralCode = this.name.substring(0, 4).toUpperCase() + 
//                        Math.random().toString(36).substring(2, 8).toUpperCase();
//   }

//   // Set email verification to true if Google user
//   if (this.googleId && this.isModified('googleId')) {
//     this.isEmailVerified = true;
//   }

//   next();
// });

// // ===== Methods =====
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   if (!this.password) {
//     return false; // Google users without password can't login with password
//   }
//   return bcrypt.compare(candidatePassword, this.password);
// };

// userSchema.methods.getDefaultAddress = function() {
//   return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
// };

// userSchema.methods.canLoginWithPassword = function() {
//   return !!this.password;
// };

// userSchema.methods.hasGoogleAccount = function() {
//   return !!this.googleId;
// };

// userSchema.methods.toJSON = function() {
//   const userObject = this.toObject();
//   delete userObject.password; // Never return password in JSON
//   return userObject;
// };

// // ===== Static Methods =====
// userSchema.statics.findByEmail = function(email) {
//   return this.findOne({ email: email.toLowerCase() });
// };

// userSchema.statics.findByGoogleId = function(googleId) {
//   return this.findOne({ googleId });
// };

// userSchema.statics.createGoogleUser = async function(googleData) {
//   const { googleId, email, name, avatar, isEmailVerified, role = 'buyer' } = googleData;

//   const user = new this({
//     name,
//     email: email.toLowerCase(), // Generate random phone
//     googleId,
//     role,
//     avatar,
//     isEmailVerified: isEmailVerified || false,
//     lastLogin: new Date()
//   });

//   return await user.save();
// };

// module.exports = mongoose.model('User', userSchema);






const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ===== Core Identity =====
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    // required: true,
    validate: {
      validator: function (v) {
        return /^\+?[\d\s\-\(\)]{10,15}$/.test(v);
      },
      message: 'Invalid phone number format'
    },
    sparse: true // Allows multiple null values
  },
  password: {
    type: String,
    required: function () {
      // Password is required only if user doesn't have Google account
      return !this.googleId && this.role !== 'seller';
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // This allows multiple null values
  },

  // ===== Profile Details =====
  avatar: {
    type: String,
    default: null
  },
  profilePicture: String, // From first schema
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  fcmToken: String, // For push notifications (from first schema)

  // PWA Push Notifications
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ===== Roles & Status =====
  role: {
    type: String,
    enum: ['buyer', 'admin', 'seller', 'delivery', 'super-admin', 'customer'],
    default: 'buyer'
  },
  rating: {
    type: Number,
    default: function () {
      return this.role === "seller" ? 0 : undefined;
    }
  },
  capacity_per_day: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },

  // ===== Seller Profile (from first schema) =====
  sellerProfile: {
    storeName: {
      type: String,
      default: "Veg shop",
      required: function () { return this.role === 'seller'; }
    },
    // Restored fields as per user request
    sellerType: {
      type: [String],
      enum: ['food', 'tiffin', 'grocery', 'laundry', 'all', 'other'],
      default: ['food']
    },
    storeType: {
      type: [String],
      enum: ['restaurant', 'mess', 'kitchen', 'shop', 'store'],
      default: ['restaurant']
    },
    storeDescription: String,
    storeAddress: {
      type: String,
      default: " ",
      required: function () { return this.role === 'seller'; }
    },
    storeStatus: {
      type: String,
      enum: ['open', 'closed', 'temporarily_closed'],
      default: 'open'
    },
    statusReason: String,
    lastStatusUpdate: {
      type: Date,
      default: Date.now
    },
    operatingHours: {
      monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } }
    },
    deliverySettings: {
      minOrderValue: { type: Number, default: 100 },
      deliveryCharges: { type: Number, default: 20 },
      deliveryAreas: [String], // Pincodes
      freeDeliveryAbove: Number,
      deliveryRadius: { type: Number, default: 15000 }
    },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    isVerified: { type: Boolean, default: false },
    verificationDocuments: {
      businessLicense: String,
      panCard: String,
      aadharCard: String
    },
    payments: {
      advancePayment: {
        type: Number,
        default: 0
      },
      receivedPayment: {
        type: Number,
        default: 0
      },
      totalReceivedPayment: {
        type: Number,
        default: 0
      },
      paymentHistory: [{
        amount: Number,
        type: {
          type: String,
          enum: ['advance', 'payment', 'commission']
        },
        description: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        referenceId: String
      }]
    },
    sundayAvailability: {
      morning: Boolean,
      evening: Boolean
    },
    // New Fields for Enhanced UI
    storeMedia: {
      logo: { type: String, default: null },
      cover: { type: String, default: null },
      photos: [String],
      video: { type: String, default: null }
    },
    cuisines: {
      type: [String],
      default: []
    },
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      costForTwo: { type: Number, default: 0 }
    },
    tags: [String] // e.g. "Best Seller", "Pure Veg"
  },

  // ===== Addresses (Enhanced) =====
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    name: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    instructions: String
  }],

  // ===== Wallet (Real Money) =====
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    transactions: [{
      amount: Number, // Amount in Rupees
      type: {
        type: String,
        enum: ['credit', 'debit']
      },
      category: {
        type: String,
        enum: ['refund', 'topup', 'purchase', 'withdrawal', 'referral'],
        default: 'purchase'
      },
      note: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['success', 'pending', 'failed'],
        default: 'success'
      },
      referenceId: String
    }]
  },

  // ===== T-Coins (Loyalty System) =====
  tCoins: {
    balance: { type: Number, default: 0 },
    history: [{
      points: Number,
      action: {
        type: String,
        enum: ['earned', 'redeemed', 'expired', 'bonus']
      },
      reason: String, // e.g. "Order #1234 Reward"
      date: { type: Date, default: Date.now }
    }]
  },

  loyaltyPoints: { type: Number, default: 0 }, // Deprecated field, keep for migration safety
  // ===== Food Preferences (GKK Specific) =====
  foodPreferences: {
    dietaryType: {
      type: String,
      enum: ['vegetarian', 'non-vegetarian', 'vegan', 'jain'],
      default: 'vegetarian'
    },
    spiceLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    allergies: [String],
    restrictions: {
      noOnion: { type: Boolean, default: false },
      noGarlic: { type: Boolean, default: false }
    },
    favoriteItems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal'
    }]
  },

  // ===== Referral System =====
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: String,
  referralCount: {
    type: Number,
    default: 0
  },

  // ===== Security =====
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,

  // ===== Driver Profile (when role is 'delivery') =====
  driverProfile: {
    isOnline: {
      type: Boolean,
      default: false
    },
    currentLocation: {
      lat: {
        type: Number,
        default: 22.763813
      },
      lng: {
        type: Number,
        default: 75.885822
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    vehicle: {
      type: {
        type: String,
        enum: ['bike', 'scooter', 'car', 'bicycle'],
        default: 'bike'
      },
      number: {
        type: String,
        default: 'Coming Soon'
      },
      model: String,
      color: String
    },
    documents: {
      license: {
        number: String,
        imageUrl: String,
        verified: {
          type: Boolean,
          default: false
        }
      },
      vehicleRegistration: {
        number: String,
        imageUrl: String,
        verified: {
          type: Boolean,
          default: false
        }
      }
    },
    deliveries: {
      type: Number,
      default: 0
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '22:00'
      }
    },
    serviceAreas: [{
      name: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      radius: {
        type: Number,
        default: 5 // km
      }
    }],
    zones: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryZone',
      index: true
    }],
    // Shift preferences
    shifts: [{
      type: String,
      enum: ['morning', 'evening'],
      default: ['morning', 'evening']
    }],
    // Current shift status
    currentShift: {
      shift: {
        type: String,
        enum: ['morning', 'evening']
      },
      zone: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryZone'
      },
      startTime: Date,
      endTime: Date,
      isActive: {
        type: Boolean,
        default: false
      }
    },
    earnings: {
      today: {
        type: Number,
        default: 0
      },
      thisWeek: {
        type: Number,
        default: 0
      },
      thisMonth: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      }
    },
    bookings: {
      type: Number,
      default: 0
    }
  },

  // ===== Geo-Location (New for Filtering) =====
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String // Formatted address string
  },

  // ===== Preferences =====
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'en'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    location: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// ===== Indexes for better performance =====
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ role: 1 }); // Added widely used index
userSchema.index({ phone: 1 }); // Added index
userSchema.index({ 'sellerProfile.storeStatus': 1, role: 1 });
userSchema.index({ 'sellerProfile.deliveryAreas': 1 });
userSchema.index({ location: '2dsphere' }); // Geospatial Index

// ===== Pre-save Hooks =====
userSchema.pre('save', async function (next) {
  // Password hashing
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  // Generate referral code if new user
  if (this.isNew && !this.referralCode) {
    this.referralCode = this.name.substring(0, 4).toUpperCase() +
      Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Set email verification to true if Google user
  if (this.googleId && this.isModified('googleId')) {
    this.isEmailVerified = true;
  }

  next();
});

// ===== Methods =====
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false; // Google users without password can't login with password
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getDefaultAddress = function () {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
};

userSchema.methods.canLoginWithPassword = function () {
  return !!this.password;
};

userSchema.methods.hasGoogleAccount = function () {
  return !!this.googleId;
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password; // Never return password in JSON
  return userObject;
};

// ===== Static Methods =====
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByGoogleId = function (googleId) {
  return this.findOne({ googleId });
};

userSchema.statics.createGoogleUser = async function (googleData) {
  const { googleId, email, name, avatar, isEmailVerified, role = 'buyer' } = googleData;

  const user = new this({
    name,
    email: email.toLowerCase(),
    googleId,
    role,
    avatar,
    isEmailVerified: isEmailVerified || false,
    lastLogin: new Date()
  });

  return await user.save();
};



module.exports = mongoose.model('User', userSchema);
