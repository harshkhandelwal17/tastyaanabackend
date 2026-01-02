// models/SystemBackup.js
const mongoose = require("mongoose");

const systemBackupSchema = new mongoose.Schema({
  name: String,
  type: {
    type: String,
    enum: ['full', 'partial', 'incremental'],
    default: 'full'
  },
  collections: [String],
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  size: Number, // in bytes
  location: String, // file path or cloud storage URL
  checksum: String,
  metadata: {
    totalRecords: Number,
    duration: Number, // in seconds
    compressionRatio: Number
  },
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  error: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemBackup', systemBackupSchema);