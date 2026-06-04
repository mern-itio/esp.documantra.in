const jwt = require('jsonwebtoken');
const verifyJWT = require('@draftnsign/auth-lib');

/**
 * Accepts normal user JWT OR a scoped public-flow token (wizard → editor without login).
 */
const verifyJWTOrPublicFlow = () => {
  return (req, res, next) => {
    const pathOnly = (req.originalUrl || req.url || '').split('?')[0];
    if (pathOnly.includes('/api/e-sign/public/')) {
      return res.status(404).json({
        status: 404,
        message:
          'Public e-sign route not found. Restart e-sign-service with the latest code.',
      });
    }

    const publicToken = req.headers['x-public-flow-token'];
    if (publicToken) {
      try {
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) {
          return res.status(500).json({ message: 'Server misconfiguration' });
        }
        const decoded = jwt.verify(publicToken, secret);
        if (
          decoded?.type !== 'public-flow' ||
          !decoded.envelopeId ||
          !decoded.senderId
        ) {
          return res.status(401).json({ message: 'Invalid public flow token' });
        }

        const requestedEnvelopeId =
          req.body?.envelopeId ||
          req.params?.envelopeId ||
          req.params?.id ||
          req.query?.envelopeId;

        if (
          requestedEnvelopeId &&
          String(requestedEnvelopeId) !== String(decoded.envelopeId)
        ) {
          return res.status(403).json({
            message: 'Public flow token is not valid for this envelope',
          });
        }

        const esignPath = pathOnly.replace(/^\/api\/e-sign/, '') || pathOnly;

        const allowed =
          esignPath === '/get-envelopes' ||
          esignPath === '/upload' ||
          esignPath === '/add-recipients' ||
          esignPath === '/save-signature-fields' ||
          esignPath === '/update-envelope' ||
          /^\/envelope\/[^/]+$/.test(esignPath) ||
          /^\/envelope\/get-signature-fields\//.test(esignPath) ||
          /^\/envelope\/remove-document\//.test(esignPath) ||
          /^\/envelope\/remove-signature-field\//.test(esignPath);

        if (!allowed) {
          return res.status(403).json({
            message: 'This action requires a full account login',
          });
        }

        req.user = { data: { id: decoded.senderId } };
        req.isPublicFlow = true;
        req.publicFlowEnvelopeId = String(decoded.envelopeId);
        return next();
      } catch {
        return res.status(401).json({ message: 'Invalid or expired public flow token' });
      }
    }

    return verifyJWT()(req, res, next);
  };
};

module.exports = verifyJWTOrPublicFlow;
