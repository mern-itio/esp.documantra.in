const jwt = require('jsonwebtoken');

const optionalJwt = () => async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
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
