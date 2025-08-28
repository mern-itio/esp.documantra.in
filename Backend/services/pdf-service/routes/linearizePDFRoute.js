const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const linearizePDFController = require('../controllers/linearizePDFController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, extension);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Allow up to 10 files for batch operations
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Main linearization endpoint
router.post('/linearize', upload.single('file'), linearizePDFController.linearizePDF);

// PDF analysis endpoint
router.post('/analyze', upload.single('file'), linearizePDFController.analyzePDF);

// Get linearization presets
router.get('/presets', linearizePDFController.getLinearizationPresets);

// Check available tools
router.get('/tools', linearizePDFController.checkLinearizationTools);

// Get optimization recommendations
router.post('/recommendations', upload.single('file'), linearizePDFController.getLinearizationRecommendations);

// Preview linearization
router.post('/preview', upload.single('file'), linearizePDFController.previewLinearization);

// Batch linearization
router.post('/batch', upload.array('files', 10), linearizePDFController.batchLinearization);

module.exports = router;
