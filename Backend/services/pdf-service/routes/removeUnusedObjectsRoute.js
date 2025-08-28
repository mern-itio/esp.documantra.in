const express = require('express');
const multer = require('multer');
const path = require('path');
const removeUnusedObjectsController = require('../controllers/removeUnusedObjectsController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `document-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Route to remove unused objects from PDF
router.post('/remove-unused-objects', upload.single('file'), removeUnusedObjectsController.removeUnusedObjects);

// Route to analyze objects in PDF
router.post('/analyze-objects', upload.single('file'), removeUnusedObjectsController.analyzeObjects);

// Route to get cleanup presets
router.get('/cleanup-presets', removeUnusedObjectsController.getCleanupPresets);

// Route to check cleanup tools
router.get('/cleanup-tools', removeUnusedObjectsController.checkCleanupTools);

// Route to get cleanup recommendations
router.post('/cleanup-recommendations', upload.single('file'), removeUnusedObjectsController.getCleanupRecommendations);

// Route to preview cleanup results
router.post('/preview-cleanup', upload.single('file'), removeUnusedObjectsController.previewCleanup);

// Route to batch cleanup multiple PDFs
router.post('/batch-cleanup', upload.array('files', 10), removeUnusedObjectsController.batchCleanup);

module.exports = router;
