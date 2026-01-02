/**
 * Middleware to authorize admin users
 */
const authorizeAdmin = (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required. Access denied.'
      });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

/**
 * Middleware to authorize seller users
 */
const authorizeSeller = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seller access required. Access denied.'
      });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

/**
 * Middleware to authorize admin or seller users
 */
const authorizeAdminOrSeller = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!['admin', 'seller'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin or seller access required. Access denied.'
      });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

module.exports = {
  authorizeAdmin,
  authorizeSeller,
  authorizeAdminOrSeller
};
