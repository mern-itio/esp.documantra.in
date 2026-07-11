const jwt = require('jsonwebtoken');

const PORTAL_TOKEN_TTL = process.env.RECIPIENT_PORTAL_TOKEN_TTL || '90d';
const PORTAL_VIEW_PERMISSION = 'recipient_portal:view_documents';

function getPortalTokenSecret() {
  return (
    process.env.RECIPIENT_PORTAL_JWT_SECRET ||
    process.env.JWT_SECRET ||
    process.env.INTERNAL_SERVICE_KEY ||
    'recipient-portal-dev-secret'
  );
}

function normalizePortalEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function buildRecipientPortalUrl(frontendUrl, email) {
  const base = String(frontendUrl || '').replace(/\/+$/, '');
  const path = `${base}/e-sign/recipient-portal`;
  const normalized = normalizePortalEmail(email);
  if (!normalized) return path;
  return `${path}?email=${encodeURIComponent(normalized)}`;
}

function signRecipientPortalToken(email, options = {}) {
  const normalizedEmail = normalizePortalEmail(email);
  return jwt.sign(
    {
      type: 'recipient_portal',
      email: normalizedEmail,
      sessionId: options.sessionId || undefined,
      permissions: options.permissions || [PORTAL_VIEW_PERMISSION],
    },
    getPortalTokenSecret(),
    { expiresIn: options.expiresIn || PORTAL_TOKEN_TTL },
  );
}

function verifyRecipientPortalToken(token) {
  const decoded = jwt.verify(token, getPortalTokenSecret());
  if (!decoded || decoded.type !== 'recipient_portal' || !decoded.email) {
    throw new Error('Invalid portal token');
  }
  return {
    email: normalizePortalEmail(decoded.email),
    sessionId: decoded.sessionId || null,
    permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [PORTAL_VIEW_PERMISSION],
    exp: decoded.exp,
  };
}

module.exports = {
  signRecipientPortalToken,
  verifyRecipientPortalToken,
  normalizePortalEmail,
  buildRecipientPortalUrl,
  PORTAL_VIEW_PERMISSION,
};
