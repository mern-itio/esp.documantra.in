const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const pdfStatisticsController = require('../controllers/pdfStatisticsController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Ensure the uploads directory exists
      const uploadsDir = path.join(__dirname, '../../uploads');
      await fs.ensureDir(uploadsDir);
      console.log('📋 Multer: Uploads directory ensured at:', uploadsDir);
      cb(null, uploadsDir);
    } catch (error) {
      console.error('❌ Multer: Error creating uploads directory:', error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// PDF Statistics API Routes

// Get comprehensive PDF statistics
router.post('/analyze', upload.single('pdf'), (req, res) => {
  pdfStatisticsController.getPdfStatistics(req, res);
});

// Get content analysis only
router.post('/content-analysis', upload.single('pdf'), (req, res) => {
  pdfStatisticsController.getContentAnalysis(req, res);
});

// Get usage statistics only
router.post('/usage-statistics', upload.single('pdf'), (req, res) => {
  pdfStatisticsController.getUsageStatistics(req, res);
});

// Get performance metrics only
router.post('/performance-metrics', upload.single('pdf'), (req, res) => {
  pdfStatisticsController.getPerformanceMetrics(req, res);
});

// Compare multiple PDFs
router.post('/compare', upload.array('pdfs', 10), (req, res) => {
  pdfStatisticsController.comparePdfStatistics(req, res);
});

// Get service status and capabilities
router.get('/status', (req, res) => {
  pdfStatisticsController.getServiceStatus(req, res);
});

// Health check endpoint
router.get('/health', (req, res) => {
  pdfStatisticsController.healthCheck(req, res);
});

module.exports = router;
