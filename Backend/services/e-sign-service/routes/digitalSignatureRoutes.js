const express = require('express');
const { signDocumentController } = require('../controllers/digitalSignatureController');
const { addSignature } = require('../controllers/mainController');
const { downloadSignedDocument,downloadAllSignedDocument } = require('../controllers/documentController');
const { pdfUpload } = require('../utils/secureUpload');

const router = express.Router();

// Advanced compliance-based signature submission
router.post('/signatures/sign', pdfUpload.single('pdf'), signDocumentController);

// New: Signature with visible + compliance integration '
router.post('/add-signature', addSignature);

// New: Download signed PDF
router.get('/signatures/download/:documentId', downloadSignedDocument);
router.get('/signatures/download-all/:envelopeId', downloadAllSignedDocument);

module.exports = router;
