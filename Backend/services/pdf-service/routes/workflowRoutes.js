const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const workflowController = require('../controllers/workflowController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'workflow-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xlsx', '.pptx', '.txt', '.html'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLSX, PPTX, TXT, and HTML files are allowed.'), false);
    }
  }
});

// Workflow Template Routes
// Get all workflow templates
router.get('/templates', workflowController.getWorkflowTemplates);

// Get a specific workflow template
router.get('/templates/:templateId', workflowController.getWorkflowTemplate);

// Create a new workflow template
router.post('/templates', workflowController.createWorkflowTemplate);

// Update a workflow template
router.put('/templates/:templateId', workflowController.updateWorkflowTemplate);

// Delete a workflow template
router.delete('/templates/:templateId', workflowController.deleteWorkflowTemplate);

// Duplicate a workflow template
router.post('/templates/:templateId/duplicate', workflowController.duplicateWorkflowTemplate);

// Workflow Execution Routes
// Execute a workflow
router.post('/templates/:templateId/execute', upload.single('file'), workflowController.executeWorkflow);

// Get workflow execution status
router.get('/executions/:executionId', workflowController.getWorkflowExecution);

// Download workflow execution result
router.get('/executions/:executionId/download', workflowController.downloadWorkflowResult);

// Get user's workflow executions
router.get('/executions', workflowController.getUserWorkflowExecutions);

// Cancel workflow execution
router.post('/executions/:executionId/cancel', workflowController.cancelWorkflowExecution);

module.exports = router;
