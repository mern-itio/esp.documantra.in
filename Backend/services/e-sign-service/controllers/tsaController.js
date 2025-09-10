// controllers/tsaController.js
const { requestTimestamp, verifyTimestamp } = require('../services/tsaService');
const { DigitalSignature } = require('../models/DigitalSignature');

async function requestTsaController(req, res) {
  try {
    const { digitalSignatureId, pdfHash, envelopeId, recipientId } = req.body;

    // prefer digitalSignatureId
    const opts = {};
    if (digitalSignatureId) opts.digitalSignatureId = digitalSignatureId;
    else opts.pdfHash = pdfHash, opts.envelopeId = envelopeId, opts.recipientId = recipientId;

    const { token, tokenJson } = await requestTimestamp(opts);

    // If digitalSignatureId provided, return updated record
    let signatureRecord = null;
    if (digitalSignatureId) {
      signatureRecord = await DigitalSignature.findById(digitalSignatureId);
    }

    res.json({ success: true, token, tokenJson, signatureRecord });
  } catch (err) {
    console.error('TSA request error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

function verifyTsaController(req, res) {
  try {
    const { token } = req.body;
    const payload = verifyTimestamp(token);
    res.json({ success: true, payload });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = { requestTsaController, verifyTsaController };
