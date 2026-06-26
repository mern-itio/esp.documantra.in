const mongoose = require('mongoose');

const selfieVerificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    envelopeId: { type: String, default: null },
    authProviderId: { type: String, required: true },
    verificationId: { type: String, required: true },
    imagePath: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

selfieVerificationSchema.index({ verificationId: 1 });
selfieVerificationSchema.index({ userId: 1, envelopeId: 1 });

module.exports = mongoose.model('SelfieVerification', selfieVerificationSchema);
