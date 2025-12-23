const express = require('express');
const router = express.Router();
const {
  generateAIContent,
  convertTextToPDF,
  generateAIContentStream,
  storePendingDocument,
  getPendingDocument,
  deletePendingDocument
} = require('../controllers/aiContentController');

// Public routes (no auth required)
router.post('/generate', generateAIContent);
router.post('/generate-stream', generateAIContentStream);
router.post('/convert-to-pdf', convertTextToPDF);
router.post('/store-pending', storePendingDocument);
router.get('/pending-document', getPendingDocument);
router.delete('/pending-document/:documentId', deletePendingDocument);

module.exports = router;
