// src/controllers/identityController.js
const diditProvider = require('../providers/diditProvider');
const surepassDigilockerProvider = require('../providers/surepassDigilockerProvider');
const identitySession = require('../models/identityModal');

const resolvePublicBaseUrl = () => {
  const explicit = process.env.IDENTITY_SERVICE_PUBLIC_URL || process.env.PUBLIC_IDENTITY_SERVICE_URL;
  if (explicit && String(explicit).trim()) {
    return String(explicit).trim().replace(/\/+$/, '');
  }
  return (process.env.IDENTITY_SERVICE_URL || `http://localhost:${process.env.PORT || 2114}`).replace(/\/+$/, '');
};

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

exports.startDigilocker = async (req, res) => {
  try {
    const {
      userId,
      authProviderId,
      apiKey,
      envelopeId,
      webhookUrl,
      redirectUrl,
      apiBaseUrl,
      authType,
      logoUrl,
      skipMainScreen,
      initializePath,
    } = req.body;

    const publicBase = resolvePublicBaseUrl();
    const effectiveWebhook = webhookUrl || `${publicBase}/webhook/surepass-digilocker`;
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const effectiveRedirect = redirectUrl || `${publicBase}/webhook/surepass-digilocker/return`;

    const data = await surepassDigilockerProvider.initializeSession({
      apiKeyRef: apiKey,
      apiBaseUrl,
      authType: authType || 'link',
      webhookUrl: effectiveWebhook,
      redirectUrl: effectiveRedirect,
      logoUrl,
      skipMainScreen: skipMainScreen === true || skipMainScreen === 'true',
      initializePath: initializePath || '/api/v1/digilocker/initialize',
    });

    const clientId = data?.data?.client_id;
    if (!clientId) {
      return res.status(502).json({
        success: false,
        message: 'Surepass response missing client_id',
      });
    }

    let verificationUrl = surepassDigilockerProvider.extractVerificationUrl(data);
    if (!verificationUrl && data?.data?.token) {
      const gatewayBase = (apiBaseUrl || process.env.SUREPASS_API_BASE_URL || 'https://sandbox.surepass.app')
        .replace(/\/+$/, '');
      verificationUrl = `${gatewayBase}/digilocker?token=${encodeURIComponent(data.data.token)}`;
    }

    if (!verificationUrl) {
      return res.status(502).json({
        success: false,
        message: 'Surepass response missing verification URL',
      });
    }

    await identitySession.create({
      userId,
      envelopeId,
      authProviderId,
      provider: 'digilocker_link',
      sessionId: clientId,
      status: 'pending',
    });

    return res.json({
      success: true,
      url: verificationUrl,
      clientId,
      redirectUrl: `${frontendUrl}/e-sign/signer/${envelopeId}/${userId}`,
    });
  } catch (err) {
    console.error('Failed to start Surepass Digilocker session:', err.response?.data || err.message);
    const status = err.code === 'SUREPASS_TOKEN_MISSING' ? 400 : 500;
    return res.status(status).json({
      success: false,
      message: err.response?.data?.message || err.message || 'Failed to start Digilocker verification',
    });
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