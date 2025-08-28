const express = require('express');
const router = express.Router();
const {createApiKey, getAllApiKeys} = require('../controllers/apiKeyController');

// route to generate keys
router.post('/generate', createApiKey);
// Route to get user's all keys
router.get('/keys', getAllApiKeys);

module.exports = router;
