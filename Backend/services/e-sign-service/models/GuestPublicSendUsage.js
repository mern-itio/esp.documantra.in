const mongoose = require('mongoose');

const GuestPublicSendUsageSchema = new mongoose.Schema(
  {
    guestId: { type: String, index: true, required: true },
    monthKey: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true },
);

GuestPublicSendUsageSchema.index({ guestId: 1, monthKey: 1 }, { unique: true });

module.exports = mongoose.model('GuestPublicSendUsage', GuestPublicSendUsageSchema);
