const express = require('express');
const multer = require('multer');
const path = require('path');
const setPermissionsController = require('../controllers/setPermissionsController');

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
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

// Set permissions on PDF
router.post('/set-permissions', upload.single('file'), setPermissionsController.setPermissions);

// View PDF with enforced permissions (secure link)
router.get('/view/:token/:filename', setPermissionsController.viewSecurePDF);

// Serve raw PDF for iframe (with restrictions)
router.get('/raw-pdf/:token/:filename', setPermissionsController.serveRawPDF);

// Revoke secure link
router.delete('/revoke/:token', setPermissionsController.revokeSecureLink);

// Get current permissions of a PDF
router.post('/get-current-permissions', upload.single('file'), setPermissionsController.getCurrentPermissions);

module.exports = router;
