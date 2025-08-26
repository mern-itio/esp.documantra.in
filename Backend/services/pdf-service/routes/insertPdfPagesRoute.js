const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { insertPdfPages, reorderPdfPages, getPDFInfo } = require('../controllers/insertPdfPagesService');

const router = express.Router();

// Ensure uploads and outputs directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const outputsDir = path.join(__dirname, '../outputs');

fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(outputsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
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
    files: 10 // Allow up to 10 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * POST /reorder-pages
 * Reorder pages from a single PDF document
 */
router.post('/reorder-pages', upload.single('document'), async (req, res) => {
  try {
    const { pageOrder } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'PDF document is required'
      });
    }

    if (!pageOrder || !Array.isArray(pageOrder)) {
      return res.status(400).json({
        success: false,
        error: 'Page order array is required'
      });
    }

    // Parse page order JSON
    let parsedPageOrder;
    try {
      parsedPageOrder = JSON.parse(pageOrder);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page order format'
      });
    }

    // Generate output filename
    const timestamp = Date.now();
    const outputFilename = `reordered_pages_${timestamp}.pdf`;
    const outputPath = path.join(outputsDir, outputFilename);

    // Process the PDF
    const result = await reorderPdfPages(
      req.file.path,
      parsedPageOrder,
      outputPath
    );

    // Add download URL to result
    result.downloadUrl = `/outputs/${outputFilename}`;

    // Clean up uploaded file
    try {
      await fs.remove(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError);
    }

    res.json(result);

  } catch (error) {
    console.error('Error in reorder-pages endpoint:', error);
    
    // Clean up uploaded file on error
    try {
      if (req.file) {
        await fs.remove(req.file.path);
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file on error:', cleanupError);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to reorder pages',
      message: error.message
    });
  }
});

/**
 * POST /insert-pages
 * Insert pages into a PDF document
 */
router.post('/insert-pages', upload.fields([
  { name: 'mainDocument', maxCount: 1 },
  { name: 'sourceDocuments', maxCount: 5 }
]), async (req, res) => {
  try {
    const { insertions } = req.body;
   
    
    if (!req.files.mainDocument || req.files.mainDocument.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Main document is required'
      });
    }

    if (!insertions) {
      return res.status(400).json({
        success: false,
        error: 'Insertions field is required'
      });
    }

    // Parse insertions JSON first
    let parsedInsertions;
    try {
      parsedInsertions = JSON.parse(insertions);
     
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid insertions format - must be valid JSON'
      });
    }

    // Now check if it's an array
    if (!Array.isArray(parsedInsertions)) {
      return res.status(400).json({
        success: false,
        error: 'Insertions must be an array'
      });
    }

    const mainDocument = req.files.mainDocument[0];
    const sourceDocuments = req.files.sourceDocuments || [];
    
    for (const insertion of parsedInsertions) {
      
      if (!insertion.type || !insertion.position) {
        return res.status(400).json({
          success: false,
          error: 'Each insertion must have type and position'
        });
      }

      if (insertion.type === 'import') {
       
        
        if (insertion.sourceDocumentIndex === undefined || insertion.sourcePageIndex === undefined) {
          return res.status(400).json({
            success: false,
            error: 'Import insertions must have sourceDocumentIndex and sourcePageIndex'
          });
        }
      }
    }

    // Process insertions to map source document references
    const processedInsertions = parsedInsertions.map(insertion => {
      if (insertion.type === 'import') {
        const sourceDocIndex = parseInt(insertion.sourceDocumentIndex);
        if (sourceDocIndex >= 0 && sourceDocIndex < sourceDocuments.length) {
          return {
            ...insertion,
            sourcePath: sourceDocuments[sourceDocIndex].path,
            sourcePageIndex: parseInt(insertion.sourcePageIndex)
          };
        } else {
          throw new Error(`Invalid source document index: ${sourceDocIndex}`);
        }
      }
      return insertion;
    });

    // Generate output filename
    const timestamp = Date.now();
    const outputFilename = `inserted_pages_${timestamp}.pdf`;
    const outputPath = path.join(outputsDir, outputFilename);

    // Process the PDF
    const result = await insertPdfPages(
      mainDocument.path,
      processedInsertions,
      outputPath
    );

    // Add download URL to result
    result.downloadUrl = `/outputs/${outputFilename}`;

    // Clean up uploaded files
    try {
      await fs.remove(mainDocument.path);
      for (const sourceDoc of sourceDocuments) {
        await fs.remove(sourceDoc.path);
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded files:', cleanupError);
    }

    res.json(result);

  } catch (error) {
    console.error('Error in insert-pages endpoint:', error);
    
    // Clean up uploaded files on error
    try {
      if (req.files) {
        for (const fieldName in req.files) {
          for (const file of req.files[fieldName]) {
            await fs.remove(file.path);
          }
        }
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded files on error:', cleanupError);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to insert pages',
      message: error.message
    });
  }
});

/**
 * POST /info
 * Get information about a PDF file
 */
router.post('/info', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'PDF file is required'
      });
    }

    const result = await getPDFInfo(req.file.path);
    
    // Clean up uploaded file
    try {
      await fs.remove(req.file.path);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError);
    }

    res.json(result);

  } catch (error) {
    console.error('Error in info endpoint:', error);
    
    // Clean up uploaded file on error
    try {
      if (req.file) {
        await fs.remove(req.file.path);
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file on error:', cleanupError);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get PDF information',
      message: error.message
    });
  }
});

/**
 * GET /test
 * Test endpoint
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Insert PDF Pages service is running',
    endpoints: {
      'POST /reorder-pages': 'Reorder pages from a single PDF document',
      'POST /insert-pages': 'Insert pages into a PDF document',
      'POST /info': 'Get PDF information'
    }
  });
});

module.exports = router;
