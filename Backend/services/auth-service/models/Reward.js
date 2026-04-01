const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: {
      type: String,
      enum: ['referrer_bonus', 'referee_welcome'],
      required: true,
    },
    status: { type: String, enum: ['pending', 'unlocked'], default: 'pending', index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    unlockedAt: { type: Date, default: null },
    relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reward', RewardSchema);
