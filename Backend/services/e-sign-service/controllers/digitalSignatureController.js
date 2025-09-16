// controllers/digitalSignatureController.js
const { signAndEmbed } = require('../services/digitalSignatureService');
const Envelope  = require('../models/Envelope');
const { OtpLog } = require('../models/OtpLog');
const { AuditTrail } = require('../models/AuditTrail');

/**
 * Expects multipart/form-data:
 * - pdf: file
 * - envelopeId, documentId, recipientId, certificateId
 */
async function signDocumentController(req, res) {
  try {
    const { envelopeId, documentId, recipientId, certificateId } = req.body;

    // Optional: check OTP verified for this recipient and envelope if authLevel requires
    const envelope = await Envelope.findById(envelopeId);
    if (!envelope) return res.status(404).json({ error: 'Envelope not found' });

    // If envelope or recipient permission requires OTP, verify last OtpLog is verified
    // (Adjust logic to check recipient permission and envelope setting)
    // const otp = await OtpLog.findOne({ recipientId, envelopeId }).sort({ createdAt: -1 });
    // if (otp && otp.status !== 'verified') return res.status(403).json({ error: 'OTP not verified' });

    const signerName = req.body.signerName || '';

    const result = await signAndEmbed({
      envelopeId,
      documentId,
      recipientId,
      certificateId,
      signerName
    });

    res.status(201).json({
      message: 'Document signed successfully',
      signatureId: result.signatureRecord._id,
      signedDocumentId: result.signedDocument._id,
      pdfHash: result.pdfHash,
      tsaAttached: result.tsaAttached
    });
  } catch (err) {
    console.error('Sign controller error:', err);
    await AuditTrail.create({
      envelopeId: req.body ? req.body.envelopeId : null,
      recipientId: req.body ? req.body.recipientId : null,
      action: 'SIGN_CONTROLLER_ERROR',
      details: { error: err.message }
    });
    res.status(500).json({ error: err.message });
  }
}

module.exports = { signDocumentController };
