const express = require('express');
const multer = require('multer');
const path = require('path');
// Configure multer storage (files go to /uploads folder)
const { envelopesDetail,getSignatureFields,addSignature, activityLogs,getEnvelopePower,signerInitiate,getSelfSigner,saveNonSignatureField,saveupdateSignature,LinkUserRecipient, assignEnvelopeToSomeoneElsePublic, declineEnvelopePublic,acceptTerms,fetchCurrentRecipient, getRecipientAuditTrail } = require('../controllers/mainController');

const {updateAuthStatus} = require('../controllers/recipientController');
const vSignController = require('../controllers/vSignController');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads')); // one level up from /routes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const router = express.Router();

router.get('/health', (_, res) => res.send('E-Sign Public Service is running...'));
router.get('/envelope/:id', envelopesDetail);
router.get('/document/signature-fields/:id/:mode?', getSignatureFields);
router.post('/save-signature', saveupdateSignature);
router.post('/add-signature', addSignature); 
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
router.post('/envelope/accept-terms',acceptTerms);
router.post('/fetch/current-recipient',fetchCurrentRecipient);
//V Sign
router.post('/start-esign', vSignController.startEsign);
router.post('/v-sign/response', vSignController.esignResponse);
module.exports = router;
