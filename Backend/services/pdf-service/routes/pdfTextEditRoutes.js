const express = require('express');
const router = express.Router();
const { 
  upload, 
  extractText, 
  editText, 
  downloadEditedPDF 
} = require('../controllers/pdfTextEditController');

// Route to upload PDF and extract text
router.post('/extract-text', upload.single('pdf'), extractText);

// Route to edit PDF text
router.post('/edit-text', editText);

// Route to download edited PDF
router.get('/download/:fileName', downloadEditedPDF);

module.exports = router;
