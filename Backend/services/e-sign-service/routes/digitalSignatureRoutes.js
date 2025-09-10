// routes/digitalSignatureRoutes.js
const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const { signDocumentController } = require('../controllers/digitalSignatureController');

const router = express.Router();

router.post('/signatures/sign', upload.single('pdf'), signDocumentController);

module.exports = router;
