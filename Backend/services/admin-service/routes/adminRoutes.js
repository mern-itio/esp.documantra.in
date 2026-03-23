const express = require('express');
const router = express.Router();

const {
  userStatusToggle,
  getUserDetail,
  updateUserDetail,
  updateUserPassword,
  userList
} = require('../controllers/mainController');
const { getActivation, setActivation } = require('../controllers/activationController');
const {getEnvelopes,getAllEnvelopeStats} = require('../controllers/eSignController');
const {getDocuments, getDocumentVersions, getDocumentComments, getDocumentWorkflows} = require('../controllers/documentController');
const { getSharedDocuments, getSharedDocumentComments } = require('../controllers/documentController');

const {createPlane, getPlan, listPlans, updatePlan, deletePlan} = require('../controllers/subscriptionController');
const {getUserPdfOperations, getUserServiceStats, getUserOperationHistory} = require('../controllers/userUsageController');
const {getUserPdfOperations: getPdfOps, getUserPdfStats, getAllUsersPdfStats, getPdfOperationById, deletePdfOperation} = require('../controllers/pdfController');

const {addAuthProvider, listAuthProviders, updateAuthProvider, toggleAuthProvider, deleteAuthProvider} = require('../controllers/authProviderController');
const {listOrganizations} = require('../controllers/organizationController');
const {listCreditPackages, createCreditPackage, updateCreditPackage, deleteCreditPackage} = require('../controllers/creditPackageController');

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


// Tool Activation routes (separate from settings)
router.get('/tool-activation/:toolId', getActivation);
router.put('/tool-activation/:toolId', setActivation);

// E-Sign Routes
router.get('/fetch/envelopes',getEnvelopes);
router.get('/envelope/all-stats', getAllEnvelopeStats);

// Document Routes
router.get('/fetch/documents',getDocuments);
router.get('/fetch/shared-documents', getSharedDocuments);
router.get('/shared-documents/:shareToken/comments', getSharedDocumentComments);
router.get('/documents/:documentId/versions', getDocumentVersions);
router.get('/documents/:documentId/comments', getDocumentComments);
router.get('/documents/:documentId/workflows', getDocumentWorkflows);
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


// Auth Provider routes
router.post('/auth-providers', addAuthProvider);
router.get('/auth-providers', listAuthProviders);
router.put('/auth-providers/:id', updateAuthProvider);
router.post('/auth-providers/toggle', toggleAuthProvider);
router.delete('/auth-providers/:id', deleteAuthProvider);

//Credit Packages routes
router.get('/credit-packages', listCreditPackages);
router.post('/credit-packages', createCreditPackage);
router.put('/credit-packages/:id', updateCreditPackage);
router.delete('/credit-packages/:id', deleteCreditPackage);

// Organization routes
router.get('/organization-request-list', listOrganizations);

module.exports = router;
