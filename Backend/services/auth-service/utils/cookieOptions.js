const ACCESS_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '8h';

const parseExpiryToMs = (expireIn) => {
  if (!expireIn) return ACCESS_TOKEN_MAX_AGE_MS;
  if (typeof expireIn === 'number') return expireIn;

  const value = String(expireIn).trim();
  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) return ACCESS_TOKEN_MAX_AGE_MS;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * (multipliers[unit] || ACCESS_TOKEN_MAX_AGE_MS);
};

const isSecureRequest = (req) => {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  if (process.env.NODE_ENV === 'production') return true;
  return Boolean(
    req?.secure ||
    String(req?.headers?.['x-forwarded-proto'] || '').split(',')[0].trim() === 'https'
  );
};

const getAccessTokenCookieOptions = (req, expireIn = DEFAULT_ACCESS_TOKEN_EXPIRY) => ({
  httpOnly: true,
  secure: isSecureRequest(req),
  sameSite: 'lax',
  maxAge: parseExpiryToMs(expireIn),
});

const getAdminAccessTokenCookieOptions = (req, expireIn = process.env.ADMIN_ACCESS_TOKEN_EXPIRY || '8h') => ({
  httpOnly: true,
  secure: isSecureRequest(req),
  sameSite: 'strict',
  maxAge: parseExpiryToMs(expireIn),
});

module.exports = {
  getAccessTokenCookieOptions,
  getAdminAccessTokenCookieOptions,
  isSecureRequest,
};
