// routes/superadmin.js
const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const superAdminController = require('../controllers/superAdminController');
const { rateLimitStrict } = require('../middleware/rateLimiting');

// Apply strict authentication and super admin role check
router.use(auth);
router.use(checkRole(['superadmin']));
router.use(rateLimitStrict); // Extra strict rate limiting for super admin

// Business Dashboard
router.get('/dashboard', superAdminController.getBusinessDashboard);

// User & Role Management
router.get('/users', superAdminController.getAllUsers);
router.post('/staff', superAdminController.createStaffUser);
router.patch('/users/:userId/role', superAdminController.updateUserRole);
router.delete('/users/:userId', superAdminController.deleteUser);

// System Settings
router.get('/settings', superAdminController.getSystemSettings);
router.patch('/settings', superAdminController.updateSystemSettings);

// Feature Flags
router.get('/feature-flags', superAdminController.getFeatureFlags);
router.post('/toggle-feature', superAdminController.toggleFeature);

// routes/superadmin.js
// const express = require('express');
// const router = express.Router();
// const { auth, checkRole } = require('../middleware/auth');
// const superAdminController = require('../controllers/superAdminController');
// const { rateLimitStrict } = require('../middleware/rateLimiting');

// Apply strict authentication and super admin role check
router.use(auth);
router.use(checkRole(['superadmin']));
router.use(rateLimitStrict); // Extra strict rate limiting for super admin

// Business Dashboard
router.get('/dashboard', superAdminController.getBusinessDashboard);

// User & Role Management
router.get('/users', superAdminController.getAllUsers);
router.post('/staff', superAdminController.createStaffUser);
router.patch('/users/:userId/role', superAdminController.updateUserRole);
router.delete('/users/:userId', superAdminController.deleteUser);

// System Settings
router.get('/settings', superAdminController.getSystemSettings);
router.patch('/settings', superAdminController.updateSystemSettings);

// Feature Flags
router.get('/feature-flags', superAdminController.getFeatureFlags);
router.post('/toggle-feature', superAdminController.toggleFeature);

// System Control
router.post('/maintenance', superAdminController.setMaintenanceMode);

// Audit Logs
router.get('/logs', superAdminController.getAuditLogs);
router.get('/logs/:userId', superAdminController.getUserAuditLogs);

// User Sessions
router.get('/sessions', superAdminController.getActiveSessions);
router.delete('/sessions/:sessionId', superAdminController.terminateSession);

// Backup Management
router.post('/backup', superAdminController.createBackup);
router.get('/backups', superAdminController.getBackups);

// A/B Testing
router.get('/experiments', superAdminController.getExperiments);
router.post('/experiments', superAdminController.createExperiment);
router.delete('/experiments/:experimentId', superAdminController.deleteExperiment);

// Broadcast Management
router.post('/broadcast', superAdminController.createBroadcast);

module.exports = router;







// middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');

const rateLimitStrict = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs for super admin
  message: {
    error: 'Too many requests from this IP for super admin actions'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const rateLimitModerate = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP'
  }
});

module.exports = { rateLimitStrict, rateLimitModerate };

// middleware/superAdminAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');

const superAdminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    if (user.role !== 'superadmin') {
      await logAuditEvent(user._id, 'UNAUTHORIZED_ACCESS', 'superadmin_panel', null, {
        userRole: user.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });
      return res.status(403).json({ message: 'Access denied. Super admin role required.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }

    req.user = user;
    
    // Log access
    await logAuditEvent(user._id, 'ACCESS', 'superadmin_panel', null, {
      endpoint: req.originalUrl,
      method: req.method,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = superAdminAuth;

// utils/systemHealth.js
const mongoose = require('mongoose');
const os = require('os');

const getSystemHealthMetrics = async () => {
  try {
    const health = {
      timestamp: new Date(),
      status: 'healthy',
      services: {},
      performance: {},
      errors: []
    };

    // Database health
    try {
      const dbState = mongoose.connection.readyState;
      const dbStats = await mongoose.connection.db.stats();
      
      health.services.database = {
        status: dbState === 1 ? 'connected' : 'disconnected',
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes
      };
    } catch (error) {
      health.services.database = { status: 'error', error: error.message };
      health.errors.push('Database connection issue');
    }

    // System performance
    health.performance = {
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        systemTotal: os.totalmem(),
        systemFree: os.freemem()
      },
      cpu: {
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length
      }
    };

    // Check if system is under stress
    const memoryUsagePercent = (health.performance.memory.used / health.performance.memory.total) * 100;
    const systemMemoryUsagePercent = ((health.performance.memory.systemTotal - health.performance.memory.systemFree) / health.performance.memory.systemTotal) * 100;
    
    if (memoryUsagePercent > 90 || systemMemoryUsagePercent > 90) {
      health.status = 'warning';
      health.errors.push('High memory usage detected');
    }

    if (health.performance.cpu.loadAverage[0] > health.performance.cpu.cpuCount * 0.8) {
      health.status = 'warning';
      health.errors.push('High CPU load detected');
    }

    return health;
  } catch (error) {
    return {
      timestamp: new Date(),
      status: 'error',
      error: error.message
    };
  }
};

const checkMaintenanceMode = async () => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const setting = await SystemSettings.findOne({ key: 'maintenance_mode' });
    
    if (setting && setting.value.enabled) {
      return {
        enabled: true,
        message: setting.value.message,
        allowedRoles: setting.value.allowedRoles,
        startTime: setting.value.startTime
      };
    }
    
    return { enabled: false };
  } catch (error) {
    return { enabled: false, error: error.message };
  }
};

module.exports = { getSystemHealthMetrics, checkMaintenanceMode };

// utils/featureFlag.js
const FeatureFlag = require('../models/FeatureFlag');

const isFeatureEnabled = async (featureName, user = null) => {
  try {
    const flag = await FeatureFlag.findOne({ name: featureName });
    
    if (!flag) return false;
    if (!flag.isEnabled) return false;

    // Check date range
    const now = new Date();
    if (flag.startDate && now < flag.startDate) return false;
    if (flag.endDate && now > flag.endDate) return false;

    // Check user targeting
    if (user) {
      // Check if user is specifically targeted
      if (flag.targetUsers.includes(user._id)) return true;
      
      // Check role targeting
      if (flag.targetRoles.length > 0 && !flag.targetRoles.includes(user.role)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      if (user) {
        // Use user ID for consistent rollout
        const hash = hashUserId(user._id.toString());
        const userPercentile = hash % 100;
        return userPercentile < flag.rolloutPercentage;
      } else {
        // Random rollout for anonymous users
        return Math.random() * 100 < flag.rolloutPercentage;
      }
    }

    return true;
  } catch (error) {
    console.error('Feature flag check failed:', error);
    return false; // Fail closed
  }
};

const hashUserId = (userId) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const getUserFeatures = async (user) => {
  try {
    const flags = await FeatureFlag.find({ isEnabled: true });
    const userFeatures = {};

    for (const flag of flags) {
      userFeatures[flag.name] = await isFeatureEnabled(flag.name, user);
    }

    return userFeatures;
  } catch (error) {
    console.error('Failed to get user features:', error);
    return {};
  }
};

module.exports = { isFeatureEnabled, getUserFeatures };

// cron/systemMaintenance.js
const cron = require('node-cron');
const { getSystemHealthMetrics } = require('../utils/systemHealth');
const { createBackup } = require('../utils/backupManager');
const SystemBackup = require('../models/SystemBackup');
const AuditLog = require('../models/AuditLog');

// System health check every hour
cron.schedule('0 * * * *', async () => {
  try {
    const health = await getSystemHealthMetrics();
    
    if (health.status === 'error' || health.errors.length > 0) {
      console.error('System health issues detected:', health.errors);
      // Send alert to super admins
      // Implementation depends on your notification system
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }
});

// Automatic backup every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const backup = new SystemBackup({
      name: `auto_backup_${new Date().toISOString().split('T')[0]}`,
      type: 'full',
      scheduledBy: null // System generated
    });

    await backup.save();
    await createBackup(backup._id);
    
    console.log('Automatic backup completed:', backup._id);
  } catch (error) {
    console.error('Automatic backup failed:', error);
  }
});

// Clean old audit logs (keep 1 year)
cron.schedule('0 3 * * 0', async () => { // Weekly on Sunday at 3 AM
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: oneYearAgo }
    });

    console.log(`Cleaned ${result.deletedCount} old audit log entries`);
  } catch (error) {
    console.error('Audit log cleanup failed:', error);
  }
});

console.log('System maintenance cron jobs initialized');

module.exports = {};