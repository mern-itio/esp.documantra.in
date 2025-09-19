const express = require('express');
const router = express.Router();
const { advancedPdfEditorController, upload } = require('../controllers/advancedPdfEditorController');

// Upload PDF file
router.post('/upload', upload.single('pdf'), advancedPdfEditorController.uploadPdf);

// Extract text blocks with positions
router.get('/extract-text-blocks/:fileName/:pageNumber', advancedPdfEditorController.extractTextBlocks);

// Apply edits to PDF
router.post('/apply-edits', (req, res, next) => {
  console.log('=== APPLY EDITS ROUTE HIT ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  console.log('Request body keys:', Object.keys(req.body || {}));
  next();
}, advancedPdfEditorController.applyEdits);

// Download edited PDF
router.get('/download/:fileName', advancedPdfEditorController.downloadPdf);

// Get page preview as image
router.get('/preview', advancedPdfEditorController.getPagePreview);

// Serve uploaded PDF files
router.get('/file/:fileName', (req, res, next) => {
  console.log('File serving route hit:', req.params.fileName);
  next();
}, advancedPdfEditorController.servePdfFile);

// Test file upload endpoint
router.post('/test-upload', upload.single('pdf'), advancedPdfEditorController.testFileUpload);

// Test route to check if routing is working
router.get('/test', (req, res) => {
  res.json({ message: 'Advanced PDF Editor routes are working!' });
});

module.exports = router;
