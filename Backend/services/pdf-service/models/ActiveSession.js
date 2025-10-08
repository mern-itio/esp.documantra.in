const mongoose = require('mongoose');

const ActiveSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userAgent: { type: String, default: null },
  ipAddress: { type: String, default: null },
  lastSeen: { type: Date, default: Date.now, index: true },
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });

ActiveSessionSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('ActiveSession', ActiveSessionSchema);


