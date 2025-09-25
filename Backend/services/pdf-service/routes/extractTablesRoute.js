const express = require('express');
const multer = require('multer');
const path = require('path');
const extractTablesController = require('../controllers/extractTablesController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const originalName = path.parse(file.originalname).name;
    const extension = path.extname(file.originalname);
    cb(null, `extract-tables-${timestamp}-${randomSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Only allow PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 5 // Maximum 5 files
  }
});

// API Routes
router.post('/process', upload.array('files', 5), extractTablesController.extractTables);
router.get('/tools', extractTablesController.checkTools);
router.get('/diagnose', extractTablesController.diagnoseErrors);

module.exports = router;
