const express = require('express');
const documentTrackingController = require('../controllers/documentTrackingController');
const router = express.Router();

// Get the multer upload middleware from the controller
const { upload } = documentTrackingController;

// Test endpoint to verify tracking is working
router.get('/test', async (req, res) => {
  try {
    const DocumentTracking = require('../models/documentTracking');
    const testRecord = new DocumentTracking({
      documentId: 'test-' + Date.now(),
      documentName: 'Test Document',
      documentType: 'pdf',
      originalFilename: 'test.pdf',
      userId: 'test-user',
      action: 'view',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      isTracked: true,
      trackingSource: 'automatic',
      metadata: { test: true, timestamp: new Date() }
    });
    
    await testRecord.save();
    res.json({ 
      success: true, 
      message: 'Test tracking record created successfully',
      recordId: testRecord._id
    });
  } catch (error) {
    console.error('Test tracking failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Test tracking failed',
      details: error.message 
    });
  }
});

// Log events (for automatic tracking)
router.post('/log', documentTrackingController.logEvent);

// Upload document for manual tracking - now with multer middleware
router.post('/upload', upload.single('document'), documentTrackingController.uploadDocumentForTracking);

// Access document via shareable link (GET redirects to frontend, POST logs access)
router.get('/share/:linkToken', documentTrackingController.accessSharedDocument);
router.post('/share/:linkToken', documentTrackingController.accessSharedDocument);

// Download shared document
router.get('/download/:linkToken', documentTrackingController.downloadSharedDocument);

// Get tracked documents summary
router.get('/documents', documentTrackingController.getTrackedDocuments);

// Get tracking for a specific document
router.get('/document/:documentId', documentTrackingController.getDocumentTracking);

// Get user activity (for current authenticated user)
router.get('/user/activity', documentTrackingController.getUserActivity);

// Get audit trail
router.get('/audit-trail', documentTrackingController.getAuditTrail);

// Get dashboard statistics
router.get('/dashboard-stats', documentTrackingController.getDashboardStats);

// Export tracking data
router.get('/export', documentTrackingController.exportTrackingData);

module.exports = router;
