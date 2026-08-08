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
  sendEnvelope,
  getEnvSignFields,
} = require('../controllers/mainController');

const {
  Upload,
  insertRecipient,
  saveSignatureFields
} = require('../controllers/eSignController');

const {updateAuthStatus,saveAadhaar,patchSigningEvidence} = require('../controllers/recipientController');
const {
  requestRecipientPortalCode,
  verifyRecipientPortalCode,
  refreshRecipientPortalSession,
  listRecipientPortalDocuments,
  getRecipientPortalDocumentViewer,
  downloadRecipientPortalDocument,
} = require('../controllers/recipientPortalController');
const {
  checkSignerAccess,
  requestSignerAccessCode,
  verifySignerAccessCode,
} = require('../controllers/signerAccessController');
const {
  listEnvelopeComments,
  createEnvelopeComment,
  resolveEnvelopeComment,
  replyToEnvelopeCommentByRecipient,
} = require('../controllers/envelopeCommentController');
const recipientPortalAuth = require('../middleware/recipientPortalAuth');
const requireSignerAccess = require('../middleware/requireSignerAccess');
const vSignController = require('../controllers/vSignController');
const { upload } = require('../utils/secureUpload');
const { viewDocument } = require('../controllers/documentViewController');
const {
  requirePublicDraftOrSenderAccess,
} = require('../middleware/envelopeAccessMiddleware');

const router = express.Router();
const publicDraftWrite = requirePublicDraftOrSenderAccess({ fromBody: true, optional: true });
const publicDraftWriteRequired = requirePublicDraftOrSenderAccess({ fromBody: true });
const publicSendEnvelope = requirePublicDraftOrSenderAccess();

router.get('/health', (_, res) => res.send('E-Sign Public Service is running...'));
router.get('/documents/:documentId/view', viewDocument);
router.get('/envelope/:id', envelopesDetail);
router.get(
  '/envelope/get-signature-fields/:envelopeId',
  requirePublicDraftOrSenderAccess(),
  getEnvSignFields,
);
router.get('/document/signature-fields/:id/:mode?', getSignatureFields);
router.post(
  '/upload',
  publicDraftWrite,
  upload.array('files'),
  Upload
);
router.post(
  '/add-recipients',
  publicDraftWriteRequired,
  insertRecipient
);

router.post(
  '/send-envelope/:envelopeId',
  publicSendEnvelope,
  sendEnvelope
);

router.post('/save-signature-fields', publicDraftWriteRequired, saveSignatureFields);

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
router.get(
  '/envelope/:envelopeId/recipient/:recipientId/comments',
  requireSignerAccess,
  listEnvelopeComments,
);
router.post(
  '/envelope/:envelopeId/recipient/:recipientId/comments',
  requireSignerAccess,
  createEnvelopeComment,
);
router.patch(
  '/envelope/:envelopeId/recipient/:recipientId/comments/:commentId/resolve',
  requireSignerAccess,
  resolveEnvelopeComment,
);
router.post(
  '/envelope/:envelopeId/recipient/:recipientId/comments/:commentId/reply',
  requireSignerAccess,
  replyToEnvelopeCommentByRecipient,
);
router.post('/recipients/update-verification-status',updateAuthStatus);
router.post('/signing-evidence', patchSigningEvidence);
router.post('/recipients/validate',validateRecipient);
router.post('/save-aadhaar', saveAadhaar);  
router.post('/envelope/accept-terms',acceptTerms);
router.post('/fetch/current-recipient',fetchCurrentRecipient);
router.post('/recipient-portal/request-code', requestRecipientPortalCode);
router.post('/recipient-portal/verify-code', verifyRecipientPortalCode);
router.post('/recipient-portal/refresh-session', refreshRecipientPortalSession);
router.get('/recipient-portal/documents', recipientPortalAuth, listRecipientPortalDocuments);
router.get(
  '/recipient-portal/documents/:envelopeId/:recipientId/viewer',
  recipientPortalAuth,
  getRecipientPortalDocumentViewer,
);
router.get(
  '/recipient-portal/documents/:envelopeId/:recipientId/files/:documentId',
  recipientPortalAuth,
  downloadRecipientPortalDocument,
);
router.get('/signer-access/check', checkSignerAccess);
router.post('/signer-access/request-code', requestSignerAccessCode);
router.post('/signer-access/verify-code', verifySignerAccessCode);
//V Sign
// router.post('/start-esign', vSignController.startEsign);
router.post('/v-sign/response', vSignController.esignResponse);

// Prevent unmatched /api/e-sign/public/* requests from falling through to JWT-protected routes.
router.use((req, res) => {
  res.status(404).json({ message: `Public route not found: ${req.method} ${req.path}` });
});

module.exports = router;
