// middleware/adminAuth.js
/**
 * Super Admin authentication middleware
 */
exports.requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
  
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required.'
      });
    }
  
    next();
  };
  
  /**
   * Restaurant owner authentication middleware
   */
  exports.requireRestaurant = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
  
    if (!['seller', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Restaurant access required.'
      });
    }
  
    next();
  };
  
  /**
   * Delivery partner authentication middleware
   */
  exports.requireDeliveryPartner = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
  
    if (!['delivery', 'admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Delivery partner access required.'
      });
    }
  
    next();
  };
  