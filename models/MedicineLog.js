// const mongoose = require('mongoose');

// const MedicineLogSchema = new mongoose.Schema({
//     deviceId: { type: String, required: true },
//     time: { type: String, required: true },
//     action: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('MedicineLog', MedicineLogSchema);

// models/MedicineLog.js
const mongoose = require('mongoose');

const MedicineLogSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  containerIndex: { type: Number },
  time: { type: Date, default: Date.now },
  action: { type: String }, // e.g., "scheduled_alert", "manual_button", "taken", "missed", "low_stock"
  detail: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('MedicineLog', MedicineLogSchema);
