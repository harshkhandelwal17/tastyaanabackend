const express = require('express');
const router = express.Router();
const {
  getCategorySlots,
  getSlotsByCategory,
  getAvailableSlots,
  createOrUpdateCategorySlots,
  deleteCategorySlots,
  toggleCategorySlotStatus,
  initializeDefaultSlots,
  getAvailableSlotsWithTimeValidation,
  validateSlotSelection,
  getAlternativeSlots
} = require('../controllers/categorySlotController');

const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/categories/:categoryId/slots', getSlotsByCategory);
router.get('/categories/:categoryId/slots/:dayOfWeek', getAvailableSlots);
router.get('/categories/:categoryId/available-slots', getAvailableSlotsWithTimeValidation);
router.post('/validate-slot', validateSlotSelection);
router.get('/alternative-slots', getAlternativeSlots);

// Protected routes (admin only)

router.route('/')
.get(getCategorySlots)
router.use(authenticate, authorize('admin'));
router.route('/')
.post(createOrUpdateCategorySlots);
router.route('/:id')
  .delete(deleteCategorySlots);

router.put('/:id/status', toggleCategorySlotStatus);
router.post('/categories/:categoryId/init-slots', initializeDefaultSlots);

module.exports = router;
