const express = require('express');
const router = express.Router();
const {envelopesData, envelopeStats, getAllEnvelopeStats} = require('../controllers/mainController');
const {
  getVSignConfig,
  updateVSignConfig,
  uploadVSignCert,
  testVSignConfig,
  certUpload,
} = require('../controllers/vsignConfigAdminController');

router.get('/fetch/envelopes/',envelopesData );
router.get('/user-stats',envelopeStats);
router.get('/envelope/all-stats/:userType', getAllEnvelopeStats);

router.get('/vsign-config', getVSignConfig);
router.put('/vsign-config', updateVSignConfig);
router.post('/vsign-config/test', testVSignConfig);
router.post(
  '/vsign-config/upload',
  certUpload.single('file'),
  uploadVSignCert,
);

module.exports = router;