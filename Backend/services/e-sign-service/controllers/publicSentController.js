const mongoose = require('mongoose');
const Envelope = require('../models/Envelope');
const RecipientPermission = require('../models/RecipientPermission');
const { getUserId } = require('../helpers/envelopeAccess');
const {
  assertPublicSendQuota,
  attachPublicGuestToEnvelope,
  getPublicGuestId,
  PUBLIC_FREE_MONTHLY_LIMIT,
  buildLimitResponse,
  countUserSentThisMonth,
  getGuestUsageCount,
  unclaimedSenderFilter,
  listTrackedEnvelopeIdsForGuest,
} = require('../helpers/publicGuestSend');

const formatEnvelopeRow = (envelope, recipients = []) => ({
  id: String(envelope._id),
  name: envelope.name || envelope.subject || 'Untitled document',
  subject: envelope.subject || envelope.name || 'Untitled document',
  status: envelope.status,
  createdAt: envelope.createdAt,
  updatedAt: envelope.updatedAt,
  recipientCount: recipients.length,
  completedCount: recipients.filter((r) => String(r.status || '').toLowerCase() === 'completed').length,
});

const getSendUsage = async (req, res) => {
  try {
    const quota = await assertPublicSendQuota(req);
    if (!quota.ok) {
      return res.status(200).json({
        ...buildLimitResponse(quota.used || PUBLIC_FREE_MONTHLY_LIMIT),
        limitReached: true,
      });
    }
    return res.status(200).json({
      ...buildLimitResponse(quota.used || 0),
      limitReached: false,
    });
  } catch (error) {
    console.error('getSendUsage failed:', error);
    return res.status(500).json({ message: 'Failed to load send usage' });
  }
};

const listSentEnvelopes = async (req, res) => {
  try {
    const userId = getUserId(req);
    const guestId = getPublicGuestId(req);
    const filter = userId
      ? { sender: userId, status: { $nin: ['draft', 'deleted'] } }
      : guestId
        ? { publicGuestId: guestId, status: { $nin: ['draft', 'deleted'] } }
        : null;

    if (!filter) {
      return res.status(200).json({ envelopes: [], usage: buildLimitResponse(0) });
    }

    const envelopes = await Envelope.find(filter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const rows = await Promise.all(
      envelopes.map(async (envelope) => {
        const permissions = await RecipientPermission.find({ envelopeId: envelope._id })
          .populate('recipientId', 'name email status')
          .lean();
        const recipients = permissions
          .map((p) => p.recipientId)
          .filter(Boolean);
        return formatEnvelopeRow(envelope, recipients);
      }),
    );

    const used = userId
      ? await countUserSentThisMonth(userId)
      : guestId
        ? await getGuestUsageCount(guestId)
        : 0;

    return res.status(200).json({
      envelopes: rows,
      usage: buildLimitResponse(used),
    });
  } catch (error) {
    console.error('listSentEnvelopes failed:', error);
    return res.status(500).json({ message: 'Failed to load sent documents' });
  }
};

const claimGuestEnvelopes = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const guestId = getPublicGuestId(req);
    if (!guestId) {
      return res.status(200).json({ claimed: 0 });
    }

    const senderId = mongoose.Types.ObjectId.isValid(String(userId))
      ? new mongoose.Types.ObjectId(String(userId))
      : userId;

    const byGuestId = await Envelope.updateMany(
      {
        publicGuestId: guestId,
        ...unclaimedSenderFilter,
      },
      { $set: { sender: senderId } },
    );

    const trackedIds = await listTrackedEnvelopeIdsForGuest(guestId);
    let byTrackedIds = { modifiedCount: 0 };
    if (trackedIds.length) {
      byTrackedIds = await Envelope.updateMany(
        {
          _id: { $in: trackedIds },
          ...unclaimedSenderFilter,
        },
        { $set: { sender: senderId, publicGuestId: guestId } },
      );
    }

    const claimed =
      (byGuestId.modifiedCount || 0) + (byTrackedIds.modifiedCount || 0);

    return res.status(200).json({ claimed });
  } catch (error) {
    console.error('claimGuestEnvelopes failed:', error);
    return res.status(500).json({ message: 'Failed to claim guest documents' });
  }
};

const enforcePublicSendLimit = async (req, res, next) => {
  try {
    const quota = await assertPublicSendQuota(req);
    if (!quota.ok) {
      return res.status(quota.status).json({
        message: quota.message,
        upgrade: quota.upgrade,
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getSendUsage,
  listSentEnvelopes,
  claimGuestEnvelopes,
  enforcePublicSendLimit,
  attachPublicGuestToEnvelope,
};
