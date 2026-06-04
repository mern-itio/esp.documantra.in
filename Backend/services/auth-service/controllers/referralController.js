const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Reward = require('../models/Reward');
const { getOrCreateConfig } = require('./referralProgramAdminController');

const LEGACY_ENV_CREDITS = parseInt(process.env.REFERRAL_REWARD_CREDITS || '10', 10);

function subscriptionBaseUrl() {
  const rawBase = process.env.SUBSCRIPTION_SERVICE_URL || 'https://esp.documantra.in/subscription';
  return String(rawBase).replace(/\/+$/, '');
}

async function grantReferralCredits(userId, referralId, rewardKind, creditsAmount) {
  try {
    const base = subscriptionBaseUrl();
    const key = process.env.INTERNAL_SERVICE_KEY;
    const amount = Number(creditsAmount);
    if (!base || !key || !userId || !Number.isFinite(amount) || amount <= 0) return;

    await axios.post(
      `${base}/user-plan/internal/grant-credits`,
      {
        userId: String(userId),
        credits: amount,
        reason: rewardKind,
        referralId: String(referralId || ''),
      },
      { headers: { 'x-internal-key': key }, timeout: 8000 }
    );
  } catch (e) {
    console.warn('grantReferralCredits failed:', e?.response?.data?.message || e?.message || e);
  }
}

async function grantReferralPerk(userId, referralId, config, role) {
  try {
    const base = subscriptionBaseUrl();
    const key = process.env.INTERNAL_SERVICE_KEY;
    if (!base || !key || !userId) return;

    const p = role === 'referee' ? 'referee' : 'referrer';
    const perkType = config[`${p}RewardType`];
    let label = 'Referral benefit';
    let value = {};

    if (perkType === 'plan_discount_percent') {
      const pct = Number(config[`${p}PlanDiscountPercent`] || 0);
      label = `${pct}% off annual plan`;
      value = { percent: pct, appliesTo: 'annual' };
    } else if (perkType === 'free_auth_method') {
      const m = String(config[`${p}FreeAuthMethod`] || '').trim() || 'verification';
      label = `Free ${m} verification`;
      value = { method: m };
    } else {
      label = String(config[`${p}CustomLabel`] || 'Referral benefit');
      value = { description: String(config[`${p}CustomDescription`] || '') };
    }

    await axios.post(
      `${base}/user-plan/internal/referral-perk`,
      {
        userId: String(userId),
        referralId: String(referralId || ''),
        perkType,
        label,
        value,
        reason: `referral_${role}_${perkType}`,
      },
      { headers: { 'x-internal-key': key }, timeout: 8000 }
    );
  } catch (e) {
    console.warn('grantReferralPerk failed:', e?.response?.data?.message || e?.message || e);
  }
}

function buildMeta(config, role) {
  const p = role === 'referee' ? 'referee' : 'referrer';
  const type = config[`${p}RewardType`];
  const meta = { rewardType: type, role };
  if (type === 'credits') {
    meta.credits = Number(config[`${p}Credits`] ?? LEGACY_ENV_CREDITS);
  } else if (type === 'plan_discount_percent') {
    meta.planDiscountPercent = Number(config[`${p}PlanDiscountPercent`] || 0);
    meta.appliesTo = 'annual';
  } else if (type === 'free_auth_method') {
    meta.freeAuthMethod = String(config[`${p}FreeAuthMethod`] || '');
  } else {
    meta.customLabel = String(config[`${p}CustomLabel`] || '');
    meta.customDescription = String(config[`${p}CustomDescription`] || '');
  }
  return meta;
}

function buildRefereeCopy(config) {
  const credits = Number(config.refereeCredits ?? LEGACY_ENV_CREDITS);
  if (config.refereeRewardType === 'credits') {
    return {
      title: 'Welcome reward',
      description: `Unlocks ${credits} credits when you send your first document successfully.`,
    };
  }
  if (config.refereeRewardType === 'plan_discount_percent') {
    const pct = Number(config.refereePlanDiscountPercent || 0);
    return {
      title: 'Welcome reward',
      description: `Unlocks ${pct}% off your annual plan when you send your first document successfully.`,
    };
  }
  if (config.refereeRewardType === 'free_auth_method') {
    const m = String(config.refereeFreeAuthMethod || 'selected').trim() || 'selected';
    return {
      title: 'Welcome reward',
      description: `Unlocks free ${m} verification when you send your first document successfully.`,
    };
  }
  return {
    title: String(config.refereeCustomLabel || 'Welcome reward'),
    description: String(
      config.refereeCustomDescription ||
        'Unlocks when you send your first document successfully.'
    ),
  };
}

function buildReferrerMilestoneCopy(config) {
  const n = Math.max(1, Number(config.referrerCompletionsPerReward || 1));
  const credits = Number(config.referrerCredits ?? LEGACY_ENV_CREDITS);
  if (config.referrerRewardType === 'credits') {
    return {
      title: 'Referral milestone reward',
      description:
        n <= 1
          ? `Earn ${credits} credits when an invite sends their first document.`
          : `Earn ${credits} credits for every ${n} invites who send their first document.`,
    };
  }
  if (config.referrerRewardType === 'plan_discount_percent') {
    const pct = Number(config.referrerPlanDiscountPercent || 0);
    return {
      title: 'Referral milestone reward',
      description:
        n <= 1
          ? `Earn ${pct}% off annual plan when an invite sends their first document.`
          : `Earn ${pct}% off annual plan for every ${n} successful invites.`,
    };
  }
  if (config.referrerRewardType === 'free_auth_method') {
    const m = String(config.referrerFreeAuthMethod || 'selected').trim() || 'selected';
    return {
      title: 'Referral milestone reward',
      description:
        n <= 1
          ? `Earn free ${m} verification when an invite sends their first document.`
          : `Earn free ${m} verification for every ${n} successful invites.`,
    };
  }
  return {
    title: String(config.referrerCustomLabel || 'Referral reward'),
    description: String(
      config.referrerCustomDescription || 'Reward for successful referrals.'
    ),
  };
}

async function fulfillConfiguredReward(userId, referralId, config, role) {
  const p = role === 'referee' ? 'referee' : 'referrer';
  const type = config[`${p}RewardType`];
  if (type === 'credits') {
    const credits = Number(config[`${p}Credits`] ?? LEGACY_ENV_CREDITS);
    if (credits > 0) {
      await grantReferralCredits(userId, referralId, `referral_${role}_${type}`, credits);
    }
  } else {
    await grantReferralPerk(userId, referralId, config, role);
  }
}

function normalizeReferrerId(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return s;
}

function publicProgramSummary(config) {
  const c = config.toObject ? config.toObject() : config;
  return {
    isActive: !!c.isActive,
    refereeRewardEnabled: !!c.refereeRewardEnabled,
    referrerRewardEnabled: !!c.referrerRewardEnabled,
    referrerCompletionsPerReward: Math.max(1, Number(c.referrerCompletionsPerReward || 1)),
    refereeRewardType: c.refereeRewardType,
    referrerRewardType: c.referrerRewardType,
    refereeCredits: Number(c.refereeCredits ?? LEGACY_ENV_CREDITS),
    referrerCredits: Number(c.referrerCredits ?? LEGACY_ENV_CREDITS),
    refereePlanDiscountPercent: Number(c.refereePlanDiscountPercent || 0),
    referrerPlanDiscountPercent: Number(c.referrerPlanDiscountPercent || 0),
    refereeFreeAuthMethod: c.refereeFreeAuthMethod || '',
    referrerFreeAuthMethod: c.referrerFreeAuthMethod || '',
    refereeCustomLabel: c.refereeCustomLabel || '',
    referrerCustomLabel: c.referrerCustomLabel || '',
  };
}

/**
 * Called after a new user registers with ?ref= referrer id.
 */
async function attachReferralOnSignup(newUserId, referrerIdRaw) {
  const referrerIdStr = normalizeReferrerId(referrerIdRaw);
  if (!referrerIdStr) return;

  if (String(referrerIdStr) === String(newUserId)) return;

  const referrer = await User.findById(referrerIdStr).select('_id');
  if (!referrer) return;

  const user = await User.findById(newUserId);
  if (!user) return;
  if (user.referredBy) return;

  const config = await getOrCreateConfig();

  user.referredBy = referrer._id;
  await user.save({ validateBeforeSave: false });

  const dup = await Referral.findOne({ refereeId: user._id });
  if (dup) return;

  const refDoc = await Referral.create({
    referrerId: referrer._id,
    refereeId: user._id,
    status: 'pending',
  });

  if (!config.isActive) return;

  if (config.refereeRewardEnabled) {
    const copy = buildRefereeCopy(config);
    await Reward.create({
      userId: user._id,
      kind: 'referee_welcome',
      status: 'pending',
      title: copy.title,
      description: copy.description,
      relatedUserId: referrer._id,
      referralId: refDoc._id,
      meta: buildMeta(config, 'referee'),
    });
  }

  /* Referrer rewards are issued on milestones (see onFirstDocumentSentInternal), not at signup. */
}

async function getMyReferral(req, res) {
  try {
    const userId = req.user?.data?.id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const config = await getOrCreateConfig();
    const rawBase = process.env.FRONTEND_URL || process.env.BASE_URL || 'https://esp.documantra.in';
    const base = String(rawBase).replace(/\/+$/, '') || 'https://esp.documantra.in';
    const referralLink = `${base}/signup?ref=${encodeURIComponent(String(userId))}`;

    const rid = new mongoose.Types.ObjectId(String(userId));
    const completed = await Referral.countDocuments({ referrerId: rid, status: 'completed' });
    const pending = await Referral.countDocuments({ referrerId: rid, status: 'pending' });
    const referrals = await Referral.find({ referrerId: rid })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('refereeId', 'fullname email')
      .lean();

    const referralRows = referrals.map((r) => {
      const referee = r?.refereeId && typeof r.refereeId === 'object' ? r.refereeId : null;
      return {
        id: String(r._id),
        status: r.status,
        createdAt: r.createdAt || null,
        completedAt: r.completedAt || null,
        firstEnvelopeId: r.firstEnvelopeId ? String(r.firstEnvelopeId) : null,
        referee: referee
          ? {
              id: String(referee._id),
              fullname: referee.fullname || '',
              email: referee.email || '',
            }
          : null,
      };
    });

    const n = Math.max(1, Number(config.referrerCompletionsPerReward || 1));
    const progressTowardNext = completed % n;
    const invitesUntilNext = completed % n === 0 ? n : n - (completed % n);

    const [referrerUnlockedCount, refereeUnlockedCount, milestoneCount] = await Promise.all([
      Reward.countDocuments({
        userId: rid,
        kind: { $in: ['referrer_bonus', 'referrer_milestone'] },
        status: 'unlocked',
      }),
      Reward.countDocuments({ userId: rid, kind: 'referee_welcome', status: 'unlocked' }),
      Reward.countDocuments({ userId: rid, kind: 'referrer_milestone' }),
    ]);

    const primaryCredits =
      config.referrerRewardType === 'credits'
        ? Number(config.referrerCredits ?? LEGACY_ENV_CREDITS)
        : null;

    return res.status(200).json({
      referralLink,
      program: publicProgramSummary(config),
      stats: {
        completedReferrals: completed,
        pendingReferrals: pending,
        totalReferrals: completed + pending,
        referrerUnlockedRewards: referrerUnlockedCount,
        refereeUnlockedRewards: refereeUnlockedCount,
        referrerMilestonesPaid: milestoneCount,
        referrerCompletionsPerReward: n,
        invitesUntilNextMilestone: invitesUntilNext,
        progressTowardNextMilestone: progressTowardNext,
        creditsPerReward: primaryCredits,
      },
      referrals: referralRows,
    });
  } catch (e) {
    console.error('getMyReferral', e);
    return res.status(500).json({ message: 'Failed to load referral info' });
  }
}

async function listRewards(req, res) {
  try {
    const userId = req.user?.data?.id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const uid = new mongoose.Types.ObjectId(String(userId));
    const rewards = await Reward.find({ userId: uid })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({ rewards });
  } catch (e) {
    console.error('listRewards', e);
    return res.status(500).json({ message: 'Failed to load rewards' });
  }
}

/**
 * Internal: first time a user successfully sends a document (e-sign service).
 */
async function onFirstDocumentSentInternal(req, res) {
  try {
    const secret = process.env.INTERNAL_SERVICE_KEY;
    const key = req.headers['x-internal-key'] || req.headers['x-service-key'];
    if (!secret || key !== secret) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { userId, envelopeId } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(400).json({ message: 'userId required' });
    }

    const uidRef = new mongoose.Types.ObjectId(String(userId));
    const user = await User.findById(uidRef).select('referredBy');
    if (!user || !user.referredBy) {
      return res.status(200).json({ ok: true, action: 'none' });
    }

    const referral = await Referral.findOne({
      refereeId: user._id,
      status: 'pending',
    });
    if (!referral) {
      return res.status(200).json({ ok: true, action: 'none' });
    }

    const config = await getOrCreateConfig();

    referral.status = 'completed';
    referral.firstEnvelopeId = envelopeId
      ? new mongoose.Types.ObjectId(String(envelopeId))
      : null;
    referral.completedAt = new Date();
    await referral.save();

    const now = new Date();

    const refereeOid = new mongoose.Types.ObjectId(String(user._id));
    const referrerOid = new mongoose.Types.ObjectId(String(referral.referrerId));

    let rewardCredits = 0;
    let rewardSummary = null;

    const shouldReferee = config.isActive && config.refereeRewardEnabled;
    if (shouldReferee) {
      const refereeUnlock = await Reward.updateMany(
        {
          referralId: referral._id,
          kind: 'referee_welcome',
          userId: refereeOid,
          status: 'pending',
        },
        { $set: { status: 'unlocked', unlockedAt: now, meta: buildMeta(config, 'referee') } }
      );
      if ((refereeUnlock.modifiedCount || 0) > 0) {
        await fulfillConfiguredReward(refereeOid, referral._id, config, 'referee');
        if (config.refereeRewardType === 'credits') {
          rewardCredits = Number(config.refereeCredits ?? LEGACY_ENV_CREDITS);
        }
        rewardSummary = {
          role: 'referee',
          rewardType: config.refereeRewardType,
          credits: config.refereeRewardType === 'credits' ? rewardCredits : null,
        };
      }
    }

    /* Legacy: referrer_bonus created per-invite in older builds */
    const legacyReferrer = await Reward.updateMany(
      {
        referralId: referral._id,
        kind: 'referrer_bonus',
        userId: referrerOid,
        status: 'pending',
      },
      { $set: { status: 'unlocked', unlockedAt: now, meta: buildMeta(config, 'referrer') } }
    );
    const legacyReferrerUnlocked = (legacyReferrer.modifiedCount || 0) > 0;
    if (legacyReferrerUnlocked && config.isActive && config.referrerRewardEnabled) {
      await fulfillConfiguredReward(referrerOid, referral._id, config, 'referrer');
      if (!rewardSummary && config.referrerRewardType === 'credits') {
        rewardCredits = Number(config.referrerCredits ?? LEGACY_ENV_CREDITS);
      }
    }

    let referrerMilestoneAchieved = false;
    /* Milestone program only when this completion did not unlock a legacy per-invite row (avoids double payout). */
    if (config.isActive && config.referrerRewardEnabled && !legacyReferrerUnlocked) {
      const completedCount = await Referral.countDocuments({
        referrerId: referrerOid,
        status: 'completed',
      });
      const n = Math.max(1, Number(config.referrerCompletionsPerReward || 1));
      const expectedMilestones = Math.floor(completedCount / n);
      const milestoneGranted = await Reward.countDocuments({
        userId: referrerOid,
        kind: 'referrer_milestone',
      });

      let toGrant = expectedMilestones - milestoneGranted;
      const copy = buildReferrerMilestoneCopy(config);
      let idx = milestoneGranted;
      while (toGrant > 0) {
        idx += 1;
        await Reward.create({
          userId: referrerOid,
          kind: 'referrer_milestone',
          status: 'unlocked',
          title: copy.title,
          description: copy.description,
          unlockedAt: now,
          relatedUserId: refereeOid,
          referralId: referral._id,
          meta: { ...buildMeta(config, 'referrer'), milestoneIndex: idx },
        });
        await fulfillConfiguredReward(referrerOid, referral._id, config, 'referrer');
        referrerMilestoneAchieved = true;
        toGrant -= 1;
      }

      if (referrerMilestoneAchieved && config.referrerRewardType === 'credits') {
        rewardCredits = Number(config.referrerCredits ?? LEGACY_ENV_CREDITS);
        rewardSummary = { role: 'referrer', rewardType: 'credits', credits: rewardCredits };
      } else if (referrerMilestoneAchieved) {
        rewardSummary = { role: 'referrer', rewardType: config.referrerRewardType };
      }
    }

    return res.status(200).json({
      ok: true,
      action: 'completed',
      referralId: referral._id,
      rewardCredits,
      rewardSummary,
      referrerMilestoneAchieved,
    });
  } catch (e) {
    console.error('onFirstDocumentSentInternal', e);
    return res.status(500).json({ message: 'Internal error' });
  }
}

module.exports = {
  attachReferralOnSignup,
  getMyReferral,
  listRewards,
  onFirstDocumentSentInternal,
};
