const Envelope = require('../models/Envelope');
const GuestPublicSendUsage = require('../models/GuestPublicSendUsage');
const { getUserId } = require('./envelopeAccess');

const PUBLIC_FREE_MONTHLY_LIMIT = Number(process.env.PUBLIC_FREE_ENVELOPE_LIMIT || 10);

const getMonthKey = (date = new Date()) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getMonthStart = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));

const readCookieValue = (req, name) => {
  const header = req.headers?.cookie;
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== name) continue;
    const raw = trimmed.slice(eq + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
};

const getPublicGuestId = (req) => {
  const header = req.headers['x-public-guest-id'];
  if (header && String(header).trim()) return String(header).trim();
  const bodyGuest = req.body?.guestId;
  if (bodyGuest && String(bodyGuest).trim()) return String(bodyGuest).trim();
  const cookieGuest = readCookieValue(req, 'publicGuestId');
  if (cookieGuest && String(cookieGuest).trim()) return String(cookieGuest).trim();
  return null;
};

const unclaimedSenderFilter = {
  $or: [{ sender: null }, { sender: { $exists: false } }],
};

const countUserSentThisMonth = async (userId) => {
  if (!userId) return 0;
  return Envelope.countDocuments({
    sender: userId,
    status: { $nin: ['draft', 'deleted'] },
    updatedAt: { $gte: getMonthStart() },
  });
};

const getGuestUsageCount = async (guestId) => {
  if (!guestId) return 0;
  const row = await GuestPublicSendUsage.findOne({ guestId, monthKey: getMonthKey() }).lean();
  return row?.count || 0;
};

const buildLimitResponse = (used, limit = PUBLIC_FREE_MONTHLY_LIMIT) => ({
  used,
  limit,
  remaining: Math.max(0, limit - used),
  monthKey: getMonthKey(),
});

const assertPublicSendQuota = async (req) => {
  const userId = getUserId(req);
  const guestId = getPublicGuestId(req);

  if (userId) {
    const used = await countUserSentThisMonth(userId);
    if (used >= PUBLIC_FREE_MONTHLY_LIMIT) {
      return {
        ok: false,
        status: 429,
        message: `Free plan limit reached. You can send up to ${PUBLIC_FREE_MONTHLY_LIMIT} documents per month. Upgrade to send more.`,
        upgrade: true,
        ...buildLimitResponse(used),
      };
    }
    return { ok: true, ...buildLimitResponse(used) };
  }

  if (!guestId) {
    return { ok: true, ...buildLimitResponse(0) };
  }

  const used = await getGuestUsageCount(guestId);
  if (used >= PUBLIC_FREE_MONTHLY_LIMIT) {
    return {
      ok: false,
      status: 429,
      message: `Free plan limit reached. You can send up to ${PUBLIC_FREE_MONTHLY_LIMIT} documents per month. Create a free account or upgrade to continue.`,
      upgrade: true,
      ...buildLimitResponse(used),
    };
  }

  return { ok: true, ...buildLimitResponse(used) };
};

const incrementPublicSendQuota = async (req, envelopeId) => {
  const userId = getUserId(req);
  if (userId) return;

  const guestId = getPublicGuestId(req);
  if (!guestId) return;

  const monthKey = getMonthKey();
  const update = { $inc: { count: 1 } };
  if (envelopeId) {
    update.$addToSet = { envelopeIds: String(envelopeId) };
  }

  await GuestPublicSendUsage.findOneAndUpdate(
    { guestId, monthKey },
    update,
    { upsert: true, new: true },
  );
};

const attachPublicGuestToEnvelope = async (envelope, req) => {
  if (!envelope || envelope.sender) return envelope;
  const guestId = getPublicGuestId(req);
  if (!guestId) return envelope;
  if (envelope.publicGuestId !== guestId) {
    envelope.publicGuestId = guestId;
    await envelope.save();
  }
  return envelope;
};

const listTrackedEnvelopeIdsForGuest = async (guestId) => {
  if (!guestId) return [];
  const rows = await GuestPublicSendUsage.find({ guestId }).select('envelopeIds').lean();
  return [...new Set(rows.flatMap((row) => (row.envelopeIds || []).map(String)))];
};

module.exports = {
  PUBLIC_FREE_MONTHLY_LIMIT,
  getMonthKey,
  getPublicGuestId,
  unclaimedSenderFilter,
  countUserSentThisMonth,
  getGuestUsageCount,
  buildLimitResponse,
  assertPublicSendQuota,
  incrementPublicSendQuota,
  attachPublicGuestToEnvelope,
  listTrackedEnvelopeIdsForGuest,
};
