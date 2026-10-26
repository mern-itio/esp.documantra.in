// src/webhooks/diditWebhook.js
const express = require('express');
const router = express.Router();
const identityModal = require('../models/identityModal');
const diditProvider = require('../providers/diditProvider');
const axios = require('axios');

function htmlPage(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 560px; margin: 48px auto; padding: 0 16px; color: #111; }
    .ok { color: #14532d; background: #dcfce7; border: 1px solid #86efac; padding: 12px 14px; border-radius: 8px; }
    .warn { color: #92400e; background: #fef3c7; border: 1px solid #fcd34d; padding: 12px 14px; border-radius: 8px; }
    a { color: #1B4D3E; }
    code { font-size: 12px; word-break: break-all; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
}

router.get('/', async (req, res) => {
  try {
    const { verificationSessionId, status } = req.query;

    if (!verificationSessionId || !status) {
      return res.status(400).send('Missing verificationSessionId or status');
    }

    let sessionData = await identityModal.findOne({ sessionId: String(verificationSessionId) });

    const mappedStatus = diditProvider.mapVerificationStatus(status);

    // Orphan callback (admin test / share link / session not persisted yet)
    if (!sessionData) {
      try {
        sessionData = await identityModal.create({
          sessionId: String(verificationSessionId),
          provider: 'didit',
          status: mappedStatus,
          decisionStatus: String(status),
          isAdminTest: true,
        });
      } catch (createErr) {
        console.warn('Could not upsert orphan Didit session:', createErr.message);
      }

      const adminSessions =
        (process.env.ADMIN_FRONTEND_URL || 'http://127.0.0.1:5174').replace(/\/+$/, '') +
        '/admin/verification-sessions';

      return res
        .status(200)
        .send(
          htmlPage(
            'Didit verification received',
            `<div class="warn">
              <p><strong>Verification callback received</strong> (${String(status)}).</p>
              <p>No matching eSign recipient session was found for this Didit session (often an admin test or share-link run).</p>
              <p>Session: <code>${String(verificationSessionId)}</code></p>
              <p><a href="${adminSessions}">Open Verification Sessions</a></p>
            </div>`
          )
        );
    }

    sessionData.status = mappedStatus;
    sessionData.decisionStatus = String(status);
    await sessionData.save();

    // Admin / test sessions: no envelope to update
    if (!sessionData.envelopeId || !sessionData.userId || !sessionData.authProviderId) {
      const adminSessions =
        (process.env.ADMIN_FRONTEND_URL || 'http://127.0.0.1:5174').replace(/\/+$/, '') +
        '/admin/verification-sessions';
      return res
        .status(200)
        .send(
          htmlPage(
            'Didit verification complete',
            `<div class="ok">
              <p><strong>Verification updated:</strong> ${String(status)} → <code>${mappedStatus}</code></p>
              <p>Session: <code>${String(verificationSessionId)}</code></p>
              <p><a href="${adminSessions}">Open Verification Sessions</a></p>
            </div>`
          )
        );
    }

    try {
      await axios.post(
        process.env.ESING_SERVICE_URL + '/api/e-sign/public/recipients/update-verification-status',
        {
          recipientId: sessionData.userId,
          providerId: sessionData.authProviderId,
          envelopeId: sessionData.envelopeId,
          verificationStatus: mappedStatus,
        }
      );

      const redirectUrl = `${process.env.FRONTEND_URL}/e-sign/signer/${sessionData.envelopeId}/${sessionData.userId}`;
      return res.redirect(redirectUrl);
    } catch (err) {
      console.error('Failed to update recipient after Didit verification:', err.response?.data || err.message);
      return res.status(500).send('Something went wrong');
    }
  } catch (error) {
    console.error('Error updating Didit webhook record:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
