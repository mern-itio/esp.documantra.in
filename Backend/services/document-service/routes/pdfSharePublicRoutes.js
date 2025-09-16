const express = require('express');
const fs = require('fs');
const pdfShareController = require('../controllers/pdfShareController');
const SharedDocument = require('../models/SharedDocument');

console.log('📁 Loading PDF Share Public Routes...');

const router = express.Router();

// Test endpoint to check if public routes are working
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({
    success: true,
    message: 'Public PDF share routes are working',
    timestamp: new Date().toISOString(),
    path: '/public/pdf-share/test'
  });
});

// Simple health check
router.get('/', (req, res) => {
  console.log('🏥 Health check endpoint called');
  res.json({
    success: true,
    message: 'PDF Share Public Routes are active',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to list all shared documents
router.get('/debug/all', async (req, res) => {
  try {
    const sharedDocuments = await SharedDocument.find({})
      .populate('documentId', 'name size')
      .select('shareToken ownerName isActive expiresAt createdAt allowComments')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      count: sharedDocuments.length,
      documents: sharedDocuments.map(doc => ({
        shareToken: doc.shareToken,
        documentName: doc.documentId?.name,
        ownerName: doc.ownerName,
        isActive: doc.isActive,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt,
        allowComments: doc.allowComments
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shared documents',
      error: error.message
    });
  }
});

// Public Routes (No Authentication Required)
console.log('🔗 Registering public routes: /view/:shareToken and /download/:shareToken');
router.post('/view/:shareToken', pdfShareController.getSharedDocument);
router.post('/download/:shareToken', pdfShareController.downloadSharedDocument);

// Additional public routes for direct access (must be after specific routes)
router.get('/:shareToken/comments', pdfShareController.getSharedDocumentComments);
router.post('/:shareToken/comments', pdfShareController.addSharedDocumentComment);
router.get('/:shareToken', pdfShareController.getSharedDocument);

// Public PDF file access for shared documents
router.get('/file/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    console.log('📄 Public PDF file access for token:', shareToken);

    const sharedDocument = await SharedDocument.findOne({ shareToken })
      .populate('documentId');

    if (!sharedDocument) {
      return res.status(404).json({
        success: false,
        message: 'Shared document not found'
      });
    }

    // Check if share is accessible
    if (!sharedDocument.isAccessible()) {
      return res.status(403).json({
        success: false,
        message: 'This shared document is no longer accessible'
      });
    }

    const document = sharedDocument.documentId;
    const filePath = document.filePath;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.setHeader('Content-Length', document.size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving public PDF file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve PDF file',
      error: error.message
    });
  }
});

console.log('✅ PDF Share Public Routes loaded successfully');
module.exports = router;
