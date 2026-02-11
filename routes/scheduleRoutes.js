// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');

// create schedule
router.post('/', async (req, res) => {
  try {
    const s = new Schedule(req.body);
    await s.save();
    res.json({ success: true, schedule: s });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false });
  }
});

// update schedule
router.put('/:id', async (req, res) => {
  try {
    const s = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, schedule: s });
  } catch (err) {
    res.status(500).json({ success:false });
  }
});

// get schedules for device
router.get('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const schedules = await Schedule.find({ deviceId }); // or however you store it

    if (!schedules) {
      return res.status(404).json({ success: false, message: "No schedules found" });
    }

    res.status(200).json(schedules);
  } catch (error) {
    console.error("Schedule fetch error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
module.exports = router;
