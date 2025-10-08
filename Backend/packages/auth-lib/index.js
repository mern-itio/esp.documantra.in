const jwt = require('jsonwebtoken');
/**
 * Flexible JWT verification middleware
 * @param {'user' | 'admin'} type - specify which token type to verify
 */
const verifyJWT = (type = 'user') => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers?.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
      if (!token) {
        return res.status(401).json({
          status: 401,
          message: 'Missing or invalid token',
          data: null
        });
      }

      const secret =
        type === 'admin'
          ? process.env.ADMIN_ACCESS_TOKEN_SECRET
          : process.env.ACCESS_TOKEN_SECRET;
      if (!secret) {
        console.error(`[verifyToken] Missing JWT secret for ${type}`);
        return res.status(500).json({ message: 'Server misconfiguration: missing JWT secret' });
      }

      const decoded = jwt.verify(token, secret);
      if (!decoded) {
        return res.status(401).json({
          status: 401,
          message: 'Invalid or malformed token',
          data: null
        });
      }

      // Attach decoded data to request object
      req.user = decoded;
      req.userType = type;

      next();
    } catch (err) {
      console.error(`[verifyToken] ${type} verification failed:`, err.message);
      return res.status(403).json({
        status: 403,
        message: 'Invalid or expired token',
        data: null
      });
    }
  };
};

module.exports = verifyJWT;
