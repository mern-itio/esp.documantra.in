const express = require('express');
const multer = require('multer');
const path = require('path');
const formRecognitionController = require('../controllers/formRecognitionController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Convert static form to fillable form
router.post('/convert', upload.single('pdf'), formRecognitionController.convertToFillableForm);

// Analyze form structure and content
router.post('/analyze', upload.single('pdf'), formRecognitionController.analyzeFormStructure);

// Detect form fields automatically
router.post('/detect-fields', upload.single('pdf'), formRecognitionController.detectFormFields);

// Optimize field placement and properties
router.post('/optimize-fields', formRecognitionController.optimizeFields);

// Get service status
router.get('/status', formRecognitionController.getServiceStatus);

module.exports = router;
