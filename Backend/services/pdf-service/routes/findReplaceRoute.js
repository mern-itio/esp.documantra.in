const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const findReplaceController = require('../controllers/findReplaceController');

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

// Route to perform find & replace on PDF
router.post('/find-replace', upload.single('file'), findReplaceController.findReplace);

// Route to preview find & replace without making changes
router.post('/preview-find-replace', upload.single('file'), findReplaceController.previewFindReplace);

// Route to test tools installation
router.get('/test-tools', async (req, res) => {
  try {
    const result = await findReplaceController.testToolsInstallation();
    res.json(result);
  } catch (error) {
    console.error('Error testing tools installation:', error);
    res.status(500).json({ error: 'Failed to test tools installation' });
  }
});

module.exports = router;
