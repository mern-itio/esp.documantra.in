const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const {
  splitByPages,
  splitByCustomRanges,
  splitByBookmarks,
  splitBySize
} = require('../controllers/pdfSplitService');

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

// Split PDF endpoint
router.post('/split', upload.single('file'), async (req, res) => {
  try {
    console.log('Split request received:', {
      file: req.file ? req.file.originalname : 'No file',
      body: req.body
    });

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const { mode, pagesPerSplit, maxSizeMB, customRanges } = req.body;
    const filePath = req.file.path;

    let resultFiles = [];
    let splitInfo = {};

    if (mode === 'pages') {
      const pagesPerSplitNum = parseInt(pagesPerSplit) || 1;
      resultFiles = await splitByPages(filePath, pagesPerSplitNum);
      splitInfo = { mode: 'pages', pagesPerSplit: pagesPerSplitNum };
    } else if (mode === 'custom') {
      const ranges = customRanges ? JSON.parse(customRanges) : [];
      resultFiles = await splitByCustomRanges(filePath, ranges);
      splitInfo = { mode: 'custom', ranges };
    } else if (mode === 'bookmarks') {
      resultFiles = await splitByBookmarks(filePath);
      splitInfo = { mode: 'bookmarks' };
    } else if (mode === 'size') {
      const maxSize = parseFloat(maxSizeMB) || 10;
      resultFiles = await splitBySize(filePath, maxSize);
      splitInfo = { mode: 'size', maxSizeMB: maxSize };
    } else {
      throw new Error('Invalid mode. Use "pages", "custom", "bookmarks", or "size".');
    }

    console.log(`PDF split successfully by ${mode}. Created ${resultFiles.length} files.`);

    // Clean up uploaded file
    await fs.remove(filePath);

    res.json({
      success: true,
      message: `PDF split successfully by ${mode}`,
      splitInfo,
      files: resultFiles.map(f => ({
        filename: path.basename(f),
        path: f,
        size: fs.statSync(f).size
      })),
      totalFiles: resultFiles.length
    });

  } catch (err) {
    console.error('Error splitting PDF:', err);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to split PDF',
      message: err.message 
    });
  }
});

// Get PDF info endpoint for split operations
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
    message: 'Split PDF service is running',
    endpoints: {
      split: 'POST /pdf-service/split',
      info: 'POST /pdf-service/info'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
