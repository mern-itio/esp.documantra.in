const Envelope = require('../models/Envelope');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const mongoose = require('mongoose');

const getUserId = (req) => req?.user?.data?.id || req?.user?.id || null;

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(String(value)) &&
  String(new mongoose.Types.ObjectId(String(value))) === String(value);

const isAnonymousDraftEnvelope = (envelope) => {
  if (!envelope) return false;
  const status = String(envelope.status || '').toLowerCase();
  return status === 'draft' && !envelope.sender;
};

const sendAccessDenied = (res, result) =>
  res.status(result.status).json({
    status: result.status,
    message: result.message,
    data: null,
  });

const loadEnvelope = async (envelopeId) =>
  Envelope.findById(envelopeId).populate({
    path: 'recipientIds',
    select: 'UserId email name',
  });

const isEnvelopeSender = (userId, envelope, req) => {
  if (!userId || !envelope?.sender) return false;
  if (String(envelope.sender) !== String(userId)) return false;

  const accountType = req?.headers?.['x-account-type'];
  const orgId = req?.headers?.['x-organization-id'];
  if (envelope.isOrganization && orgId) {
    return String(envelope.organizationId) === String(orgId);
  }
  return true;
};

const isEnvelopeRecipientFromPopulated = (userId, envelope) => {
  if (!userId || !Array.isArray(envelope?.recipientIds)) return false;
  const uid = String(userId);
  return envelope.recipientIds.some((recipient) => recipient?.UserId && String(recipient.UserId) === uid);
};

const isEnvelopeRecipient = async (userId, envelope) => {
  if (!userId || !envelope) return false;
  if (isEnvelopeRecipientFromPopulated(userId, envelope)) return true;

  const userRecipients = await Recipient.find({ UserId: userId }).select('_id').lean();
  if (!userRecipients.length) return false;

  const permission = await RecipientPermission.findOne({
    envelopeId: envelope._id,
    recipientId: { $in: userRecipients.map((entry) => entry._id) },
  }).lean();

  return Boolean(permission);
};

const userHasEnvelopeAccess = async (req, envelope) => {
  const userId = getUserId(req);
  if (!userId || !envelope) return false;
  if (req.userType === 'admin') return true;
  if (isEnvelopeSender(userId, envelope, req)) return true;
  return isEnvelopeRecipient(userId, envelope);
};

const assertAuthenticatedEnvelopeAccess = async (req, envelopeId, { requireSender = false } = {}) => {
  if (!isValidObjectId(envelopeId)) {
    return { ok: false, status: 400, message: 'Invalid envelope ID' };
  }

  const envelope = await loadEnvelope(envelopeId);
  if (!envelope) {
    return { ok: false, status: 404, message: 'Envelope not found' };
  }

  const userId = getUserId(req);
  if (!userId) {
    return { ok: false, status: 401, message: 'Authentication required' };
  }

  if (requireSender) {
    if (!isEnvelopeSender(userId, envelope, req) && req.userType !== 'admin') {
      return { ok: false, status: 403, message: 'Access denied' };
    }
    return { ok: true, envelope };
  }

  if (!(await userHasEnvelopeAccess(req, envelope))) {
    return { ok: false, status: 403, message: 'Access denied' };
  }

  return { ok: true, envelope };
};

const assertPublicSenderDraftAccess = async (req, envelopeId) => {
  if (!isValidObjectId(envelopeId)) {
    return { ok: false, status: 400, message: 'Invalid envelope ID' };
  }

  const envelope = await Envelope.findById(envelopeId);
  if (!envelope) {
    return { ok: false, status: 404, message: 'Envelope not found' };
  }

  const userId = getUserId(req);
  if (userId && isEnvelopeSender(userId, envelope, req)) {
    return { ok: true, envelope };
  }

  if (isAnonymousDraftEnvelope(envelope)) {
    return { ok: true, envelope };
  }

  return { ok: false, status: 403, message: 'Access denied' };
};

const filterAccessibleEnvelopeIds = async (req, envelopeIds = []) => {
  const uniqueIds = [...new Set((envelopeIds || []).map((id) => String(id)).filter(Boolean))];
  if (!uniqueIds.length) return [];

  const envelopes = await Envelope.find({ _id: { $in: uniqueIds } }).populate({
    path: 'recipientIds',
    select: 'UserId',
  });

  const allowed = [];
  for (const envelope of envelopes) {
    if (await userHasEnvelopeAccess(req, envelope)) {
      allowed.push(envelope._id.toString());
    }
  }
  return allowed;
};

module.exports = {
  getUserId,
  isAnonymousDraftEnvelope,
  sendAccessDenied,
  loadEnvelope,
  userHasEnvelopeAccess,
  assertAuthenticatedEnvelopeAccess,
  assertPublicSenderDraftAccess,
  filterAccessibleEnvelopeIds,
};
