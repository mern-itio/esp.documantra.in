const express = require('express');
const path = require('path');

//Import Controller
const {Test,getAllForm,createForm,getFormDetail,addField,getFormSubmissions,deleteForm} = require('../controllers/formBuilderController');
const {saveAITemplate} = require('../controllers/templateController');

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

module.exports = router;