const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { deletePdfPages } = require('../controllers/deletePdfPagesService');

const router = express.Router();

// Set up multer with better configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Delete pages endpoint
router.post('/delete-pages', upload.single('file'), async (req, res) => {
  try {
    console.log('Delete pages request received:', {
      file: req.file ? req.file.originalname : 'No file',
      body: req.body
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded'
      });
    }

    const { pages } = req.body;

    if (!pages) {
      return res.status(400).json({
        success: false,
        error: 'No pages provided for deletion'
      });
    }

    let pagesToDelete;
    try {
      pagesToDelete = JSON.parse(pages);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pages format. Must be a valid JSON array.'
      });
    }

    if (!Array.isArray(pagesToDelete) || pagesToDelete.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Pages must be a non-empty array of numbers'
      });
    }

    // Validate that all page numbers are integers
    for (const pageNum of pagesToDelete) {
      if (!Number.isInteger(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          error: `Invalid page number: ${pageNum}. Must be a positive integer.`
        });
      }
    }

    const resultFile = await deletePdfPages(req.file.path, pagesToDelete);

    console.log(`PDF pages deleted successfully. Created file: ${path.basename(resultFile)}`);

    // Clean up uploaded file
    await fs.remove(req.file.path);

    res.json({
      success: true,
      message: 'PDF pages deleted successfully',
      file: {
        filename: path.basename(resultFile),
        path: resultFile,
        size: fs.statSync(resultFile).size
      },
      downloadUrl: `/outputs/${path.basename(resultFile)}`,
      deletedPages: pagesToDelete,
      remainingPages: fs.statSync(resultFile).size > 0 ? 'Calculated after processing' : 0
    });

  } catch (err) {
    console.error('Error deleting PDF pages:', err);

    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete PDF pages',
      message: err.message
    });
  }
});

// Get PDF info endpoint
router.post('/info', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileSize = req.file.size;

    // Get PDF page count using pdf-lib
    const { PDFDocument } = require('pdf-lib');
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes);
    const totalPages = pdfDoc.getPageCount();

    // Clean up uploaded file
    await fs.remove(filePath);

    res.json({
      success: true,
      pages: totalPages,
      size: fileSize,
      isValid: true
    });

  } catch (error) {
    console.error('Error getting PDF info:', error);

    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get PDF info',
      message: error.message
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Delete PDF Pages service is running',
    endpoints: {
      'POST /delete-pages': 'Delete specified pages from PDF',
      'POST /info': 'Get PDF information (page count, size)',
      'GET /test': 'Test endpoint'
    }
  });
});

module.exports = router;
