const express = require('express');
const router = express.Router();
const { addTextWatermark, addImageWatermark, previewWatermark, upload } = require('../controllers/addWatermarkController');

// Text watermark route
router.post('/text', upload.single('pdf'), addTextWatermark);

// Image watermark route - uses multer with multiple files
router.post('/image', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), addImageWatermark);

// Preview watermark route
router.post('/preview', upload.single('pdf'), previewWatermark);

module.exports = router;
