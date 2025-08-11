const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { convertDocToPdf, convertPdfToDoc, convertDocToPdfAlternative, convertPdfToExcel, convertExcelToPdf, convertPdfToPpt, convertPptToPdf, convertPptImagesToPdf, convertPdfToTxt, convertTxtToPdf, convertPdfToHtml, convertHtmlToPdf } = require('../controllers/pdfController.js');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.doc', '.docx', '.pdf', '.xlsx', '.pptx', '.txt', '.html'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .doc, .docx, .pdf, .xlsx, .pptx, .txt, and .html files are allowed.'), false);
    }
  }
});

// DOC/DOCX to PDF conversion
router.post('/doc-to-pdf', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.pdf');

    console.log(`Converting ${req.file.originalname} to PDF...`);
    
    const result = await convertDocToPdf(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// PDF to DOC conversion
router.post('/pdf-to-doc', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.docx');

    console.log(`Converting ${req.file.originalname} to DOC...`);
    
    const result = await convertPdfToDoc(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});


// PDF to Excel conversion
router.post('/pdf-to-excel', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.xlsx');

    console.log(`Converting ${req.file.originalname} to Excel...`);
    
    const result = await convertPdfToExcel(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// Excel to PDF conversion
router.post('/excel-to-pdf', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.pdf');

    console.log(`Converting ${req.file.originalname} to PDF...`);
    
    const result = await convertExcelToPdf(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// PDF to PPT conversion
router.post('/pdf-to-ppt', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.pptx');

    console.log(`Converting ${req.file.originalname} to PPT...`);
    
    const result = await convertPdfToPpt(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});


// PPT to PDF conversion
router.post('/ppt-to-pdf', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.pdf');

    console.log(`Converting ${req.file.originalname} to PDF...`);
    
    const result = await convertPptToPdf(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});


// PPT to TXT conversion
router.post('/pdf-to-txt', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.txt');

    console.log(`Converting ${req.file.originalname} to TXT...`);
    
    const result = await convertPdfToTxt(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});


// TXT to PDF conversion
router.post('/txt-to-pdf', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.pdf');

    console.log(`Converting ${req.file.originalname} to PDF...`);
    
    const result = await convertTxtToPdf(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});


// PDF to HTML conversion
router.post('/pdf-to-html', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.html');

    console.log(`Converting ${req.file.originalname} to HTML...`);
    
    const result = await convertPdfToHtml(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// HTML to PDF conversion
router.post('/html-to-pdf', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.pdf');

    console.log(`Converting ${req.file.originalname} to PDF...`);
    
    const result = await convertHtmlToPdf(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize
    });

  } catch (error) {
    console.error('Conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});


// Get conversion status and available formats
router.get('/formats', (req, res) => {
  res.json({
    supportedFormats: {
      input: ['.doc', '.docx', '.pdf', '.xlsx', '.pptx', '.txt', '.html'],
      output: ['.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.html'],
      conversions: [
        { from: 'DOC/DOCX', to: 'PDF', endpoint: '/api/conversion/doc-to-pdf' },
        { from: 'PDF', to: 'DOCX', endpoint: '/api/conversion/pdf-to-doc' },
        { from: 'PDF', to: 'Excel', endpoint: '/api/conversion/pdf-to-excel' },
        { from: 'Excel', to: 'PDF', endpoint: '/api/conversion/excel-to-pdf' },
        { from: 'PDF', to: 'PowerPoint', endpoint: '/api/conversion/pdf-to-ppt' },
        { from: 'PowerPoint', to: 'PDF', endpoint: '/api/conversion/ppt-to-pdf' },
        { from: 'PDF', to: 'TXT', endpoint: '/api/conversion/pdf-to-txt' },
        { from: 'TXT', to: 'PDF', endpoint: '/api/conversion/txt-to-pdf' },
        { from: 'PDF', to: 'HTML', endpoint: '/api/conversion/pdf-to-html' },
        { from: 'HTML', to: 'PDF', endpoint: '/api/conversion/html-to-pdf' }
      ]
    },
    maxFileSize: '50MB',
    uploadField: 'document'
  });
});

module.exports = router; 