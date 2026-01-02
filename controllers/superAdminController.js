// controllers/superAdminController.js
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const SystemSettings = require('../models/SystemSetting');
const AuditLog = require('../models/Auditlog.js');
const UserSession = require('../models/UserSession');
const FeatureFlag = require('../models/FeatureFlag');
const ABTest = require('../models/ABtest');
const SystemBackup = require('../models/SystemBackup');
const Broadcast = require('../models/Broadcast');
const { logAuditEvent } = require('../utils/auditLogger');
const { createBackup } = require('../utils/BackupManager');
const { sendBroadcast } = require('../utils/BroadcastManager');

// Business Dashboard
exports.getBusinessDashboard = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const dateRange = getDateRange(period);

    const [
      platformMetrics,
      userGrowth,
      revenueMetrics,
      orderMetrics,
      sellerMetrics,
      systemHealth
    ] = await Promise.all([
      getPlatformMetrics(dateRange),
      getUserGrowthMetrics(dateRange),
      getRevenueMetrics(dateRange),
      getOrderMetrics(dateRange),
      getSellerMetrics(dateRange),
      getSystemHealthMetrics()
    ]);

    await logAuditEvent(req.user._id, 'VIEW', 'dashboard', null, {
      period,
      timestamp: new Date()
    });

    res.json({
      platform: platformMetrics,
      userGrowth,
      revenue: revenueMetrics,
      orders: orderMetrics,
      sellers: sellerMetrics,
      system: systemHealth,
      period,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User & Role Management
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      role, 
      status, 
      search, 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = {};
    
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sellerInfo.bankDetails');

    const total = await User.countDocuments(query);

    // Get user sessions and activity
    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        const sessions = await UserSession.countDocuments({
          userId: user._id,
          isActive: true
        });
        
        const lastActivity = await UserSession.findOne({
          userId: user._id
        }).sort({ lastActivity: -1 });

        return {
          ...user.toObject(),
          activeSessions: sessions,
          lastActivity: lastActivity?.lastActivity
        };
      })
    );

    await logAuditEvent(req.user._id, 'VIEW', 'users', null, { 
      query: req.query,
      resultCount: users.length 
    });

    res.json({
      users: usersWithActivity,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createStaffUser = async (req, res) => {
  try {
    const { name, email, role, permissions, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      role,
      permissions: permissions || [],
      isVerified: true,
      isActive: true,
      createdBy: req.user._id
    });

    await user.save();

    await logAuditEvent(req.user._id, 'CREATE', 'user', user._id, {
      userRole: role,
      permissions
    });

    res.status(201).json({
      message: 'Staff user created successfully',
      user: user.toObject()
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions, isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldData = {
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive
    };

    if (role !== undefined) user.role = role;
    if (permissions !== undefined) user.permissions = permissions;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    await logAuditEvent(req.user._id, 'UPDATE', 'user', userId, {
      oldData,
      newData: { role, permissions, isActive }
    });

    res.json({
      message: 'User updated successfully',
      user: user.toObject()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot delete super admin user' });
    }

    await User.findByIdAndDelete(userId);

    await logAuditEvent(req.user._id, 'DELETE', 'user', userId, {
      deletedUser: user.toObject(),
      reason
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// System Settings
exports.getSystemSettings = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = {};
    if (category) query.category = category;

    const settings = await SystemSettings.find(query)
      .populate('lastModifiedBy', 'name email')
      .sort({ category: 1, key: 1 });

    res.json({ settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Array of settings to update

    const updates = [];
    
    for (const setting of settings) {
      const { key, value, category, description, dataType } = setting;
      
      const updated = await SystemSettings.findOneAndUpdate(
        { key },
        {
          key,
          value,
          category,
          description,
          dataType,
          lastModifiedBy: req.user._id
        },
        { upsert: true, new: true }
      );
      
      updates.push(updated);
    }

    await logAuditEvent(req.user._id, 'UPDATE', 'system_settings', null, {
      updatedSettings: settings
    });

    res.json({
      message: 'Settings updated successfully',
      settings: updates
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Feature Flags
exports.getFeatureFlags = async (req, res) => {
  try {
    const flags = await FeatureFlag.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ flags });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleFeature = async (req, res) => {
  try {
    const { 
      name, 
      isEnabled, 
      rolloutPercentage, 
      targetRoles, 
      targetUsers,
      startDate,
      endDate 
    } = req.body;

    const flag = await FeatureFlag.findOneAndUpdate(
      { name },
      {
        name,
        isEnabled,
        rolloutPercentage: rolloutPercentage || 0,
        targetRoles: targetRoles || [],
        targetUsers: targetUsers || [],
        startDate,
        endDate,
        createdBy: req.user._id
      },
      { upsert: true, new: true }
    );

    await logAuditEvent(req.user._id, 'TOGGLE_FEATURE', 'feature_flag', flag._id, {
      featureName: name,
      isEnabled,
      rolloutPercentage
    });

    res.json({
      message: 'Feature flag updated successfully',
      flag
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Maintenance Mode
exports.setMaintenanceMode = async (req, res) => {
  try {
    const { enabled, message, allowedRoles, estimatedDuration } = req.body;

    await SystemSettings.findOneAndUpdate(
      { key: 'maintenance_mode' },
      {
        key: 'maintenance_mode',
        value: {
          enabled,
          message: message || 'System is under maintenance',
          allowedRoles: allowedRoles || ['admin', 'superadmin'],
          estimatedDuration,
          startTime: enabled ? new Date() : null
        },
        category: 'system',
        lastModifiedBy: req.user._id
      },
      { upsert: true }
    );

    await logAuditEvent(req.user._id, 'MAINTENANCE_MODE', 'system', null, {
      enabled,
      message,
      estimatedDuration
    });

    res.json({
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      userId, 
      action, 
      resource,
      startDate,
      endDate,
      success
    } = req.query;

    let query = {};
    
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (success !== undefined) query.success = success === 'true';
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserAuditLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const logs = await AuditLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments({ userId });

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User Sessions
exports.getActiveSessions = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const sessions = await UserSession.find({ isActive: true })
      .populate('userId', 'name email role')
      .sort({ lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserSession.countDocuments({ isActive: true });

    res.json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await UserSession.findById(sessionId)
      .populate('userId', 'name email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await UserSession.findByIdAndUpdate(sessionId, { isActive: false });

    await logAuditEvent(req.user._id, 'TERMINATE_SESSION', 'user_session', sessionId, {
      targetUser: session.userId
    });

    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Backup Management
exports.createBackup = async (req, res) => {
  try {
    const { name, type = 'full', collections } = req.body;

    const backup = new SystemBackup({
      name: name || `backup_${Date.now()}`,
      type,
      collections: collections || [],
      scheduledBy: req.user._id
    });

    await backup.save();

    // Start backup process asynchronously
    createBackup(backup._id).catch(error => {
      console.error('Backup failed:', error);
    });

    await logAuditEvent(req.user._id, 'CREATE_BACKUP', 'system_backup', backup._id, {
      backupType: type,
      collections
    });

    res.status(202).json({
      message: 'Backup initiated successfully',
      backupId: backup._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBackups = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const backups = await SystemBackup.find()
      .populate('scheduledBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SystemBackup.countDocuments();

    res.json({
      backups,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// A/B Testing
exports.getExperiments = async (req, res) => {
  try {
    const experiments = await ABTest.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ experiments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createExperiment = async (req, res) => {
  try {
    const experiment = new ABTest({
      ...req.body,
      createdBy: req.user._id
    });

    await experiment.save();

    await logAuditEvent(req.user._id, 'CREATE', 'ab_test', experiment._id, {
      experimentName: experiment.name
    });

    res.status(201).json({
      message: 'Experiment created successfully',
      experiment
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteExperiment = async (req, res) => {
  try {
    const { experimentId } = req.params;

    const experiment = await ABTest.findByIdAndDelete(experimentId);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    await logAuditEvent(req.user._id, 'DELETE', 'ab_test', experimentId, {
      experimentName: experiment.name
    });

    res.json({ message: 'Experiment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Broadcast Management
exports.createBroadcast = async (req, res) => {
  try {
    const broadcast = new Broadcast({
      ...req.body,
      createdBy: req.user._id
    });

    await broadcast.save();

    // Send immediately or schedule
    if (!req.body.scheduledAt || new Date(req.body.scheduledAt) <= new Date()) {
      sendBroadcast(broadcast._id).catch(error => {
        console.error('Broadcast failed:', error);
      });
    }

    await logAuditEvent(req.user._id, 'CREATE_BROADCAST', 'broadcast', broadcast._id, {
      title: broadcast.title,
      audience: broadcast.audience
    });

    res.status(201).json({
      message: 'Broadcast created successfully',
      broadcast
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper Functions
const getPlatformMetrics = async (dateRange) => {
  const [userStats, orderStats, revenueStats] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' }
        }
      }
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    users: userStats,
    orders: orderStats,
    revenue: revenueStats[0] || { totalRevenue: 0, avgOrderValue: 0, orderCount: 0 }
  };
};

const getDateRange = (period) => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return { start, end };
};

module.exports = exports;
