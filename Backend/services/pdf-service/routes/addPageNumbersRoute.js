const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const addPageNumbersController = require('../controllers/addPageNumbersController');


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

// Route to add page numbers to PDF
router.post('/add-page-numbers', 
 
  upload.single('file'), 
  addPageNumbersController.addPageNumbers
);

// Route to generate preview of page numbers
router.post('/preview-page-numbers', 
 
  upload.single('file'), 
  addPageNumbersController.getPageNumberPreview
);

// Route to serve PDF files with proper headers for iframe embedding
router.get('/preview/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'outputs', filename);
    
    console.log(`Preview route: Looking for file: ${filename}`);
    console.log(`Preview route: Full path: ${filePath}`);
    
    if (await fs.pathExists(filePath)) {
      console.log(`Preview route: File found, serving: ${filename}`);
      // Set headers to allow iframe embedding
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000 http://localhost:5173 https://esp.documantra.in");
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      res.sendFile(filePath);
    } else {
      console.log(`Preview route: File not found: ${filename}`);
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving preview file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Route to serve main PDF files for download (the ones with all pages numbered)
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'outputs', filename);
    
    console.log(`Download route: Looking for file: ${filename}`);
    console.log(`Download route: Full path: ${filePath}`);
    
    if (await fs.pathExists(filePath)) {
      console.log(`Download route: File found, serving: ${filename}`);
      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      res.sendFile(filePath);
    } else {
      console.log(`Download route: File not found: ${filename}`);
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving PDF download:', error);
    res.status(500).json({ error: 'Failed to serve PDF download' });
  }
});

module.exports = router;
