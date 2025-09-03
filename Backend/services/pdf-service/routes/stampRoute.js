const express = require('express');
const multer = require('multer');
const path = require('path');
const stampController = require('../controllers/stampController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'stamp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'file' && file.mimetype === 'application/pdf') {
      cb(null, true);
    } else if (file.fieldname === 'customImage' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Routes
router.post('/add-stamps', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'customImage', maxCount: 1 }
]), stampController.addStamps);

router.post('/preview-stamps', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'customImage', maxCount: 1 }
]), stampController.previewStamps);

router.get('/stamp-types', (req, res) => {
  res.json({
    success: true,
    stampTypes: stampController.getStampTypes()
  });
});
router.get('/download/:filename', stampController.downloadStampedFile);

module.exports = router;
