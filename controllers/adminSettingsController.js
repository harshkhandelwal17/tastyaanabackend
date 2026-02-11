const AdminSettings = require('../models/AdminSettings');
const { ErrorResponse } = require('../utils/errorResponse');

/**
 * @desc    Get current admin settings
 * @route   GET /api/v1/admin/settings
 * @access  Private/Admin
 */
const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await AdminSettings.getCurrentSettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update admin settings
 * @route   PUT /api/v1/admin/settings
 * @access  Private/Admin
 */
const updateAdminSettings = async (req, res, next) => {
  try {
    const { maxSkipDays } = req.body;
    
    // Validate input
    if (maxSkipDays && (maxSkipDays < 1 || maxSkipDays > 8)) {
      return next(new ErrorResponse('maxSkipDays must be between 1 and 8', 400));
    }
    
    // Get current settings
    const currentSettings = await AdminSettings.getCurrentSettings();
    
    // Create new settings with updated values
    const settings = await AdminSettings.create({
      maxSkipDays: maxSkipDays || currentSettings.maxSkipDays,
      updatedBy: req.user.id
    });
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminSettings,
  updateAdminSettings
};
