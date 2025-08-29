const express = require('express');
const multer = require('multer');
const path = require('path');
const batchOptimizationController = require('../controllers/batchOptimizationController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `batch-optimization-${uniqueSuffix}-${file.originalname}`);
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
    fileSize: 100 * 1024 * 1024, // 100MB limit per file
    files: 10 // Allow up to 10 files for batch operations
  }
});

// Route to get optimization presets
router.get('/presets', batchOptimizationController.getOptimizationPresets);

// Route to batch optimize PDFs
router.post('/optimize', upload.array('files', 10), batchOptimizationController.batchOptimize);

// Route to check optimization tools
router.get('/tools', batchOptimizationController.checkOptimizationTools);

module.exports = router;
