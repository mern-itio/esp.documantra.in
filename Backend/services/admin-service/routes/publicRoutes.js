const express = require('express');
const router = express.Router();
const { getPublicToolSettings, getToolSettings } = require('../controllers/toolSettingsController');
const { getActivationPublic, getActiveToolIdsPublic } = require('../controllers/activationController');
const { listToolsPublic } = require('../controllers/pdfToolController');

// Public routes for tool settings (no auth required)
router.get('/tool-settings', getPublicToolSettings);
router.get('/tool-settings/:toolId', getToolSettings);
router.get('/tool-activation/:toolId', getActivationPublic);
router.get('/tool-activation', getActiveToolIdsPublic);

// Public list of PDF tools (id, name)
router.get('/pdf-tools', listToolsPublic);

module.exports = router;
