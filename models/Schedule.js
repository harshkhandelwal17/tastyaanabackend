// models/Schedule.js
const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, index: true },
  containerIndex: { type: Number, default: 1 }, // 1..N container
  hour: { type: Number, required: true },
  minute: { type: Number, required: true },
  label: { type: String, default: "" }, // e.g., "Morning tablets"
  beforeFood: { type: Boolean, default: false }, // true => user must eat before taking
  active: { type: Boolean, default: true },
  days: { type: [Number], default: [] }, // optional: days of week 0-6
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);
