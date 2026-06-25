const rateLimit = require('express-rate-limit');

const createAdminWriteLimiter = (message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message, data: null },
  });

const planMutationLimiter = createAdminWriteLimiter(
  'Too many plan changes. Please try again later.'
);

const creditPackageMutationLimiter = createAdminWriteLimiter(
  'Too many credit package changes. Please try again later.'
);

const templateMutationLimiter = createAdminWriteLimiter(
  'Too many template operations. Please try again later.'
);

const pdfToolMutationLimiter = createAdminWriteLimiter(
  'Too many PDF tool changes. Please try again later.'
);

module.exports = {
  planMutationLimiter,
  creditPackageMutationLimiter,
  templateMutationLimiter,
  pdfToolMutationLimiter,
};
