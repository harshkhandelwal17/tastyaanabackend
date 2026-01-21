// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression'); // Added compression
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connect = require('./config/database');



// Import all route files
const reviewRouter = require("./routes/reviewRout");
const auth = require("./routes/auth");
const cartRoute = require("./routes/cartRoute");
const categoryRoute = require("./routes/categoryRoute");
const customRequestsRoute = require("./routes/customRequestsRoute");
const GKKRoute = require("./routes/GKKRoute");
const wishlistRoute = require("./routes/wishlistRoute");
const menuchangeRoute = require("./routes/menuchangeRoute");
const orderRoute = require("./routes/orderRoute");
const productRoute = require("./routes/productroute");
const userRoutes = require("./routes/userRoutes");
const sellerRoutes = require("./routes/seller");
const dailyMealRoute = require("./routes/DailyMealRoute");
const upload = require("./routes/upload");
const subscriptionRoute = require("./routes/subscriptionRoute");
const meal = require("./routes/mealsPlan");
const homepageRoute = require("./routes/homepageRoutes");
const paymentRoute = require("./routes/paymentRoute");
// const mealsPlan = require("./routes/mealsPlan");
const groceryRoutes = require("./routes/grocery");
const deliveryTrackingRoutes = require("./routes/deliveryTracking");
const driverRoutes = require("./routes/driver");
const adminRoutes = require("./routes/adminRoutes");
const adminPanelRoutes = require("./routes/adminPanel");
const customizationRoutes = require('./routes/customization');
const sellerMealPlansRoutes = require('./routes/sellerMealPlans');
const categorySlotRoutes = require('./routes/categorySlotRoutes');
const dailyMealDeliveryRoutes = require('./routes/dailyMealDelivery');
const subscriptionV2Route = require("./routes/subscriptionV2");
const sellerSubscriptionV2Route = require("./routes/sellerSubscriptionV2");
const sellerTiffinRoutes = require("./routes/sellerTiffin");
const chargesRoutes = require("./routes/chargesRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const couponRoutes = require("./routes/couponRoutes");
const adminSubscriptionRoutes = require("./routes/adminSubscriptionRoutes");
const bhandaraRoutes = require("./routes/bhandaraRoutes");
const laundryRoutes = require("./routes/laundryRoutes");
const testRoute = require("./routes/testRoute");
// const medicineRoute = require('./routes/medicine');
const deviceRoutes = require('./routes/deviceRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const deliveryScheduleRoutes = require('./routes/deliveryScheduleRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const sellergadgetsRoutes = require('./routes/sellerGadgetsRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const supportRoutes = require('./routes/supportRoutes');
const groupOrderRoutes = require('./routes/groupOrderRoutes');
const app = express();
// Middleware
// Middleware
app.use(compression()); // Enable GZIP compression
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MANUAL BODY PARSER REMOVED (Standard middleware restored)
// Fixed client-side serialization instead.
app.use((req, res, next) => {
  if (req.body) return next();

  // Only attempt manual parse for JSON calls
  const contentType = req.headers['content-type'] || '';
  if (req.method !== 'GET' && contentType.includes('application/json')) {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      if (data && data.trim()) {
        try {
          req.body = JSON.parse(data);
          console.log('Manual Parse Success:', req.body);
        } catch (e) {
          console.error('Manual Parse Error:', e);
        }
      } else {
        req.body = {}; // Empty body
      }
      next();
    });
  } else {
    next();
  }
});
app.use(morgan('dev'));
app.use(cookieParser());
app.use(helmet());

// DEBUG & FIX MIDDLEWARE
app.use((req, res, next) => {
  // FLIGHT CHECK: Force JSON content type for settings update if missing
  // This fixes cases where client fetch defaults to text/plain or empty
  if (req.method === 'PUT' && req.url.includes('preferences')) {
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
      console.log('⚠️ Missing/Wrong Content-Type. Forcing application/json');
      req.headers['content-type'] = 'application/json';
    }
  }
  next();
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://tastyaana.vercel.app',
  "https://www.tastyaana.com",
  "www.tastyaana.com",
  'http://192.168.1.2:5173',
  'https://192.168.1.2:5173',
  'https://localhost:5173',
  "http://127.0.0.1:5500",
  'https://tastyaanafrontendapp.vercel.app',

  process.env.CLIENT_URL,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Accept', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve robots.txt for API server
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
`)
});

// Add CORS headers specifically for Googlebot 
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  if (userAgent.includes('Googlebot') || userAgent.includes('googlebot')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
  next();
});

// Routes
// app.use('/api/medicine', medicineRoute);

app.use('/api/device', deviceRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/delivery-schedule', deliveryScheduleRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/medicine', medicineRoutes);
app.use("/api/test", testRoute);
app.use("/api/users", userRoutes);
app.use("/api/gkk", GKKRoute);
app.use("/api/custom-requests", customRequestsRoute);
app.use("/api/cart", cartRoute);
app.use("/api/wishlist", wishlistRoute);
app.use("/api/auth", auth);
app.use("/api/category", categoryRoute);
app.use("/api/products", productRoute);
app.use("/api/meal-plan", meal);
app.use("/api/orders", orderRoute);
app.use("/api/menu-change", menuchangeRoute);
app.use("/api/reviews", reviewRouter);
app.use("/api/upload", upload);
app.use("/api/payments", paymentRoute);
app.use("/api/payment", require("./routes/payment"));
app.use("/api/dailymeals", dailyMealRoute);
app.use("/api/homepage", homepageRoute);
app.use("/api/seller/gadgets", sellergadgetsRoutes);
app.use("/api/seller", sellerRoutes);

app.use('/api/subscriptions', subscriptionRoute);
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/replace-able/items', require('./routes/replaceAbleItemsRoutes'))
app.use('/api/groceries', groceryRoutes);
app.use('/api/delivery-tracking', deliveryTrackingRoutes);
app.use('/api/driver-routes', require('./routes/driverRoute')); // Driver route management
app.use('/api/drivers', driverRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/admin-panel', adminPanelRoutes);
app.use('/api/test-realtime', require('./routes/testRealtime'));
app.use('/api/customizations', customizationRoutes); // Customization routes
app.use('/api/seller/meal-plans', sellerMealPlansRoutes); // Seller meal plans routes
app.use('/api/seller/analytics', require('./routes/sellerAnalytics')); // Seller analytics routes
app.use('/api/seller', require('./routes/sellerThaliRoutes')); // Seller thali overview routes
app.use('/api/seller/tiffin', sellerTiffinRoutes); // Seller tiffin management routes
app.use('/api/hisaab', require('./routes/hisaabRoutes')); // Hisaab management routes
app.use('/api/category-slots', categorySlotRoutes); // Category slot management routes
app.use('/api/daily-meal-delivery', dailyMealDeliveryRoutes); // Daily meal delivery tracking routes
app.use('/api/charges', chargesRoutes); // Charges and taxes management routes
app.use('/api/notifications', notificationRoutes); // Notification management routes
app.use('/api/coupons', couponRoutes); // Coupon management routes
app.use('/api/bhandaras', bhandaraRoutes); // Bhandara management routes
app.use('/api/support', supportRoutes); // Customer Support Ticket routes
app.use('/api/subcategories', require('./routes/subCategoryRoutes')); // SubCategory routes
app.use('/api/group-orders', groupOrderRoutes); // Tastyaana Party routes

// Subscription V2 routes/v2/seller/subscriptions
app.use('/api/v2/seller/subscriptions', sellerSubscriptionV2Route);
app.use('/api/v2/subscriptions', subscriptionV2Route);

// Admin subscription management routes
app.use('/api/admin/subscriptions', adminSubscriptionRoutes);

// Laundry service routes
app.use('/api/laundry', laundryRoutes);
// Initialize cron jobs
require('./corn/jobs');

module.exports = app;
