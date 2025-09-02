const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const pdfRepairController = require('../controllers/pdfRepairController');

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
    cb(null, 'pdf_repair_' + uniqueSuffix + path.extname(file.originalname));
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

// PDF Repair endpoints
router.post('/repair', upload.single('pdf'), (req, res) => pdfRepairController.repairPdf(req, res));

router.post('/analyze', upload.single('pdf'), (req, res) => pdfRepairController.analyzePdf(req, res));

router.post('/analyze-repaired', upload.single('pdf'), (req, res) => pdfRepairController.analyzeRepairedPdf(req, res));

router.post('/optimize', upload.single('pdf'), (req, res) => pdfRepairController.optimizePdf(req, res));

router.get('/status', (req, res) => pdfRepairController.getServiceStatus(req, res));

module.exports = router;
