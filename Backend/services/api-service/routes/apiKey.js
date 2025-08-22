const express = require('express');
const router = express.Router();
const { runApiTest } = require('../controllers/testApiController');

router.post('/test-api', runApiTest);

module.exports = router;
