const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const digitalSignatureController = require('../controllers/digitalSignatureController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Allow PDF files and PEM files (for certificates and private keys)
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pem')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and PEM files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Certificate management routes
router.post('/generate-certificate', digitalSignatureController.generateCertificate);
router.get('/list-certificates', digitalSignatureController.listCertificates);
router.post('/test-certificate', digitalSignatureController.testCertificateGeneration);

// Digital signature routes
router.post('/add-signature', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'privateKeyFile', maxCount: 1 },
  { name: 'certificateFile', maxCount: 1 }
]), digitalSignatureController.addDigitalSignature);
router.post('/verify-signature', upload.single('file'), digitalSignatureController.verifyDigitalSignature);

// Timestamp authority routes
router.post('/timestamp-authority', digitalSignatureController.getTimestampAuthority);

// Download route for signed PDFs
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'outputs', filename);
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Health check for digital signature service
router.get('/health', (req, res) => {
  res.json({
    service: 'Digital Signature Service',
    status: 'running',
    timestamp: new Date().toISOString(),
    features: [
      'certificate_validation',
      'timestamp_authority', 
      'signature_verification',
      'digital_signature_creation'
    ]
  });
});

module.exports = router;
