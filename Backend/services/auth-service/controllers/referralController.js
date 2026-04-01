const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Reward = require('../models/Reward');

const REFERRAL_REWARD_CREDITS = parseInt(process.env.REFERRAL_REWARD_CREDITS || '10', 10);

async function grantReferralCredits(userId, referralId, rewardKind) {
  try {
    const rawBase = process.env.SUBSCRIPTION_SERVICE_URL || 'http://165.22.215.73:2110';
    const base = String(rawBase).replace(/\/+$/, '');
    const key = process.env.INTERNAL_SERVICE_KEY;
    if (!base || !key || !userId) return;

    await axios.post(
      `${base}/user-plan/internal/grant-credits`,
      {
        userId: String(userId),
        credits: REFERRAL_REWARD_CREDITS,
        reason: `referral_${rewardKind}`,
        referralId: String(referralId || ''),
      },
      { headers: { 'x-internal-key': key }, timeout: 8000 }
    );
  } catch (e) {
    console.warn('grantReferralCredits failed:', e?.response?.data?.message || e?.message || e);
  }
}

function normalizeReferrerId(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!mongoose.Types.ObjectId.isValid(s)) return null;
  return s;
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

  user.referredBy = referrer._id;
  await user.save({ validateBeforeSave: false });

  const dup = await Referral.findOne({ refereeId: user._id });
  if (dup) return;

  const refDoc = await Referral.create({
    referrerId: referrer._id,
    refereeId: user._id,
    status: 'pending',
  });

  await Reward.create({
    userId: user._id,
    kind: 'referee_welcome',
    status: 'pending',
    title: 'Welcome reward',
    description: `Unlocks ${REFERRAL_REWARD_CREDITS} credits when you send your first document successfully.`,
    relatedUserId: referrer._id,
    referralId: refDoc._id,
    meta: { credits: REFERRAL_REWARD_CREDITS },
  });

  await Reward.create({
    userId: referrer._id,
    kind: 'referrer_bonus',
    status: 'pending',
    title: 'Referral reward',
    description: `Unlocks ${REFERRAL_REWARD_CREDITS} credits when your invite sends their first document successfully.`,
    relatedUserId: user._id,
    referralId: refDoc._id,
    meta: { credits: REFERRAL_REWARD_CREDITS },
  });
}

async function getMyReferral(req, res) {
  try {
    const userId = req.user?.data?.id || req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const rawBase = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://165.22.215.73:8081';
    const base = String(rawBase).replace(/\/+$/, '') || 'http://165.22.215.73:8081';
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

    const [referrerUnlockedCount, refereeUnlockedCount] = await Promise.all([
      Reward.countDocuments({ userId: rid, kind: 'referrer_bonus', status: 'unlocked' }),
      Reward.countDocuments({ userId: rid, kind: 'referee_welcome', status: 'unlocked' }),
    ]);

    return res.status(200).json({
      referralLink,
      stats: {
        completedReferrals: completed,
        pendingReferrals: pending,
        totalReferrals: completed + pending,
        referrerUnlockedRewards: referrerUnlockedCount,
        refereeUnlockedRewards: refereeUnlockedCount,
        creditsPerReward: REFERRAL_REWARD_CREDITS,
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

    referral.status = 'completed';
    referral.firstEnvelopeId = envelopeId
      ? new mongoose.Types.ObjectId(String(envelopeId))
      : null;
    referral.completedAt = new Date();
    await referral.save();

    const now = new Date();

    const refereeOid = new mongoose.Types.ObjectId(String(user._id));
    const referrerOid = new mongoose.Types.ObjectId(String(referral.referrerId));

    const refereeUnlock = await Reward.updateMany(
      {
        referralId: referral._id,
        kind: 'referee_welcome',
        userId: refereeOid,
        status: 'pending',
      },
      { $set: { status: 'unlocked', unlockedAt: now, 'meta.credits': REFERRAL_REWARD_CREDITS } }
    );
    if ((refereeUnlock.modifiedCount || 0) > 0) {
      await grantReferralCredits(refereeOid, referral._id, 'referee_welcome');
    }

    const referrerUnlock = await Reward.updateMany(
      {
        referralId: referral._id,
        kind: 'referrer_bonus',
        userId: referrerOid,
        status: 'pending',
      },
      { $set: { status: 'unlocked', unlockedAt: now, 'meta.credits': REFERRAL_REWARD_CREDITS } }
    );
    if ((referrerUnlock.modifiedCount || 0) > 0) {
      await grantReferralCredits(referrerOid, referral._id, 'referrer_bonus');
    }

    return res.status(200).json({
      ok: true,
      action: 'completed',
      referralId: referral._id,
      rewardCredits: REFERRAL_REWARD_CREDITS,
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
