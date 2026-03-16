const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/smtpConfiguration.controller');

router.post('/send/:id', ctrl.sendMail);
router.post('/send-by-system', ctrl.sendMailBySystem);

module.exports = router;
