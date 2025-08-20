const express = require('express');
const router = express.Router();
const {
  uploadPdfInMemory,
  uploadImageToDisk,
} = require('../middleware/upload');

const {
  convertPDFtoImage,
  convertImagesToPDF,
  convertPdfToEpub,
  batchConvert,
} = require('../controllers/pdfToImage');

// Route: PDF → Images (matches frontend expectation)
router.post('/pdf-to-images', uploadPdfInMemory.single('document'), convertPDFtoImage);

// Route: PDF → Image
router.post('/pdf-to-image', uploadPdfInMemory.single('document'), convertPDFtoImage);

// Route: Images → PDF
router.post('/images-to-pdf', uploadImageToDisk.array('images', 10), convertImagesToPDF);

// Route: PDF → EPUB
router.post('/pdf-to-epub', uploadPdfInMemory.single('pdf'), convertPdfToEpub);

// Route: Batch Conversion (up to 5 files)
router.post('/batch-convert', uploadPdfInMemory.array('files', 5), batchConvert);

module.exports = router;
