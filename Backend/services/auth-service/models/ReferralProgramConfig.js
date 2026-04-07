const mongoose = require('mongoose');

const rewardTypeEnum = ['credits', 'plan_discount_percent', 'free_auth_method', 'custom'];

/**
 * Singleton-style config (key: 'default') controlled by admin.
 * Referrer reward fires every `referrerCompletionsPerReward` completed invites (first doc sent).
 */
const ReferralProgramConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true, index: true },
    isActive: { type: Boolean, default: true },

    refereeRewardEnabled: { type: Boolean, default: true },
    refereeRewardType: { type: String, enum: rewardTypeEnum, default: 'credits' },
    refereeCredits: { type: Number, default: 10, min: 0 },
    refereePlanDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    refereeFreeAuthMethod: { type: String, default: '' },
    refereeCustomLabel: { type: String, default: '' },
    refereeCustomDescription: { type: String, default: '' },

    referrerCompletionsPerReward: { type: Number, default: 1, min: 1 },
    referrerRewardEnabled: { type: Boolean, default: true },
    referrerRewardType: { type: String, enum: rewardTypeEnum, default: 'credits' },
    referrerCredits: { type: Number, default: 10, min: 0 },
    referrerPlanDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    referrerFreeAuthMethod: { type: String, default: '' },
    referrerCustomLabel: { type: String, default: '' },
    referrerCustomDescription: { type: String, default: '' },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReferralProgramConfig', ReferralProgramConfigSchema);
