const mongoose = require('mongoose');

const GuestUsageSchema = new mongoose.Schema({
  ip: { type: String, index: true, required: true },
  windowStart: { type: Date, required: true },
  count: { type: Number, default: 0 },
}, { timestamps: true });

GuestUsageSchema.index({ ip: 1 });

module.exports = mongoose.model('GuestUsage', GuestUsageSchema);


