const { getAllowedOrigins } = require('@draftnsign/validators');

/**
 * Block bare OPTIONS probes (VAPT CWE-346) while allowing browser CORS preflight.
 */
const optionsGuard = (req, res, next) => {
  if (req.method !== 'OPTIONS') {
    return next();
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

module.exports = { optionsGuard };
