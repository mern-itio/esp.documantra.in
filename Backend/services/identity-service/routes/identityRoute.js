// src/routes/identityRoute.js
const express = require('express');
const router = express.Router();

const controller = require('../controllers/identityController');
const selfieController = require('../controllers/selfieController');

router.post('/start', controller.startIdentity);
router.post('/digilocker/start', controller.startDigilocker);
router.post('/selfie/store', selfieController.storeSelfie);
router.post('/liveness/store', selfieController.storeLiveness);
router.get('/selfie/status/:verificationId', selfieController.getSelfieStatus);

// Didit Workflows (Management API proxy) — must be before /:userId
router.get('/workflows', controller.listWorkflows);
router.post('/workflows', controller.createWorkflow);
router.get('/workflows/:id', controller.getWorkflow);
router.patch('/workflows/:id', controller.updateWorkflow);

// Sessions
router.get('/sessions', controller.listLocalSessions);
router.get('/sessions/didit', controller.listDiditSessions);
router.post('/sessions', controller.createAdminSession);
router.get('/sessions/:sessionId/decision', controller.getSessionDecision);

router.get('/:userId', controller.getStatus);

module.exports = router;
