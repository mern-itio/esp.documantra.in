const fs = require('fs');
const express = require('express');
const router = express.Router();
const multer = require('multer');

const { createEnvelope, forwardRecipientsRequest, getEnvelopeDetail, saveSignatureFields, updateEnvelope, sendEnvelope, getSignatureFields, addSignature } = require('../controllers/e-signController');
const validateSandboxApiKey = require('../middleware/apiKeyValidate');

// Multer config - temp storage for uploaded files
const upload = multer({ dest: 'uploads/' });

router.post( '/upload', validateSandboxApiKey, upload.array('files', 10),  // Accept up to 10 files, "files" should match frontend field
  async (req, res) => {
    // Don't forget to clean up temp files after the proxy call completes
    try {
      await createEnvelope(req, res);
    } finally {
      if (req.files && req.files.length) {
        req.files.forEach(f => {
          try { fs.unlinkSync(f.path); } catch (_) {}
        });
      }
    }
  }
);

router.post('/add-recipients', validateSandboxApiKey, forwardRecipientsRequest);
router.get('/envelope/:id',validateSandboxApiKey , getEnvelopeDetail);
router.post('/save-signature-fields', validateSandboxApiKey, saveSignatureFields);
router.post('/update',validateSandboxApiKey, updateEnvelope);
router.put('/send/:envelopeId', validateSandboxApiKey, sendEnvelope);
router.get('/signature/:id', validateSandboxApiKey, getSignatureFields);
router.post('/add-signature', validateSandboxApiKey, addSignature);

module.exports = router;
