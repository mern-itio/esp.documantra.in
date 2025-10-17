const express = require('express');
const router = express.Router();
const { getBalance, consumeCredits, listUsage } = require('../controllers/usageController');

// Note: index.js should mount this under /usage and apply verifyJWT('user')
router.get('/balance', getBalance);
router.post('/consume', consumeCredits);
router.get('/records', listUsage);

module.exports = router;


