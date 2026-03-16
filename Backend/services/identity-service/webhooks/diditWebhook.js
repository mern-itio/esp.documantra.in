// src/webhooks/diditWebhook.js
const express = require('express');
const router = express.Router();
const identityModal = require('../models/identityModal');
const axios = require('axios');

router.get('/', async (req, res) => {
  try {
    const { verificationSessionId, status } = req.query;

    if (!verificationSessionId || !status) {
      return res.status(400).send('Missing verificationSessionId or status');
    }

    // Find the record by verificationSessionId
    const sessionData = await identityModal.findOne({ sessionId: verificationSessionId });

    if (!sessionData) {
      return res.status(404).send('Record not found');
    }

    // Update the status field (or any other fields)
    sessionData.status = status;

    // Save the updated record
    await sessionData.save();
    // Update authRecord
        try{
          await axios.post(process.env.ESING_SERVICE_URL + '/api/e-sign/public/recipients/update-verification-status', {
            recipientId: sessionData.userId,
            providerId: sessionData.authProviderId,
            envelopeId: sessionData.envelopeId,
            verificationStatus: 'completed'
          });
          const redirectUrl = `${process.env.FRONTEND_URL}/e-sign/signing/${sessionData.envelopeId}/${sessionData.userId}`;
          // Redirect the user
          return res.redirect(redirectUrl);
    
        }catch (err){
          console.error("Failed to update recipient record after OTP verification:", err);
            return res.status(500).send('Something went wrong');
        }
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;