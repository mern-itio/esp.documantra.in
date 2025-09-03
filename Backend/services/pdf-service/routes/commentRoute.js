const express = require('express');
const multer = require('multer');
const path = require('path');
const commentController = require('../controllers/commentController');

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

// Routes
router.post('/add-comments', upload.single('file'), commentController.addComments);

router.post('/preview-comments', upload.single('file'), commentController.previewComments);

router.get('/comment-library', (req, res) => {
  console.log('Comment library request received');
  const library = commentController.getCommentLibrary();
  console.log('Comment library:', library);
  res.json({
    success: true,
    commentLibrary: library
  });
});

router.get('/download/:filename', commentController.downloadCommentedFile);

module.exports = router;
