// controllers/verificationController.js
const { verifySignedDocumentBySignedDocId } = require('../services/verificationService');

exports.verifySignedDocument = async (req, res) => {
  try {
    const { signedDocumentId } = req.params;
    const result = await verifySignedDocumentBySignedDocId(signedDocumentId);
    return res.json({ ok: true, result });
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
