const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { cropPdfPages } = require('../controllers/cropPdfPagesService');

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

// Crop pages endpoint
router.post('/crop-pages', upload.single('file'), async (req, res) => {
  try {
    console.log('Crop pages request received:', {
      file: req.file ? req.file.originalname : 'No file',
      body: req.body
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded'
      });
    }

    const { crops } = req.body;

    if (!crops) {
      return res.status(400).json({
        success: false,
        error: 'Crop data is required'
      });
    }

    let cropArray;
    try {
      cropArray = JSON.parse(crops);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid crops format. Must be a valid JSON array.'
      });
    }

    if (!Array.isArray(cropArray)) {
      return res.status(400).json({
        success: false,
        error: 'Crops must be an array'
      });
    }

    // Validate crop objects
    for (const crop of cropArray) {
      if (!crop.page || !crop.x || !crop.y || !crop.width || !crop.height) {
        return res.status(400).json({
          success: false,
          error: 'Each crop must have page, x, y, width, and height properties'
        });
      }

      if (!Number.isInteger(crop.page) || crop.page < 1) {
        return res.status(400).json({
          success: false,
          error: `Invalid page number: ${crop.page}. Must be a positive integer.`
        });
      }

      if (typeof crop.x !== 'number' || typeof crop.y !== 'number' || 
          typeof crop.width !== 'number' || typeof crop.height !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Crop coordinates and dimensions must be numbers'
        });
      }

      if (crop.width <= 0 || crop.height <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Crop width and height must be positive numbers'
        });
      }

      if (crop.x < 0 || crop.y < 0) {
        return res.status(400).json({
          success: false,
          error: 'Crop x and y coordinates must be non-negative numbers'
        });
      }
    }

    const resultFile = await cropPdfPages(req.file.path, cropArray);

    console.log(`PDF pages cropped successfully. Created file: ${path.basename(resultFile)}`);

    // Clean up uploaded file
    await fs.remove(req.file.path);

    res.json({
      success: true,
      message: 'PDF pages cropped successfully',
      file: {
        filename: path.basename(resultFile),
        path: resultFile,
        size: fs.statSync(resultFile).size
      },
      downloadUrl: `/outputs/${path.basename(resultFile)}`,
      crops: cropArray,
      totalCrops: cropArray.length
    });

  } catch (err) {
    console.error('Error cropping PDF pages:', err);

    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to crop PDF pages',
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

    // Get PDF page count and dimensions using pdf-lib
    const { PDFDocument } = require('pdf-lib');
    const fileBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBytes);
    const totalPages = pdfDoc.getPageCount();
    
    // Get dimensions of first page for reference
    let pageDimensions = null;
    if (totalPages > 0) {
      const firstPage = pdfDoc.getPage(0);
      pageDimensions = {
        width: firstPage.getWidth(),
        height: firstPage.getHeight()
      };
    }

    // Clean up uploaded file
    await fs.remove(filePath);

    res.json({
      success: true,
      pages: totalPages,
      size: fileSize,
      pageDimensions,
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
    message: 'Crop PDF Pages service is running',
    endpoints: {
      'POST /crop-pages': 'Crop PDF pages according to specified coordinates and dimensions',
      'POST /info': 'Get PDF information (page count, size, dimensions)',
      'GET /test': 'Test endpoint'
    }
  });
});

module.exports = router;
