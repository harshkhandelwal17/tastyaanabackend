// // ===================================================================
// // COMPLETE BACKEND STRUCTURE FOR SWEET SHOP E-COMMERCE
// // ===================================================================

// // FOLDER STRUCTURE:
// // /backend
// //   /controllers
// //   /routes
// //   /middleware
// //   /utils
// //   /config
// //   /models
// //   server.js

// // ===================================================================
// // MIDDLEWARE SETUP (middleware/auth.js)
// // ===================================================================
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// // Authentication middleware
// const authenticate = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
//     if (!token) {
//       return res.status(401).json({ message: 'Access denied. No token provided.' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id).select('-password');
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid token.' });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Invalid token.' });
//   }
// };

// // Authorization middleware
// const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         message: 'Access denied. Insufficient permissions.'
//       });
//     }
//     next();
//   };
// };

// module.exports = { authenticate, authorize };

// // ===================================================================
// // VALIDATION MIDDLEWARE (middleware/validation.js)
// // ===================================================================
// const { body, validationResult } = require('express-validator');

// const validateRequest = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({
//       message: 'Validation failed',
//       errors: errors.array()
//     });
//   }
//   next();
// };

// // Product validation rules
// const productValidation = [
//   body('name').notEmpty().trim().isLength({ min: 2, max: 200 }),
//   body('description').notEmpty().trim().isLength({ min: 10, max: 1000 }),
//   body('category').isMongoId(),
//   body('weightOptions').isArray({ min: 1 }),
//   body('weightOptions.*.weight').notEmpty(),
//   body('weightOptions.*.price').isNumeric({ min: 0 }),
//   body('weightOptions.*.originalPrice').isNumeric({ min: 0 })
// ];

// // User validation rules
// const userValidation = [
//   body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
//   body('email').isEmail().normalizeEmail(),
//   body('phone').isMobilePhone('en-IN'),
//   body('password').isLength({ min: 6 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
// ];

// module.exports = { validateRequest, productValidation, userValidation };

// // ===================================================================
// // USER CONTROLLER (controllers/userController.js)
// // ===================================================================
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { sendEmail } = require('../utils/emailService');

// const userController = {
//   // Register new user
//   register: async (req, res) => {
//     try {
//       const { name, email, phone, password, role = 'customer' } = req.body;

//       // Check if user exists
//       const existingUser = await User.findOne({
//         $or: [{ email }, { phone }]
//       });
//       if (existingUser) {
//         return res.status(400).json({
//           message: 'User with this email or phone already exists'
//         });
//       }

//       // Hash password
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, salt);

//       // Create user
//       const user = new User({
//         name,
//         email,
//         phone,
//         password: hashedPassword,
//         role
//       });

//       await user.save();

//       // Generate JWT
//       const token = jwt.sign(
//         { id: user._id, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: '30d' }
//       );

//       // Send welcome email
//       await sendEmail({
//         to: email,
//         subject: 'Welcome to Sweet Bliss!',
//         template: 'welcome',
//         data: { name }
//       });

//       res.status(201).json({
//         message: 'User registered successfully',
//         token,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Login user
//   login: async (req, res) => {
//     try {
//       const { email, password } = req.body;

//       // Find user
//       const user = await User.findOne({ email });
//       if (!user) {
//         return res.status(400).json({ message: 'Invalid credentials' });
//       }

//       // Check password
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ message: 'Invalid credentials' });
//       }

//       // Update last login
//       user.lastLogin = new Date();
//       await user.save();

//       // Generate JWT
//       const token = jwt.sign(
//         { id: user._id, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: '30d' }
//       );

//       res.json({
//         message: 'Login successful',
//         token,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//           avatar: user.avatar
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get user profile
//   getProfile: async (req, res) => {
//     try {
//       const user = await User.findById(req.user.id).select('-password');
//       res.json({ user });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Update user profile
//   updateProfile: async (req, res) => {
//     try {
//       const updates = req.body;
//       delete updates.password; // Prevent password update through this route

//       const user = await User.findByIdAndUpdate(
//         req.user.id,
//         { ...updates, updatedAt: new Date() },
//         { new: true, runValidators: true }
//       ).select('-password');

//       res.json({
//         message: 'Profile updated successfully',
//         user
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Add address
//   addAddress: async (req, res) => {
//     try {
//       const user = await User.findById(req.user.id);
      
//       // If this is the first address, make it default
//       if (user.addresses.length === 0) {
//         req.body.isDefault = true;
//       }

//       // If setting as default, remove default from others
//       if (req.body.isDefault) {
//         user.addresses.forEach(addr => addr.isDefault = false);
//       }

//       user.addresses.push(req.body);
//       await user.save();

//       res.json({
//         message: 'Address added successfully',
//         addresses: user.addresses
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get all users (Admin only)
//   getAllUsers: async (req, res) => {
//     try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 10;
//       const skip = (page - 1) * limit;

//       const users = await User.find()
//         .select('-password')
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit);

//       const total = await User.countDocuments();

//       res.json({
//         users,
//         pagination: {
//           page,
//           limit,
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// };

// module.exports = userController;

// // ===================================================================
// // PRODUCT CONTROLLER (controllers/productController.js)
// // ===================================================================
// const Product = require('../models/Product');
// const Category = require('../models/Category');
// const { uploadToCloudinary } = require('../utils/cloudinary');

// const productController = {
//   // Create product (Admin/Seller)
//   createProduct: async (req, res) => {
//     try {
//       const productData = {
//         ...req.body,
//         createdBy: req.user.id
//       };

//       // Generate slug
//       productData.slug = req.body.name
//         .toLowerCase()
//         .replace(/[^a-z0-9 -]/g, '')
//         .replace(/\s+/g, '-')
//         .replace(/-+/g, '-');

//       // Handle image uploads
//       if (req.files && req.files.length > 0) {
//         const imageUrls = [];
//         for (let file of req.files) {
//           const result = await uploadToCloudinary(file.buffer);
//           imageUrls.push({
//             url: result.secure_url,
//             alt: req.body.name,
//             isPrimary: imageUrls.length === 0
//           });
//         }
//         productData.images = imageUrls;
//       }

//       const product = new Product(productData);
//       await product.save();

//       const populatedProduct = await Product.findById(product._id)
//         .populate('category', 'name slug');

//       res.status(201).json({
//         message: 'Product created successfully',
//         product: populatedProduct
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get all products with filtering
//   getAllProducts: async (req, res) => {
//     try {
//       const {
//         page = 1,
//         limit = 12,
//         category,
//         minPrice,
//         maxPrice,
//         rating,
//         featured,
//         search,
//         sortBy = 'createdAt',
//         sortOrder = 'desc'
//       } = req.query;

//       const skip = (page - 1) * limit;
//       const query = { isActive: true };

//       // Apply filters
//       if (category) query.category = category;
//       if (featured) query.featured = featured === 'true';
//       if (rating) query['ratings.average'] = { $gte: parseFloat(rating) };
//       if (search) {
//         query.$or = [
//           { name: { $regex: search, $options: 'i' } },
//           { description: { $regex: search, $options: 'i' } },
//           { tags: { $in: [new RegExp(search, 'i')] } }
//         ];
//       }

//       // Price filter (check within weightOptions)
//       if (minPrice || maxPrice) {
//         const priceQuery = {};
//         if (minPrice) priceQuery.$gte = parseFloat(minPrice);
//         if (maxPrice) priceQuery.$lte = parseFloat(maxPrice);
//         query['weightOptions.price'] = priceQuery;
//       }

//       const products = await Product.find(query)
//         .populate('category', 'name slug')
//         .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
//         .skip(skip)
//         .limit(parseInt(limit));

//       const total = await Product.countDocuments(query);

//       res.json({
//         products,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get single product
//   getProduct: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const product = await Product.findOne({
//         $or: [{ _id: id }, { slug: id }],
//         isActive: true
//       })
//       .populate('category', 'name slug')
//       .populate('createdBy', 'name');

//       if (!product) {
//         return res.status(404).json({ message: 'Product not found' });
//       }

//       res.json({ product });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Update product
//   updateProduct: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updates = { ...req.body, updatedAt: new Date() };

//       // Handle image updates
//       if (req.files && req.files.length > 0) {
//         const imageUrls = [];
//         for (let file of req.files) {
//           const result = await uploadToCloudinary(file.buffer);
//           imageUrls.push({
//             url: result.secure_url,
//             alt: req.body.name || 'Product image',
//             isPrimary: imageUrls.length === 0
//           });
//         }
//         updates.images = imageUrls;
//       }

//       const product = await Product.findByIdAndUpdate(
//         id,
//         updates,
//         { new: true, runValidators: true }
//       ).populate('category', 'name slug');

//       if (!product) {
//         return res.status(404).json({ message: 'Product not found' });
//       }

//       res.json({
//         message: 'Product updated successfully',
//         product
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Delete product
//   deleteProduct: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const product = await Product.findByIdAndUpdate(
//         id,
//         { isActive: false },
//         { new: true }
//       );

//       if (!product) {
//         return res.status(404).json({ message: 'Product not found' });
//       }

//       res.json({ message: 'Product deleted successfully' });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get featured products
//   getFeaturedProducts: async (req, res) => {
//     try {
//       const products = await Product.find({
//         featured: true,
//         isActive: true
//       })
//       .populate('category', 'name slug')
//       .sort({ createdAt: -1 })
//       .limit(6);

//       res.json({ products });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Search products
//   searchProducts: async (req, res) => {
//     try {
//       const { q, page = 1, limit = 12 } = req.query;
//       const skip = (page - 1) * limit;

//       if (!q) {
//         return res.status(400).json({ message: 'Search query required' });
//       }

//       const searchQuery = {
//         isActive: true,
//         $or: [
//           { name: { $regex: q, $options: 'i' } },
//           { description: { $regex: q, $options: 'i' } },
//           { tags: { $in: [new RegExp(q, 'i')] } }
//         ]
//       };

//       const products = await Product.find(searchQuery)
//         .populate('category', 'name slug')
//         .sort({ rating: -1, createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit));

//       const total = await Product.countDocuments(searchQuery);

//       res.json({
//         products,
//         searchTerm: q,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// };

// module.exports = productController;

// // ===================================================================
// // CATEGORY CONTROLLER (controllers/categoryController.js)
// // ===================================================================
// const Category = require('../models/Category');

// const categoryController = {
//   // Create category
//   createCategory: async (req, res) => {
//     try {
//       const categoryData = req.body;
      
//       // Generate slug
//       categoryData.slug = req.body.name
//         .toLowerCase()
//         .replace(/[^a-z0-9 -]/g, '')
//         .replace(/\s+/g, '-');

//       const category = new Category(categoryData);
//       await category.save();

//       res.status(201).json({
//         message: 'Category created successfully',
//         category
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get all categories
//   getAllCategories: async (req, res) => {
//     try {
//       const categories = await Category.find({ isActive: true })
//         .populate('parent', 'name slug')
//         .sort({ sortOrder: 1, name: 1 });

//       res.json({ categories });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get category with products
//   getCategoryWithProducts: async (req, res) => {
//     try {
//       const { slug } = req.params;
//       const { page = 1, limit = 12 } = req.query;
//       const skip = (page - 1) * limit;

//       const category = await Category.findOne({ slug, isActive: true });
//       if (!category) {
//         return res.status(404).json({ message: 'Category not found' });
//       }

//       const products = await Product.find({
//         category: category._id,
//         isActive: true
//       })
//       .populate('category', 'name slug')
//       .sort({ featured: -1, createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//       const total = await Product.countDocuments({
//         category: category._id,
//         isActive: true
//       });

//       res.json({
//         category,
//         products,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// };

// module.exports = categoryController;

// // ===================================================================
// // CART CONTROLLER (controllers/cartController.js)
// // ===================================================================
// const Cart = require('../models/Cart');
// const Product = require('../models/Product');

// const cartController = {
//   // Get user's cart
//   getCart: async (req, res) => {
//     try {
//       let cart = await Cart.findOne({ user: req.user.id })
//         .populate('items.product', 'name images weightOptions rating');

//       if (!cart) {
//         cart = new Cart({ user: req.user.id, items: [] });
//         await cart.save();
//       }

//       res.json({ cart });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Add item to cart
//   addToCart: async (req, res) => {
//     try {
//       const { productId, weight, quantity = 1 } = req.body;

//       // Verify product and weight option
//       const product = await Product.findById(productId);
//       if (!product) {
//         return res.status(404).json({ message: 'Product not found' });
//       }

//       const weightOption = product.weightOptions.find(w => w.weight === weight);
//       if (!weightOption) {
//         return res.status(400).json({ message: 'Weight option not available' });
//       }

//       if (weightOption.stock < quantity) {
//         return res.status(400).json({ message: 'Insufficient stock' });
//       }

//       let cart = await Cart.findOne({ user: req.user.id });
//       if (!cart) {
//         cart = new Cart({ user: req.user.id, items: [] });
//       }

//       // Check if item already exists
//       const existingItemIndex = cart.items.findIndex(
//         item => item.product.toString() === productId && item.weight === weight
//       );

//       if (existingItemIndex > -1) {
//         // Update quantity
//         cart.items[existingItemIndex].quantity += quantity;
//       } else {
//         // Add new item
//         cart.items.push({
//           product: productId,
//           weight,
//           quantity,
//           price: weightOption.price,
//           originalPrice: weightOption.originalPrice
//         });
//       }

//       // Calculate totals
//       cart.totalAmount = cart.items.reduce((total, item) =>
//         total + (item.price * item.quantity), 0);
//       cart.totalDiscount = cart.items.reduce((total, item) =>
//         total + ((item.originalPrice - item.price) * item.quantity), 0);

//       cart.updatedAt = new Date();
//       await cart.save();

//       const populatedCart = await Cart.findById(cart._id)
//         .populate('items.product', 'name images weightOptions rating');

//       res.json({
//         message: 'Item added to cart',
//         cart: populatedCart
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Update cart item
//   updateCartItem: async (req, res) => {
//     try {
//       const { itemId } = req.params;
//       const { quantity } = req.body;

//       const cart = await Cart.findOne({ user: req.user.id });
//       if (!cart) {
//         return res.status(404).json({ message: 'Cart not found' });
//       }

//       const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
//       if (itemIndex === -1) {
//         return res.status(404).json({ message: 'Item not found in cart' });
//       }

//       if (quantity <= 0) {
//         // Remove item
//         cart.items.splice(itemIndex, 1);
//       } else {
//         // Update quantity
//         cart.items[itemIndex].quantity = quantity;
//       }

//       // Recalculate totals
//       cart.totalAmount = cart.items.reduce((total, item) =>
//         total + (item.price * item.quantity), 0);
//       cart.totalDiscount = cart.items.reduce((total, item) =>
//         total + ((item.originalPrice - item.price) * item.quantity), 0);

//       cart.updatedAt = new Date();
//       await cart.save();

//       const populatedCart = await Cart.findById(cart._id)
//         .populate('items.product', 'name images weightOptions rating');

//       res.json({
//         message: 'Cart updated successfully',
//         cart: populatedCart
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Clear cart
//   clearCart: async (req, res) => {
//     try {
//       await Cart.findOneAndUpdate(
//         { user: req.user.id },
//         {
//           items: [],
//           totalAmount: 0,
//           totalDiscount: 0,
//           updatedAt: new Date()
//         }
//       );

//       res.json({ message: 'Cart cleared successfully' });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// };

// module.exports = cartController;

// // ===================================================================
// // ORDER CONTROLLER (controllers/orderController.js)
// // ===================================================================
// const Order = require('../models/Order');
// const Cart = require('../models/Cart');
// const { generateOrderNumber } = require('../utils/orderUtils');
// const { sendOrderConfirmation } = require('../utils/emailService');

// const orderController = {
//   // Create order
//   createOrder: async (req, res) => {
//     try {
//       const { shippingAddress, paymentMethod, notes, giftMessage, isGift } = req.body;

//       // Get user's cart
//       const cart = await Cart.findOne({ user: req.user.id })
//         .populate('items.product');

//       if (!cart || cart.items.length === 0) {
//         return res.status(400).json({ message: 'Cart is empty' });
//       }

//       // Generate order number
//       const orderNumber = await generateOrderNumber();

//       // Calculate shipping
//       const shippingCharges = cart.totalAmount >= 500 ? 0 : 50;

//       // Create order
//       const order = new Order({
//         orderNumber,
//         user: req.user.id,
//         items: cart.items.map(item => ({
//           product: item.product._id,
//           name: item.product.name,
//           weight: item.weight,
//           quantity: item.quantity,
//           price: item.price,
//           originalPrice: item.originalPrice,
//           discount: item.originalPrice - item.price,
//           image: item.product.images[0]?.url
//         })),
//         subtotal: cart.totalAmount,
//         discount: cart.totalDiscount,
//         shippingCharges,
//         tax: 0,
//         total: cart.totalAmount + shippingCharges,
//         shippingAddress,
//         paymentMethod,
//         notes,
//         giftMessage,
//         isGift
//       });

//       await order.save();

//       // Clear cart
//       await Cart.findOneAndUpdate(
//         { user: req.user.id },
//         { items: [], totalAmount: 0, totalDiscount: 0 }
//       );

//       // Send confirmation email
//       await sendOrderConfirmation(req.user.email, order);

//       res.status(201).json({
//         message: 'Order created successfully',
//         order: await Order.findById(order._id).populate('user', 'name email')
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get user's orders
//   getUserOrders: async (req, res) => {
//     try {
//       const { page = 1, limit = 10, status } = req.query;
//       const skip = (page - 1) * limit;
//       const query = { user: req.user.id };

//       if (status) query.status = status;

//       const orders = await Order.find(query)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit));

//       const total = await Order.countDocuments(query);

//       res.json({
//         orders,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get single order
//   getOrder: async (req, res) => {
//     try {
//       const { orderNumber } = req.params;
//       const order = await Order.findOne({ orderNumber })
//         .populate('user', 'name email phone');

//       if (!order) {
//         return res.status(404).json({ message: 'Order not found' });
//       }

//       // Check if user owns the order or is admin
//       if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
//         return res.status(403).json({ message: 'Access denied' });
//       }

//       res.json({ order });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Update order status (Admin only)
//   updateOrderStatus: async (req, res) => {
//     try {
//       const { orderNumber } = req.params;
//       const { status, trackingNumber } = req.body;

//       const order = await Order.findOneAndUpdate(
//         { orderNumber },
//         {
//           status,
//           trackingNumber,
//           ...(status === 'delivered' && { deliveredAt: new Date() }),
//           updatedAt: new Date()
//         },
//         { new: true }
//       );

//       if (!order) {
//         return res.status(404).json({ message: 'Order not found' });
//       }

//       res.json({
//         message: 'Order status updated successfully',
//         order
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   },

//   // Get all orders (Admin only)
//   getAllOrders: async (req, res) => {
//     try {
//       const {
//         page = 1,
//         limit = 10,
//         status,
//         startDate,
//         endDate,
//         search
//       } = req.query;
//       const skip = (page - 1) * limit;
//       const query = {};

//       if (status) query.status = status;
//       if (startDate || endDate) {
//         query.createdAt = {};
//         if (startDate) query.createdAt.$gte = new Date(startDate);
//         if (endDate) query.createdAt.$lte = new Date(endDate);
//       }
//       if (search) {
//         query.$or = [
//           { orderNumber: { $regex: search, $options: 'i' } },
//           { 'shippingAddress.name': { $regex: search, $options: 'i' } },
//           { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
//         ];
//       }

//       const orders = await Order.find(query)
//         .populate('user', 'name email phone')
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit));

//       const total = await Order.countDocuments(query);

//       res.json({
//         orders,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// };

// module.exports = orderController;

// // ===================================================================
// // ROUTES SETUP
// // ===================================================================

// // USER ROUTES (routes/userRoutes.js)
// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const { authenticate, authorize } = require('../middleware/auth');
// const { userValidation, validateRequest } = require('../middleware/validation');

// // Public routes
// router.post('/register', userValidation, validateRequest, userController.register);
// router.post('/login', userController.login);

// // Protected routes
// router.get('/profile', authenticate, userController.getProfile);
// router.put('/profile', authenticate, userController.updateProfile);
// router.post('/address', authenticate, userController.addAddress);

// // Admin routes
// router.get('/all', authenticate, authorize('admin'), userController.getAllUsers);

// module.exports = router;

// // PRODUCT ROUTES (routes/productRoutes.js)
// const express = require('express');
// const router = express.Router();
// const productController = require('../controllers/productController');
// const { authenticate, authorize } = require('../middleware/auth');
// const { productValidation, validateRequest } = require('../middleware/validation');
// const upload = require('../middleware/upload');

// // Public routes
// router.get('/', productController.getAllProducts);
// router.get('/featured', productController.getFeaturedProducts);
// router.get('/search', productController.searchProducts);
// router.get('/:id', productController.getProduct);

// // Protected routes (Admin/Seller)
// router.post('/',
//   authenticate,
//   authorize('admin', 'seller'),
//   upload.array('images', 5),
//   productValidation,
//   validateRequest,
//   productController.createProduct
// );
// router.put('/:id',
//   authenticate,
//   authorize('admin', 'seller'),
//   upload.array('images', 5),
//   productController.updateProduct
// );
// router.delete('/:id',
//   authenticate,
//   authorize('admin', 'seller'),
//   productController.deleteProduct
// );

// module.exports = router;

// // CATEGORY ROUTES (routes/categoryRoutes.js)
// const express = require('express');
// const router = express.Router();
// const categoryController = require('../controllers/categoryController');
// const { authenticate, authorize } = require('../middleware/auth');

// // Public routes
// router.get('/', categoryController.getAllCategories);
// router.get('/:slug', categoryController.getCategoryWithProducts);

// // Admin routes
// router.post('/', authenticate, authorize('admin'), categoryController.createCategory);

// module.exports = router;

// // CART ROUTES (routes/cartRoutes.js)
// const express = require('express');
// const router = express.Router();
// const cartController = require('../controllers/cartController');
// const { authenticate } = require('../middleware/auth');

// // All cart routes require authentication
// router.get('/', authenticate, cartController.getCart);
// router.post('/add', authenticate, cartController.addToCart);
// router.put('/item/:itemId', authenticate, cartController.updateCartItem);
// router.delete('/clear', authenticate, cartController.clearCart);

// module.exports = router;

// // ORDER ROUTES (routes/orderRoutes.js)
// const express = require('express');
// const router = express.Router();
// const orderController = require('../controllers/orderController');
// const { authenticate, authorize } = require('../middleware/auth');

// // Customer routes
// router.post('/', authenticate, orderController.createOrder);
// router.get('/my-orders', authenticate, orderController.getUserOrders);
// router.get('/:orderNumber', authenticate, orderController.getOrder);

// // Admin routes
// router.get('/', authenticate, authorize('admin'), orderController.getAllOrders);
// router.put('/:orderNumber/status', authenticate, authorize('admin'), orderController.updateOrderStatus);

// module.exports = router;

// // ===================================================================
// // MAIN ROUTES FILE (routes/index.js)
// // ===================================================================
// const express = require('express');
// const router = express.Router();

// // Import route modules
// const userRoutes = require('./userRoutes');
// const productRoutes = require('./productRoutes');
// const categoryRoutes = require('./categoryRoutes');
// const cartRoutes = require('./cartRoutes');
// const orderRoutes = require('./orderRoutes');

// // Use routes
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);
// router.use('/categories', categoryRoutes);
// router.use('/cart', cartRoutes);
// router.use('/orders', orderRoutes);

// // Health check
// router.get('/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     message: 'Sweet Shop API is running!',
//     timestamp: new Date().toISOString()
//   });
// });

// module.exports = router;

// // ===================================================================
// // MAIN SERVER FILE (server.js)
// // ===================================================================
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// require('dotenv').config();

// const routes = require('./routes');

// const app = express();

// // Security middleware
// app.use(helmet());
// app.use(cors());

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Database connection
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch((err) => console.error('MongoDB connection error:', err));

// // Routes
// app.use('/api/v1', routes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     message: 'Something went wrong!',
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ message: 'Route not found' });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Sweet Shop API server running on port ${PORT}`);
// });

// module.exports = app;









































































// // ===================================================================
// // utils/orderUtils.js - Order Number Generation and Utilities
// // ===================================================================

// const Order = require('../models/Order');
// const crypto = require('crypto');

// const orderUtils = {
//   /**
//    * Generate unique order number
//    * Format: ORD-YYYY-XXXXXX (e.g., ORD-2025-000001)
//    */
//   generateOrderNumber: async () => {
//     try {
//       const currentYear = new Date().getFullYear();
//       const prefix = `ORD-${currentYear}-`;
      
//       // Get the count of orders for current year
//       const startOfYear = new Date(currentYear, 0, 1);
//       const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
      
//       const orderCount = await Order.countDocuments({
//         createdAt: {
//           $gte: startOfYear,
//           $lte: endOfYear
//         }
//       });
      
//       // Generate sequential number with padding
//       const sequentialNumber = (orderCount + 1).toString().padStart(6, '0');
//       const orderNumber = `${prefix}${sequentialNumber}`;
      
//       // Check if order number already exists (safety check)
//       const existingOrder = await Order.findOne({ orderNumber });
//       if (existingOrder) {
//         // If exists, generate with random suffix
//         const randomSuffix = crypto.randomInt(100, 999);
//         return `${prefix}${sequentialNumber}${randomSuffix}`;
//       }
      
//       return orderNumber;
//     } catch (error) {
//       // Fallback: Generate with timestamp
//       const timestamp = Date.now().toString().slice(-6);
//       return `ORD-${new Date().getFullYear()}-${timestamp}`;
//     }
//   },

//   /**
//    * Calculate order total including taxes and shipping
//    */
//   calculateOrderTotal: (subtotal, discount = 0, shippingCharges = 0, taxRate = 0) => {
//     const discountedAmount = subtotal - discount;
//     const tax = (discountedAmount * taxRate) / 100;
//     const total = discountedAmount + shippingCharges + tax;
    
//     return {
//       subtotal,
//       discount,
//       tax: Math.round(tax * 100) / 100,
//       shippingCharges,
//       total: Math.round(total * 100) / 100
//     };
//   },

//   /**
//    * Calculate shipping charges based on location and weight
//    */
//   calculateShippingCharges: (totalAmount, location, totalWeight = 0) => {
//     // Free shipping for orders above 500
//     if (totalAmount >= 500) return 0;
    
//     // Base shipping rates
//     const baseRates = {
//       local: 30,      // Same city
//       regional: 50,   // Same state
//       national: 80,   // Other states
//       metro: 40       // Metro cities
//     };
    
//     const metroCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad'];
//     const cityName = location.city.toLowerCase();
    
//     let shippingRate = baseRates.national; // Default
    
//     if (metroCities.includes(cityName)) {
//       shippingRate = baseRates.metro;
//     }
    
//     // Additional charges for heavy orders (above 2kg)
//     if (totalWeight > 2000) { // weight in grams
//       shippingRate += Math.ceil((totalWeight - 2000) / 500) * 10;
//     }
    
//     return shippingRate;
//   },

//   /**
//    * Generate estimated delivery date
//    */
//   generateEstimatedDelivery: (location, orderDate = new Date()) => {
//     const metroCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad'];
//     const cityName = location.city.toLowerCase();
    
//     // Delivery timeframes in days
//     let deliveryDays = 5; // Default for other cities
    
//     if (metroCities.includes(cityName)) {
//       deliveryDays = 2; // Metro cities - 2 days
//     } else if (location.state.toLowerCase() === 'maharashtra') {
//       deliveryDays = 3; // Same state - 3 days
//     }
    
//     // Add weekend buffer
//     const deliveryDate = new Date(orderDate);
//     deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    
//     // If delivery falls on Sunday, move to Monday
//     if (deliveryDate.getDay() === 0) {
//       deliveryDate.setDate(deliveryDate.getDate() + 1);
//     }
    
//     return deliveryDate;
//   },

//   /**
//    * Format order status for display
//    */
//   formatOrderStatus: (status) => {
//     const statusMap = {
//       pending: { label: 'Order Placed', color: 'orange', icon: '🛒' },
//       confirmed: { label: 'Confirmed', color: 'blue', icon: '✅' },
//       processing: { label: 'Preparing', color: 'purple', icon: '👨‍🍳' },
//       shipped: { label: 'Shipped', color: 'yellow', icon: '🚚' },
//       delivered: { label: 'Delivered', color: 'green', icon: '📦' },
//       cancelled: { label: 'Cancelled', color: 'red', icon: '❌' },
//       refunded: { label: 'Refunded', color: 'gray', icon: '💰' }
//     };
    
//     return statusMap[status] || { label: status, color: 'gray', icon: '❓' };
//   },

//   /**
//    * Validate order data before creation
//    */
//   validateOrderData: (orderData) => {
//     const errors = [];
    
//     if (!orderData.shippingAddress) {
//       errors.push('Shipping address is required');
//     } else {
//       const requiredFields = ['name', 'phone', 'street', 'city', 'state', 'pincode'];
//       requiredFields.forEach(field => {
//         if (!orderData.shippingAddress[field]) {
//           errors.push(`${field} is required in shipping address`);
//         }
//       });
//     }
    
//     if (!orderData.paymentMethod) {
//       errors.push('Payment method is required');
//     }
    
//     if (!['cod', 'online', 'wallet', 'card'].includes(orderData.paymentMethod)) {
//       errors.push('Invalid payment method');
//     }
    
//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }
// };

// module.exports = orderUtils;

// // ===================================================================
// // utils/emailService.js - Email Service for Order Notifications
// // ===================================================================

// const nodemailer = require('nodemailer');
// const fs = require('fs').promises;
// const path = require('path');

// class EmailService {
//   constructor() {
//     this.transporter = nodemailer.createTransporter({
//       // Gmail configuration
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER || 'your-email@gmail.com',
//         pass: process.env.EMAIL_PASS || 'your-app-password'
//       }
//     });

//     // Alternative SMTP configuration
//     // this.transporter = nodemailer.createTransporter({
//     //   host: process.env.SMTP_HOST || 'smtp.gmail.com',
//     //   port: process.env.SMTP_PORT || 587,
//     //   secure: false,
//     //   auth: {
//     //     user: process.env.SMTP_USER,
//     //     pass: process.env.SMTP_PASS
//     //   }
//     // });

//     this.fromEmail = process.env.FROM_EMAIL || 'Sweet Bliss <noreply@sweetbliss.com>';
//   }

//   /**
//    * Send order confirmation email
//    */
//   async sendOrderConfirmation(userEmail, order) {
//     try {
//       const emailTemplate = await this.generateOrderConfirmationTemplate(order);
      
//       const mailOptions = {
//         from: this.fromEmail,
//         to: userEmail,
//         subject: `🍯 Order Confirmation - ${order.orderNumber} | Sweet Bliss`,
//         html: emailTemplate,
//         attachments: [
//           {
//             filename: 'logo.png',
//             path: path.join(__dirname, '../assets/images/logo.png'),
//             cid: 'logo'
//           }
//         ]
//       };

//       const result = await this.transporter.sendMail(mailOptions);
//       console.log('Order confirmation email sent:', result.messageId);
//       return result;
//     } catch (error) {
//       console.error('Error sending order confirmation email:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send order status update email
//    */
//   async sendOrderStatusUpdate(userEmail, order, previousStatus) {
//     try {
//       const emailTemplate = await this.generateStatusUpdateTemplate(order, previousStatus);
      
//       const statusEmojis = {
//         confirmed: '✅',
//         processing: '👨‍🍳',
//         shipped: '🚚',
//         delivered: '📦',
//         cancelled: '❌'
//       };

//       const mailOptions = {
//         from: this.fromEmail,
//         to: userEmail,
//         subject: `${statusEmojis[order.status]} Order Update - ${order.orderNumber} | Sweet Bliss`,
//         html: emailTemplate
//       };

//       const result = await this.transporter.sendMail(mailOptions);
//       console.log('Order status update email sent:', result.messageId);
//       return result;
//     } catch (error) {
//       console.error('Error sending order status update email:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send order cancellation email
//    */
//   async sendOrderCancellation(userEmail, order, reason) {
//     try {
//       const emailTemplate = await this.generateCancellationTemplate(order, reason);
      
//       const mailOptions = {
//         from: this.fromEmail,
//         to: userEmail,
//         subject: `❌ Order Cancelled - ${order.orderNumber} | Sweet Bliss`,
//         html: emailTemplate
//       };

//       const result = await this.transporter.sendMail(mailOptions);
//       console.log('Order cancellation email sent:', result.messageId);
//       return result;
//     } catch (error) {
//       console.error('Error sending order cancellation email:', error);
//       throw error;
//     }
//   }

//   /**
//    * Generate order confirmation email template
//    */
//   async generateOrderConfirmationTemplate(order) {
//     const orderItems = order.items.map(item => `
//       <tr style="border-bottom: 1px solid #eee;">
//         <td style="padding: 15px 0; vertical-align: top;">
//           <div style="display: flex; align-items: center;">
//             <img src="${item.image || ''}" alt="${item.name}" style="width: 60px; height: 60px; border-radius: 8px; margin-right: 15px; object-fit: cover;">
//             <div>
//               <h4 style="margin: 0; color: #333; font-size: 16px;">${item.name}</h4>
//               <p style="margin: 5px 0; color: #666; font-size: 14px;">${item.weight} × ${item.quantity}</p>
//             </div>
//           </div>
//         </td>
//         <td style="padding: 15px 0; text-align: right; vertical-align: top;">
//           <p style="margin: 0; font-weight: bold; color: #e74c3c; font-size: 16px;">₹${item.price}</p>
//           ${item.originalPrice > item.price ? `<p style="margin: 5px 0; color: #888; font-size: 14px; text-decoration: line-through;">₹${item.originalPrice}</p>` : ''}
//         </td>
//       </tr>
//     `).join('');

//     return `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="utf-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Order Confirmation</title>
//     </head>
//     <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
//       <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        
//         <!-- Header -->
//         <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center;">
//           <img src="cid:logo" alt="Sweet Bliss" style="height: 50px; margin-bottom: 15px;">
//           <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Order Confirmed! 🍯</h1>
//           <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for choosing Sweet Bliss</p>
//         </div>

//         <!-- Order Details -->
//         <div style="padding: 30px;">
//           <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
//             <h2 style="margin: 0; font-size: 24px;">Order #${order.orderNumber}</h2>
//             <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', {
//               year: 'numeric',
//               month: 'long',
//               day: 'numeric'
//             })}</p>
//           </div>

//           <!-- Order Items -->
//           <h3 style="color: #333; border-bottom: 2px solid #ff6b35; padding-bottom: 10px; margin-bottom: 20px;">Your Sweet Delights</h3>
//           <table style="width: 100%; border-collapse: collapse;">
//             ${orderItems}
//           </table>

//           <!-- Order Summary -->
//           <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0;">
//             <h3 style="margin: 0 0 15px 0; color: #333;">Order Summary</h3>
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//               <span>Subtotal:</span>
//               <span>₹${order.subtotal}</span>
//             </div>
//             ${order.discount > 0 ? `
//             <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #4CAF50;">
//               <span>Discount:</span>
//               <span>-₹${order.discount}</span>
//             </div>
//             ` : ''}
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//               <span>Shipping:</span>
//               <span>${order.shippingCharges === 0 ? 'FREE' : '₹' + order.shippingCharges}</span>
//             </div>
//             ${order.tax > 0 ? `
//             <div style="display: flex; justify-content: space-between; margin: 10px 0;">
//               <span>Tax:</span>
//               <span>₹${order.tax}</span>
//             </div>
//             ` : ''}
//             <hr style="border: none; border-top: 2px solid #ff6b35; margin: 15px 0;">
//             <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; color: #ff6b35;">
//               <span>Total:</span>
//               <span>₹${order.total}</span>
//             </div>
//           </div>

//           <!-- Delivery Information -->
//           <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; border-left: 4px solid #2196F3;">
//             <h3 style="margin: 0 0 15px 0; color: #1976D2;">Delivery Information</h3>
//             <p style="margin: 5px 0; color: #333;"><strong>Address:</strong></p>
//             <p style="margin: 5px 0; color: #666;">
//               ${order.shippingAddress.name}<br>
//               ${order.shippingAddress.street}<br>
//               ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
//               Phone: ${order.shippingAddress.phone}
//             </p>
//             <p style="margin: 15px 0 5px 0; color: #333;"><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
//             ${order.estimatedDelivery ? `<p style="margin: 5px 0; color: #4CAF50;"><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}</p>` : ''}
//           </div>

//           ${order.isGift && order.giftMessage ? `
//           <!-- Gift Message -->
//           <div style="background: #fce4ec; padding: 20px; border-radius: 10px; border-left: 4px solid #e91e63; margin: 20px 0;">
//             <h3 style="margin: 0 0 10px 0; color: #c2185b;">🎁 Gift Message</h3>
//             <p style="margin: 0; color: #666; font-style: italic;">"${order.giftMessage}"</p>
//           </div>
//           ` : ''}

//           <!-- Next Steps -->
//           <div style="background: #fff3e0; padding: 20px; border-radius: 10px; border-left: 4px solid #ff9800; margin: 20px 0;">
//             <h3 style="margin: 0 0 15px 0; color: #f57c00;">What's Next?</h3>
//             <ul style="margin: 0; padding-left: 20px; color: #666;">
//               <li style="margin: 8px 0;">We'll start preparing your fresh sweets immediately</li>
//               <li style="margin: 8px 0;">You'll receive tracking details once your order ships</li>
//               <li style="margin: 8px 0;">Your sweets will be delivered fresh and ready to enjoy</li>
//             </ul>
//           </div>

//           <!-- Call to Action -->
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${process.env.FRONTEND_URL}/orders/${order.orderNumber}" style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Track Your Order</a>
//           </div>
//         </div>

//         <!-- Footer -->
//         <div style="background: #333; color: white; padding: 30px; text-align: center;">
//           <h3 style="margin: 0 0 15px 0;">Sweet Bliss</h3>
//           <p style="margin: 0; opacity: 0.8;">Traditional Indian Sweets | Made with Love</p>
//           <p style="margin: 15px 0 0 0; opacity: 0.6; font-size: 14px;">
//             Need help? Contact us at support@sweetbliss.com or call +91 9876543210
//           </p>
//           <div style="margin-top: 20px;">
//             <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">Facebook</a>
//             <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">Instagram</a>
//             <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">Twitter</a>
//           </div>
//         </div>
//       </div>
//     </body>
//     </html>
//     `;
//   }

//   /**
//    * Generate order status update email template
//    */
//   async generateStatusUpdateTemplate(order, previousStatus) {
//     const statusInfo = {
//       confirmed: {
//         title: 'Order Confirmed!',
//         message: 'Great news! Your order has been confirmed and we\'re preparing your delicious sweets.',
//         color: '#4CAF50',
//         icon: '✅'
//       },
//       processing: {
//         title: 'Preparing Your Sweets!',
//         message: 'Our expert halwais are handcrafting your sweets with love and care.',
//         color: '#ff9800',
//         icon: '👨‍🍳'
//       },
//       shipped: {
//         title: 'Your Order is on the Way!',
//         message: 'Your fresh sweets have been shipped and are heading to your doorstep.',
//         color: '#2196F3',
//         icon: '🚚'
//       },
//       delivered: {
//         title: 'Order Delivered!',
//         message: 'Your sweet delights have been delivered. Enjoy every bite!',
//         color: '#4CAF50',
//         icon: '📦'
//       }
//     };

//     const currentStatus = statusInfo[order.status] || statusInfo.confirmed;

//     return `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="utf-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Order Update</title>
//     </head>
//     <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
//       <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        
//         <!-- Header -->
//         <div style="background: ${currentStatus.color}; padding: 30px; text-align: center;">
//           <div style="font-size: 48px; margin-bottom: 15px;">${currentStatus.icon}</div>
//           <h1 style="color: white; margin: 0; font-size: 28px;">${currentStatus.title}</h1>
//           <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Order #${order.orderNumber}</p>
//         </div>

//         <!-- Content -->
//         <div style="padding: 30px;">
//           <p style="font-size: 16px; color: #333; line-height: 1.6;">${currentStatus.message}</p>
          
//           ${order.trackingNumber ? `
//           <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
//             <h3 style="margin: 0 0 10px 0; color: #1976D2;">Tracking Information</h3>
//             <p style="margin: 0; color: #666;">Tracking Number: <strong>${order.trackingNumber}</strong></p>
//           </div>
//           ` : ''}

//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${process.env.FRONTEND_URL}/orders/${order.orderNumber}" style="background: ${currentStatus.color}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">View Order Details</a>
//           </div>
//         </div>

//         <!-- Footer -->
//         <div style="background: #333; color: white; padding: 20px; text-align: center;">
//           <p style="margin: 0; opacity: 0.8;">Sweet Bliss - Traditional Indian Sweets</p>
//         </div>
//       </div>
//     </body>
//     </html>
//     `;
//   }

//   /**
//    * Generate order cancellation email template
//    */
//   async generateCancellationTemplate(order, reason) {
//     return `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="utf-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Order Cancelled</title>
//     </head>
//     <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
//       <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        
//         <!-- Header -->
//         <div style="background: #f44336; padding: 30px; text-align: center;">
//           <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
//           <h1 style="color: white; margin: 0; font-size: 28px;">Order Cancelled</h1>
//           <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Order #${order.orderNumber}</p>
//         </div>

//         <!-- Content -->
//         <div style="padding: 30px;">
//           <p style="font-size: 16px; color: #333; line-height: 1.6;">
//             We're sorry to inform you that your order has been cancelled.
//           </p>
          
//           ${reason ? `
//           <div style="background: #ffebee; padding: 20px; border-radius: 10px; border-left: 4px solid #f44336; margin: 20px 0;">
//             <h3 style="margin: 0 0 10px 0; color: #c62828;">Reason for Cancellation</h3>
//             <p style="margin: 0; color: #666;">${reason}</p>
//           </div>
//           ` : ''}

//           <p style="font-size: 16px; color: #333; line-height: 1.6;">
//             If you paid online, your refund will be processed within 3-5 business days to your original payment method.
//           </p>

//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${process.env.FRONTEND_URL}/products" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Continue Shopping</a>
//           </div>
//         </div>

//         <!-- Footer -->
//         <div style="background: #333; color: white; padding: 20px; text-align: center;">
//           <p style="margin: 0; opacity: 0.8;">Sweet Bliss - Traditional Indian Sweets</p>
//           <p style="margin: 10px 0 0 0; opacity: 0.6; font-size: 14px;">
//             Questions? Contact us at support@sweetbliss.com
//           </p>
//         </div>
//       </div>
//     </body>
//     </html>
//     `;
//   }

//   /**
//    * Test email connection
//    */
//   async testConnection() {
//     try {
//       await this.transporter.verify();
//       console.log('Email service is ready');
//       return true;
//     } catch (error) {
//       console.error('Email service error:', error);
//       return false;
//     }
//   }
// }

// // Create singleton instance
// const emailService = new EmailService();

// module.exports = {
//   sendOrderConfirmation: emailService.sendOrderConfirmation.bind(emailService),
//   sendOrderStatusUpdate: emailService.sendOrderStatusUpdate.bind(emailService),
//   sendOrderCancellation: emailService.sendOrderCancellation.bind(emailService),
//   testConnection: emailService.testConnection.bind(emailService)
// };

// // ===================================================================
// // ENVIRONMENT VARIABLES REQUIRED (.env file)
// // ===================================================================

// /*
// # Email Configuration
// EMAIL_USER=your-gmail@gmail.com
// EMAIL_PASS=your-app-specific-password
// FROM_EMAIL=Sweet Bliss <noreply@sweetbliss.com>

// # Alternative SMTP Configuration
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=587
// SMTP_USER=your-email@domain.com
// SMTP_PASS=your-password

// # Frontend URL for email links
// FRONTEND_URL=http://localhost:3000

// # Database URL
// MONGODB_URI=mongodb://localhost:27017/sweetbliss
// */

// // ===================================================================
// // PACKAGE.JSON DEPENDENCIES REQUIRED
// // ===================================================================

// /*
// {
//   "dependencies": {
//     "nodemailer": "^6.9.1",
//     "mongoose": "^7.0.0"
//   }
// }
// */

// // ===================================================================
// // USAGE EXAMPLE IN ORDER CONTROLLER
// // ===================================================================

// /*
// // Import the utilities
// const { generateOrderNumber } = require('../utils/orderUtils');
// const { sendOrderConfirmation } = require('../utils/emailService');

// // In your order creation endpoint:
// const orderNumber = await generateOrderNumber();
// await sendOrderConfirmation(user.email, order);
// */














































// // middleware/auth.js
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
    
//     if (!token) {
//       return res.status(401).json({ message: 'No token, authorization denied' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id).select('-password');
    
//     if (!user) {
//       return res.status(401).json({ message: 'Token is not valid' });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };

// const checkRole = (roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: 'Access denied' });
//     }
//     next();
//   };
// };

// module.exports = { auth, checkRole };

// // controllers/sellerController.js
// const User = require('../models/User');
// const Product = require('../models/Product');
// const Order = require('../models/Order');
// const Analytics = require('../models/Analytics');
// const Notification = require('../models/Notification');
// const Return = require('../models/Return');
// const Promotion = require('../models/Promotion');
// const { generateAnalytics } = require('../utils/analytics');
// const { sendNotification } = require('../utils/notifications');

// // Dashboard Analytics
// exports.getDashboard = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     // Today's metrics
//     const todayOrders = await Order.aggregate([
//       { $unwind: '$items' },
//       { $match: { 'items.seller': sellerId, createdAt: { $gte: today, $lt: tomorrow } } },
//       { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$items.price' } } }
//     ]);

//     // Lifetime metrics
//     const lifetimeMetrics = await Order.aggregate([
//       { $unwind: '$items' },
//       { $match: { 'items.seller': sellerId } },
//       { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$items.price' } } }
//     ]);

//     // Product metrics
//     const productStats = await Product.aggregate([
//       { $match: { seller: sellerId } },
//       { $group: {
//         _id: null,
//         total: { $sum: 1 },
//         active: { $sum: { $cond: ['$isActive', 1, 0] } },
//         lowStock: { $sum: { $cond: [{ $lte: ['$stock', '$lowStockThreshold'] }, 1, 0] } }
//       }}
//     ]);

//     // Recent orders
//     const recentOrders = await Order.find({
//       'items.seller': sellerId
//     })
//     .populate('customer', 'name email')
//     .populate('items.product', 'title images')
//     .sort({ createdAt: -1 })
//     .limit(10);

//     // Notifications
//     const notifications = await Notification.find({
//       recipient: sellerId,
//       isRead: false
//     })
//     .sort({ createdAt: -1 })
//     .limit(5);

//     res.json({
//       today: {
//         orders: todayOrders[0]?.count || 0,
//         revenue: todayOrders[0]?.revenue || 0
//       },
//       lifetime: {
//         orders: lifetimeMetrics[0]?.count || 0,
//         revenue: lifetimeMetrics[0]?.revenue || 0
//       },
//       products: {
//         total: productStats[0]?.total || 0,
//         active: productStats[0]?.active || 0,
//         lowStock: productStats[0]?.lowStock || 0
//       },
//       recentOrders,
//       notifications
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// // Promotions
// exports.getPromotions = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, isActive } = req.query;
//     const sellerId = req.user._id;

//     let query = { seller: sellerId };
//     if (isActive !== undefined) query.isActive = isActive === 'true';

//     const promotions = await Promotion.find(query)
//       .populate('applicableProducts', 'title')
//       .populate('applicableCategories', 'name')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip
    






















//     // middleware/auth.js
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
    
//     if (!token) {
//       return res.status(401).json({ message: 'No token, authorization denied' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id).select('-password');
    
//     if (!user) {
//       return res.status(401).json({ message: 'Token is not valid' });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };



// module.exports = { auth, checkRole };



// // server.js (Socket.io setup)
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     methods: ["GET", "POST"]
//   }
// });

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Socket.io middleware to attach io instance to requests
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/seller', require('./routes/seller'));
// app.use('/api/admin', require('./routes/admin'));

// // Socket.io connection handling
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   // Join room based on user role and ID
//   socket.on('join', (userData) => {
//     socket.join(userData.userId);
//     if (userData.role === 'seller') {
//       socket.join(`seller_${userData.userId}`);
//     }
//   });

//   // Handle new order notifications for sellers
//   socket.on('newOrder', (orderData) => {
//     // Emit to specific seller
//     io.to(`seller_${orderData.sellerId}`).emit('orderNotification', {
//       type: 'new_order',
//       order: orderData,
//       timestamp: new Date()
//     });
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// // MongoDB connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });((page - 1) * limit);

//     const total = await Product.countDocuments(query);

//     res.json({
//       products,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.createProduct = async (req, res) => {
//   try {
//     const product = new Product({
//       ...req.body,
//       seller: req.user._id
//     });

//     await product.save();
//     await product.populate('category', 'name');

//     // Send notification
//     await sendNotification(req.user._id, 'product', 'Product Created',
//       `Your product "${product.title}" has been created successfully.`);

//     res.status(201).json(product);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findOneAndUpdate(
//       { _id: req.params.id, seller: req.user._id },
//       req.body,
//       { new: true }
//     ).populate('category', 'name');

//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     res.json(product);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.deleteProduct = async (req, res) => {
//   try {
//     const product = await Product.findOneAndDelete({
//       _id: req.params.id,
//       seller: req.user._id
//     });

//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     res.json({ message: 'Product deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Orders Management
// exports.getOrders = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, status, startDate, endDate } = req.query;
//     const sellerId = req.user._id;

//     let matchStage = { 'items.seller': sellerId };
    
//     if (status) matchStage['items.status'] = status;
//     if (startDate && endDate) {
//       matchStage.createdAt = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//     const orders = await Order.aggregate([
//       { $match: matchStage },
//       { $unwind: '$items' },
//       { $match: { 'items.seller': sellerId } },
//       { $lookup: {
//         from: 'users',
//         localField: 'customer',
//         foreignField: '_id',
//         as: 'customer'
//       }},
//       { $lookup: {
//         from: 'products',
//         localField: 'items.product',
//         foreignField: '_id',
//         as: 'items.product'
//       }},
//       { $sort: { createdAt: -1 } },
//       { $skip: (page - 1) * limit },
//       { $limit: parseInt(limit) }
//     ]);

//     const total = await Order.aggregate([
//       { $match: matchStage },
//       { $unwind: '$items' },
//       { $match: { 'items.seller': sellerId } },
//       { $count: 'total' }
//     ]);

//     res.json({
//       orders,
//       totalPages: Math.ceil((total[0]?.total || 0) / limit),
//       currentPage: page,
//       total: total[0]?.total || 0
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.updateOrderStatus = async (req, res) => {
//   try {
//     const { orderId, itemId } = req.params;
//     const { status, trackingNumber, courier } = req.body;

//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     const item = order.items.id(itemId);
//     if (!item || item.seller.toString() !== req.user._id.toString()) {
//       return res.status(404).json({ message: 'Order item not found' });
//     }

//     item.status = status;
//     if (trackingNumber) item.trackingNumber = trackingNumber;
//     if (courier) item.courier = courier;

//     order.statusHistory.push({
//       status,
//       timestamp: new Date(),
//       note: `Status updated to ${status} by seller`
//     });

//     await order.save();

//     // Send notification to customer
//     await sendNotification(order.customer, 'order', 'Order Status Updated',
//       `Your order #${order.orderNumber} status has been updated to ${status}.`);

//     // Emit real-time notification
//     req.io.to(order.customer.toString()).emit('orderStatusUpdate', {
//       orderId: order._id,
//       status,
//       trackingNumber,
//       courier
//     });

//     res.json({ message: 'Order status updated successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Returns Management
// exports.getReturns = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, status } = req.query;
//     const sellerId = req.user._id;

//     let query = { seller: sellerId };
//     if (status) query.status = status;

//     const returns = await Return.find(query)
//       .populate('order', 'orderNumber')
//       .populate('customer', 'name email')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Return.countDocuments(query);

//     res.json({
//       returns,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.updateReturnStatus = async (req, res) => {
//   try {
//     const { status, adminNotes, refundAmount } = req.body;
    
//     const returnRequest = await Return.findOne({
//       _id: req.params.id,
//       seller: req.user._id
//     });

//     if (!returnRequest) {
//       return res.status(404).json({ message: 'Return request not found' });
//     }

//     returnRequest.status = status;
//     if (adminNotes) returnRequest.adminNotes = adminNotes;
//     if (refundAmount) returnRequest.refundAmount = refundAmount;

//     returnRequest.timeline.push({
//       status,
//       timestamp: new Date(),
//       note: adminNotes || `Status updated to ${status}`,
//       updatedBy: req.user._id
//     });

//     await returnRequest.save();

//     // Send notification to customer
//     await sendNotification(returnRequest.customer, 'order', 'Return Status Updated',
//       `Your return request has been ${status}.`);

//     res.json({ message: 'Return status updated successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Analytics
// exports.getAnalytics = async (req, res) => {
//   try {
//     const { period = '7d', startDate, endDate } = req.query;
//     const sellerId = req.user._id;

//     let dateRange = {};
//     const now = new Date();

//     switch (period) {
//       case '7d':
//         dateRange = {
//           $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
//           $lte: now
//         };
//         break;
//       case '30d':
//         dateRange = {
//           $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
//           $lte: now
//         };
//         break;
//       case 'custom':
//         if (startDate && endDate) {
//           dateRange = {
//             $gte: new Date(startDate),
//             $lte: new Date(endDate)
//           };
//         }
//         break;
//     }

//     const analytics = await Analytics.find({
//       seller: sellerId,
//       date: dateRange
//     }).sort({ date: 1 });

//     // Sales trends
//     const salesTrends = await Order.aggregate([
//       { $unwind: '$items' },
//       { $match: { 'items.seller': sellerId, createdAt: dateRange } },
//       { $group: {
//         _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
//         revenue: { $sum: '$items.price' },
//         orders: { $sum: 1 }
//       }},
//       { $sort: { '_id': 1 } }
//     ]);

//     // Top products
//     const topProducts = await Order.aggregate([
//       { $unwind: '$items' },
//       { $match: { 'items.seller': sellerId, createdAt: dateRange } },
//       { $group: {
//         _id: '$items.product',
//         sales: { $sum: '$items.quantity' },
//         revenue: { $sum: '$items.price' }
//       }},
//       { $lookup: {
//         from: 'products',
//         localField: '_id',
//         foreignField: '_id',
//         as: 'product'
//       }},
//       { $sort: { sales: -1 } },
//       { $limit: 10 }
//     ]);

//     res.json({
//       analytics,
//       salesTrends,
//       topProducts
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Notifications
// exports.getNotifications = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, isRead } = req.query;
    
//     let query = { recipient: req.user._id };
//     if (isRead !== undefined) query.isRead = isRead === 'true';

//     const notifications = await Notification.find(query)
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Notification.countDocuments(query);

//     res.json({
//       notifications,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.markNotificationRead = async (req, res) => {
//   try {
//     await Notification.findOneAndUpdate(
//       { _id: req.params.id, recipient: req.user._id },
//       { isRead: true }
//     );

//     res.json({ message: 'Notification marked as read' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Promotions
// exports.getPromotions = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, isActive } = req.query;
//     const sellerId = req.user._id;

//     let query = { seller: sellerId };
//     if (isActive !== undefined) query.isActive = isActive === 'true';

//     const promotions = await Promotion.find(query)
//       .populate('applicableProducts', 'title')
//       .populate('applicableCategories', 'name')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip
    









// // server.js - Main server file
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const compression = require('compression');
// const morgan = require('morgan');
// require('dotenv').config();

// // Import middleware
// const errorHandler = require('./middleware/errorHandler');
// const { auth } = require('./middleware/auth');
// const apiMetrics = require('./middleware/apiMetrics');

// // Import routes
// const authRoutes = require('./routes/auth');
// const sellerRoutes = require('./routes/seller');
// const adminRoutes = require('./routes/admin');
// const uploadRoutes = require('./routes/upload');
// const analyticsRoutes = require('./routes/analytics');
// const webhookRoutes = require('./routes/webhooks');

// // Import utilities
// const { initializeSocket } = require('./utils/socket');
// const { startCronJobs } = require('./cron/jobs');
// const { seedDatabase } = require('./utils/seedData');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true
//   }
// });

// // Security middleware
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
// }));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: {
//     error: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use(limiter);
// app.use(compression());
// app.use(morgan('combined'));
// app.use(cors({
//   origin: process.env.CLIENT_URL || "http://localhost:3000",
//   credentials: true
// }));

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Static files
// app.use('/uploads', express.static('uploads'));

// // API metrics middleware
// app.use('/api', apiMetrics);

// // Socket.io middleware to attach io instance to requests
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     environment: process.env.NODE_ENV,
//     version: process.env.npm_package_version || '1.0.0'
//   });
// });

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/seller', sellerRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/upload', uploadRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/webhooks', webhookRoutes);

// // Error handling middleware
// app.use(errorHandler);

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// // MongoDB connection with advanced options
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   maxPoolSize: 10,
//   serverSelectionTimeoutMS: 5000,
//   socketTimeoutMS: 45000,
//   bufferMaxEntries: 0,
//   bufferCommands: false,
// })
// .then(async () => {
//   console.log('✅ MongoDB connected successfully');
  
//   // Seed database in development
//   if (process.env.NODE_ENV === 'development') {
//     await seedDatabase();
//   }
// })
// .catch((error) => {
//   console.error('❌ MongoDB connection error:', error);
//   process.exit(1);
// });

// // MongoDB event handlers
// mongoose.connection.on('error', (error) => {
//   console.error('MongoDB error:', error);
// });

// mongoose.connection.on('disconnected', () => {
//   console.log('MongoDB disconnected');
// });

// // Initialize Socket.io
// initializeSocket(io);

// // Start cron jobs
// startCronJobs();

// // Graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('SIGTERM received, shutting down gracefully');
//   server.close(() => {
//     mongoose.connection.close();
//     process.exit(0);
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
// });

// // controllers/advancedAnalyticsController.js
// const Order = require('../models/Order');
// const Product = require('../models/Product');
// const User = require('../models/User');
// const Analytics = require('../models/Analytics');
// const { generateMLPredictions } = require('../utils/mlAnalytics');
// const { calculateBusinessMetrics } = require('../utils/businessMetrics');

// // Advanced Dashboard Analytics
// exports.getAdvancedDashboard = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const { period = '30d', timezone = 'Asia/Kolkata' } = req.query;
    
//     const dateRange = getDateRange(period);
    
//     // Parallel execution of analytics queries
//     const [
//       revenueMetrics,
//       orderMetrics,
//       customerMetrics,
//       productMetrics,
//       conversionMetrics,
//       trendAnalysis,
//       predictiveMetrics
//     ] = await Promise.all([
//       calculateRevenueMetrics(sellerId, dateRange),
//       calculateOrderMetrics(sellerId, dateRange),
//       calculateCustomerMetrics(sellerId, dateRange),
//       calculateProductMetrics(sellerId, dateRange),
//       calculateConversionMetrics(sellerId, dateRange),
//       calculateTrendAnalysis(sellerId, dateRange),
//       generateMLPredictions(sellerId, dateRange)
//     ]);

//     res.json({
//       summary: {
//         revenue: revenueMetrics,
//         orders: orderMetrics,
//         customers: customerMetrics,
//         products: productMetrics,
//         conversion: conversionMetrics
//       },
//       trends: trendAnalysis,
//       predictions: predictiveMetrics,
//       generatedAt: new Date(),
//       period,
//       timezone
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Revenue Analytics with Advanced Metrics
// const calculateRevenueMetrics = async (sellerId, dateRange) => {
//   const pipeline = [
//     { $unwind: '$items' },
//     { $match: {
//       'items.seller': sellerId,
//       createdAt: { $gte: dateRange.start, $lte: dateRange.end }
//     }},
//     {
//       $group: {
//         _id: null,
//         totalRevenue: { $sum: '$items.price' },
//         totalOrders: { $sum: 1 },
//         avgOrderValue: { $avg: '$items.price' },
//         maxOrderValue: { $max: '$items.price' },
//         minOrderValue: { $min: '$items.price' },
//         totalTax: { $sum: '$taxAmount' },
//         totalShipping: { $sum: '$shippingAmount' },
//         totalDiscount: { $sum: '$discountAmount' }
//       }
//     }
//   ];

//   const [current, previous] = await Promise.all([
//     Order.aggregate(pipeline),
//     Order.aggregate([
//       ...pipeline.slice(0, 2),
//       { $match: {
//         'items.seller': sellerId,
//         createdAt: {
//           $gte: new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime())),
//           $lt: dateRange.start
//         }
//       }},
//       ...pipeline.slice(3)
//     ])
//   ]);

//   const currentData = current[0] || {};
//   const previousData = previous[0] || {};

//   return {
//     current: {
//       total: currentData.totalRevenue || 0,
//       orders: currentData.totalOrders || 0,
//       avgOrderValue: currentData.avgOrderValue || 0,
//       maxOrder: currentData.maxOrderValue || 0,
//       minOrder: currentData.minOrderValue || 0,
//       tax: currentData.totalTax || 0,
//       shipping: currentData.totalShipping || 0,
//       discount: currentData.totalDiscount || 0
//     },
//     growth: {
//       revenue: calculateGrowthRate(currentData.totalRevenue, previousData.totalRevenue),
//       orders: calculateGrowthRate(currentData.totalOrders, previousData.totalOrders),
//       avgOrderValue: calculateGrowthRate(currentData.avgOrderValue, previousData.avgOrderValue)
//     },
//     breakdown: await getRevenueBreakdown(sellerId, dateRange)
//   };
// };

// // Customer Analytics with Segmentation
// const calculateCustomerMetrics = async (sellerId, dateRange) => {
//   const customerAnalysis = await Order.aggregate([
//     { $unwind: '$items' },
//     { $match: {
//       'items.seller': sellerId,
//       createdAt: { $gte: dateRange.start, $lte: dateRange.end }
//     }},
//     {
//       $group: {
//         _id: '$customer',
//         totalSpent: { $sum: '$items.price' },
//         orderCount: { $sum: 1 },
//         firstOrder: { $min: '$createdAt' },
//         lastOrder: { $max: '$createdAt' },
//         avgOrderValue: { $avg: '$items.price' }
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalCustomers: { $sum: 1 },
//         newCustomers: {
//           $sum: {
//             $cond: [
//               { $gte: ['$firstOrder', dateRange.start] },
//               1,
//               0
//             ]
//           }
//         },
//         returningCustomers: {
//           $sum: {
//             $cond: [
//               { $gt: ['$orderCount', 1] },
//               1,
//               0
//             ]
//           }
//         },
//         avgCustomerValue: { $avg: '$totalSpent' },
//         avgOrdersPerCustomer: { $avg: '$orderCount' }
//       }
//     }
//   ]);

//   const customerData = customerAnalysis[0] || {};

//   // Customer Lifetime Value (CLV) Analysis
//   const clvAnalysis = await calculateCLV(sellerId, dateRange);
  
//   // Customer Segmentation using RFM Analysis
//   const segmentation = await performRFMAnalysis(sellerId, dateRange);

//   return {
//     overview: {
//       total: customerData.totalCustomers || 0,
//       new: customerData.newCustomers || 0,
//       returning: customerData.returningCustomers || 0,
//       avgValue: customerData.avgCustomerValue || 0,
//       avgOrders: customerData.avgOrdersPerCustomer || 0
//     },
//     clv: clvAnalysis,
//     segmentation,
//     retention: await calculateRetentionRate(sellerId, dateRange)
//   };
// };

// // Product Performance Analytics
// const calculateProductMetrics = async (sellerId, dateRange) => {
//   const productPerformance = await Order.aggregate([
//     { $unwind: '$items' },
//     { $match: {
//       'items.seller': sellerId,
//       createdAt: { $gte: dateRange.start, $lte: dateRange.end }
//     }},
//     {
//       $group: {
//         _id: '$items.product',
//         totalSales: { $sum: '$items.quantity' },
//         totalRevenue: { $sum: '$items.price' },
//         orderCount: { $sum: 1 },
//         avgPrice: { $avg: '$items.price' }
//       }
//     },
//     {
//       $lookup: {
//         from: 'products',
//         localField: '_id',
//         foreignField: '_id',
//         as: 'productInfo'
//       }
//     },
//     { $unwind: '$productInfo' },
//     {
//       $project: {
//         title: '$productInfo.title',
//         category: '$productInfo.category',
//         currentStock: '$productInfo.stock',
//         totalSales: 1,
//         totalRevenue: 1,
//         orderCount: 1,
//         avgPrice: 1,
//         stockTurnover: {
//           $divide: ['$totalSales', { $add: ['$productInfo.stock', '$totalSales'] }]
//         }
//       }
//     },
//     { $sort: { totalRevenue: -1 } }
//   ]);

//   // Category performance
//   const categoryPerformance = await Order.aggregate([
//     { $unwind: '$items' },
//     { $match: {
//       'items.seller': sellerId,
//       createdAt: { $gte: dateRange.start, $lte: dateRange.end }
//     }},
//     {
//       $lookup: {
//         from: 'products',
//         localField: 'items.product',
//         foreignField: '_id',
//         as: 'product'
//       }
//     },
//     { $unwind: '$product' },
//     {
//       $lookup: {
//         from: 'categories',
//         localField: 'product.category',
//         foreignField: '_id',
//         as: 'category'
//       }
//     },
//     { $unwind: '$category' },
//     {
//       $group: {
//         _id: '$category._id',
//         categoryName: { $first: '$category.name' },
//         totalRevenue: { $sum: '$items.price' },
//         totalSales: { $sum: '$items.quantity' },
//         productCount: { $addToSet: '$items.product' }
//       }
//     },
//     {
//       $project: {
//         categoryName: 1,
//         totalRevenue: 1,
//         totalSales: 1,
//         productCount: { $size: '$productCount' }
//       }
//     },
//     { $sort: { totalRevenue: -1 } }
//   ]);

//   return {
//     topProducts: productPerformance.slice(0, 10),
//     categoryPerformance,
//     inventory: await calculateInventoryMetrics(sellerId),
//     lowStock: await getLowStockProducts(sellerId),
//     seasonalTrends: await calculateSeasonalTrends(sellerId, dateRange)
//   };
// };

// // Advanced Conversion Analytics
// const calculateConversionMetrics = async (sellerId, dateRange) => {
//   // This would integrate with product view tracking
//   const conversionData = await Analytics.aggregate([
//     {
//       $match: {
//         seller: sellerId,
//         date: { $gte: dateRange.start, $lte: dateRange.end }
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         totalViews: { $sum: '$metrics.views' },
//         totalConversions: { $sum: '$metrics.conversions' },
//         totalRevenue: { $sum: '$metrics.revenue' }
//       }
//     }
//   ]);

//   const data = conversionData[0] || {};
//   const conversionRate = data.totalViews ? (data.totalConversions / data.totalViews) * 100 : 0;

//   return {
//     views: data.totalViews || 0,
//     conversions: data.totalConversions || 0,
//     conversionRate,
//     revenuePerVisitor: data.totalViews ? data.totalRevenue / data.totalViews : 0,
//     funnel: await calculateSalesFunnel(sellerId, dateRange)
//   };
// };

// // Machine Learning Predictions
// const generateMLPredictions = async (sellerId, dateRange) => {
//   try {
//     // Demand forecasting using historical data
//     const historicalData = await getHistoricalSalesData(sellerId, 90); // 90 days
    
//     const predictions = {
//       salesForecast: await predictSalesTrend(historicalData),
//       demandForecast: await predictDemandByProduct(sellerId, historicalData),
//       reorderAlerts: await generateReorderAlerts(sellerId),
//       priceOptimization: await suggestPriceOptimization(sellerId),
//       seasonalPatterns: await identifySeasonalPatterns(historicalData)
//     };

//     return predictions;
//   } catch (error) {
//     console.error('ML Predictions error:', error);
//     return {
//       salesForecast: [],
//       demandForecast: [],
//       reorderAlerts: [],
//       priceOptimization: [],
//       seasonalPatterns: {}
//     };
//   }
// };

// // Cohort Analysis
// exports.getCohortAnalysis = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const { months = 12 } = req.query;

//     const cohortData = await Order.aggregate([
//       { $unwind: '$items' },
//       { $match: { 'items.seller': sellerId } },
//       {
//         $group: {
//           _id: '$customer',
//           firstOrderDate: { $min: '$createdAt' },
//           orders: {
//             $push: {
//               date: '$createdAt',
//               revenue: '$items.price'
//             }
//           }
//         }
//       },
//       {
//         $addFields: {
//           cohortMonth: {
//             $dateToString: {
//               format: '%Y-%m',
//               date: '$firstOrderDate'
//             }
//           }
//         }
//       },
//       {
//         $unwind: '$orders'
//       },
//       {
//         $addFields: {
//           orderMonth: {
//             $dateToString: {
//               format: '%Y-%m',
//               date: '$orders.date'
//             }
//           },
//           monthsAfterFirst: {
//             $divide: [
//               { $subtract: ['$orders.date', '$firstOrderDate'] },
//               1000 * 60 * 60 * 24 * 30
//             ]
//           }
//         }
//       },
//       {
//         $group: {
//           _id: {
//             cohort: '$cohortMonth',
//             month: { $floor: '$monthsAfterFirst' }
//           },
//           customers: { $addToSet: '$_id' },
//           revenue: { $sum: '$orders.revenue' }
//         }
//       },
//       {
//         $group: {
//           _id: '$_id.cohort',
//           data: {
//             $push: {
//               month: '$_id.month',
//               customers: { $size: '$customers' },
//               revenue: '$revenue'
//             }
//           }
//         }
//       },
//       { $sort: { '_id': -1 } },
//       { $limit: parseInt(months) }
//     ]);

//     res.json({
//       cohorts: cohortData,
//       generatedAt: new Date()
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Real-time Analytics
// exports.getRealTimeAnalytics = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

//     const realTimeData = await Order.aggregate([
//       { $unwind: '$items' },
//       { $match: {
//         'items.seller': sellerId,
//         createdAt: { $gte: last24Hours }
//       }},
//       {
//         $group: {
//           _id: {
//             hour: { $hour: '$createdAt' }
//           },
//           sales: { $sum: '$items.price' },
//           orders: { $sum: 1 },
//           customers: { $addToSet: '$customer' }
//         }
//       },
//       {
//         $project: {
//           hour: '$_id.hour',
//           sales: 1,
//           orders: 1,
//           customers: { $size: '$customers' }
//         }
//       },
//       { $sort: { hour: 1 } }
//     ]);

//     // Current active sessions (would integrate with tracking)
//     const activeSessions = await getActiveSessionCount(sellerId);
    
//     // Recent orders
//     const recentOrders = await Order.find({
//       'items.seller': sellerId,
//       createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
//     })
//     .populate('customer', 'name')
//     .populate('items.product', 'title')
//     .sort({ createdAt: -1 })
//     .limit(10);

//     res.json({
//       hourlyData: realTimeData,
//       activeSessions,
//       recentOrders,
//       lastUpdated: new Date()
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Helper Functions
// const getDateRange = (period) => {
//   const end = new Date();
//   const start = new Date();

//   switch (period) {
//     case '7d':
//       start.setDate(end.getDate() - 7);
//       break;
//     case '30d':
//       start.setDate(end.getDate() - 30);
//       break;
//     case '90d':
//       start.setDate(end.getDate() - 90);
//       break;
//     case '1y':
//       start.setFullYear(end.getFullYear() - 1);
//       break;
//     default:
//       start.setDate(end.getDate() - 30);
//   }

//   return { start, end };
// };

// const calculateGrowthRate = (current, previous) => {
//   if (!previous || previous === 0) return current > 0 ? 100 : 0;
//   return ((current - previous) / previous) * 100;
// };

// // utils/mlAnalytics.js - Machine Learning Analytics
// const tf = require('@tensorflow/tfjs-node');

// const predictSalesTrend = async (historicalData) => {
//   try {
//     // Simple linear regression for sales prediction
//     if (historicalData.length < 7) {
//       return { prediction: 'Insufficient data', confidence: 0 };
//     }

//     const values = historicalData.map(d => d.sales);
//     const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
//     // Calculate trend using linear regression
//     const n = values.length;
//     const sumX = values.reduce((sum, _, i) => sum + i, 0);
//     const sumY = values.reduce((sum, val) => sum + val, 0);
//     const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
//     const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);
    
//     const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
//     const intercept = (sumY - slope * sumX) / n;
    
//     // Predict next 7 days
//     const predictions = [];
//     for (let i = n; i < n + 7; i++) {
//       predictions.push({
//         day: i + 1,
//         predictedSales: Math.max(0, slope * i + intercept),
//         confidence: Math.min(95, Math.max(60, 85 - (i - n) * 5))
//       });
//     }

//     return {
//       trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
//       predictions,
//       accuracy: calculateAccuracy(values, slope, intercept)
//     };
//   } catch (error) {
//     console.error('Sales prediction error:', error);
//     return { prediction: 'Error in calculation', confidence: 0 };
//   }
// };

// const predictDemandByProduct = async (sellerId, historicalData) => {
//   try {
//     const productDemand = await Order.aggregate([
//       { $unwind: '$items' },
//       { $match: { 'items.seller': sellerId } },
//       {
//         $group: {
//           _id: {
//             product: '$items.product',
//             date: {
//               $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
//             }
//           },
//           dailySales: { $sum: '$items.quantity' }
//         }
//       },
//       {
//         $group: {
//           _id: '$_id.product',
//           salesHistory: {
//             $push: {
//               date: '$_id.date',
//               sales: '$dailySales'
//             }
//           }
//         }
//       },
//       {
//         $lookup: {
//           from: 'products',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'product'
//         }
//       },
//       { $unwind: '$product' }
//     ]);

//     const predictions = productDemand.map(item => {
//       const sales = item.salesHistory.map(h => h.sales);
//       const avgSales = sales.reduce((a, b) => a + b, 0) / sales.length;
//       const trend = calculateTrend(sales);
      
//       return {
//         productId: item._id,
//         productName: item.product.title,
//         currentStock: item.product.stock,
//         avgDailySales: avgSales,
//         predictedDemand: avgSales * 7, // Weekly prediction
//         reorderPoint: avgSales * 14, // 2 weeks safety stock
//         trend,
//         stockoutRisk: item.product.stock < (avgSales * 7) ? 'high' : 'low'
//       };
//     });

//     return predictions;
//   } catch (error) {
//     console.error('Demand prediction error:', error);
//     return [];
//   }
// };

// const generateReorderAlerts = async (sellerId) => {
//   const products = await Product.find({ seller: sellerId, isActive: true });
//   const alerts = [];

//   for (const product of products) {
//     const salesData = await Order.aggregate([
//       { $unwind: '$items' },
//       { $match: {
//         'items.product': product._id,
//         createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
//       }},
//       {
//         $group: {
//           _id: null,
//           totalSold: { $sum: '$items.quantity' },
//           avgDailySales: { $avg: '$items.quantity' }
//         }
//       }
//     ]);

//     if (salesData.length > 0) {
//       const { totalSold, avgDailySales } = salesData[0];
//       const daysOfStock = product.stock / (avgDailySales || 1);
      
//       if (daysOfStock < 7) {
//         alerts.push({
//           productId: product._id,
//           productName: product.title,
//           currentStock: product.stock,
//           daysRemaining: Math.floor(daysOfStock),
//           suggestedReorderQuantity: Math.ceil(avgDailySales * 30),
//           priority: daysOfStock < 3 ? 'critical' : 'warning'
//         });
//       }
//     }
//   }

//   return alerts;
// };

// // utils/businessMetrics.js - Business Intelligence
// const calculateCLV = async (sellerId, dateRange) => {
//   const clvData = await Order.aggregate([
//     { $unwind: '$items' },
//     { $match: { 'items.seller': sellerId } },
//     {
//       $group: {
//         _id: '$customer',
//         totalRevenue: { $sum: '$items.price' },
//         orderCount: { $sum: 1 },
//         firstOrder: { $min: '$createdAt' },
//         lastOrder: { $max: '$createdAt' },
//         avgOrderValue: { $avg: '$items.price' }
//       }
//     },
//     {
//       $addFields: {
//         customerLifespan: {
//           $divide: [
//             { $subtract: ['$lastOrder', '$firstOrder'] },
//             1000 * 60 * 60 * 24 // Convert to days
//           ]
//         }
//       }
//     },
//     {
//       $addFields: {
//         purchaseFrequency: {
//           $cond: [
//             { $gt: ['$customerLifespan', 0] },
//             { $divide: ['$orderCount', { $add: ['$customerLifespan', 1] }] },
//             '$orderCount'
//           ]
//         }
//       }
//     },
//     {
//       $addFields: {
//         predictedCLV: {
//           $multiply: [
//             '$avgOrderValue',
//             '$purchaseFrequency',
//             365 // Annualized
//           ]
//         }
//       }
//     },
//     {
//       $group: {
//         _id: null,
//         avgCLV: { $avg: '$predictedCLV' },
//         totalCustomers: { $sum: 1 },
//         highValueCustomers: {
//           $sum: {
//             $cond: [{ $gt: ['$predictedCLV', 10000] }, 1, 0]
//           }
//         }
//       }
//     }
//   ]);

//   return clvData[0] || { avgCLV: 0, totalCustomers: 0, highValueCustomers: 0 };
// };

// const performRFMAnalysis = async (sellerId, dateRange) => {
//   const rfmData = await Order.aggregate([
//     { $unwind: '$items' },
//     { $match: { 'items.seller': sellerId } },
//     {
//       $group: {
//         _id: '$customer',
//         recency: { $max: '$createdAt' },
//         frequency: { $sum: 1 },
//         monetary: { $sum: '$items.price' }
//       }
//     },
//     {
//       $addFields: {
//         recencyDays: {
//           $divide: [
//             { $subtract: [new Date(), '$recency'] },
//             1000 * 60 * 60 * 24
//           ]
//         }
//       }
//     }
//   ]);

//   // Calculate quintiles for RFM scoring
//   const recencyValues = rfmData.map(d => d.recencyDays).sort((a, b) => a - b);
//   const frequencyValues = rfmData.map(d => d.frequency).sort((a, b) => b - a);
//   const monetaryValues = rfmData.map(d => d.monetary).sort((a, b) => b - a);

//   const getQuintile = (value, values) => {
//         const quintileSize = Math.floor(values.length / 5);
    


































































//     // server.js - Main server file
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const compression = require('compression');
// const morgan = require('morgan');
// require('dotenv').config();

// // Import middleware
// const errorHandler = require('./middleware/errorHandler');
// const { auth } = require('./middleware/auth');
// const apiMetrics = require('./middleware/apiMetrics');

// // Import routes
// const authRoutes = require('./routes/auth');
// const sellerRoutes = require('./routes/seller');
// const adminRoutes = require('./routes/admin');
// const uploadRoutes = require('./routes/upload');
// const analyticsRoutes = require('./routes/analytics');
// const webhookRoutes = require('./routes/webhooks');

// // Import utilities
// const { initializeSocket } = require('./utils/socket');
// const { startCronJobs } = require('./cron/jobs');
// const { seedDatabase } = require('./utils/seedData');

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true
//   }
// });

// // Security middleware
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
// }));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: {
//     error: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use(limiter);
// app.use(compression());
// app.use(morgan('combined'));
// app.use(cors({
//   origin: process.env.CLIENT_URL || "http://localhost:3000",
//   credentials: true
// }));

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Static files
// app.use('/uploads', express.static('uploads'));

// // API metrics middleware
// app.use('/api', apiMetrics);

// // Socket.io middleware to attach io instance to requests
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     environment: process.env.NODE_ENV,
//     version: process.env.npm_package_version || '1.0.0'
//   });
// });

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/seller', sellerRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/upload', uploadRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/webhooks', webhookRoutes);

// // Error handling middleware
// app.use(errorHandler);

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

// // MongoDB connection with advanced options
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   maxPoolSize: 10,
//   serverSelectionTimeoutMS: 5000,
//   socketTimeoutMS: 45000,
//   bufferMaxEntries: 0,
//   bufferCommands: false,
// })
// .then(async () => {
//   console.log('✅ MongoDB connected successfully');
  
//   // Seed database in development
//   if (process.env.NODE_ENV === 'development') {
//     await seedDatabase();
//   }
// })
// .catch((error) => {
//   console.error('❌ MongoDB connection error:', error);
//   process.exit(1);
// });

// // MongoDB event handlers
// mongoose.connection.on('error', (error) => {
//   console.error('MongoDB error:', error);
// });

// mongoose.connection.on('disconnected', () => {
//   console.log('MongoDB disconnected');
// });

// // Initialize Socket.io
// initializeSocket(io);

// // Start cron jobs
// startCronJobs();

// // Graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('SIGTERM received, shutting down gracefully');
//   server.close(() => {
//     mongoose.connection.close();
//     process.exit(0);
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
// });































































































// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { generateOTP, sendOTP } = require('../utils/Otpservice');
const { sendWelcomeEmail } = require('../utils/emailService');

/**
 * Generate JWT Token
 * @param {String} userId - User ID
 * @returns {String} JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * User Registration
 * Creates new user account with referral code generation
 */
exports.register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, referredBy } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      referredBy
    });

    // Generate referral code
    user.generateReferralCode();

    // Handle referral bonus
    if (referredBy) {
      const referrer = await User.findOne({ referralCode: referredBy });
      if (referrer) {
        // Give bonus to referrer
        referrer.wallet.balance += 50;
        referrer.wallet.transactions.push({
          amount: 50,
          type: 'credit',
          note: `Referral bonus for ${name}`,
          referenceId: `REF_${Date.now()}`
        });
        referrer.referralCount += 1;
        referrer.loyaltyPoints += 100;
        await referrer.save();

        // Give bonus to new user
        user.wallet.balance = 25;
        user.wallet.transactions.push({
          amount: 25,
          type: 'credit',
          note: 'Welcome bonus',
          referenceId: `WELCOME_${Date.now()}`
        });
        user.loyaltyPoints = 50;
      }
    } else {
      // Welcome bonus for new users
      user.wallet.balance = 25;
      user.wallet.transactions.push({
        amount: 25,
        type: 'credit',
        note: 'Welcome bonus',
        referenceId: `WELCOME_${Date.now()}`
      });
      user.loyaltyPoints = 50;
    }

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * User Login
 * Authenticates user and returns JWT token
 */
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email }, { phone: email }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Send OTP for phone verification
 */
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    // Generate 6-digit OTP
    const otp = generateOTP();
    
    // Store OTP temporarily (in production, use Redis)
    // For now, we'll store in user document
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store OTP with expiry (5 minutes)
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    };
    await user.save();

    // Send OTP via SMS
    await sendOTP(phone, otp);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

/**
 * Verify OTP and complete phone verification
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists and is valid
    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if OTP is expired
    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Mark phone as verified
    user.phoneVerified = true;
    user.otp = undefined; // Remove OTP
    await user.save();

    res.json({
      success: true,
      message: 'Phone verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -otp');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};
//add new auth later



















