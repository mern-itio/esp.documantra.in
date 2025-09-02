const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const pdfValidatorController = require('../controllers/pdfValidatorController');

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
    cb(null, 'pdf_validator_' + uniqueSuffix + path.extname(file.originalname));
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

// Validate single PDF for standards compliance
router.post('/validate', upload.single('pdf'), pdfValidatorController.validatePdf);



// Get validation standards and rules
router.get('/standards', pdfValidatorController.getValidationStandards);

// Get service status
router.get('/status', pdfValidatorController.getServiceStatus);

module.exports = router;
