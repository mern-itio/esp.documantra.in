const express = require('express');
const router = express.Router();
const { getUserPlan, updateUserPlan, createFreeSubscriptionEndpoint } = require('../controllers/userPlanController');

// User plan routes (protected with user token verification)
router.get('/me', getUserPlan);
router.put('/update', updateUserPlan);

// Create free subscription (called by auth service - no auth required)
router.post('/create-free', createFreeSubscriptionEndpoint);

module.exports = router;
