const express = require('express');
const {
  getPlatformEmailConfig,
  updatePlatformEmailConfig,
  testPlatformEmail,
} = require('../controllers/platformEmailAdminController');

const router = express.Router();

router.get('/platform-email', getPlatformEmailConfig);
router.put('/platform-email', updatePlatformEmailConfig);
router.post('/platform-email/test', testPlatformEmail);

module.exports = router;
