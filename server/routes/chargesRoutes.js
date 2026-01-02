const express = require('express');
const router = express.Router();
const {
  getApplicableCharges,
  getAllCharges,
  createCharge,
  updateCharge,
  getCharges,
  deleteCharge,
  getChargeFormData
} = require('../controllers/chargesController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.post('/applicable', getApplicableCharges);
router.get('/form-data', getChargeFormData);

// Admin routes
router.get('/', authenticate, authorize(['admin', 'super-admin']), getAllCharges);
router.post('/', authenticate, authorize(['admin', 'super-admin']), createCharge);
router.get('/:id', authenticate, authorize(['admin', 'super-admin']), getCharges);

router.put('/:id', authenticate, authorize(['admin', 'super-admin']), updateCharge);
router.delete('/:id', authenticate, authorize(['admin', 'super-admin']), deleteCharge);

module.exports = router;
