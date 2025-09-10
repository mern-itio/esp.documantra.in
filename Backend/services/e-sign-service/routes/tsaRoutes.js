// routes/tsaRoutes.js
const express = require('express');
const { requestTsaController, verifyTsaController } = require('../controllers/tsaController');

const router = express.Router();

router.post('/tsa/request', requestTsaController); // create + store token for a digital signature
router.post('/tsa/verify', verifyTsaController);   // verify a token blob

module.exports = router;
