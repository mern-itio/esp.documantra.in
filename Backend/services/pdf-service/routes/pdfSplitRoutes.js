const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
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

    // Create ZIP file
    const zipFileName = `split_${Date.now()}.zip`;
    const zipPath = path.join(__dirname, '../outputs', zipFileName);
    
    // Ensure outputs directory exists
    await fs.ensureDir(path.dirname(zipPath));
    
    // Create ZIP archive
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', async () => {
        console.log(`ZIP file created: ${zipPath} (${archive.pointer()} bytes)`);
        
        // Clean up individual PDF files
        for (const file of resultFiles) {
          await fs.remove(file).catch(console.error);
        }
        
        // Clean up uploaded file
        await fs.remove(filePath);
        
        res.json({
          success: true,
          message: `PDF split successfully by ${mode}`,
          splitInfo,
          zipFile: {
            filename: zipFileName,
            path: zipPath,
            size: archive.pointer(),
            downloadUrl: `/pdf-split/download/${zipFileName}`
          },
          totalFiles: resultFiles.length
        });
        resolve();
      });
      
      archive.on('error', async (err) => {
        console.error('Archive error:', err);
        
        // Clean up files on error
        for (const file of resultFiles) {
          await fs.remove(file).catch(console.error);
        }
        await fs.remove(filePath).catch(console.error);
        
        res.status(500).json({ 
          success: false, 
          error: 'Failed to create ZIP file',
          message: err.message 
        });
        reject(err);
      });
      
      archive.pipe(output);
      
      // Add each PDF file to the archive
      resultFiles.forEach((file, index) => {
        const fileName = path.basename(file);
        archive.file(file, { name: fileName });
      });
      
      archive.finalize();
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

// Download ZIP file endpoint
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../outputs', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      success: false, 
      error: 'File not found' 
    });
  }
  
  // Set headers for file download
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  // Clean up file after download
  fileStream.on('end', () => {
    fs.remove(filePath).catch(console.error);
  });
  
  fileStream.on('error', (err) => {
    console.error('File stream error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to download file' 
    });
  });
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Split PDF service is running',
    endpoints: {
      split: 'POST /pdf-service/split',
      info: 'POST /pdf-service/info',
      download: 'GET /pdf-service/download/:filename'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
