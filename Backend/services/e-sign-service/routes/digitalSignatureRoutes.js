const express = require('express');
const { signDocumentController } = require('../controllers/digitalSignatureController');
const { addSignature } = require('../controllers/mainController');
const { downloadSignedDocument, downloadAllSignedDocument, downloadCompletionCertificate } = require('../controllers/documentController');
const { pdfUpload } = require('../utils/secureUpload');
const optionalJwt = require('../middleware/optionalJwt');

const router = express.Router();

// Advanced compliance-based signature submission
router.post('/signatures/sign', pdfUpload.single('pdf'), signDocumentController);

// New: Signature with visible + compliance integration '
router.post('/add-signature', addSignature);

// Download signed PDFs — optional JWT + envelope/recipient/fileToken checks in controller
router.get('/signatures/download/:documentId', optionalJwt(), downloadSignedDocument);
router.get('/signatures/download-all/:envelopeId', optionalJwt(), downloadAllSignedDocument);
router.get('/signatures/completion-certificate/:envelopeId', optionalJwt(), downloadCompletionCertificate);

module.exports = router;
