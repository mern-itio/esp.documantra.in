const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const addHeaderFooterController = require('../controllers/addHeaderFooterController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Route to add headers and footers to PDF
router.post('/add-header-footer', 
  upload.single('file'), 
  addHeaderFooterController.addHeaderFooter
);

// Route to generate preview of headers and footers
router.post('/preview-header-footer', 
  upload.single('file'), 
  addHeaderFooterController.getHeaderFooterPreview
);

// Route to serve PDF files with proper headers for iframe embedding
router.get('/preview/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'outputs', filename);
    
    // console.log(`Header/Footer Preview route: Looking for file: ${filename}`);
    // console.log(`Header/Footer Preview route: Full path: ${filePath}`);
    
    if (await fs.pathExists(filePath)) {
      // console.log(`Header/Footer Preview route: File found, serving: ${filename}`);
      // Set headers to allow iframe embedding
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000 http://localhost:5173 http://165.22.215.73:8081");
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      res.sendFile(filePath);
    } else {
      // console.log(`Header/Footer Preview route: File not found: ${filename}`);
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving header/footer preview file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Route to serve main PDF files for download (the ones with headers and footers)
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'outputs', filename);
    
    // console.log(`Header/Footer Download route: Looking for file: ${filename}`);
    // console.log(`Header/Footer Download route: Full path: ${filePath}`);
    
    if (await fs.pathExists(filePath)) {
      // console.log(`Header/Footer Download route: File found, serving: ${filename}`);
      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      res.sendFile(filePath);
    } else {
      // console.log(`Header/Footer Download route: File not found: ${filename}`);
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving header/footer PDF download:', error);
    res.status(500).json({ error: 'Failed to serve PDF download' });
  }
});

module.exports = router;
