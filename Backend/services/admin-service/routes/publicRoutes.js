const express = require('express');
const router = express.Router();
const { getPublicToolSettings, getToolSettings } = require('../controllers/toolSettingsController');
const { getActivationPublic, getActiveToolIdsPublic } = require('../controllers/activationController');

// Public routes for tool settings (no auth required)
router.get('/tool-settings', getPublicToolSettings);
router.get('/tool-settings/:toolId', getToolSettings);
router.get('/tool-activation/:toolId', getActivationPublic);
router.get('/tool-activation', getActiveToolIdsPublic);

module.exports = router;
