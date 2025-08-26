const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const {
  extractPages,
  extractPageRange,
  extractCustomSelection
} = require('../controllers/pdfExtractService');

const router = express.Router();

// Multer setup for PDF files
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
    fileSize: 100 * 1024 * 1024, // 100MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Extract specific pages endpoint
router.post('/extract-pages', upload.single('file'), async (req, res) => {
  try {
    console.log('Extract pages request received:', {
      file: req.file ? req.file.originalname : 'No file',
      body: req.body
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { pageNumbers, outputName } = req.body;
    const filePath = req.file.path;

    if (!pageNumbers) {
      return res.status(400).json({
        success: false,
        error: 'pageNumbers is required'
      });
    }

    let parsedPageNumbers;
    try {
      parsedPageNumbers = JSON.parse(pageNumbers);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pageNumbers format. Must be a valid JSON array.'
      });
    }

    const resultFile = await extractPages(filePath, parsedPageNumbers, outputName);

    console.log(`PDF pages extracted successfully. Created file: ${path.basename(resultFile)}`);

    // Clean up uploaded file
    await fs.remove(filePath);

    res.json({
      success: true,
      message: 'PDF pages extracted successfully',
      file: {
        filename: path.basename(resultFile),
        path: resultFile,
        size: fs.statSync(resultFile).size
      },
      extractedPages: parsedPageNumbers,
      totalPages: parsedPageNumbers.length
    });

  } catch (err) {
    console.error('Error extracting PDF pages:', err);

    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to extract PDF pages',
      message: err.message
    });
  }
});

// Extract page range endpoint
router.post('/extract-range', upload.single('file'), async (req, res) => {
  try {
    console.log('Extract page range request received:', {
      file: req.file ? req.file.originalname : 'No file',
      body: req.body
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { startPage, endPage, outputName } = req.body;
    const filePath = req.file.path;

    if (!startPage || !endPage) {
      return res.status(400).json({
        success: false,
        error: 'startPage and endPage are required'
      });
    }

    const startPageNum = parseInt(startPage);
    const endPageNum = parseInt(endPage);

    if (isNaN(startPageNum) || isNaN(endPageNum)) {
      return res.status(400).json({
        success: false,
        error: 'startPage and endPage must be valid numbers'
      });
    }

    const resultFile = await extractPageRange(filePath, startPageNum, endPageNum, outputName);

    console.log(`PDF page range extracted successfully. Created file: ${path.basename(resultFile)}`);

    // Clean up uploaded file
    await fs.remove(filePath);

    res.json({
      success: true,
      message: 'PDF page range extracted successfully',
      file: {
        filename: path.basename(resultFile),
        path: resultFile,
        size: fs.statSync(resultFile).size
      },
      extractedRange: { startPage: startPageNum, endPage: endPageNum },
      totalPages: endPageNum - startPageNum + 1
    });

  } catch (err) {
    console.error('Error extracting PDF page range:', err);

    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to extract PDF page range',
      message: err.message
    });
  }
});

// Extract custom selection endpoint
router.post('/extract-custom', upload.single('file'), async (req, res) => {
  try {
    console.log('Extract custom selection request received:', {
      file: req.file ? req.file.originalname : 'No file',
      body: req.body
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { selections, outputName } = req.body;
    const filePath = req.file.path;

    if (!selections) {
      return res.status(400).json({
        success: false,
        error: 'selections is required'
      });
    }

    let parsedSelections;
    try {
      parsedSelections = JSON.parse(selections);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid selections format. Must be a valid JSON array.'
      });
    }

    const resultFile = await extractCustomSelection(filePath, parsedSelections, outputName);

    console.log(`PDF custom selection extracted successfully. Created file: ${path.basename(resultFile)}`);

    // Clean up uploaded file
    await fs.remove(filePath);

    res.json({
      success: true,
      message: 'PDF custom selection extracted successfully',
      file: {
        filename: path.basename(resultFile),
        path: resultFile,
        size: fs.statSync(resultFile).size
      },
      selections: parsedSelections
    });

  } catch (err) {
    console.error('Error extracting PDF custom selection:', err);

    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to extract PDF custom selection',
      message: err.message
    });
  }
});

// Get PDF info endpoint for extract operations
router.post('/info', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
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
    message: 'Extract PDF Pages service is running',
    endpoints: {
      extractPages: 'POST /pdf-extract/extract-pages',
      extractRange: 'POST /pdf-extract/extract-range',
      extractCustom: 'POST /pdf-extract/extract-custom',
      info: 'POST /pdf-extract/info'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
