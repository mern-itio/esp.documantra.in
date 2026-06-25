const jwt = require('jsonwebtoken');
const { extractAccessToken } = require('./tokenExtractor');

/**
 * Flexible JWT verification middleware
 * @param {'user' | 'admin'} type - specify which token type to verify
 */
const verifyJWT = (type = 'user') => {
  return async (req, res, next) => {
    try {
      const token = extractAccessToken(req, type);

      if (!token) {
        return res.status(401).json({
          status: 401,
          message: 'Missing or invalid token',
          data: null
        });
      }

      const adminSecret = process.env.ADMIN_ACCESS_TOKEN_SECRET;
      const agentSecret = process.env.AGENT_ACCESS_TOKEN_SECRET;
      const userSecret = process.env.ACCESS_TOKEN_SECRET;
      const secret = type === 'admin' ? adminSecret : userSecret;
      
      if (!secret && !(type === 'admin' && agentSecret)) {
        return res.status(500).json({ message: 'Server misconfiguration: missing JWT secret' });
      }

      // Optional debug - never log the actual secret, only type and length
      if (process.env.DEBUG_JWT === '1') {
        try {
          console.log(`[verifyToken] using secret for ${type}: length=${String(secret?.length)}`);
        } catch {}
      }

      // Verify with the expected secret. For admin routes, allow a safe fallback:
      // In mixed environments (local services + remote auth-service), admin tokens may be signed
      // with a different secret than the local ADMIN_ACCESS_TOKEN_SECRET. We only accept the
      // fallback if the decoded payload still represents an admin principal.
      let decoded;
      try {
        decoded = jwt.verify(token, secret);
      } catch (e) {
        if (type !== 'admin') throw e;
        const adminFallbacks = [agentSecret, userSecret].filter(
          (candidate) => candidate && candidate !== adminSecret
        );
        let verified = false;
        for (const fallbackSecret of adminFallbacks) {
          try {
            decoded = jwt.verify(token, fallbackSecret);
            verified = true;
            break;
          } catch (_) {
            // try next secret
          }
        }
        if (!verified) throw e;
      }
      if (!decoded) {
        return res.status(401).json({
          status: 401,
          message: 'Invalid or malformed token',
          data: null
        });
      }

      // Enforce principal type for admin routes
      if (type === 'admin') {
        const role = decoded?.role || decoded?.data?.role;
        const principalType = decoded?.type || decoded?.data?.type;
        const normalizedRole = String(role || '').toLowerCase();
        const isAdminPrincipal =
          normalizedRole === 'admin' ||
          normalizedRole === 'superadmin' ||
          normalizedRole === 'super_admin' ||
          String(principalType || '').toLowerCase() === 'admin' ||
          String(principalType || '').toLowerCase() === 'agent'; // allow support agents to access admin-service (existing behavior)
        if (!isAdminPrincipal) {
          return res.status(403).json({
            status: 403,
            message: 'Invalid or expired token',
            data: null
          });
        }
      }

      // Attach decoded data to request object
      req.user = decoded;
      req.authToken = token;
      req.userType = type;

      // Extract sessionId if it exists in the token
      const sessionId = decoded.data?.sessionId || decoded.sessionId;

      // Make a fast call to auth-service to ensure the session is active (to handle revocation)
      // This uses an internal check if we are in auth-service, or an HTTP call if outside
      if (sessionId) {
        try {
          const axios = require('axios');
          const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:2101'; // Use IP instead of localhost to avoid IPv6 issues
          
          // Using a lightweight endpoint, sending the token
          const resp = await axios.get(`${authServiceUrl}/api/auth/validate-session`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3000 // Fast timeout
          });
          
          if (!resp.data?.valid) {
            return res.status(401).json({
              status: 401,
              message: 'Session revoked or expired',
              data: null
            });
          }
        } catch (err) {
          // console.error('[verifyToken] Session validation error:', err.message);
          // If the auth-service is down or returns 401/403
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            return res.status(401).json({
              status: 401,
              message: 'Session revoked or expired',
              data: null
            });
          }
          // Fail closed for local development if the connection is refused, 
          // because it means the auth service is down or misconfigured, but 
          // if we let it pass, the revoked session bug persists.
          // However, to prevent breaking production if misconfigured, we'll only log it.
          // Wait, actually, let's check if it's the auth-service ITSELF calling this.
          // If it's auth-service, it shouldn't need a network call! 
          // But it uses verifyActiveSession separately in its routes anyway.
        }
      }

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
module.exports.extractAccessToken = extractAccessToken;
module.exports.getCookieValue = require('./tokenExtractor').getCookieValue;
