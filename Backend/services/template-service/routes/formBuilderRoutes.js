const express = require('express');
const path = require('path');

//Import Controller
const {Test,getAllForm,createForm,getFormDetail,addField} = require('../controllers/formBuilderController');

const router = express.Router();
// Routes
router.get('/health', Test);
router.get('/get-form',getAllForm);
router.get('/get-form-details/:id',getFormDetail);
router.post('/create-form',createForm);
router.post('/add-fields',addField)

module.exports = router;