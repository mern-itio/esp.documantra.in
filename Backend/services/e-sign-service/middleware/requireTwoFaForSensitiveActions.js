const axios = require('axios');

const isEsignTwoFaEnforcementEnabled = () =>
  String(process.env.REQUIRE_2FA_FOR_E_SIGN || '').toLowerCase() === 'true';

const requireTwoFaForSensitiveActions = async (req, res, next) => {
  if (!isEsignTwoFaEnforcementEnabled()) {
    return next();
  }

  const userId = req.user?.data?.id || req.user?.id;
  if (!userId) {
    return res.status(401).json({
      status: 401,
      message: 'Authentication required',
      data: null,
    });
  }

  try {
    const authUrl = String(process.env.AUTH_URL || 'http://127.0.0.1:2101').replace(/\/+$/, '');
    const { data } = await axios.get(`${authUrl}/api/user-details/${userId}`, {
      timeout: 5000,
    });

    if (!data?.data?.twoFaEnabled) {
      return res.status(403).json({
        status: 403,
        code: 'TWO_FA_SETUP_REQUIRED',
        message: 'Enable two-factor authentication before performing this action.',
        data: null,
      });
    }

    return next();
  } catch (err) {
    console.error('2FA enforcement check failed:', err.message);
    return res.status(503).json({
      status: 503,
      message: 'Unable to verify account security settings. Please try again.',
      data: null,
    });
  }
};

module.exports = requireTwoFaForSensitiveActions;
