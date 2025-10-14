const express = require('express');
const router = express.Router();
const {envelopesData} = require('../controllers/mainController');

router.get('/fetch/envelopes/',envelopesData );

module.exports = router;