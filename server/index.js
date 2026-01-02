require('dotenv').config();
const app = require('./app');
const connect = require('./config/database');
const http = require('http');
const { Server } = require('socket.io');
const SocketService = require('./services/socketService');
const PORT = process.env.PORT || 5000;
const { startAllJobs } = require('./jobs/laundryJobs');

// Create HTTP server
const server = http.createServer(app);
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
    // const { initializeCronJobs } = require('./jobs/dailySubscriptionOrders');
    // initializeCronJobs();
    
    // Initialize subscription expiry cron job
    const { startSubscriptionExpiryJob } = require('./jobs/subscriptionExpiry');
    startSubscriptionExpiryJob();
    
    server.listen(PORT,'0.0.0.0',  () => {
      console.log(`Server running at http://'0.0.0.0':${PORT}`);
      console.log('Socket.IO initialized for real-time tracking');
    });
    console.log('🚀 Starting automated cron jobs...');
    startAllJobs();
  } catch (err) {
    console.error("Failed to connect DB", err);
    process.exit()
  }
};

startServer();

module.exports = { app, server, io };
