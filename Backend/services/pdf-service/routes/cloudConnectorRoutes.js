const express = require('express');
const router = express.Router();
const cloudConnectorController = require('../controllers/cloudConnectorController');

// Get all available cloud services
router.get('/services', cloudConnectorController.getAvailableServices);

// Get user's connected services
router.get('/connected', cloudConnectorController.getConnectedServices);

// Get OAuth authorization URL for a service
router.get('/auth/:serviceId', cloudConnectorController.getAuthUrl);

// Handle OAuth callback from frontend service (returns JSON)
router.get('/callback-api', cloudConnectorController.handleOAuthCallback);

// Disconnect a service
router.delete('/disconnect/:serviceId', cloudConnectorController.disconnectService);

// Sync files from a service
router.post('/sync/:serviceId', cloudConnectorController.syncFiles);

// Get files from services
router.get('/files', cloudConnectorController.getFiles);

// Download file from cloud service
router.get('/download/:fileId', cloudConnectorController.downloadFile);

// Upload file to cloud service - handled directly in index.js with multer middleware

// Create folder in cloud service
router.post('/create-folder', cloudConnectorController.createFolder);

module.exports = router;
