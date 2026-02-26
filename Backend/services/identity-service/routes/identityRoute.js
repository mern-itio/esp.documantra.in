// src/routes/kycRoutes.js
const express = require('express');
const router = express.Router();

const controller = require('../controllers/identityController');

router.post('/start', controller.startIdentity);
router.get('/:userId', controller.getStatus);

module.exports = router;