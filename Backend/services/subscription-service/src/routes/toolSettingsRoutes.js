const express = require('express');
const verifyJWT = require('@draftnsign/auth-lib');
const router = express.Router();
const {
  getToolSettings,
  createToolSettings,
  updateToolSettings,
  deleteToolSettings,
  getPublicToolSettings,
  getToolSettings: getSingleToolSettings
} = require('../controllers/toolSettingsController');

// Admin routes (protected)
router.get('/pdf-tool-settings', verifyJWT('admin'), getToolSettings);
router.post('/pdf-tool-settings', verifyJWT('admin'), createToolSettings);
router.put('/pdf-tool-settings/:toolId', verifyJWT('admin'), updateToolSettings);
router.delete('/pdf-tool-settings/:toolId', verifyJWT('admin'), deleteToolSettings);

// Public routes (no auth required)
router.get('/public/tool-settings', getPublicToolSettings);
router.get('/public/tool-settings/:toolId', getSingleToolSettings);

module.exports = router;
