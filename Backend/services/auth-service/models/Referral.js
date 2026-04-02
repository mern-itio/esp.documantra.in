const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema(
  {
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    firstEnvelopeId: { type: mongoose.Schema.Types.ObjectId, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ReferralSchema.index({ referrerId: 1, status: 1 });

module.exports = mongoose.model('Referral', ReferralSchema);
