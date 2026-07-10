const mongoose = require('mongoose');

const SignerAccessOtpSchema = new mongoose.Schema(
  {
    envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Envelope', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    lastSentAt: { type: Date, default: Date.now },
    attempts: { type: Number, default: 0 },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

SignerAccessOtpSchema.index({ envelopeId: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('SignerAccessOtp', SignerAccessOtpSchema);
