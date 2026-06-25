const rateLimit = require('express-rate-limit');

const aiContentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please try again later.' },
});

module.exports = aiContentLimiter;
