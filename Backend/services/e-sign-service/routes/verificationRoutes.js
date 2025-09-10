// routes/verificationRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/verificationController');

// GET /api/verify/signed-document/:signedDocumentId
router.get('/verify/signed-document/:signedDocumentId', controller.verifySignedDocument);

module.exports = router;
