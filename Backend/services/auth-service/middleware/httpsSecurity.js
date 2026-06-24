const helmet = require('helmet');

const shouldEnforceHttps = () =>
  process.env.ENFORCE_HTTPS === 'true' || process.env.NODE_ENV === 'production';

const enforceHttps = (req, res, next) => {
  if (!shouldEnforceHttps()) {
    return next();
  }

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();

  const isHttps = req.secure || forwardedProto === 'https';
  if (isHttps) {
    return next();
  }

  const host = req.get('host');
  if (!host) {
    return res.status(400).json({ message: 'HTTPS is required' });
  }

  return res.redirect(301, `https://${host}${req.originalUrl}`);
};

const httpsSecurityMiddleware = [
  helmet({
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
    },
    contentSecurityPolicy: false,
  }),
  enforceHttps,
];

module.exports = {
  enforceHttps,
  httpsSecurityMiddleware,
};
