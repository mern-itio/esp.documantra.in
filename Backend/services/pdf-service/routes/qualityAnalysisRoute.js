const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const qualityAnalysisController = require('../controllers/qualityAnalysisController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    fs.ensureDirSync(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
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

// Main quality analysis endpoint
router.post('/analyze', upload.single('file'), qualityAnalysisController.analyzeQuality);

// Get quality analysis presets
router.get('/presets', qualityAnalysisController.getQualityAnalysisPresets);

// Batch quality analysis
router.post('/batch', upload.array('files', 10), qualityAnalysisController.batchQualityAnalysis);

module.exports = router;
