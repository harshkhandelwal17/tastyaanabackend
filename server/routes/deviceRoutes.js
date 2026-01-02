const express = require('express');
const Device =require("../models/Device.js");

const router = express.Router();

// ✅ Register or Update Device
router.post("/register", async (req, res) => {
  try {
    const { deviceId, name } = req.body;
    if (!deviceId) return res.status(400).json({ message: "deviceId required" });

    let device = await Device.findOne({ deviceId });
    if (device) {
      device.name = name || device.name;
      device.lastHeartbeat = new Date();
      await device.save();
    } else {
      device = await Device.create({ deviceId, name });
    }

    res.status(200).json({ success: true, device });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Heartbeat update
router.post("/heartbeat", async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ message: "deviceId required" });

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { lastHeartbeat: new Date(), status: "online" },
      { new: true }
    );

    res.status(200).json({ success: true, device });
  } catch (err) {
    console.error("Heartbeat Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get all devices (for frontend)
router.get("/", async (req, res) => {
  try {
    const devices = await Device.find().sort({ lastHeartbeat: -1 });
    res.status(200).json(devices);
  } catch (err) {
    console.error("Fetch Devices Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get single device (optional)
router.get("/:deviceId", async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) return res.status(404).json({ message: "Device not found" });
    res.status(200).json(device);
  } catch (err) {
    console.error("Get Device Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
