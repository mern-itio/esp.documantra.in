const helmet = require('helmet');

const applySecurityHeaders = (app) => {
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      hsts: false,
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xPoweredBy: false,
    })
  );
};

module.exports = {
  applySecurityHeaders,
};
