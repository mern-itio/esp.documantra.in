const jwt = require('jsonwebtoken');

const verifyJWT = (secretOrPublicKey) => {
  return async (req, res, next) => {
    const token = req.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).send('Missing token');
    }

    try {
      const decoded = jwt.verify(token, secretOrPublicKey);
      console.log("Token Decoded",decoded);
      req.user = decoded;

      if (!decoded) {
        return res.status(401).json({
          status: 401,
          message: "Invalid Access token",
          data: null
        });
      }

      next();
    } catch (err) {
      res.status(403).send('Invalid or expired token');
    }
  };
};

module.exports = verifyJWT;
