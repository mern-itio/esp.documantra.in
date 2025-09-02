// routes/mergePdfRoutes.js
const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { mergePDFs } = require('../controllers/mergePdf');

const router = express.Router();

// Multer config for PDF files
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

// Merge PDFs endpoint
router.post('/merge', upload.array('files'), async (req, res) => {
  try {
    console.log('Merge request received:', {
      filesCount: req.files ? req.files.length : 0,
      body: req.body
    });

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least 2 PDF files are required for merging' 
      });
    }

    // Parse the ordered filenames from the request
    let orderedFilenames = [];
    try {
      orderedFilenames = JSON.parse(req.body.orderedFilenames);
      console.log('Parsed ordered filenames:', orderedFilenames);
    } catch (error) {
      // If no order specified, use upload order
      orderedFilenames = req.files.map(file => file.originalname);
      console.log('Using upload order for filenames:', orderedFilenames);
    }

    // Parse options if provided
    let options = {};
    if (req.body.options) {
      try {
        options = JSON.parse(req.body.options);
        console.log('Parsed options:', options);
      } catch (error) {
        console.warn('Failed to parse options:', error);
      }
    }

    console.log(`Merging ${req.files.length} PDF files...`);
    console.log('Order:', orderedFilenames);
    console.log('Options:', options);

    // Call the merge service
    const mergedFilePath = await mergePDFs(req.files, orderedFilenames);

    // Set response headers for download
    const filename = `merged-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    console.log('Sending merged file:', mergedFilePath);

    // Send the merged file
    res.sendFile(mergedFilePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      } else {
        console.log('File sent successfully');
      }
      
      // Clean up the merged file after sending
      fs.remove(mergedFilePath).catch(console.error);
      
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.remove(file.path).catch(console.error);
      });
    });

  } catch (error) {
    console.error('Error merging PDFs:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.remove(file.path).catch(console.error);
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to merge PDFs',
      message: error.message 
    });
  }
});

// Get PDF info endpoint
router.post('/info', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Basic PDF validation and info extraction
    const filePath = req.file.path;
    const fileSize = req.file.size;
    
    // Simple PDF validation (check if file starts with PDF header)
    const buffer = await fs.readFile(filePath);
    const isValid = buffer.length > 4 && buffer.toString('ascii', 0, 4) === '%PDF';
    
    let actualPages = 1; // Default fallback
    
    if (isValid) {
      try {
        // Use pdf-lib to get actual page count
        const { PDFDocument } = require('pdf-lib');
        const pdfBytes = await fs.readFile(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        actualPages = pdfDoc.getPageCount();
        console.log(`PDF ${req.file.originalname}: Actual page count = ${actualPages}`);
      } catch (pdfError) {
        console.warn('Failed to get actual page count, using fallback:', pdfError.message);
        // Fallback to size-based estimation if pdf-lib fails
        actualPages = Math.max(1, Math.floor(fileSize / (50 * 1024)));
      }
    }
    
    // Clean up uploaded file
    await fs.remove(filePath);

    res.json({
      success: true,
      pages: actualPages,
      size: fileSize,
      isValid: isValid
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

// Validate PDF endpoint
router.post('/validate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const filePath = req.file.path;
    const fileSize = req.file.size;
    
    // Basic PDF validation
    const buffer = await fs.readFile(filePath);
    const isValid = buffer.length > 4 && buffer.toString('ascii', 0, 4) === '%PDF';
    
    // Additional validation checks
    let error = null;
    if (!isValid) {
      error = 'File is not a valid PDF';
    } else if (fileSize === 0) {
      error = 'File is empty';
    } else if (fileSize > 100 * 1024 * 1024) { // 100MB limit
      error = 'File size exceeds 100MB limit';
    }
    
    // Clean up uploaded file
    await fs.remove(filePath);

    res.json({
      success: true,
      isValid: isValid && !error,
      error: error
    });

  } catch (error) {
    console.error('Error validating PDF:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate PDF',
      message: error.message 
    });
  }
});

// Test endpoint to verify the service is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Merge PDF service is running',
    endpoints: {
      merge: 'POST /pdf-service/merge',
      info: 'POST /pdf-service/info',
      validate: 'POST /pdf-service/validate'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
