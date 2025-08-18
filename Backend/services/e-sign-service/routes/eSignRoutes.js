const express = require('express');
const { Upload } = require('../controllers/eSignController');

const router = express.Router();

router.get('/status', (_, res) => res.send('Auth Service is running and changing'));
router.post('/upload', Upload);

module.exports = router;
