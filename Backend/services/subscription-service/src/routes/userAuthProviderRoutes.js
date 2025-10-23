const express = require('express');
const router = express.Router();

const { availableAuthMethods} = require('../controllers/authProviderController');
router.get('/available/auth/methods',availableAuthMethods);

module.exports = router;