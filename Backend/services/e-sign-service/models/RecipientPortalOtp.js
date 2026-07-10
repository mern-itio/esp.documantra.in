const mongoose = require('mongoose');

const RecipientPortalOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    lastSentAt: { type: Date, default: Date.now },
    attempts: { type: Number, default: 0 },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

RecipientPortalOtpSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('RecipientPortalOtp', RecipientPortalOtpSchema);
