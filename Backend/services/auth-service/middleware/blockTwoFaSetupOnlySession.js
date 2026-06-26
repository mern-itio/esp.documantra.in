const isTwoFaSetupAllowedRequest = (req) => {
  const path = String(req.originalUrl || req.url || req.path || '').split('?')[0];
  const allowedPrefixes = [
    '/api/auth/me',
    '/api/auth/logout',
    '/api/auth/2fa',
    '/api/auth/validate-session',
  ];
  return allowedPrefixes.some((prefix) => path.includes(prefix));
};

const blockTwoFaSetupOnlySession = (req, res, next) => {
  if (!req.user?.twoFaSetupOnly) return next();
  if (isTwoFaSetupAllowedRequest(req)) return next();
  return res.status(403).json({
    status: 403,
    code: 'TWO_FA_SETUP_REQUIRED',
    message: 'Enable two-factor authentication to continue using the application.',
    setupPath: '/account/security',
    data: null,
  });
};

module.exports = {
  blockTwoFaSetupOnlySession,
  isTwoFaSetupAllowedRequest,
};
