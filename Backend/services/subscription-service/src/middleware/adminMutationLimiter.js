const rateLimit = require('express-rate-limit');

const adminMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many admin billing changes. Please try again later.',
    data: null,
  },
});

module.exports = adminMutationLimiter;
