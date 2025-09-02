const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const pdfBookmarksController = require('../controllers/pdfBookmarksController');

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

// PDF Bookmarks API Routes

// Auto-detect and generate bookmarks from PDF structure
router.post('/auto-detect', upload.single('pdf'), (req, res) => {
  pdfBookmarksController.autoDetectBookmarks(req, res);
});

// Create custom bookmarks with user-defined structure
router.post('/create-custom', upload.single('pdf'), (req, res) => {
  pdfBookmarksController.createCustomBookmarks(req, res);
});

// Edit existing bookmarks (add, remove, modify)
router.post('/edit-bookmarks', upload.single('pdf'), (req, res) => {
  pdfBookmarksController.editBookmarks(req, res);
});

// Get bookmark structure from existing PDF
router.post('/get-bookmarks', upload.single('pdf'), (req, res) => {
  pdfBookmarksController.getExistingBookmarks(req, res);
});

// Analyze PDF structure for bookmark suggestions
router.post('/analyze-structure', upload.single('pdf'), (req, res) => {
  pdfBookmarksController.analyzeStructure(req, res);
});

// Get service status and capabilities
router.get('/status', (req, res) => {
  pdfBookmarksController.getServiceStatus(req, res);
});

// Health check endpoint
router.get('/health', (req, res) => {
  pdfBookmarksController.healthCheck(req, res);
});

module.exports = router;
