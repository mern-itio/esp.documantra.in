const express = require('express');
const multer = require('multer');
const path = require('path');
const makeSearchableController = require('../controllers/makeSearchableController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'files-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files for make searchable
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for make searchable processing'), false);
    }
  }
});

// Routes
router.post('/process', upload.array('files', 5), makeSearchableController.makeSearchable);
router.get('/tools', makeSearchableController.checkTools);

module.exports = router;
