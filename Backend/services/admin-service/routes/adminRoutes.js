const express = require('express');
const router = express.Router();

const {
  userList,
  getPDFToolSettings,
  createPDFToolSettings,
  updatePDFToolSettings,
  deletePDFToolSettings,
  bulkUpdatePDFToolSettings,
  initializeDefaultToolSettings,
  userStatusToggle,
  getUserDetail,
  updateUserDetail,
  updateUserPassword
} = require('../controllers/mainController');
const { getActivation, setActivation } = require('../controllers/activationController');
const { getPublicToolSettings, getToolSettings } = require('../controllers/toolSettingsController');
const {getEnvelopes} = require('../controllers/eSignController');
const {createPlane} = require('../controllers/subscriptionController');
// User management routes
router.get('/user-list', userList);
router.patch('/user-status/toggle/:id',userStatusToggle);
router.get('/user/:id', getUserDetail);
router.patch('/user/update/:id', updateUserDetail);
router.patch('/user/password/:id', updateUserPassword)

// PDF Tool Settings Management routes (Admin only)
router.get('/pdf-tool-settings', getPDFToolSettings);
router.post('/pdf-tool-settings', createPDFToolSettings);
router.put('/pdf-tool-settings/:toolId', updatePDFToolSettings);
router.delete('/pdf-tool-settings/:toolId', deletePDFToolSettings);
router.post('/pdf-tool-settings/bulk-update', bulkUpdatePDFToolSettings);
router.post('/pdf-tool-settings/initialize', initializeDefaultToolSettings);

// Tool Activation routes (separate from settings)
router.get('/tool-activation/:toolId', getActivation);
router.put('/tool-activation/:toolId', setActivation);

// E-Sign Routes
router.get('/fetch/envelopes',getEnvelopes);

// Susbscription and Billing routes
router.post('/plan-templates',createPlane);

module.exports = router;
