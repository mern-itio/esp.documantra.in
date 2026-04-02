const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/smtpConfiguration.controller');

router.post('/', ctrl.createSmtpConfig);
router.get('/', ctrl.getSmtpConfigs);
router.patch('/:id', ctrl.updateSmtpConfig);
router.patch('/:id/set-default', ctrl.setDefaultSmtpConfig);
router.patch('/:id/set-status', ctrl.setStatusSmtpConfig);
router.delete('/:id', ctrl.deleteSmtpConfig);
router.post('/:id/test', ctrl.testSmtpConfig);

module.exports = router;
