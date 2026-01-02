// routes/tiffin.js
const express = require('express');
const {
    schedulePickup,
    getTiffinLogs,
    updateTiffinStatus,
    rateTiffinService
} = require('../controllers/tiffinController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   POST /api/tiffin/schedule-pickup
 * @desc    Schedule tiffin pickup
 * @access  Private
 */
router.post('/schedule-pickup', authenticate, schedulePickup);

/**
 * @route   GET /api/tiffin/logs
 * @desc    Get tiffin wash logs
 * @access  Private
 */
router.get('/logs', authenticate, getTiffinLogs);

/**
 * @route   PUT /api/tiffin/:id/status
 * @desc    Update tiffin status (Delivery partner)
 * @access  Private
 */
router.put('/:id/status', authenticate, updateTiffinStatus);

/**
 * @route   POST /api/tiffin/:id/rate
 * @desc    Rate tiffin service
 * @access  Private
 */
router.post('/:id/rate', authenticate, rateTiffinService);

module.exports = router;