const helmet = require('helmet');

const applySecurityHeaders = (app) => {
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );
};

module.exports = {
  applySecurityHeaders,
};
