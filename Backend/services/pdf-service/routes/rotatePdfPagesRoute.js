const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { rotatePdfPages } = require('../controllers/rotatePdfPagesService');

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

// Rotate pages endpoint
router.post('/rotate-pages', upload.single('file'), async (req, res) => {
  try {
    console.log('Rotate pages request received:', {
      file: req.file ? req.file.originalname : 'No file',
      body: req.body
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded'
      });
    }

    const { rotations } = req.body;

    if (!rotations) {
      return res.status(400).json({
        success: false,
        error: 'Rotation data is required'
      });
    }

    let rotationArray;
    try {
      rotationArray = JSON.parse(rotations);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rotations format. Must be a valid JSON array.'
      });
    }

    if (!Array.isArray(rotationArray) || rotationArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Rotations must be a non-empty array'
      });
    }

    // Validate rotation objects
    for (const rotation of rotationArray) {
      if (!rotation.page || !rotation.angle) {
        return res.status(400).json({
          success: false,
          error: 'Each rotation must have page and angle properties'
        });
      }

      if (!Number.isInteger(rotation.page) || rotation.page < 1) {
        return res.status(400).json({
          success: false,
          error: `Invalid page number: ${rotation.page}. Must be a positive integer.`
        });
      }

      if (![90, 180, 270].includes(rotation.angle)) {
        return res.status(400).json({
          success: false,
          error: `Invalid rotation angle: ${rotation.angle}. Must be 90, 180, or 270 degrees.`
        });
      }
    }

    const resultFile = await rotatePdfPages(req.file.path, rotationArray);

    console.log(`PDF pages rotated successfully. Created file: ${path.basename(resultFile)}`);

    // Clean up uploaded file
    await fs.remove(req.file.path);

    res.json({
      success: true,
      message: 'PDF pages rotated successfully',
      file: {
        filename: path.basename(resultFile),
        path: resultFile,
        size: fs.statSync(resultFile).size
      },
      downloadUrl: `/outputs/${path.basename(resultFile)}`,
      rotations: rotationArray,
      totalRotations: rotationArray.length
    });

  } catch (err) {
    console.error('Error rotating PDF pages:', err);

    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to rotate PDF pages',
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
    message: 'Rotate PDF Pages service is running',
    endpoints: {
      'POST /rotate-pages': 'Rotate PDF pages according to specified rotations',
      'POST /info': 'Get PDF information (page count, size)',
      'GET /test': 'Test endpoint'
    }
  });
});

module.exports = router;
