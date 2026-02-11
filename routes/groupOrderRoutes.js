const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth'); // Corrected import
const { createGroup, joinGroup, syncCart, getGroupDetails, leaveGroup, checkActiveGroup, completeGroupOrder } = require('../controllers/GroupOrderController');

router.post('/create', authenticate, createGroup);
router.post('/join', authenticate, joinGroup);
router.post('/sync', authenticate, syncCart);
router.post('/leave', authenticate, leaveGroup);
router.post('/complete', authenticate, completeGroupOrder); // New Route
router.get('/active', authenticate, checkActiveGroup); // Must be before /:code
router.get('/:code', authenticate, getGroupDetails);

module.exports = router;
