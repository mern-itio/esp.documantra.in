const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const spellCheckController = require('../controllers/spellCheckController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'document-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
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

// Route to perform spell check on PDF
router.post('/spell-check', upload.single('file'), spellCheckController.spellCheck);

// Route to test tools installation
router.get('/test-tools', async (req, res) => {
  try {
    const result = await spellCheckController.testToolsInstallation();
    res.json(result);
  } catch (error) {
    console.error('Error testing tools installation:', error);
    res.status(500).json({ error: 'Failed to test tools installation' });
  }
});

module.exports = router;
