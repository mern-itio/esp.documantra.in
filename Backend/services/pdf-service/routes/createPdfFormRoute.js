const express = require('express');
const router = express.Router();
const createPdfFormController = require('../controllers/createPdfFormController');

// Create a new PDF form
router.post('/create', createPdfFormController.createPdfForm);

// Fill an existing PDF form
router.post('/fill', createPdfFormController.fillPdfForm);

// Validate form fields
router.post('/validate', createPdfFormController.validateFormFields);

// Get available form templates
router.get('/templates', createPdfFormController.getFormTemplates);

// Get supported field types
router.get('/field-types', createPdfFormController.getSupportedFieldTypes);

// Get service status
router.get('/status', createPdfFormController.getServiceStatus);

module.exports = router;
