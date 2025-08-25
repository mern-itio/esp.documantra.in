const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { convertDocToPdf, convertPdfToDoc, convertDocToPdfAlternative, convertPdfToExcel, convertExcelToPdf, convertPdfToPpt, convertPptToPdf, convertPptToPdfAdvanced, convertPptImagesToPdf, convertPdfToTxt, convertTxtToPdf, convertPdfToHtml, convertHtmlToPdf } = require('../controllers/pdfController.js');

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
    console.log(`Input path: ${inputPath}`);
    console.log(`Output path: ${outputPath}`);
    
    const result = await convertPdfToDoc(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    // Verify the output file exists
    const fileExists = await fs.pathExists(outputPath);
    console.log(`Output file exists: ${fileExists}`);
    console.log(`Output file size: ${result.fileSize}`);
    
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


// PPT to PDF conversion (Advanced)
router.post('/ppt-to-pdf', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '.pdf');

    console.log(`Converting ${req.file.originalname} to PDF using advanced method...`);
    
    const result = await convertPptToPdfAdvanced(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully using advanced method',
      originalFile: req.file.originalname,
      outputFile: path.basename(outputPath),
      downloadUrl: `/outputs/${path.basename(outputPath)}`,
      fileSize: result.fileSize,
      slidesProcessed: result.slidesProcessed,
      format: result.format
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

// PPT to PDF conversion (Basic)
router.post('/ppt-to-pdf-basic', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, '../outputs', 
      path.basename(req.file.filename, path.extname(req.file.filename)) + '-basic.pdf');

    console.log(`Converting ${req.file.originalname} to PDF using basic method...`);
    
    const result = await convertPptToPdf(inputPath, outputPath);
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'Document converted successfully using basic method',
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


// Test endpoint for debugging PowerPoint conversion
router.post('/test-pptx-extraction', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const fileExtension = path.extname(inputPath).toLowerCase();
    
    console.log(`Testing PPTX extraction for: ${req.file.originalname}`);
    console.log(`File extension: ${fileExtension}`);
    console.log(`File size: ${req.file.size} bytes`);
    
    let extractionResults = {
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        extension: fileExtension
      },
      methods: []
    };
    
    // Test Method 1: pptxgenjs
    try {
      console.log('Testing pptxgenjs method...');
      const PptxGenJS = require('pptxgenjs');
      const pptx = new PptxGenJS();
      
      const pptBuffer = await fs.readFile(inputPath);
      await pptx.load(pptBuffer);
      const slides = pptx.getSlides();
      
      extractionResults.methods.push({
        name: 'pptxgenjs',
        success: true,
        slidesFound: slides.length,
        details: `Found ${slides.length} slides`
      });
      
      console.log(`pptxgenjs: Found ${slides.length} slides`);
    } catch (error) {
      extractionResults.methods.push({
        name: 'pptxgenjs',
        success: false,
        error: error.message
      });
      console.log(`pptxgenjs failed: ${error.message}`);
    }
    
    // Test Method 2: office-to-pdf (Removed - requires LibreOffice)
    extractionResults.methods.push({
      name: 'office-to-pdf',
      success: false,
      error: 'Method disabled - requires LibreOffice which is not available in this container'
    });
    console.log('office-to-pdf: Skipped - requires LibreOffice');
    
    // Test Method 3: Manual extraction
    try {
      console.log('Testing manual extraction method...');
      const pptBuffer = await fs.readFile(inputPath);
      const extractedText = await extractTextFromPptx(pptBuffer);
      
      extractionResults.methods.push({
        name: 'manual-extraction',
        success: true,
        textLength: extractedText.length,
        textPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''),
        details: `Extracted ${extractedText.length} characters`
      });
      
      console.log(`Manual extraction: Extracted ${extractedText.length} characters`);
    } catch (error) {
      extractionResults.methods.push({
        name: 'manual-extraction',
        success: false,
        error: error.message
      });
      console.log(`Manual extraction failed: ${error.message}`);
    }
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'PPTX extraction test completed',
      results: extractionResults
    });

  } catch (error) {
    console.error('Test extraction error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Test extraction failed',
      message: error.message
    });
  }
});

// Test endpoint for debugging HTML to PDF conversion
router.post('/test-html-to-pdf', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const fileExtension = path.extname(inputPath).toLowerCase();
    
    console.log(`Testing HTML to PDF conversion for: ${req.file.originalname}`);
    console.log(`File extension: ${fileExtension}`);
    console.log(`File size: ${req.file.size} bytes`);
    
    if (fileExtension !== '.html') {
      return res.status(400).json({ error: 'Only HTML files are supported for this test' });
    }
    
    let testResults = {
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        extension: fileExtension
      },
      htmlAnalysis: {},
      conversionTest: {}
    };
    
    // Analyze HTML content
    try {
      const htmlContent = await fs.readFile(inputPath, 'utf8');
      testResults.htmlAnalysis = {
        contentLength: htmlContent.length,
        hasHtmlTag: htmlContent.includes('<html'),
        hasBodyTag: htmlContent.includes('<body'),
        hasHeadTag: htmlContent.includes('<head'),
        hasTitleTag: htmlContent.includes('<title'),
        hasScriptTags: (htmlContent.match(/<script/g) || []).length,
        hasStyleTags: (htmlContent.match(/<style/g) || []).length,
        hasDivTags: (htmlContent.match(/<div/g) || []).length,
        hasParagraphTags: (htmlContent.match(/<p/g) || []).length,
        textContentLength: htmlContent.replace(/<[^>]+>/g, '').trim().length,
        preview: htmlContent.substring(0, 500) + (htmlContent.length > 500 ? '...' : '')
      };
      
      console.log('HTML analysis completed');
    } catch (error) {
      testResults.htmlAnalysis.error = error.message;
      console.log('HTML analysis failed:', error.message);
    }
    
    // Test basic conversion
    try {
      console.log('Testing basic HTML to PDF conversion...');
      const outputPath = path.join(__dirname, '../outputs', 
        path.basename(req.file.filename, path.extname(req.file.filename)) + '-test.pdf');
      
      const result = await convertHtmlToPdf(inputPath, outputPath);
      
      testResults.conversionTest = {
        success: true,
        outputFile: path.basename(outputPath),
        fileSize: result.fileSize,
        message: result.message,
        contentAnalysis: result.contentAnalysis || 'No content analysis available'
      };
      
      // Clean up test output file
      await fs.remove(outputPath).catch(console.error);
      
      console.log('HTML to PDF conversion test completed successfully');
    } catch (error) {
      testResults.conversionTest = {
        success: false,
        error: error.message,
        stack: error.stack
      };
      console.log('HTML to PDF conversion test failed:', error.message);
    }
    
    // Clean up uploaded file
    await fs.remove(inputPath);
    
    res.json({
      success: true,
      message: 'HTML to PDF conversion test completed',
      results: testResults
    });

  } catch (error) {
    console.error('Test HTML to PDF conversion error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Test HTML to PDF conversion failed',
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