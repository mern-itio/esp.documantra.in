const express = require('express');
const router = express.Router();
const {envelopesData, envelopeStats, getAllEnvelopeStats} = require('../controllers/mainController');

router.get('/fetch/envelopes/',envelopesData );
router.get('/user-stats',envelopeStats);
router.get('/envelope/all-stats/:userType', getAllEnvelopeStats);

module.exports = router;