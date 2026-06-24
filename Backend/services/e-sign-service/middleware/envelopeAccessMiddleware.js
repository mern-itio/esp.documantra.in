const {
  assertAuthenticatedEnvelopeAccess,
  assertPublicSenderDraftAccess,
  sendAccessDenied,
} = require('../helpers/envelopeAccess');

const resolveEnvelopeId = (req, options = {}) => {
  const { param, fromBody = false, optional = false } = options;
  const envelopeId =
    req.params?.[param] ||
    req.params?.envelopeId ||
    req.params?.id ||
    (fromBody ? req.body?.envelopeId : null);

  if (!envelopeId && !optional) {
    return { error: { ok: false, status: 400, message: 'Envelope ID is required' } };
  }

  return { envelopeId };
};

const requireAuthenticatedEnvelopeAccess = ({ param = 'envelopeId', requireSender = false, fromBody = false, optional = false } = {}) =>
  async (req, res, next) => {
    try {
      const { envelopeId, error } = resolveEnvelopeId(req, { param, fromBody, optional });
      if (error) return sendAccessDenied(res, error);
      if (!envelopeId) return next();

      const access = await assertAuthenticatedEnvelopeAccess(req, envelopeId, { requireSender });
      if (!access.ok) return sendAccessDenied(res, access);

      req.envelope = access.envelope;
      return next();
    } catch (err) {
      return next(err);
    }
  };

const requirePublicDraftOrSenderAccess = ({ param = 'envelopeId', fromBody = false, optional = false } = {}) =>
  async (req, res, next) => {
    try {
      const { envelopeId, error } = resolveEnvelopeId(req, { param, fromBody, optional });
      if (error) return sendAccessDenied(res, error);
      if (!envelopeId) return next();

      const userId = req?.user?.data?.id || req?.user?.id;
      const access = userId
        ? await assertAuthenticatedEnvelopeAccess(req, envelopeId, { requireSender: true })
        : await assertPublicSenderDraftAccess(req, envelopeId);

      if (!access.ok) return sendAccessDenied(res, access);

      req.envelope = access.envelope;
      return next();
    } catch (err) {
      return next(err);
    }
  };

module.exports = {
  requireAuthenticatedEnvelopeAccess,
  requirePublicDraftOrSenderAccess,
};
