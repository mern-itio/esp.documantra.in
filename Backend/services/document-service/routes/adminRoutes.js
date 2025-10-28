const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// Admin endpoint to fetch all documents with optional userId filter
router.get('/fetch/documents', async (req, res) => {
  return await documentController.getAllDocuments(req, res);
});

// Admin endpoint to get document stats for a specific user
router.get('/user-stats', async (req, res) => {
  console.log('📊 Document stats route hit:', req.query);
  return await documentController.getUserDocumentStats(req, res);
});

// Admin endpoints for document details
router.get('/documents/:documentId/versions', async (req, res) => {
  try {
    const { documentId } = req.params;
    const Version = require('../models/Version');
    const versions = await Version.find({ documentId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: versions });
  } catch (error) {
    console.error('Error getting versions:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch versions' });
  }
});

router.get('/documents/:documentId/comments', async (req, res) => {
  try {
    const { documentId } = req.params;
    const Comment = require('../models/Comment');
    const comments = await Comment.find({ documentId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Error getting comments:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
});

router.get('/documents/:documentId/workflows', async (req, res) => {
  try {
    const { documentId } = req.params;
    const Workflow = require('../models/Workflow');
    const workflows = await Workflow.find({ documentId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, data: workflows });
  } catch (error) {
    console.error('Error getting workflows:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch workflows' });
  }
});

module.exports = router;


