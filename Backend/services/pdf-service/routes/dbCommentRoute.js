const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbCommentController = require('../controllers/dbCommentController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
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

// Routes for database-backed comment system

// Create a new commented document with shareable link
router.post('/create-document', upload.single('file'), dbCommentController.createCommentedDocument);

// Get document by shareable link
router.get('/shared/:linkToken', dbCommentController.getDocumentByLink);

// Add comment to existing document
router.post('/shared/:linkToken/comments', (req, res, next) => {
  console.log('Add comment route hit:', {
    linkToken: req.params.linkToken,
    body: req.body
  });
  next();
}, dbCommentController.addComment);

// Reply to a comment
router.post('/shared/:linkToken/comments/:commentId/reply', dbCommentController.replyToComment);

// Resolve/unresolve a comment
router.patch('/shared/:linkToken/comments/:commentId/resolve', dbCommentController.toggleCommentResolution);

// Get user's commented documents
router.get('/user/:userId/documents', dbCommentController.getUserDocuments);

// Preview route for commented files - inline display
router.get('/preview/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    console.log(`Preview route - looking for file: ${filename}`);
    console.log(`Preview route - file path: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`Preview route - file not found: ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log(`Preview route - file found, serving: ${filename}`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Preview route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download route for commented files
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      console.log(`Download route - file not found: ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log(`Download route - file found, serving: ${filename}`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
