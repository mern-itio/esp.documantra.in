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
const {
  planMutationLimiter,
  creditPackageMutationLimiter,
  templateMutationLimiter,
  pdfToolMutationLimiter,
} = require('../middleware/adminMutationLimiter');
const {getUserPdfOperations, getUserServiceStats, getUserOperationHistory} = require('../controllers/userUsageController');
const {getUserPdfOperations: getPdfOps, getUserPdfStats, getAllUsersPdfStats, getPdfOperationById, deletePdfOperation} = require('../controllers/pdfController');

const {addAuthProvider, listAuthProviders, updateAuthProvider, toggleAuthProvider, deleteAuthProvider} = require('../controllers/authProviderController');
const {listOrganizations,updateOrganizationVerificationStatus} = require('../controllers/organizationController');
const {listCreditPackages, createCreditPackage, updateCreditPackage, deleteCreditPackage,getFlexibleCreditPackage} = require('../controllers/creditPackageController');
const {createEmailTemplate,getEmailTemplates,updateEmailTemplates,deleteEmailTemplate} = require('../controllers/emailTemplateController');
const {
  getPlatformEmailConfig,
  updatePlatformEmailConfig,
  testPlatformEmail,
} = require('../controllers/platformEmailController');
const {
  getVSignConfig,
  getVSignProfileStatus,
  switchVSignProfile,
  updateVSignConfig,
  testVSignConfig,
} = require('../controllers/vsignConfigController');
const {
  listTemplates,
  updateTemplate,
  deleteTemplate,
  setApproval,
  generateAndActivateTemplate,
  listTemplateTypes,
  createTemplateType,
  updateTemplateType,
  deleteTemplateType,
  generateTemplateContent,
  generateTemplateContentStream
} = require('../controllers/templateModerationController');
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
router.post('/pdf-tools', pdfToolMutationLimiter, createTool);
router.put('/pdf-tools/:id', updateTool);
router.delete('/pdf-tools/:id', deleteTool);

// Subscription and Billing routes
router.get('/plan-templates', listPlans);
router.post('/plan-templates', planMutationLimiter, createPlane);
router.get('/plan-templates/:id', getPlan);
router.put('/plan-templates/:id', planMutationLimiter, updatePlan);
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
router.post('/credit-packages', creditPackageMutationLimiter, createCreditPackage);
router.put('/credit-packages/:id', creditPackageMutationLimiter, updateCreditPackage);
router.delete('/credit-packages/:id', deleteCreditPackage);
// Flexible credit package
router.get('/flexible-credit-package',getFlexibleCreditPackage);

// Email Template routes
router.post('/create-email-template',createEmailTemplate);
router.get('/email-templates',getEmailTemplates);
router.put('/email-templates/:id',updateEmailTemplates);
router.delete('/email-templates/:id',deleteEmailTemplate);

// Platform email (Mailgun) settings
router.get('/platform-email', getPlatformEmailConfig);
router.put('/platform-email', updatePlatformEmailConfig);
router.post('/platform-email/test', testPlatformEmail);

// VSign / Aadhaar eSign settings
router.get('/vsign-config', getVSignConfig);
router.get('/vsign-config/status', getVSignProfileStatus);
router.post('/vsign-config/switch', switchVSignProfile);
router.put('/vsign-config', updateVSignConfig);
router.post('/vsign-config/test', testVSignConfig);

// Organization routes
router.get('/organization-request-list', listOrganizations);
router.patch('/organization/:id/status', updateOrganizationVerificationStatus);

// Template moderation routes
router.get('/templates', listTemplates);
router.post('/templates/generate-ai', templateMutationLimiter, generateAndActivateTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);
router.patch('/templates/:id/approval', setApproval);
router.post('/templates/ai/generate', templateMutationLimiter, generateTemplateContent);
router.post('/templates/ai/generate-stream', templateMutationLimiter, generateTemplateContentStream);
router.get('/template-types', listTemplateTypes);
router.post('/template-types', templateMutationLimiter, createTemplateType);
router.put('/template-types/:id', updateTemplateType);
router.delete('/template-types/:id', deleteTemplateType);

module.exports = router;
