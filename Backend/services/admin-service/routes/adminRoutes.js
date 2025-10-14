const express = require('express');
const router = express.Router();

const {
  getPDFToolSettings,
  createPDFToolSettings,
  updatePDFToolSettings,
  deletePDFToolSettings,
  bulkUpdatePDFToolSettings,
  initializeDefaultToolSettings,
  userStatusToggle,
  getUserDetail,
  updateUserDetail,
  updateUserPassword,
  userList
} = require('../controllers/mainController');
const { getActivation, setActivation } = require('../controllers/activationController');
const {getEnvelopes} = require('../controllers/eSignController');
const {createPlane, getPlan, listPlans, updatePlan, deletePlan} = require('../controllers/subscriptionController');
const {getUserPdfOperations, getUserServiceStats, getUserOperationHistory} = require('../controllers/userUsageController');
const {getUserPdfOperations: getPdfOps, getUserPdfStats, getAllUsersPdfStats, getPdfOperationById, deletePdfOperation} = require('../controllers/pdfController');
// User management routes
router.get('/user-list', userList);
router.patch('/user-status/toggle/:id',userStatusToggle);
router.get('/user/:id', getUserDetail);
router.patch('/user/update/:id', updateUserDetail);
router.patch('/user/password/:id', updateUserPassword)
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

// E-Sign Routes
router.get('/fetch/envelopes',getEnvelopes);
// PDF Tools CRUD (Admin)
router.get('/pdf-tools', listTools);
router.get('/pdf-tools/:id', getTool);
router.post('/pdf-tools', createTool);
router.put('/pdf-tools/:id', updateTool);
router.delete('/pdf-tools/:id', deleteTool);

// Subscription and Billing routes
router.get('/plan-templates', listPlans);
router.post('/plan-templates', createPlane);
router.get('/plan-templates/:id', getPlan);
router.put('/plan-templates/:id', updatePlan);
router.delete('/plan-templates/:id', deletePlan);

// User Usage Tracking routes
router.get('/users/:userId/pdf-operations', getUserPdfOperations);
router.get('/users/:userId/service-stats', getUserServiceStats);
router.get('/users/:userId/operation-history', getUserOperationHistory);

// PDF Service Admin routes
router.get('/pdf/users/:userId/operations', getPdfOps);
router.get('/pdf/users/:userId/stats', getUserPdfStats);
router.get('/pdf/stats/all-users', getAllUsersPdfStats);
router.get('/pdf/operations/:operationId', getPdfOperationById);
router.delete('/pdf/operations/:operationId', deletePdfOperation);


module.exports = router;
