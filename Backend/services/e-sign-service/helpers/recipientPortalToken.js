const jwt = require('jsonwebtoken');

const PORTAL_TOKEN_TTL = '24h';

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

function signRecipientPortalToken(email) {
  const normalizedEmail = normalizePortalEmail(email);
  return jwt.sign(
    {
      type: 'recipient_portal',
      email: normalizedEmail,
    },
    getPortalTokenSecret(),
    { expiresIn: PORTAL_TOKEN_TTL },
  );
}

function verifyRecipientPortalToken(token) {
  const decoded = jwt.verify(token, getPortalTokenSecret());
  if (!decoded || decoded.type !== 'recipient_portal' || !decoded.email) {
    throw new Error('Invalid portal token');
  }
  return {
    email: normalizePortalEmail(decoded.email),
    exp: decoded.exp,
  };
}

module.exports = {
  signRecipientPortalToken,
  verifyRecipientPortalToken,
  normalizePortalEmail,
  buildRecipientPortalUrl,
};
