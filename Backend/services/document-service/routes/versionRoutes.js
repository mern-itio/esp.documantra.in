const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');

// Get all versions for a document
router.get('/documents/:documentId/versions', versionController.getDocumentVersions);

// Create a new version
router.post('/documents/:documentId/versions', versionController.createVersion);

// Get a specific version
router.get('/versions/:versionId', versionController.getVersion);

// Update version metadata
router.put('/versions/:versionId', versionController.updateVersion);

// Delete a version
router.delete('/versions/:versionId', versionController.deleteVersion);

// Compare two versions
router.get('/versions/:fromVersionId/compare/:toVersionId', versionController.compareVersions);

module.exports = router;
