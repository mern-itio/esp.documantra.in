const { getAllowedOrigins } = require('@draftnsign/validators');

const SENSITIVE_OPTIONS_PATHS = new Set([
  '/login',
  '/google-login',
  '/facebook-login',
  '/linkedin-login',
  '/twitter-login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/admin/login',
  '/admin-forgot-password',
  '/admin-reset-password',
  '/admin/change-password',
  '/admin-change-password',
]);

const isSensitiveAuthOptionsPath = (path = '') => {
  const normalized = String(path).split('?')[0].toLowerCase();
  if (!normalized || normalized === '/') return false;
  if (SENSITIVE_OPTIONS_PATHS.has(normalized)) return true;
  if (normalized.startsWith('/api/auth')) return true;
  if (normalized.startsWith('/api-admin')) return true;
  if (normalized.startsWith('/2fa')) return true;
  if (normalized.startsWith('/admin/2fa')) return true;
  return false;
};

/**
 * Block OPTIONS enumeration on auth/login and other sensitive routes (VAPT CWE-346).
 * Must run before cors() so preflight is not answered with 204 + method list.
 */
const optionsGuard = (req, res, next) => {
  if (req.method !== 'OPTIONS') {
    return next();
  }

  if (isSensitiveAuthOptionsPath(req.path)) {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const origin = String(req.headers.origin || '').trim();
  if (!origin) {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const allowed = getAllowedOrigins();
  if (!allowed.includes(origin)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
};

module.exports = { optionsGuard, isSensitiveAuthOptionsPath };
