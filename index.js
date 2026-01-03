require('dotenv').config();
// // server/server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const path = require('path');
// const connect = require('./config/database');
// // Routes
// const authRoutes = require('./routes/auth');
// const productRoutes = require('./routes/productroute');
// const orderRoutes = require('./routes/orderRoute');
// const {  adminRouter } = require('./routes/reviewRoute');
// const wishlistRoutes = require('./routes/wishlistRoute');
// const cookieParser = require('cookie-parser');

//   const { reviewRouter} = require('./routes/reviewRoute');
// const morgan = require('morgan');
// const app = express();
// app.use(morgan('dev'));
// // Security middleware
// app.use(cookieParser());
// app.use(helmet());
// const allowedOrigins = [
//   'http://localhost:5173',
//   'https://tastyaana.vercel.app',
//   process.env.CLIENT_URL,
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no origin (like mobile apps, curl, Postman)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     } else {
//       return callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization'],
// }));


// // Rate limiting
// // const limiter = rateLimit({
// //   windowMs: 15 * 60 * 1000, // 15 minutes
// //   max: 100 // limit each IP to 100 requests per windowMs
// // });
// // app.use('/api/', limiter);

// // Body parser
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Static files
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// // Routes
// console.log("coming ");
// app.use('/api/auth', authRoutes);
// app.use('/api/cart', require("./routes/cartRoute"));
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/admin', adminRouter);
// app.use('/api/reviews', reviewRouter);
// app.use('/api/wishlist', wishlistRoutes);

// // Error handling middleware
// // app.use((err, req, res, next) => {
// //   console.error(err.stack);
// //   res.status(500).json({ message: 'Something went wrong!' });
// // });

// // 404 handler
// // app.use('*', (req, res) => {
//   //   res.status(404).json({ message: 'Route not found' });
//   // });
  
// // console.log('Routes initialized');
// const startServer = async () => {
//   try {
//     // Connect to the database first
//     await connect();
    
//     // Initialize scheduler if needed
//     // initScheduler();
    
//     // Then start the server
//     app.listen(5000, () => {
//       console.log(`Server running in development  mode on port ${5000}`);
//     });
//   } catch (error) {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   }
// };
// startServer();


// index.js


const app = require('./app');
const connect = require('./config/database');
const http = require('http');
const { Server } = require('socket.io');
const SocketService = require('./services/socketService');
const PORT = process.env.PORT || 5000;
const { startAllJobs } = require('./jobs/laundryJobs');

// Create HTTP server
const server = http.createServer(app);
console.log("server js")
// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',    
        'http://localhost:5174',
      'https://tastyaana.vercel.app',
      'http://192.168.1.2:5173',
      'https://www.tastyaana.com',
        'https://192.168.1.2:5173',
        'https://localhost:5173',
      process.env.CLIENT_URL
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize socket service
const socketService = new SocketService(io);

// Make io and socketService available globally
app.set('io', io);
app.set('socketService', socketService);
global.io = io;

const startServer = async () => {
  try {
    await connect();
    
    // Initialize cron jobs after database connection
    const { initializeCronJobs } = require('./jobs/dailySubscriptionOrders');
    initializeCronJobs();
    
    // Initialize subscription expiry cron job
    const { startSubscriptionExpiryJob } = require('./jobs/subscriptionExpiry');
    startSubscriptionExpiryJob();
    
    // server.listen(PORT,'0.0.0.0',  () => {
    //   console.log(`Server running at http://'0.0.0.0':${PORT}`);
    //   console.log('Socket.IO initialized for real-time tracking');
    // });
    console.log('🚀 Starting automated cron jobs...');
    startAllJobs();
  } catch (err) {
    console.error("Failed to connect DB", err);
    process.exit()
  }
};

startServer();

module.exports = { app, server, io };
