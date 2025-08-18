const express = require('express');
const router = express.Router();
const documentAnalysisController = require('../controllers/documentAnalysisController');
// Authentication is handled globally in the main index.js

/**
 * @route POST /api/document-analysis/:documentId/process
 * @desc Process a document for analysis
 * @access Private
 */
router.post('/:documentId/process', documentAnalysisController.processDocument);

/**
 * @route GET /api/document-analysis/:documentId
 * @desc Get document analysis results
 * @access Private
 */
router.get('/:documentId', documentAnalysisController.getDocumentAnalysis);

/**
 * @route GET /api/document-analysis/:documentId/status
 * @desc Get analysis processing status
 * @access Private
 */
router.get('/:documentId/status', documentAnalysisController.getAnalysisStatus);

/**
 * @route POST /api/document-analysis/:documentId/reprocess
 * @desc Reprocess document analysis
 * @access Private
 */
router.post('/:documentId/reprocess', documentAnalysisController.reprocessDocument);

/**
 * @route GET /api/document-analysis/user/:userId
 * @desc Get all analyses for a user
 * @access Private
 */
router.get('/user/:userId', documentAnalysisController.getUserAnalyses);

/**
 * @route DELETE /api/document-analysis/:analysisId
 * @desc Delete document analysis
 * @access Private
 */
router.delete('/:analysisId', documentAnalysisController.deleteAnalysis);

module.exports = router;
