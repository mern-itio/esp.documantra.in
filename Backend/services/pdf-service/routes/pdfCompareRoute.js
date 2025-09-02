const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const pdfCompareController = require('../controllers/pdfCompareController');

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
    cb(null, 'pdf_compare_' + uniqueSuffix + path.extname(file.originalname));
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

// PDF Comparison endpoints
router.post('/compare', upload.fields([
  { name: 'pdf1', maxCount: 1 },
  { name: 'pdf2', maxCount: 1 }
]), (req, res) => pdfCompareController.comparePdfs(req, res));

router.get('/status', (req, res) => pdfCompareController.getServiceStatus(req, res));

module.exports = router;
