const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, default: "Smart Box" },
  lastHeartbeat: { type: Date, default: Date.now },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
});

module.exports = mongoose.model("Device", deviceSchema);
