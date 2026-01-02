const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const User = require('../models/User');

// Get minimal user profile data (for auth checks)
router.get('/profile/minimal', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('role name sellerProfile.sellerType sellerProfile.vehicleRentalService.isEnabled');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return only essential data for UI decisions
    const minimalData = {
      id: user._id,
      role: user.role,
      name: user.name,
      isVehicleRentalSeller: false
    };

    // Check if user is a vehicle rental seller
    if (user.sellerProfile) {
      const hasVehicleRentalType = user.sellerProfile.sellerType?.includes('vehiclerental');
      const hasRentalType = user.sellerProfile.sellerType?.includes('rental'); // Backward compatibility
      const hasRentalService = user.sellerProfile.vehicleRentalService?.isEnabled;
      minimalData.isVehicleRentalSeller = hasVehicleRentalType || hasRentalType || hasRentalService;
    }

    res.json({
      success: true,
      data: minimalData
    });
  } catch (error) {
    console.error('Error fetching minimal profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;