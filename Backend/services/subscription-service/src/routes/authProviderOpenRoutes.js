const express = require('express');
const router = express.Router();
const { bulkFetchByIds } = require('../controllers/authProviderController');
const { callback} = require('../controllers/authProviderCallbackController');
const { initiateAuth,verifyOtp } = require('../controllers/AuthenticationController');
router.post('/bulk/details',bulkFetchByIds);
router.post('/initiate/auth', initiateAuth);
router.post('/verify/otp', verifyOtp);
router.get('/callback/:type',callback);

module.exports = router;