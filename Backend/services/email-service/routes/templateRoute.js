const express = require('express');
const router = express.Router();
const { createTemplate, updateTemplate, getTemplateById, deleteTemplate, fetchAllTemplates, getTemplateBySlug } = require('../controllers/mainController');

router.post('/create', createTemplate);
router.patch('/update/:templateId', updateTemplate);
router.get('/fetch-all', fetchAllTemplates);
router.get('/get-one/:templateId', getTemplateById);
router.delete('/delete/:templateId', deleteTemplate);
router.get('/fetch-by-slug/slug/:slug', getTemplateBySlug);
module.exports = router;
