const ESignApiKey = require('../models/apiKey');
const { touchSandboxKeyLastUsed } = require('../utils/recordSandboxKeyUsage');

module.exports = async function validateSandboxApiKey(req, res, next) {
  const apiKey = req.headers['x-sandbox-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: "Missing X-Sandbox-Api-Key header" });
  }

  const keyDoc = await ESignApiKey.findOne({ apiKey, mode: 'sandbox', isActive: true });

  if (!keyDoc) {
    return res.status(403).json({ error: "Invalid or inactive sandbox API key" });
  }
  req.keyDoc = keyDoc;
  touchSandboxKeyLastUsed(keyDoc).catch(() => {});
  next();
};
