const express = require('express');
//Import Controller
const {getFormDetail,insertFormData} = require('../controllers/formBuilderController');

const router = express.Router();
// Routes
router.get('/get-form-details/:id',getFormDetail);
router.post('/insert-form-data',insertFormData);

module.exports = router;