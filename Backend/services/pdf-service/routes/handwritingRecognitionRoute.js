const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Import controller
const handwritingRecognitionController = require('../controllers/handwritingRecognitionController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Handwriting recognition routes
router.post('/recognize', upload.array('images', 10), handwritingRecognitionController.recognizeHandwriting);
router.post('/recognize-cursive', upload.array('images', 10), handwritingRecognitionController.recognizeCursiveHandwriting);
router.post('/tune-accuracy', upload.array('images', 5), handwritingRecognitionController.tuneAccuracy);
router.post('/preprocess-image', upload.array('images', 5), handwritingRecognitionController.preprocessImage);

// Information and status routes
router.get('/supported-languages', handwritingRecognitionController.getSupportedLanguages);
router.get('/accuracy-metrics', handwritingRecognitionController.getAccuracyMetrics);
router.get('/status', handwritingRecognitionController.getServiceStatus);
router.get('/models', handwritingRecognitionController.getAvailableModels);

module.exports = router;
