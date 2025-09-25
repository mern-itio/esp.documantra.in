// controllers/certificateController.js
const Recipient = require('../models/Recipient');
const Envelope = require('../models/Envelope');
const { issueCertificate } = require('../services/pkiService');
const { logActivity } = require("../services/activityLogService");
const selfSigner = require('../models/selfSigner');

const issueCertController = async (req, res) => {
  try {
    const { recipientId, envelopeId, selfValue } = req.body;
    if (!recipientId || !envelopeId) {
      return res.status(400).json({ error: 'recipientId and envelopeId required' });
    }

    // Basic existence checks (prevents issuing for bad ids)
    if(selfValue !== "1"){
      const recipient = await Recipient.findById(recipientId).lean();
      if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
   } else{
      const recipient = await selfSigner.findById(recipientId).lean();
      if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
   }

    const envelope = await Envelope.findById(envelopeId).lean();
    if (!envelope) return res.status(404).json({ error: 'Envelope not found' });

    // Issue certificate (service should NOT return privateKey)
    const cert = await issueCertificate(recipientId, envelopeId, "test");

    // Step 3: Log certificate issued action
    await logActivity(envelopeId, "CERTIFICATE_ISSUED", "Sender", {
      recipientId,
      certificateId: cert.certificateId,
    });
    // cert should only contain safe fields: certificateId, publicKey, certPem, validTill
    return res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId: cert.certificateId,
      publicKey: cert.publicKey,
      certPem: cert.certPem,
      validTill: cert.validTill
    });
  } catch (err) {
    console.error('Cert issue error:', err);
    return res.status(500).json({ error: 'Failed to issue certificate' });
  }
};

module.exports = {
  issueCertController
};
