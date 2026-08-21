const jwt = require('jsonwebtoken');

const SIGNER_ACCESS_PURPOSE = 'signer_access';
const LINK_TTL_DAYS = Number(process.env.SIGNER_ACCESS_LINK_TTL_DAYS || 30);
const SESSION_TTL = '24h';

function getSecret() {
  return (
    process.env.SIGNER_ACCESS_JWT_SECRET ||
    process.env.RECIPIENT_PORTAL_JWT_SECRET ||
    process.env.JWT_SECRET ||
    'signer-access-dev-secret'
  );
}

function createSignerLinkToken({ envelopeId, recipientId }) {
  return jwt.sign(
    {
      type: SIGNER_ACCESS_PURPOSE,
      envelopeId: String(envelopeId),
      recipientId: String(recipientId),
      link: true,
    },
    getSecret(),
    { expiresIn: `${Math.max(LINK_TTL_DAYS, 1)}d` },
  );
}

function createSignerSessionToken({ envelopeId, recipientId, email }) {
  return jwt.sign(
    {
      type: SIGNER_ACCESS_PURPOSE,
      envelopeId: String(envelopeId),
      recipientId: String(recipientId),
      email: String(email || '').toLowerCase(),
      link: false,
    },
    getSecret(),
    { expiresIn: SESSION_TTL },
  );
}

function verifySignerAccessToken(token, { envelopeId, recipientId } = {}) {
  const decoded = jwt.verify(token, getSecret());
  if (!decoded || decoded.type !== SIGNER_ACCESS_PURPOSE) {
    throw new Error('Invalid signer access token');
  }
  if (envelopeId && String(decoded.envelopeId) !== String(envelopeId)) {
    throw new Error('Signer access token envelope mismatch');
  }
  if (recipientId && String(decoded.recipientId) !== String(recipientId)) {
    throw new Error('Signer access token recipient mismatch');
  }
  return decoded;
}

function buildPublicSignerUrl(envelopeId, recipientId) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const token = createSignerLinkToken({ envelopeId, recipientId });
  return `${frontendUrl}/e-sign/signer/${envelopeId}/${recipientId}?accessToken=${encodeURIComponent(token)}`;
}

function isSignerAccessOtpEnabled() {
  if (process.env.DISABLE_SIGNER_ACCESS_OTP === 'true') return false;
  if (process.env.DISABLE_SIGNER_ACCESS_OTP === 'false') return true;
  // Local dev: skip email OTP by default (Mailgun/SMTP often not configured)
  if (process.env.NODE_ENV !== 'production') return false;
  return true;
}

module.exports = {
  createSignerLinkToken,
  createSignerSessionToken,
  verifySignerAccessToken,
  buildPublicSignerUrl,
  isSignerAccessOtpEnabled,
};
