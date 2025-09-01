const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const pdfInfoController = require('../controllers/pdfInfoController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    await fs.ensureDir(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    cb(null, 'pdf_info_' + uniqueSuffix + path.extname(file.originalname));
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

// Routes

// Get comprehensive PDF information (metadata, statistics, security)
router.post('/get-info', upload.single('pdf'), pdfInfoController.getPdfInfo);

// Get metadata only
router.post('/get-metadata', upload.single('pdf'), pdfInfoController.getMetadata);

// Get document statistics
router.post('/get-statistics', upload.single('pdf'), pdfInfoController.getDocumentStatistics);

// Get security information
router.post('/get-security', upload.single('pdf'), pdfInfoController.getSecurityInfo);

// Get service status
router.get('/status', pdfInfoController.getServiceStatus);

module.exports = router;
