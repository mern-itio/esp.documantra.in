const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const Envelope = require('../models/Envelope');
const {
  verifySignerAccessToken,
  isSignerAccessOtpEnabled,
} = require('./signerAccessToken');

function maskEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const [local, domain] = normalized.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

function extractSignerAccessToken(req) {
  const authHeader = String(req.headers.authorization || '');
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return (
    String(req.query.accessToken || '').trim() ||
    String(req.headers['x-signer-access-token'] || '').trim()
  );
}

function envelopeRequiresSignerAccess(status) {
  const normalized = String(status || '').toLowerCase();
  return ['in-progress', 'sent', 'active'].includes(normalized);
}

async function evaluateSignerAccess(req, envelopeId, recipientId) {
  if (!isSignerAccessOtpEnabled()) {
    return { ok: true };
  }

  const token = extractSignerAccessToken(req);
  if (token) {
    try {
      verifySignerAccessToken(token, { envelopeId, recipientId });
      return { ok: true };
    } catch (error) {
      const expired = error?.name === 'TokenExpiredError';
      const recipient = await Recipient.findById(recipientId).select('email').lean();
      return {
        ok: false,
        expired,
        requiresAccessVerification: true,
        maskedEmail: maskEmail(recipient?.email),
        message: expired
          ? 'Your signing link has expired. Request a new access code.'
          : 'Signer access verification required',
      };
    }
  }

  const [recipient, permission, envelope] = await Promise.all([
    Recipient.findById(recipientId).select('email').lean(),
    RecipientPermission.findOne({ envelopeId, recipientId }).select('status role').lean(),
    Envelope.findById(envelopeId).select('status').lean(),
  ]);

  if (!recipient || !permission || !envelope) {
    return { ok: false, status: 404, message: 'Recipient access not found' };
  }

  if (!envelopeRequiresSignerAccess(envelope.status)) {
    return { ok: true };
  }

  return {
    ok: false,
    requiresAccessVerification: true,
    maskedEmail: maskEmail(recipient.email),
    message: 'Signer access verification required',
  };
}

module.exports = {
  maskEmail,
  extractSignerAccessToken,
  envelopeRequiresSignerAccess,
  evaluateSignerAccess,
};
