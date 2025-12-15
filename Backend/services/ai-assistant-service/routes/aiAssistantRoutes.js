const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const aiAssistantController = require('../controllers/aiAssistantController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, Word docs, and images
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload PDF, Word document, or image.'));
    }
  }
});

// Process command (with optional file upload)
router.post('/command', upload.single('file'), aiAssistantController.processCommand.bind(aiAssistantController));

// Get conversation history
router.get('/conversation', aiAssistantController.getConversationHistory.bind(aiAssistantController));

// Clear conversation
router.delete('/conversation', aiAssistantController.clearConversation.bind(aiAssistantController));

// Sync documents for indexing
router.post('/sync-documents', aiAssistantController.syncDocuments.bind(aiAssistantController));

module.exports = router;

