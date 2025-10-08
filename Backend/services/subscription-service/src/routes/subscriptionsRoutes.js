const express = require('express');
const router = express.Router();
const { purchase, mySubscriptions, listSubscriptions } = require('../controllers/subscriptionsController');

// user routes
router.post('/purchase', purchase);
router.get('/me', mySubscriptions);

// admin overview (route mounted under /subscriptions with admin verify in index if needed)
router.get('/', listSubscriptions);

module.exports = router;


