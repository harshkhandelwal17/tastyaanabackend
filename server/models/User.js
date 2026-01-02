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
      validator: function(v) {
        return /^\+?[\d\s\-\(\)]{10,15}$/.test(v);
      },
      message: 'Invalid phone number format'
    },
    sparse: true // Allows multiple null values
  },
  password: {
    type: String,
    required: function() { 
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
    enum: ['buyer', 'admin', 'seller', 'delivery', 'super-admin', 'customer', 'worker'],
    default: 'buyer'
  },
  rating: {
    type: Number,
    default: function(){
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
      default:"Veg shop",
      required: function() { return this.role === 'seller'; }
    },
    storeDescription: String,
     sellerType: [{
      type: String,
      enum: [
        'vehiclerental',
        'food',
        'meal-plan', 
        'vegetable', 
        'grocery',
        'phones', 
        'electronics',
        'laundry', 
        'rental',
        'clothing',
        'accessories',
        'home-decor',
        'books',
        'stationery',
        'health-wellness',
        'beauty-cosmetics',
        'sports-fitness',
        'toys-games',
        'pet-supplies',
        'automotive',
        'services',
        'other'
      ]
    }],
    
    // Store Type/Format
    storeType: [{
      type: String,
      enum: [
        'juice-centre',
       "vehiclerental",
        'restaurant',
        'bakery',
        'cafe',
        'street-food',
        'cloud-kitchen',
        'sweet-shop',
        'fast-food',
        'fine-dining',
        'dhaba',
        'food-truck',
        'catering',
        'tiffin-service',
        'ice-cream-parlour',
        'pizzeria',
        'biryani-house',
        'chinese-corner',
        'south-indian',
        'north-indian',
        'continental',
        'multi-cuisine',
        'vegetarian-only',
        'non-vegetarian',
        'pure-veg',
        'retail-store',
        'wholesale',
        'online-only',
        'other'
      ]
    }],
    
    storeDescription: {
      type: String,
      maxlength: 1000,
      trim: true
    },
    
    // Store Media (Photos/Videos)
    storeMedia: {
      photos: [{
        url: String,
        caption: String,
        isPrimary: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now }
      }],
      videos: [{
        url: String,
        thumbnail: String,
        caption: String,
        duration: Number, // in seconds
        uploadedAt: { type: Date, default: Date.now }
      }],
      logo: String,
      banner: String
    },
    storeAddress: {
      type: String,
      default:" ",
      required: function() { return this.role === 'seller'; }
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
      freeDeliveryAbove: Number
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
     sundayAvailability:{
        morning:Boolean,
        evening:Boolean
      },
      mealAvailability: {
        isAvailable: {
          type: Boolean,
          default: true
        },
        status: {
          type: String,
          enum: ['available', 'temporarily_off', 'maintenance', 'holiday'],
          default: 'available'
        },
        reason: {
          type: String,
          default: null
        },
        lastUpdated: {
          type: Date,
          default: Date.now
        },
        shifts: {
          morning: {
            isAvailable: {
              type: Boolean,
              default: true
            },
            status: {
              type: String,
              enum: ['available', 'temporarily_off', 'maintenance', 'holiday'],
              default: 'available'
            },
            reason: String
          },
          evening: {
            isAvailable: {
              type: Boolean,
              default: true
            },
            status: {
              type: String,
              enum: ['available', 'temporarily_off', 'maintenance', 'holiday'],
              default: 'available'
            },
            reason: String
          }
        }
      },

      // ===== Vehicle Rental Service =====
      vehicleRentalService: {
        isEnabled: {
          type: Boolean,
          default: false
        },
        serviceStatus: {
          type: String,
          enum: ['active', 'inactive', 'temporarily_closed', 'under_maintenance'],
          default: 'inactive'
        },
        businessType: {
          type: String,
          enum: ['individual', 'fleet_owner', 'agency', 'franchise'],
          default: 'individual'
        },
        
        // Service Areas/Zones
        serviceZones: [{
          zoneName: {
            type: String,
            required: function() {
              return this.parent().isEnabled && this.zoneCode;
            }
          },
          zoneCode: {
            type: String,
            required: function() {
              return this.parent().isEnabled && this.zoneName;
            }
          },
          workerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: function() {
              return this.parent().isEnabled && this.zoneName && this.zoneCode;
            }
          },
          address: {
            type: String,
            required: function() {
              return this.parent().isEnabled && this.zoneName && this.zoneCode;
            }
          },
          coordinates: {
            lat: Number,
            lng: Number
          },
          isActive: {
            type: Boolean,
            default: true
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
          contactInfo: {
            phone: String,
            email: String,
            managerName: String
          }
        }],

        // Fleet Information
        fleetStats: {
          totalVehicles: {
            type: Number,
            default: 0
          },
          activeVehicles: {
            type: Number,
            default: 0
          },
          vehicleCategories: {
            bikes: { type: Number, default: 0 },
            cars: { type: Number, default: 0 },
            scooties: { type: Number, default: 0 },
            buses: { type: Number, default: 0 },
            trucks: { type: Number, default: 0 }
          },
          lastUpdated: {
            type: Date,
            default: Date.now
          }
        },

        // Business Settings
        businessSettings: {
          allowAdvanceBooking: {
            type: Boolean,
            default: true
          },
          maxAdvanceBookingDays: {
            type: Number,
            default: 30
          },
          minBookingHours: {
            type: Number,
            default: 2
          },
          cancellationPolicy: {
            freeUptoHours: {
              type: Number,
              default: 24
            },
            chargePercentage: [{
              hoursBeforeStart: Number,
              chargePercent: Number
            }]
          },
          securityDeposit: {
            defaultAmount: {
              type: Number,
              default: 2000
            },
            refundPolicy: String
          }
        },

        // Financial Settings
        financialSettings: {
          commissionRate: {
            type: Number,
            default: 10, // Platform commission percentage
            min: 0,
            max: 30
          },
          taxSettings: {
            gstRate: {
              type: Number,
              default: 18
            },
            serviceTaxRate: {
              type: Number,
              default: 0
            }
          },
          paymentTerms: {
            settlementCycle: {
              type: String,
              enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
              default: 'weekly'
            },
            minimumSettlementAmount: {
              type: Number,
              default: 1000
            }
          }
        },

        // Documentation & Verification
        businessDocuments: {
          transportLicense: String,
          vehicleRegistrationCertificate: String,
          insurancePolicy: String,
          businessRegistration: String,
          gstCertificate: String,
          bankAccountProof: String,
          isVerified: {
            type: Boolean,
            default: false
          },
          verificationDate: Date,
          verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          }
        },

        // Analytics & Performance
        businessMetrics: {
          totalBookings: {
            type: Number,
            default: 0
          },
          totalRevenue: {
            type: Number,
            default: 0
          },
          averageRating: {
            type: Number,
            default: 0
          },
          ratingCount: {
            type: Number,
            default: 0
          },
          lastBookingDate: Date,
          popularVehicleTypes: [String],
          peakHours: [{
            hour: Number,
            bookingCount: Number
          }]
        },

        // Staff Management
        staffMembers: [{
          name: {
            type: String,
            required: true
          },
          phone: {
            type: String,
            required: true
          },
          role: {
            type: String,
            enum: ['manager', 'supervisor', 'driver', 'mechanic', 'cleaner'],
            required: true
          },
          assignedZones: [String],
          isActive: {
            type: Boolean,
            default: true
          },
          joiningDate: {
            type: Date,
            default: Date.now
          },
          salary: Number,
          permissions: {
            canCreateBooking: { type: Boolean, default: false },
            canCancelBooking: { type: Boolean, default: false },
            canProcessRefund: { type: Boolean, default: false },
            canManageVehicles: { type: Boolean, default: false }
          }
        }]
      }
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

  // ===== Wallet & Loyalty =====
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    transactions: [{
      amount: Number,
      type: {
        type: String,
        enum: ['credit', 'debit']
      },
      note: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      },
      lastTopUp: Date,
      referenceId: String,
      currency: {
        type: String,
        default: 'INR'
      },
    }]
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
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
    }
  },

  // ===== Worker Profile =====
  workerProfile: {
    // Required only for users with role: 'worker'
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.role === 'worker';
      }
    },
    zoneId: {
      type: String,
      required: function() {
        return this.role === 'worker';
      }
    },
    zoneCode: {
      type: String,
      required: function() {
        return this.role === 'worker';
      }
    },
    zoneName: {
      type: String,
      required: function() {
        return this.role === 'worker';
      }
    },
    // Worker Status
    isActive: {
      type: Boolean,
      default: true
    },
    joinedDate: {
      type: Date,
      default: Date.now
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    },
    // Performance metrics
    performance: {
      bookingsHandled: {
        type: Number,
        default: 0
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalRatings: {
        type: Number,
        default: 0
      }
    },
    // Work schedule
    workingHours: {
      monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
      tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
      wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
      thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
      friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
      saturday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
      sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
    }
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
    }
  }
}, {
  timestamps: true
});

// ===== Indexes for better performance =====
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ 'sellerProfile.storeStatus': 1, role: 1 });
userSchema.index({ 'sellerProfile.deliveryAreas': 1 });

// ===== Pre-save Hooks =====
userSchema.pre('save', async function(next) {
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
  
  // ===== Data Cleanup and Normalization =====
  
  // Fix sellerType case sensitivity
  if (this.sellerProfile && this.sellerProfile.sellerType && Array.isArray(this.sellerProfile.sellerType)) {
    this.sellerProfile.sellerType = this.sellerProfile.sellerType.map(type => {
      if (typeof type === 'string') {
        const lowerType = type.toLowerCase();
        // Map common variations
        const typeMap = {
          'food': 'food',
          'mealplan': 'meal-plan',
          'meal-plan': 'meal-plan',
          'meal_plan': 'meal-plan',
          'vegetable': 'vegetable',
          'grocery': 'grocery',
          'phones': 'phones',
          'vehiclerental': 'vehiclerental',
          'electronics': 'electronics',
          'laundry': 'laundry',
          'rental': 'rental',
          'clothing': 'clothing',
          'accessories': 'accessories',
          'home-decor': 'home-decor',
          'books': 'books',
          'stationery': 'stationery',
          'health-wellness': 'health-wellness',
          'beauty-cosmetics': 'beauty-cosmetics',
          'sports-fitness': 'sports-fitness',
          'toys-games': 'toys-games',
          'pet-supplies': 'pet-supplies',
          'automotive': 'automotive',
          'services': 'services',
          'other': 'other'
        };
        return typeMap[lowerType] || 'other';
      }
      return type;
    });
  }
  
  // Clean up empty vehicleRentalService serviceZones
  if (this.sellerProfile && 
      this.sellerProfile.vehicleRentalService && 
      this.sellerProfile.vehicleRentalService.serviceZones) {
    
    // Remove empty or invalid service zones
    this.sellerProfile.vehicleRentalService.serviceZones = 
      this.sellerProfile.vehicleRentalService.serviceZones.filter(zone => 
        zone && zone.zoneName && zone.zoneCode
      );
    
    // If no valid zones and service is not enabled, clear the array
    if (!this.sellerProfile.vehicleRentalService.isEnabled) {
      this.sellerProfile.vehicleRentalService.serviceZones = [];
    }
  }
  
  next();
});

// ===== Methods =====
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false; // Google users without password can't login with password
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getDefaultAddress = function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
};

userSchema.methods.canLoginWithPassword = function() {
  return !!this.password;
};

userSchema.methods.hasGoogleAccount = function() {
  return !!this.googleId;
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password; // Never return password in JSON
  return userObject;
};

// ===== Static Methods =====
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

userSchema.statics.createGoogleUser = async function(googleData) {
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
