const mongoose = require('mongoose');
const ReferralProgramConfig = require('../models/ReferralProgramConfig');

async function getOrCreateConfig() {
  let doc = await ReferralProgramConfig.findOne({ key: 'default' });
  if (!doc) {
    doc = await ReferralProgramConfig.create({ key: 'default' });
  }
  return doc;
}

function getAdminId(req) {
  return req.user?.id || req.user?.data?.id || req.user?._id || null;
}

async function getReferralProgram(req, res) {
  try {
    const doc = await getOrCreateConfig();
    return res.status(200).json({ config: doc.toObject() });
  } catch (e) {
    console.error('getReferralProgram', e);
    return res.status(500).json({ message: 'Failed to load referral program' });
  }
}

async function updateReferralProgram(req, res) {
  try {
    const adminId = getAdminId(req);
    const body = req.body || {};
    const doc = await getOrCreateConfig();

    const allowed = [
      'isActive',
      'refereeRewardEnabled',
      'refereeRewardType',
      'refereeCredits',
      'refereePlanDiscountPercent',
      'refereeFreeAuthMethod',
      'refereeCustomLabel',
      'refereeCustomDescription',
      'referrerCompletionsPerReward',
      'referrerRewardEnabled',
      'referrerRewardType',
      'referrerCredits',
      'referrerPlanDiscountPercent',
      'referrerFreeAuthMethod',
      'referrerCustomLabel',
      'referrerCustomDescription',
    ];

    for (const k of allowed) {
      if (body[k] !== undefined) doc[k] = body[k];
    }

    if (adminId && mongoose.Types.ObjectId.isValid(String(adminId))) {
      doc.updatedBy = adminId;
    }

    if (typeof doc.referrerCompletionsPerReward === 'number' && doc.referrerCompletionsPerReward < 1) {
      doc.referrerCompletionsPerReward = 1;
    }

    await doc.save();
    return res.status(200).json({ config: doc.toObject(), message: 'Referral program updated' });
  } catch (e) {
    console.error('updateReferralProgram', e);
    return res.status(500).json({ message: 'Failed to update referral program' });
  }
}

module.exports = {
  getReferralProgram,
  updateReferralProgram,
  getOrCreateConfig,
};
