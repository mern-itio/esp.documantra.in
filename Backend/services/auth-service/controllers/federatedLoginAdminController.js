const mongoose = require('mongoose');
const {
  getOrCreateFederatedLoginDoc,
  refreshFederatedLoginCache,
  getAdminFederatedLoginConfig,
  getPublicFederatedProviders,
  mergeWithDefaults,
  PROVIDER_ORDER,
} = require('../utils/federatedLoginPolicy');

function getAdminId(req) {
  return req.user?.id || req.user?.data?.id || req.user?._id || null;
}

async function getFederatedLoginConfig(req, res) {
  try {
    const payload = await getAdminFederatedLoginConfig();
    return res.status(200).json(payload);
  } catch (err) {
    console.error('getFederatedLoginConfig', err);
    return res.status(500).json({ message: 'Failed to load federated login settings' });
  }
}

async function updateFederatedLoginConfig(req, res) {
  try {
    const body = req.body || {};
    const incoming = Array.isArray(body.providers) ? body.providers : [];
    const doc = await getOrCreateFederatedLoginDoc();
    const current = mergeWithDefaults(doc);
    const incomingById = new Map(incoming.map((p) => [p.provider, p]));

    doc.providers = current.map((row) => {
      const patch = incomingById.get(row.provider) || {};
      const next = {
        provider: row.provider,
        enabled: patch.enabled !== undefined ? Boolean(patch.enabled) : row.enabled,
        clientId: patch.clientId !== undefined ? String(patch.clientId || '').trim() : row.clientId,
        callbackUrl: patch.callbackUrl !== undefined ? String(patch.callbackUrl || '').trim() : row.callbackUrl,
        scopes: patch.scopes !== undefined ? String(patch.scopes || '').trim() : row.scopes,
        clientSecret: row.clientSecret,
      };
      if (patch.clientSecret !== undefined && String(patch.clientSecret).trim()) {
        next.clientSecret = String(patch.clientSecret).trim();
      } else if (patch.clearClientSecret) {
        next.clientSecret = '';
      }
      return next;
    });

    const adminId = getAdminId(req);
    if (adminId && mongoose.Types.ObjectId.isValid(String(adminId))) {
      doc.updatedBy = adminId;
    }

    await doc.save();
    await refreshFederatedLoginCache();

    const payload = await getAdminFederatedLoginConfig();
    return res.status(200).json({
      ...payload,
      message: 'Federated login settings saved',
    });
  } catch (err) {
    console.error('updateFederatedLoginConfig', err);
    return res.status(500).json({ message: 'Failed to update federated login settings' });
  }
}

async function listPublicFederatedProviders(req, res) {
  try {
    await refreshFederatedLoginCache();
    const providers = await getPublicFederatedProviders();
    return res.status(200).json({ providers });
  } catch (err) {
    console.error('listPublicFederatedProviders', err);
    return res.status(500).json({ message: 'Failed to load login providers' });
  }
}

module.exports = {
  getFederatedLoginConfig,
  updateFederatedLoginConfig,
  listPublicFederatedProviders,
  PROVIDER_ORDER,
};
