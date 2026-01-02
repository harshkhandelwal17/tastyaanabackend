const express = require('express');
const router = express.Router();
const bhandaraController = require('../controllers/bhandaraController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', bhandaraController.getAllBhandaras);
router.get('/upcoming', bhandaraController.getUpcomingBhandaras);
router.get('/:id', bhandaraController.getBhandaraById);

// User routes (no authentication required for submission, but can be added later)
router.post('/', bhandaraController.createBhandara);

// User's submitted Bhandaras (authentication required)
router.get('/my-bhandaras', authenticate, bhandaraController.getUserBhandaras);

// User feedback routes (authentication required)
router.post('/:id/like', authenticate, bhandaraController.likeBhandara);
router.post('/:id/dislike', authenticate, bhandaraController.dislikeBhandara);
router.get('/:id/feedback', authenticate, bhandaraController.getBhandaraFeedback);

// Admin routes (authentication required)
router.put('/:id/status', authenticate, authorize('admin'), bhandaraController.updateBhandaraStatus);

module.exports = router;