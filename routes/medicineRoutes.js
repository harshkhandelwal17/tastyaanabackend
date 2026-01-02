// routes/medicineRoutes.js
const express = require('express');
const router = express.Router();
const MedicineLog = require('../models/MedicineLog');
const Device = require('../models/Device');

// ingest logs from device
router.post('/log', async (req, res) => {
  try {
    const { deviceId, containerIndex, action, time, detail } = req.body;
    const log = new MedicineLog({
      deviceId, containerIndex, action, time: time ? new Date(time) : new Date(), detail
    });
    await log.save();
    // update device lastSeen
    await Device.findOneAndUpdate({ deviceId }, { lastSeen: new Date() });
    console.log('Log saved:', log);
    // optional: trigger notifications if action is 'low_stock' or 'missed'
    res.json({ success: true, log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false });
  }
});

// get latest logs (for frontend)
router.get('/', async (req, res) => {
  try {
    const logs = await MedicineLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ success:false });
  }
});

module.exports = router;
