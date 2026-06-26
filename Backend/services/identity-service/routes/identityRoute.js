// src/routes/kycRoutes.js
const express = require('express');
const router = express.Router();

const controller = require('../controllers/identityController');
const selfieController = require('../controllers/selfieController');

router.post('/start', controller.startIdentity);
router.post('/selfie/store', selfieController.storeSelfie);
router.get('/selfie/status/:verificationId', selfieController.getSelfieStatus);
router.get('/:userId', controller.getStatus);
module.exports = router;