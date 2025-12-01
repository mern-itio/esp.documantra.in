const jwt = require('jsonwebtoken');
const verifyJWT = require('@draftnsign/auth-lib');
const { getAllJWTSecrets } = require('../utils/getJWTSecret');
const SupportAgent = require('../models/SupportAgent');

// Verify customer JWT (using existing auth-lib)
const verifyCustomerAuth = verifyJWT('user');

// Verify agent/admin JWT
const verifyAgentAuth = async (req, res, next) => {
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

    // Get all possible secrets to try (same order as token signing)
    const secretsToTry = getAllJWTSecrets();
    
    if (secretsToTry.length === 0) {
      console.error('JWT Secret missing! Set AGENT_ACCESS_TOKEN_SECRET, ADMIN_ACCESS_TOKEN_SECRET, or ACCESS_TOKEN_SECRET');
      return res.status(500).json({ 
        status: 500,
        message: 'Server misconfiguration: missing JWT secret. Please set at least one JWT secret in .env',
        data: null
      });
    }

    // Try all possible secrets in order (same priority as signing)
    let decoded = null;
    let lastError = null;

    for (const secretToTry of secretsToTry) {
      try {
        decoded = jwt.verify(token, secretToTry);
        // Check if token has agent/admin role
        if (decoded && (decoded.role === 'agent' || decoded.role === 'admin')) {
          req.agent = decoded;
          return next();
        }
        // If decoded but wrong role, continue to next secret
      } catch (err) {
        lastError = err;
        // Continue to try next secret
        continue;
      }
    }

    // If we get here, all secrets failed
    console.error('JWT verification failed with all secrets');
    console.error('Last error:', lastError?.message);
    console.error('Available secrets:', secretsToTry.length);
    console.error('Token preview:', token.substring(0, 30) + '...');
    
    // Try to decode without verification to see what's in the token
    try {
      const unverified = jwt.decode(token, { complete: true });
      if (unverified) {
        console.error('Token payload:', unverified.payload);
      }
    } catch (decodeErr) {
      // Ignore decode errors
    }
    
    return res.status(403).json({
      status: 403,
      message: `Invalid or expired token: ${lastError?.message || 'Signature verification failed'}`,
      data: null
    });
  } catch (err) {
    console.error('Agent auth verification failed:', err.message);
    return res.status(403).json({
      status: 403,
      message: `Invalid or expired token: ${err.message}`,
      data: null
    });
  }
};

// Verify admin JWT - Allow both admin and agent roles (unified dashboard)
const verifyAdminAuth = async (req, res, next) => {
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

    // Get all possible secrets to try (same order as token signing)
    const secretsToTry = getAllJWTSecrets();
    
    if (secretsToTry.length === 0) {
      console.error('JWT Secret missing! Set AGENT_ACCESS_TOKEN_SECRET, ADMIN_ACCESS_TOKEN_SECRET, or ACCESS_TOKEN_SECRET');
      return res.status(500).json({ 
        status: 500,
        message: 'Server misconfiguration: missing JWT secret. Please set at least one JWT secret in .env',
        data: null
      });
    }

    // Try all possible secrets in order (same priority as signing)
    let decoded = null;
    let lastError = null;

    for (const secretToTry of secretsToTry) {
      try {
        decoded = jwt.verify(token, secretToTry);
        // Allow both admin and agent roles for unified dashboard
        if (decoded && (decoded.role === 'admin' || decoded.role === 'agent')) {
          req.admin = decoded;
          req.userRole = decoded.role; 
          if (decoded.role === 'agent') {
            console.log(`Agent ${decoded.email}: Using support-service agent ID ${decoded.id} for ticket operations`);
          }
          
          return next();
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    console.error('Admin auth verification failed with all secrets');
    console.error('Last error:', lastError?.message);
    
    return res.status(403).json({
      status: 403,
      message: `Invalid or expired token: ${lastError?.message || 'Signature verification failed'}`,
      data: null
    });
  } catch (err) {
    console.error('Admin auth verification failed:', err.message);
    return res.status(403).json({
      status: 403,
      message: 'Invalid or expired token',
      data: null
    });
  }
};

module.exports = {
  verifyCustomerAuth,
  verifyAgentAuth,
  verifyAdminAuth
};

