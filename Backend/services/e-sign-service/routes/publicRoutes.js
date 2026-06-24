const express = require('express');
// Configure multer storage (files go to /uploads folder)
//const { envelopesDetail,getSignatureFields,addSignature, activityLogs,getEnvelopePower,signerInitiate,getSelfSigner,saveNonSignatureField,saveupdateSignature,LinkUserRecipient, assignEnvelopeToSomeoneElsePublic, declineEnvelopePublic,acceptTerms,fetchCurrentRecipient, getRecipientAuditTrail,completeSignature,validateRecipient } = require('../controllers/mainController');

const {
  envelopesDetail,
  getSignatureFields,
  addSignature,
  activityLogs,
  getEnvelopePower,
  signerInitiate,
  getSelfSigner,
  saveNonSignatureField,
  saveupdateSignature,
  LinkUserRecipient,
  assignEnvelopeToSomeoneElsePublic,
  declineEnvelopePublic,
  acceptTerms,
  fetchCurrentRecipient,
  getRecipientAuditTrail,
  completeSignature,
  validateRecipient,
  sendEnvelope
} = require('../controllers/mainController');

const {
  Upload,
  insertRecipient,
  saveSignatureFields
} = require('../controllers/eSignController');

const {updateAuthStatus,saveAadhaar} = require('../controllers/recipientController');
const vSignController = require('../controllers/vSignController');
const { upload } = require('../utils/secureUpload');

const router = express.Router();

router.get('/health', (_, res) => res.send('E-Sign Public Service is running...'));
router.get('/envelope/:id', envelopesDetail);
router.get('/document/signature-fields/:id/:mode?', getSignatureFields);
router.post(
  '/upload',
  upload.array('files'),
  Upload
);
router.post(
  '/add-recipients',
  insertRecipient
);

router.post(
  '/send-envelope/:envelopeId',
  sendEnvelope
);

router.post('/save-signature-fields', saveSignatureFields);

router.post('/save-signature', saveupdateSignature);
router.post('/add-signature', addSignature); 
router.post('/signature-complete',completeSignature);
router.get('/envelope/activity-log/:envelopeId', activityLogs);
router.get('/envelope/power/:powerFormId/:envelopeId',getEnvelopePower);
router.post('/envelope/signer-initiate',signerInitiate);
router.get('/envelope/self-signer/:cycleId',getSelfSigner);
router.post('/save-non-signature-field', saveNonSignatureField);
router.post('/link-user-recipient', LinkUserRecipient);
router.post('/envelope/assign-to-someone-else', assignEnvelopeToSomeoneElsePublic);
router.post('/envelope/decline', declineEnvelopePublic);
router.get('/envelope/:envelopeId/recipient/:recipientId/audit-trail', getRecipientAuditTrail);
router.post('/recipients/update-verification-status',updateAuthStatus);
router.post('/recipients/validate',validateRecipient);
router.post('/save-aadhaar', saveAadhaar);  
router.post('/envelope/accept-terms',acceptTerms);
router.post('/fetch/current-recipient',fetchCurrentRecipient);
//V Sign
// router.post('/start-esign', vSignController.startEsign);
router.post('/v-sign/response', vSignController.esignResponse);

// Prevent unmatched /api/e-sign/public/* requests from falling through to JWT-protected routes.
router.use((req, res) => {
  res.status(404).json({ message: `Public route not found: ${req.method} ${req.path}` });
});

module.exports = router;
