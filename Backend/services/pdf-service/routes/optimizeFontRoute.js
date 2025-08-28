const express = require('express');
const multer = require('multer');
const path = require('path');
const optimizeFontController = require('../controllers/optimizeFontController');

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

// Route to optimize fonts in PDF
router.post('/optimize-font', upload.single('file'), optimizeFontController.optimizeFont);

// Route to analyze fonts in PDF
router.post('/analyze-fonts', upload.single('file'), optimizeFontController.analyzeFonts);

// Route to get font optimization presets
router.get('/font-optimization-presets', optimizeFontController.getFontOptimizationPresets);

// Route to check font optimization tools
router.get('/font-optimization-tools', optimizeFontController.checkFontOptimizationTools);

// Route to get font optimization recommendations
router.post('/font-optimization-recommendations', upload.single('file'), optimizeFontController.getFontOptimizationRecommendations);

// Route to preview font optimization results
router.post('/preview-font-optimization', upload.single('file'), optimizeFontController.previewFontOptimization);

// Route to batch optimize fonts
router.post('/batch-optimize-fonts', upload.array('files', 10), optimizeFontController.batchOptimizeFonts);

module.exports = router;
