const express = require('express');
const router = express.Router();
const fillPdfFormController = require('../controllers/fillPdfFormController');
const { upload, uploadAllFiles } = require('../middleware/upload');

// Fill PDF form with data
router.post('/fill', upload.single('pdf'), fillPdfFormController.fillPdfForm);

// Auto-fill PDF form using AI/pattern recognition
router.post('/auto-fill', upload.single('pdf'), fillPdfFormController.autoFillPdfForm);

// Validate form data before filling
router.post('/validate', fillPdfFormController.validateFormData);

// Get form fields from PDF
router.post('/extract-fields', upload.single('pdf'), fillPdfFormController.extractFormFields);

// Add signature to form fields
router.post('/add-signature', upload.single('pdf'), fillPdfFormController.addSignatureToForm);

// Bulk fill multiple forms
router.post('/bulk-fill', uploadAllFiles.array('pdfs', 10), fillPdfFormController.bulkFillForms);

// Save form data as template
router.post('/save-template', fillPdfFormController.saveFormTemplate);

// Get saved templates
router.get('/templates', fillPdfFormController.getSavedTemplates);

// Get a specific template by ID
router.get('/templates/:templateId', fillPdfFormController.getTemplateById);

// Get service status
router.get('/status', fillPdfFormController.getServiceStatus);

module.exports = router;
