const express = require('express');
const router = express.Router();

const {
  getPDFToolSettings,
  createPDFToolSettings,
  updatePDFToolSettings,
  deletePDFToolSettings,
  bulkUpdatePDFToolSettings,
  initializeDefaultToolSettings
} = require('../controllers/mainController');
const { getActivation, setActivation } = require('../controllers/activationController');
const {
  listTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
} = require('../controllers/pdfToolController');

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

// PDF Tools CRUD (Admin)
router.get('/pdf-tools', listTools);
router.get('/pdf-tools/:id', getTool);
router.post('/pdf-tools', createTool);
router.put('/pdf-tools/:id', updateTool);
router.delete('/pdf-tools/:id', deleteTool);

const {userList,userStatusToggle,getUserDetail,updateUserDetail,updateUserPassword} = require('../controllers/mainController');
router.get('/user-list',userList);
router.patch('/user-status/toggle/:id',userStatusToggle);
router.get('/user/:id', getUserDetail);
router.patch('/user/update/:id', updateUserDetail);
router.patch('/user/password/:id', updateUserPassword)

module.exports = router;
