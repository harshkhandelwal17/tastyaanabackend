// utils/auditLogger.js
const AuditLog = require('../models/Auditlog');

const logAuditEvent = async (userId, action, resource, resourceId, metadata = {}) => {
  try {
    const auditLog = new AuditLog({
      userId,
      userRole: metadata.userRole || 'unknown',
      action,
      resource,
      resourceId,
      oldValue: metadata.oldValue,
      newValue: metadata.newValue,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      success: metadata.success !== false,
      error: metadata.error,
      metadata: {
        ...metadata,
        timestamp: new Date()
      }
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw error to avoid breaking main functionality
  }
};

const getAuditStats = async (timeframe = '30d') => {
  const dateRange = getDateRange(timeframe);
  
  const stats = await AuditLog.aggregate([
    {
      $match: {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          resource: '$resource',
          success: '$success'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: { action: '$_id.action', resource: '$_id.resource' },
        total: { $sum: '$count' },
        successful: {
          $sum: { $cond: ['$_id.success', '$count', 0] }
        },
        failed: {
          $sum: { $cond: ['$_id.success', 0, '$count'] }
        }
      }
    }
  ]);

  return stats;
};

module.exports = { logAuditEvent, getAuditStats };
