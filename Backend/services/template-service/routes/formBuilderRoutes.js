const express = require('express');
const path = require('path');

//Import Controller
const {Test,getAllForm,createForm,getFormDetail,addField,getFormSubmissions,deleteForm} = require('../controllers/formBuilderController');
const {
  saveAITemplate,
  createApprovedAITemplateForAdmin,
  listTemplatesForAdmin,
  updateTemplateForAdmin,
  setTemplateApprovalStatus,
  listTemplateTypesForAdmin,
  createTemplateTypeForAdmin,
  updateTemplateTypeForAdmin,
  deleteTemplateTypeForAdmin,
  deleteTemplateForAdmin
} = require('../controllers/templateController');

const router = express.Router();
// Routes
router.get('/health', Test);
router.get('/get-form',getAllForm);
router.get('/get-form-details/:id',getFormDetail);
router.post('/create-form',createForm);
router.post('/add-fields',addField);
router.get('/form-submissions/:id',getFormSubmissions);
router.delete('/delete-form/:id',deleteForm);
router.post('/save-ai-template',saveAITemplate);
router.get('/admin/templates', listTemplatesForAdmin);
router.post('/admin/templates/generate-ai', createApprovedAITemplateForAdmin);
router.put('/admin/templates/:id', updateTemplateForAdmin);
router.delete('/admin/templates/:id', deleteTemplateForAdmin);
router.patch('/admin/templates/:id/approval', setTemplateApprovalStatus);
router.get('/admin/template-types', listTemplateTypesForAdmin);
router.post('/admin/template-types', createTemplateTypeForAdmin);
router.put('/admin/template-types/:id', updateTemplateTypeForAdmin);
router.delete('/admin/template-types/:id', deleteTemplateTypeForAdmin);

module.exports = router;