const express = require('express');
const router = express.Router();

const { callback} = require('../controllers/authProviderCallbackController');
router.get('/callback/:type',callback);

module.exports = router;