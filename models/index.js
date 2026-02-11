// // ===================================================================
// // COMPLETE MONGODB SCHEMAS FOR SWEET SHOP E-COMMERCE APPLICATION
// // ===================================================================

// const mongoose = require('mongoose');

// // ===================================================================
// // 1. USER/CUSTOMER SCHEMA
// // ===================================================================
// const userSchema = new mongoose.Schema({
//   // Basic Information
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
//     type: String,
//     required: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 6
//   },
  
//   // Profile Information
//   avatar: {
//     type: String, // URL to profile image
//     default: null
//   },
//   dateOfBirth: {
//     type: Date
//   },
//   gender: {
//     type: String,
//     enum: ['male', 'female', 'other']
//   },
  
//   // Role & Status
//   role: {
//     type: String,
//     enum: ['customer', 'admin', 'seller', 'super-admin'],
//     default: 'customer'
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   isEmailVerified: {
//     type: Boolean,
//     default: false
//   },
//   isPhoneVerified: {
//     type: Boolean,
//     default: false
//   },
  
//   // Addresses
//   addresses: [{
//     type: {
//       type: String,
//       enum: ['home', 'work', 'other'],
//       default: 'home'
//     },
//     name: String, // Address label
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: {
//       type: String,
//       default: 'India'
//     },
//     isDefault: {
//       type: Boolean,
//       default: false
//     }
//   }],
  
//   // Preferences
//   preferences: {
//     theme: {
//       type: String,
//       enum: ['light', 'dark'],
//       default: 'light'
//     },
//     language: {
//       type: String,
//       default: 'en'
//     },
//     currency: {
//       type: String,
//       default: 'INR'
//     },
//     notifications: {
//       email: {
//         type: Boolean,
//         default: true
//       },
//       sms: {
//         type: Boolean,
//         default: true
//       },
//       push: {
//         type: Boolean,
//         default: true
//       }
//     }
//   },
  
//   // Security
//   lastLogin: Date,
//   loginAttempts: {
//     type: Number,
//     default: 0
//   },
//   lockUntil: Date,
  
//   // Timestamps
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 2. PRODUCT/SWEET SCHEMA
// // ===================================================================
// const productSchema = new mongoose.Schema({
//   // Basic Information
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 200
//   },
//   description: {
//     type: String,
//     required: true,
//     maxlength: 1000
//   },
//   shortDescription: {
//     type: String,
//     maxlength: 250
//   },
  
//   // Images
//   images: [{
//     url: String,
//     alt: String,
//     isPrimary: {
//       type: Boolean,
//       default: false
//     }
//   }],
  
//   // Category & Classification
//   category: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Category',
//     required: true
//   },
//   subcategory: {
//     type: String,
//     trim: true
//   },
//   tags: [String], // ["Kesar", "Festival", "Premium"]
  
//   // Pricing & Variants
//   weightOptions: [{
//     weight: {
//       type: String,
//       required: true // "250g", "500g", "1kg"
//     },
//     price: {
//       type: Number,
//       required: true
//     },
//     originalPrice: {
//       type: Number,
//       required: true
//     },
//     discount: {
//       type: Number,
//       default: 0 // percentage
//     },
//     stock: {
//       type: Number,
//       default: 0
//     }
//   }],
  
//   // Product Status & Flags
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   featured: {
//     type: Boolean,
//     default: false
//   },
//   isNew: {
//     type: Boolean,
//     default: false
//   },
//   isBestseller: {
//     type: Boolean,
//     default: false
//   },
//   isOrganic: {
//     type: Boolean,
//     default: false
//   },
  
//   // Badges & Labels
//   badge: {
//     type: String,
//     enum: ['Premium Royal', 'Master Crafted', 'Gift Special', 'Regional Special', 'Festival Special']
//   },
  
//   // Ratings & Reviews
//   rating: {
//     average: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 5
//     },
//     count: {
//       type: Number,
//       default: 0
//     }
//   },
//   reviewCount: {
//     type: Number,
//     default: 0
//   },
  
//   // Ingredients & Nutrition
//   ingredients: [String],
//   allergens: [String],
//   nutritionInfo: {
//     calories: Number,
//     protein: Number,
//     carbs: Number,
//     fat: Number,
//     sugar: Number,
//     fiber: Number
//   },
  
//   // Manufacturing
//   manufacturer: {
//     name: String,
//     address: String,
//     license: String
//   },
//   shelfLife: {
//     type: Number, // in days
//     default: 7
//   },
//   storageInstructions: String,
  
//     unique: true
//   },
//   metaTitle: String,
//   metaDescription: String,
  
//   // Admin Fields
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
  
//   // Timestamps
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 3. CATEGORY SCHEMA
// // ===================================================================
// const categorySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//     unique: true
//   },
//   description: String,
//   image: String,
//   icon: String,
//   slug: {
//     type: String,
//     unique: true
//   },
//   parent: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Category',
//     default: null
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   sortOrder: {
//     type: Number,
//     default: 0
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 4. CART SCHEMA
// // ===================================================================
// const cartSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   items: [{
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Product',
//       required: true
//     },
//     weight: {
//       type: String,
//       required: true // "250g", "500g", etc.
//     },
//     quantity: {
//       type: Number,
//       required: true,
//       min: 1
//     },
//     price: {
//       type: Number,
//       required: true
//     },
//     originalPrice: {
//       type: Number,
//       required: true
//     },
//     addedAt: {
//       type: Date,
//       default: Date.now
//     }
//   }],
//   totalAmount: {
//     type: Number,
//     default: 0
//   },
//   totalDiscount: {
//     type: Number,
//     default: 0
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 5. ORDER SCHEMA
// // ===================================================================
// const orderSchema = new mongoose.Schema({
//   // Order Information
//   orderNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
  
//   // Order Items
//   items: [{
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Product'
//     },
//     name: String, // Store name for record keeping
//     weight: String,
//     quantity: Number,
//     price: Number,
//     originalPrice: Number,
//     discount: Number,
//     image: String
//   }],
  
//   // Pricing
//   subtotal: {
//     type: Number,
//     required: true
//   },
//   discount: {
//     type: Number,
//     default: 0
//   },
//   shippingCharges: {
//     type: Number,
//     default: 0
//   },
//   tax: {
//     type: Number,
//     default: 0
//   },
//   total: {
//     type: Number,
//     required: true
//   },
  
//   // Delivery Information
//   shippingAddress: {
//     name: String,
//     phone: String,
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: String
//   },
  
//   // Order Status
//   status: {
//     type: String,
//     enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
//     default: 'pending'
//   },
  
//   // Payment Information
//   paymentMethod: {
//     type: String,
//     enum: ['cod', 'online', 'wallet', 'card'],
//     required: true
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'completed', 'failed', 'refunded'],
//     default: 'pending'
//   },
//   paymentId: String, // Payment gateway transaction ID
  
//   // Delivery Tracking
//   trackingNumber: String,
//   estimatedDelivery: Date,
//   deliveredAt: Date,
  
//   // Special Instructions
//   notes: String,
//   giftMessage: String,
//   isGift: {
//     type: Boolean,
//     default: false
//   },
  
//   // Timestamps
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 6. WISHLIST SCHEMA
// // ===================================================================
// const wishlistSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   items: [{
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Product',
//       required: true
//     },
//     addedAt: {
//       type: Date,
//       default: Date.now
//     }
//   }],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 7. REVIEW SCHEMA
// // ===================================================================
// const reviewSchema = new mongoose.Schema({
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product',
//     required: true
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   order: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Order'
//   },
  
//   // Review Content
//   rating: {
//     type: Number,
//     required: true,
//     min: 1,
//     max: 5
//   },
//   title: {
//     type: String,
//     maxlength: 100
//   },
//   comment: {
//     type: String,
//     required: true,
//     maxlength: 1000
//   },
  
//   // Review Media
//   images: [String], // URLs to review images
  
//   // Review Status
//   isVerified: {
//     type: Boolean,
//     default: false
//   },
//   isApproved: {
//     type: Boolean,
//     default: true
//   },
  
//   // Helpful Votes
//   helpfulVotes: {
//     type: Number,
//     default: 0
//   },
  
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 8. NOTIFICATION SCHEMA
// // ===================================================================
// const notificationSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
  
//   // Notification Content
//   title: {
//     type: String,
//     required: true
//   },
//   message: {
//     type: String,
//     required: true
//   },
  
//   // Notification Type
//   type: {
//     type: String,
//     enum: ['order', 'promotion', 'festival', 'system', 'review', 'general'],
//     required: true
//   },
  
//   // Related Data
//   relatedModel: {
//     type: String,
//     enum: ['Order', 'Product', 'User']
//   },
//   relatedId: {
//     type: mongoose.Schema.Types.ObjectId
//   },
  
//   // Status
//   read: {
//     type: Boolean,
//     default: false
//   },
//   readAt: Date,
  
//   // Action Button
//   actionUrl: String,
//   actionText: String,
  
//   // Delivery Channels
//   channels: {
//     push: {
//       type: Boolean,
//       default: true
//     },
//     email: {
//       type: Boolean,
//       default: false
//     },
//     sms: {
//       type: Boolean,
//       default: false
//     }
//   },
  
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 9. COUPON SCHEMA
// // ===================================================================
// const couponSchema = new mongoose.Schema({
//   code: {
//     type: String,
//     required: true,
//     unique: true,
//     uppercase: true
//   },
//   description: String,
  
//   // Discount Details
//   discountType: {
//     type: String,
//     enum: ['percentage', 'fixed'],
//     required: true
//   },
//   discountValue: {
//     type: Number,
//     required: true
//   },
//   maxDiscount: Number, // Max discount for percentage type
  
//   // Usage Limits
//   minOrderAmount: {
//     type: Number,
//     default: 0
//   },
//   maxUsage: {
//     type: Number,
//     default: null // null = unlimited
//   },
//   usedCount: {
//     type: Number,
//     default: 0
//   },
//   maxUsagePerUser: {
//     type: Number,
//     default: 1
//   },
  
//   // Validity
//   startDate: {
//     type: Date,
//     required: true
//   },
//   endDate: {
//     type: Date,
//     required: true
//   },
  
//   // Applicable Products/Categories
//   applicableProducts: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product'
//   }],
//   applicableCategories: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Category'
//   }],
  
//   // Status
//   isActive: {
//     type: Boolean,
//     default: true
//   },
  
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 10. BANNER/PROMOTION SCHEMA
// // ===================================================================
// const bannerSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true
//   },
//   subtitle: String,
//   description: String,
  
//   // Images
//   image: {
//     desktop: String,
//     mobile: String,
//     tablet: String
//   },
  
//   // Link & Action
//   linkType: {
//     type: String,
//     enum: ['product', 'category', 'page', 'external'],
//     required: true
//   },
//   linkUrl: String,
//   buttonText: String,
  
//   // Display Settings
//   position: {
//     type: String,
//     enum: ['hero', 'featured', 'sidebar', 'footer'],
//     default: 'hero'
//   },
//   sortOrder: {
//     type: Number,
//     default: 0
//   },
  
//   // Visibility
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   startDate: Date,
//   endDate: Date,
  
//   // Analytics
//   views: {
//     type: Number,
//     default: 0
//   },
//   clicks: {
//     type: Number,
//     default: 0
//   },
  
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 11. ANALYTICS SCHEMA
// // ===================================================================
// const analyticsSchema = new mongoose.Schema({
//   date: {
//     type: Date,
//     required: true
//   },
  
//   // Sales Metrics
//   sales: {
//     totalOrders: {
//       type: Number,
//       default: 0
//     },
//     totalRevenue: {
//       type: Number,
//       default: 0
//     },
//     averageOrderValue: {
//       type: Number,
//       default: 0
//     }
//   },
  
//   // Product Metrics
//   products: {
//     totalViews: {
//       type: Number,
//       default: 0
//     },
//     totalAddToCart: {
//       type: Number,
//       default: 0
//     },
//     conversionRate: {
//       type: Number,
//       default: 0
//     }
//   },
  
//   // User Metrics
//   users: {
//     newUsers: {
//       type: Number,
//       default: 0
//     },
//     activeUsers: {
//       type: Number,
//       default: 0
//     },
//     returningUsers: {
//       type: Number,
//       default: 0
//     }
//   },
  
//   // Top Products
//   topProducts: [{
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Product'
//     },
//     sales: Number,
//     revenue: Number
//   }],
  
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // 12. SETTINGS SCHEMA (For Admin Configuration)
// // ===================================================================
// const settingsSchema = new mongoose.Schema({
//   key: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   value: mongoose.Schema.Types.Mixed,
//   description: String,
//   category: {
//     type: String,
//     enum: ['general', 'payment', 'shipping', 'email', 'sms', 'social'],
//     default: 'general'
//   },
//   isPublic: {
//     type: Boolean,
//     default: false
//   },
//   updatedBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ===================================================================
// // EXPORT ALL MODELS
// // ===================================================================
// module.exports = {
//   // User: mongoose.model('User', userSchema),
//   // Product: mongoose.model('Product', productSchema),
//   // Category: mongoose.model('Category', categorySchema),
//   // Cart: mongoose.model('Cart', cartSchema),
//   // Order: mongoose.model('Order', orderSchema),
//   // Wishlist: mongoose.model('Wishlist', wishlistSchema),
//   // Review: mongoose.model('Review', reviewSchema),
//   // Notification: mongoose.model('Notification', notificationSchema),
//   // Coupon: mongoose.model('Coupon', couponSchema),
//   // Banner: mongoose.model('Banner', bannerSchema),
//   // Analytics: mongoose.model('Analytics', analyticsSchema),
//   // Settings: mongoose.model('Settings', settingsSchema)
// };

// // ===================================================================
// // SAMPLE DATA STRUCTURE FOR REFERENCE
// // ===================================================================

// /*
// // SAMPLE PRODUCT DOCUMENT
// {
//   "_id": "507f1f77bcf86cd799439011",
//   "name": "Royal Kesar Malai Gujiya",
//   "description": "Premium saffron-infused gujiya with rich malai filling...",
//   "images": [
//     {
//       "url": "https://example.com/gujiya1.jpg",
//       "alt": "Royal Kesar Malai Gujiya",
//       "isPrimary": true
//     }
//   ],
//   "category": "507f1f77bcf86cd799439012",
//   "tags": ["Kesar", "Festival", "Premium"],
//   "weightOptions": [
//     {
//       "weight": "250g",
//       "price": 280,
//       "originalPrice": 320,
//       "discount": 15,
//       "stock": 50
//     }
//   ],
//   "featured": true,
//   "isNew": true,
//   "isBestseller": false,
//   "badge": "Premium Royal",
//   "rating": {
//     "average": 4.9,
//     "count": 342
//   },
//   "reviewCount": 342,
//   "createdAt": "2025-01-01T00:00:00.000Z"
// }

// // SAMPLE ORDER DOCUMENT
// {
//   "_id": "507f1f77bcf86cd799439013",
//   "orderNumber": "ORD-2025-001",
//   "user": "507f1f77bcf86cd799439014",
//   "items": [
//     {
//       "product": "507f1f77bcf86cd799439011",
//       "name": "Royal Kesar Malai Gujiya",
//       "weight": "500g",
//       "quantity": 2,
//       "price": 520,
//       "originalPrice": 600
//     }
//   ],
//   "subtotal": 1040,
//   "discount": 160,
//   "shippingCharges": 0,
//   "tax": 0,
//   "total": 880,
//   "status": "delivered",
//   "paymentMethod": "online",
//   "paymentStatus": "completed",
//   "shippingAddress": {
//     "name": "Priya Sharma",
//     "phone": "+91 9876543210",
//     "street": "123 Main Street",
//     "city": "Mumbai",
//     "state": "Maharashtra",
//     "pincode": "400001",
//     "country": "India"
//   },
//   "createdAt": "2025-01-01T00:00:00.000Z"
// }
// */





















































// // tastyaana models

// // models/User.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 6
//   },
//   role: {
//     type: String,
//     enum: ['customer', 'seller', 'admin'],
//     default: 'customer'
//   },
//   isVerified: {
//     type: Boolean,
//     default: false
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   avatar: String,
//   phone: String,
//   address: {
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: { type: String, default: 'India' }
//   },
//   // Seller specific fields
//   sellerInfo: {
//     storeName: String,
//     storeDescription: String,
//     storeLogo: String,
//     storeBanner: String,
//     businessType: String,
//     gstNumber: String,
//     panNumber: String,
//     bankDetails: {
//       accountNumber: String,
//       ifscCode: String,
//       bankName: String,
//       accountHolderName: String
//     },
//     commissionRate: {
//       type: Number,
//       default: 5 // 5% default commission
//     },
//     isApproved: {
//       type: Boolean,
//       default: false
//     },
//     rating: {
//       type: Number,
//       default: 0
//     },
//     totalRatings: {
//       type: Number,
//       default: 0
//     }
//   }
// }, {
//   timestamps: true
// });

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// // Compare password method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// module.exports = mongoose.model('User', userSchema);

// // models/Product.js
// const mongoose = require('mongoose');

// const productSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   price: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   discountPrice: {
//     type: Number,
//     min: 0
//   },
//   images: [{
//     url: String,
//     alt: String,
//     isPrimary: { type: Boolean, default: false }
//   }],
//   category: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Category',
//     required: true
//   },
//   subcategory: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Category'
//   },
//   seller: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   variants: [{
//     size: String,
//     color: String,
//     stock: { type: Number, default: 0 },
//     price: Number,
//     sku: String
//   }],
//   stock: {
//     type: Number,
//     required: true,
//     default: 0
//   },
//   lowStockThreshold: {
//     type: Number,
//     default: 10
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   tags: [String],
//   specifications: [{
//     name: String,
//     value: String
//   }],
//   weight: Number,
//   dimensions: {
//     length: Number,
//     width: Number,
//     height: Number
//   },
//     keywords: [String]
//   },
//   ratings: {
//     average: { type: Number, default: 0 },
//     count: { type: Number, default: 0 }
//   },
//   views: {
//     type: Number,
//     default: 0
//   },
//   salesCount: {
//     type: Number,
//     default: 0
//   }
// }, {
//   timestamps: true
// });

// // Index for search optimization
// productSchema.index({ title: 'text', description: 'text', tags: 'text' });
// productSchema.index({ seller: 1, isActive: 1 });
// productSchema.index({ category: 1, isActive: 1 });

// module.exports = mongoose.model('Product', productSchema);

// // models/Order.js
// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//   orderNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   customer: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   items: [{
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Product',
//       required: true
//     },
//     seller: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true
//     },
//     quantity: {
//       type: Number,
//       required: true,
//       min: 1
//     },
//     price: {
//       type: Number,
//       required: true
//     },
//     variant: {
//       size: String,
//       color: String
//     },
//     status: {
//       type: String,
//       enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
//       default: 'pending'
//     },
//     trackingNumber: String,
//     courier: String
//   }],
//   totalAmount: {
//     type: Number,
//     required: true
//   },
//   shippingAmount: {
//     type: Number,
//     default: 0
//   },
//   taxAmount: {
//     type: Number,
//     default: 0
//   },
//   discountAmount: {
//     type: Number,
//     default: 0
//   },
//   paymentMethod: {
//     type: String,
//     enum: ['cod', 'online', 'wallet'],
//     required: true
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'failed', 'refunded'],
//     default: 'pending'
//   },
//   paymentId: String,
//   shippingAddress: {
//     name: String,
//     phone: String,
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: String
//   },
//   billingAddress: {
//     name: String,
//     phone: String,
//     street: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: String
//   },
//   couponCode: String,
//   notes: String,
//   statusHistory: [{
//     status: String,
//     timestamp: { type: Date, default: Date.now },
//     note: String
//   }],
//   estimatedDelivery: Date,
//   actualDelivery: Date
// }, {
//   timestamps: true
// });

// // Generate order number
// orderSchema.pre('save', async function(next) {
//   if (!this.orderNumber) {
//     const count = await this.constructor.countDocuments();
//     this.orderNumber = `ORD${String(count + 1).padStart(6, '0')}`;
//   }
//   next();
// });

// module.exports = mongoose.model('Order', orderSchema);

// // models/Notification.js
// const mongoose = require('mongoose');

// const notificationSchema = new mongoose.Schema({
//   recipient: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   type: {
//     type: String,
//     enum: ['order', 'payment', 'product', 'system', 'promotion'],
//     required: true
//   },
//   title: {
//     type: String,
//     required: true
//   },
//   message: {
//     type: String,
//     required: true
//   },
//   data: {
//     type: mongoose.Schema.Types.Mixed
//   },
//   isRead: {
//     type: Boolean,
//     default: false
//   },
//   priority: {
//     type: String,
//     enum: ['low', 'medium', 'high'],
//     default: 'medium'
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Notification', notificationSchema);

// // models/Analytics.js
// const mongoose = require('mongoose');

// const analyticsSchema = new mongoose.Schema({
//   seller: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   date: {
//     type: Date,
//     required: true
//   },
//   metrics: {
//     revenue: { type: Number, default: 0 },
//     orders: { type: Number, default: 0 },
//     products: { type: Number, default: 0 },
//     customers: { type: Number, default: 0 },
//     views: { type: Number, default: 0 },
//     conversions: { type: Number, default: 0 }
//   },
//   topProducts: [{
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Product'
//     },
//     sales: Number,
//     revenue: Number
//   }]
// }, {
//   timestamps: true
// });

// // Compound index for efficient queries
// analyticsSchema.index({ seller: 1, date: -1 });

// module.exports = mongoose.model('Analytics', analyticsSchema);

// // models/Category.js
// const mongoose = require('mongoose');

// const categorySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   slug: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   description: String,
//   image: String,
//   icon: String,
//   parent: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Category'
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   sortOrder: {
//     type: Number,
//     default: 0
//   },
//     keywords: [String]
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Category', categorySchema);

// // models/Return.js
// const mongoose = require('mongoose');

// const returnSchema = new mongoose.Schema({
//   order: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Order',
//     required: true
//   },
//   orderItem: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true
//   },
//   customer: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   seller: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   reason: {
//     type: String,
//     enum: ['damaged', 'wrong_item', 'not_as_described', 'size_issue', 'quality_issue', 'other'],
//     required: true
//   },
//   description: String,
//   images: [String],
//   status: {
//     type: String,
//     enum: ['requested', 'approved', 'rejected', 'picked_up', 'refunded'],
//     default: 'requested'
//   },
//   refundAmount: Number,
//   refundMethod: {
//     type: String,
//     enum: ['original_payment', 'wallet', 'bank_transfer']
//   },
//   adminNotes: String,
//   timeline: [{
//     status: String,
//     timestamp: { type: Date, default: Date.now },
//     note: String,
//     updatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     }
//   }]
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Return', returnSchema);

// // models/Promotion.js
// const mongoose = require('mongoose');

// const promotionSchema = new mongoose.Schema({
//   seller: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   title: {
//     type: String,
//     required: true
//   },
//   description: String,
//   type: {
//     type: String,
//     enum: ['percentage', 'fixed_amount', 'bogo', 'free_shipping'],
//     required: true
//   },
//   value: {
//     type: Number,
//     required: true
//   },
//   code: {
//     type: String,
//     unique: true,
//     sparse: true
//   },
//   applicableProducts: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product'
//   }],
//   applicableCategories: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Category'
//   }],
//   minOrderAmount: {
//     type: Number,
//     default: 0
//   },
//   maxDiscount: Number,
//   usageLimit: {
//     type: Number,
//     default: 1000
//   },
//   usageCount: {
//     type: Number,
//     default: 0
//   },
//   startDate: {
//     type: Date,
//     required: true
//   },
//   endDate: {
//     type: Date,
//     required: true
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Promotion', promotionSchema);





















// ghar ka khana model

// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'seller', 'delivery', 'superadmin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
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
      referenceId: String
    }]
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'mr'],
    default: 'en'
  },
  preferences: {
    noOnion: {
      type: Boolean,
      default: false
    },
    noGarlic: {
      type: Boolean,
      default: false
    },
    spiceLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    dietaryType: {
      type: String,
      enum: ['vegetarian', 'non-vegetarian', 'vegan', 'jain'],
      default: 'vegetarian'
    },
    allergies: [String],
    favoriteItems: [String]
  },
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: String,
    default: null
  },
  referralCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate referral code
userSchema.methods.generateReferralCode = function() {
  const code = this.name.substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
  this.referralCode = code;
  return code;
};

module.exports = mongoose.model('User', userSchema);



























































// Add to main routes in server.js
// app.use('/api/menu-change', require('./routes/menuChange'));




// Usage in Dashboard component
// import MenuChangeModal from '../components/MenuChange/MenuChangeModal';

const DashboardPage = () => {
  const [showMenuChangeModal, setShowMenuChangeModal] = useState(false);
  const [selectedChangeDate, setSelectedChangeDate] = useState(null);
  const [selectedChangeSlot, setSelectedChangeSlot] = useState(null);

  const handleChangeMenuClick = (date, slot) => {
    setSelectedChangeDate(date);
    setSelectedChangeSlot(slot);
    setShowMenuChangeModal(true);
  };

  return (
    <div className="dashboard">
      {/* Other dashboard content */}
      
      {/* Today's Orders Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Today's Meals</h2>
        
        <div className="space-y-4">
          {/* Lunch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">Lunch</h3>
              <p className="text-sm text-gray-600">Rice • Dal • Roti • Sabzi</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-600 font-medium">₹120</span>
              <Button
                size="small"
                variant="outline"
                onClick={() => handleChangeMenuClick(new Date().toISOString().split('T')[0], 'lunch')}
              >
                Change Menu
              </Button>
            </div>
          </div>

          {/* Dinner */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">Dinner</h3>
              <p className="text-sm text-gray-600">Roti • Paneer • Dal • Salad</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-600 font-medium">₹110</span>
              <Button
                size="small"
                variant="outline"
                onClick={() => handleChangeMenuClick(new Date().toISOString().split('T')[0], 'dinner')}
              >
                Change Menu
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Change Modal */}
      <MenuChangeModal
        isOpen={showMenuChangeModal}
        onClose={() => setShowMenuChangeModal(false)}
        selectedDate={selectedChangeDate}
        selectedSlot={selectedChangeSlot}
      />
    </div>
  );
};







