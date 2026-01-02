const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
  getAdminSettings, 
  updateAdminSettings 
} = require('../controllers/adminSettingsController');

// Protect all routes with authentication and admin authorization
router.use(protect);
router.use(authorize('admin'));

// Routes
router.route('/')
  .get(getAdminSettings)
  .put(updateAdminSettings);

module.exports = router;
