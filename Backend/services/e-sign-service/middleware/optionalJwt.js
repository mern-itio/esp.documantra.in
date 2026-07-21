const jwt = require('jsonwebtoken');
const { extractAccessToken } = require('@draftnsign/auth-lib');

/**
 * Optionally attach req.user from Bearer header or httpOnly accessToken cookie (M14).
 * Does not reject unauthenticated requests — controllers decide access.
 */
const optionalJwt = () => async (req, res, next) => {
  try {
    const token = extractAccessToken(req, 'user');
    if (!token) return next();

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) return next();

    const decoded = jwt.verify(token, secret);
    if (decoded) {
      req.user = decoded;
      req.userType = 'user';
    }
  } catch {
    // Ignore invalid tokens on optional routes; access checks will still fail closed.
  }
  return next();
};

module.exports = optionalJwt;
