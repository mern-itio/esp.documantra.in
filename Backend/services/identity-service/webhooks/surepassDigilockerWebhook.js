const express = require('express');
const axios = require('axios');
const identityModal = require('../models/identityModal');
const surepassProvider = require('../providers/surepassDigilockerProvider');

const router = express.Router();

const normalizeStatus = (status) => String(status || '').toLowerCase();

const isSuccessStatus = (status) => {
  const value = normalizeStatus(status);
  return value === 'success' || value === 'completed' || value === 'approved';
};

const findSession = async ({ clientId, sessionId }) => {
  if (clientId) {
    const byClient = await identityModal.findOne({ sessionId: clientId });
    if (byClient) return byClient;
  }
  if (sessionId) {
    return identityModal.findOne({ sessionId });
  }
  return null;
};

const completeVerification = async (sessionData, status) => {
  sessionData.status = normalizeStatus(status) || 'success';
  await sessionData.save();

  if (!process.env.ESING_SERVICE_URL) {
    console.warn('ESING_SERVICE_URL missing; skipping recipient verification update');
    return;
  }

  await axios.post(`${process.env.ESING_SERVICE_URL}/api/e-sign/public/recipients/update-verification-status`, {
    recipientId: sessionData.userId,
    providerId: sessionData.authProviderId,
    envelopeId: sessionData.envelopeId,
    verificationStatus: 'completed',
  });
};

const buildSignerRedirect = (sessionData) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  return `${frontendUrl}/e-sign/signer/${sessionData.envelopeId}/${sessionData.userId}`;
};

const handleWebhookPayload = async (payload) => {
  const clientId = payload?.client_id || payload?.clientId || payload?.data?.client_id;
  const status = payload?.status || payload?.data?.status;
  const type = payload?.type || payload?.data?.type;

  if (type && normalizeStatus(type) !== 'digilocker') {
    return { handled: false, reason: 'unsupported_type' };
  }

  if (!clientId) {
    return { handled: false, reason: 'missing_client_id' };
  }

  const sessionData = await findSession({ clientId });
  if (!sessionData) {
    return { handled: false, reason: 'session_not_found', clientId };
  }

  if (!isSuccessStatus(status)) {
    sessionData.status = normalizeStatus(status) || 'failed';
    await sessionData.save();
    return { handled: true, success: false, clientId };
  }

  await completeVerification(sessionData, status);
  return { handled: true, success: true, clientId, sessionData };
};

router.post('/', async (req, res) => {
  try {
    const result = await handleWebhookPayload(req.body || {});
    if (!result.handled) {
      return res.status(result.reason === 'session_not_found' ? 404 : 400).json({
        success: false,
        message: result.reason,
      });
    }

    return res.status(200).json({ success: true, status: result.success ? 'completed' : 'failed' });
  } catch (error) {
    console.error('Surepass Digilocker webhook error:', error?.response?.data || error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.get('/return', async (req, res) => {
  try {
    const clientId = req.query.client_id || req.query.clientId;
    const status = req.query.status || 'success';

    if (!clientId) {
      return res.status(400).send('Missing client_id');
    }

    const sessionData = await findSession({ clientId });
    if (!sessionData) {
      return res.status(404).send('Session not found');
    }

    if (isSuccessStatus(status)) {
      await completeVerification(sessionData, status);
    } else {
      sessionData.status = normalizeStatus(status) || 'failed';
      await sessionData.save();
    }

    return res.redirect(buildSignerRedirect(sessionData));
  } catch (error) {
    console.error('Surepass Digilocker return redirect error:', error?.response?.data || error.message);
    return res.status(500).send('Internal Server Error');
  }
});

router.get('/status/:clientId', async (req, res) => {
  try {
    const sessionData = await findSession({ clientId: req.params.clientId });
    if (!sessionData) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    return res.json({
      success: true,
      status: sessionData.status,
      clientId: sessionData.sessionId,
      envelopeId: sessionData.envelopeId,
      userId: sessionData.userId,
    });
  } catch (error) {
    console.error('Surepass Digilocker status error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
