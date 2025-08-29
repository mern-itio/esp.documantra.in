const express = require('express');
const router = express.Router();
const {createApiKey, getAllApiKeys, getAnalyticsStats, getRequestVolume, getStatusCodes, getHourlyLatencyPercentiles, getErrorTypesDistribution, getRecentErrors, getTopApiEndpoints} = require('../controllers/apiKeyController');

// Route to generate keys
router.post('/generate', createApiKey);
// Route to get user's all keys
router.get('/keys', getAllApiKeys);
// Route to get total number of requests
router.get('/total-requests', getAnalyticsStats);
// Route to get request volume data
router.get('/request-volume', getRequestVolume);
// Route for status codes distribution
router.get('/status-codes', getStatusCodes);
// Route to get percentile data
router.get('/response-percentiles', getHourlyLatencyPercentiles);
// Route for error types distribution
router.get('/error-types', getErrorTypesDistribution);
// Route for recent errors
router.get('/recent-errors', getRecentErrors);
// Route for top API endpoints
router.get('/top-endpoints', getTopApiEndpoints);

module.exports = router;
