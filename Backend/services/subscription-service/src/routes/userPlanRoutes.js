const express = require('express');
const { getMyPlan } = require('../controllers/userPlanController');
const { listPlans } = require('../controllers/plansController');

const router = express.Router();

// Index will attach verifyJWT('user') to this router
router.get('/me', getMyPlan);
router.get('/all', listPlans);

module.exports = router;


