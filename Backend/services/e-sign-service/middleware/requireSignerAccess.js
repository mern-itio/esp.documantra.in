const { evaluateSignerAccess } = require('../helpers/signerAccessGate');

async function requireSignerAccess(req, res, next) {
  try {
    const envelopeId = req.params.envelopeId || req.params.id;
    const recipientId = req.params.recipientId || req.query.recipientId || req.body?.recipientId;

    if (!envelopeId || !recipientId) {
      return res.status(400).json({
        status: 'error',
        message: 'envelopeId and recipientId are required',
      });
    }

    const gate = await evaluateSignerAccess(req, envelopeId, recipientId);
    if (!gate.ok) {
      return res.status(gate.status || 403).json({
        status: 'error',
        message: gate.message || 'Signer access verification required',
        requiresAccessVerification: !!gate.requiresAccessVerification,
        expired: !!gate.expired,
        maskedEmail: gate.maskedEmail || null,
      });
    }

    req.signerAccess = { envelopeId, recipientId };
    return next();
  } catch (error) {
    console.error('requireSignerAccess error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to verify signer access',
    });
  }
}

module.exports = requireSignerAccess;
