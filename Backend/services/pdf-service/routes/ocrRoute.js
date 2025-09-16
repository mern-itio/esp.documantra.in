const express = require('express');
const multer = require('multer');
const path = require('path');
const ocrController = require('../controllers/ocrController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter: function (req, file, cb) {
    // Accept PDFs and image files
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
    }
  }
});

// OCR API endpoints
router.get('/languages', ocrController.getAvailableLanguages);
router.post('/process', upload.array('files', 5), ocrController.performOCR);
router.get('/tools', ocrController.checkOCRTools);
router.get('/download/:filename', ocrController.downloadFile);

module.exports = router;
