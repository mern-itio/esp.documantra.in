const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  UPLOAD_PRESETS,
  sanitizeUploadFilename,
  createMulterFileFilter,
} = require('@draftnsign/validators');
const pdfShareController = require('../controllers/pdfShareController');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create user-specific upload directory
    const userId = req.user?.data?.id || 'anonymous';
    const userDir = path.join(uploadsDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(sanitizeUploadFilename(file.originalname)) || '.pdf';
    cb(null, 'pdf-share-' + uniqueSuffix + ext);
  }
});

const fileFilter = createMulterFileFilter(UPLOAD_PRESETS.PDF_ONLY);

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: UPLOAD_PRESETS.PDF_ONLY.maxFileSize,
    files: UPLOAD_PRESETS.PDF_ONLY.maxFiles,
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'PDF file size exceeds 50MB limit'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Only one PDF file allowed per upload'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'PDF upload error: ' + error.message
    });
  }
  
  if (error.message === 'Only PDF files are allowed for sharing') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are allowed for sharing'
    });
  }
  
  next(error);
};

// PDF Sharing Routes (Authenticated)
router.post('/upload', upload.single('pdf'), handleMulterError, pdfShareController.uploadPDFForSharing);
router.post('/share', pdfShareController.createShareAndSendEmails);
router.get('/my-shares', pdfShareController.getUserSharedDocuments);
router.delete('/revoke/:shareToken', pdfShareController.revokeSharedDocument);
router.post('/admin-comment/:shareToken', pdfShareController.addAdminComment);
router.get('/comments/:shareToken', pdfShareController.getSharedDocumentComments);

// Public PDF Sharing Routes (No Authentication Required)
router.get('/public/:shareToken', pdfShareController.getSharedDocument);
router.get('/public/:shareToken/comments', pdfShareController.getSharedDocumentComments);
router.post('/public/:shareToken/comments', pdfShareController.addSharedDocumentComment);

module.exports = router;
