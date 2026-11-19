const express = require('express');
const rateLimit = require('express-rate-limit');
const { ingestBatch } = require('../controllers/ingestController');

const router = express.Router();

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/v1/batch', ingestLimiter, ingestBatch);
router.post('/v1/page', ingestLimiter, ingestBatch);

module.exports = router;
