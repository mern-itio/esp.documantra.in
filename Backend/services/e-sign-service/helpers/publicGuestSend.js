const axios = require('axios');
const Envelope = require('../models/Envelope');
const GuestPublicSendUsage = require('../models/GuestPublicSendUsage');
const { getUserId } = require('./envelopeAccess');

const PUBLIC_FREE_MONTHLY_LIMIT = Math.max(
  1,
  Number(process.env.PUBLIC_FREE_ENVELOPE_LIMIT || process.env.FREE_ENVELOPE_MONTHLY_LIMIT || 10),
);

const isPublicSendLimitDisabled = () =>
  String(process.env.SKIP_PUBLIC_SEND_LIMIT || '').toLowerCase() === 'true';

const SUBSCRIPTION_BASE = (
  process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:2110'
).replace(/\/+$/, '');

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

/** Fail closed: treat as free unless subscription clearly says paid. */
const isUserOnFreePlan = async (req) => {
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (!auth) return true;
  try {
    const res = await axios.get(`${SUBSCRIPTION_BASE}/user-plan/me`, {
      headers: { Authorization: auth },
      timeout: 5000,
    });
    const plan = res.data?.data || res.data || {};
    return plan.isFree !== false;
  } catch (err) {
    console.warn('[free-envelope-quota] plan lookup failed; enforcing free limit:', err.message);
    return true;
  }
};

const denyFreeLimit = (used) => ({
  ok: false,
  status: 429,
  message: `Free plan limit reached. You can send up to ${PUBLIC_FREE_MONTHLY_LIMIT} envelopes per month. Upgrade to send more.`,
  upgrade: true,
  ...buildLimitResponse(used),
});

/**
 * Hard monthly cap for free-plan authenticated users.
 * Never respects SKIP_PUBLIC_SEND_LIMIT — product rule is absolute for free.
 */
const assertFreeUserSendQuota = async (req) => {
  const userId = getUserId(req);
  if (!userId) {
    return { ok: true, ...buildLimitResponse(0) };
  }

  const free = await isUserOnFreePlan(req);
  if (!free) {
    return { ok: true, paid: true, ...buildLimitResponse(0, 999999) };
  }

  const used = await countUserSentThisMonth(userId);
  if (used >= PUBLIC_FREE_MONTHLY_LIMIT) {
    return denyFreeLimit(used);
  }
  return { ok: true, free: true, ...buildLimitResponse(used) };
};

const assertPublicSendQuota = async (req) => {
  const userId = getUserId(req);

  // Logged-in free users on the public path: always hard-capped (ignore SKIP).
  if (userId) {
    return assertFreeUserSendQuota(req);
  }

  if (isPublicSendLimitDisabled()) {
    return { ok: true, ...buildLimitResponse(0, 999999) };
  }

  const guestId = getPublicGuestId(req);
  if (!guestId) {
    return { ok: true, ...buildLimitResponse(0) };
  }

  const used = await getGuestUsageCount(guestId);
  if (used >= PUBLIC_FREE_MONTHLY_LIMIT) {
    return {
      ok: false,
      status: 429,
      message: `Free plan limit reached. You can send up to ${PUBLIC_FREE_MONTHLY_LIMIT} envelopes per month. Create a free account or upgrade to continue.`,
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
  isUserOnFreePlan,
  assertFreeUserSendQuota,
  assertPublicSendQuota,
  incrementPublicSendQuota,
  attachPublicGuestToEnvelope,
  listTrackedEnvelopeIdsForGuest,
};
