const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/smtpConfiguration.controller');

router.post('/send/:id', ctrl.sendMail);

module.exports = router;
