// src/controllers/identityController.js
const diditProvider = require('../providers/diditProvider');
const identitySession = require('../models/identityModal');

exports.startIdentity = async (req, res) => {
  try {
    const { userId,authProviderId,verificationUrl, workFLowId, webhookUrl,apiKey,envelopeId } = req.body;  
    console.log("User Id:", userId);
    console.log("Auth Provider Id:", authProviderId);
    console.log("Verification URL:", verificationUrl);
    console.log("Workflow ID:", workFLowId);
    console.log("Webhook URL:", webhookUrl);
    console.log("API Key:", apiKey);
    console.log("Envelope ID:", envelopeId);
     const data = await diditProvider.createSession(userId, verificationUrl, workFLowId, webhookUrl, apiKey, envelopeId, authProviderId);
     console.log('Didit response:', data);
       await identitySession.create({
            userId,
            envelopeId,
            authProviderId,
            sessionId: data.session_id
        });

    return res.json({ success: true, url:data.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start identity verification' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const session = await identitySession.findOne({ userId }).sort({ createdAt: -1 });
    console.log('Session found:', session);
    if (!session) {
      return res.status(404).json({ error: 'No identity session found for this user' });
    }
    return res.json(session);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get status' });
  }
};