const express = require('express');
const { getMyPlan, upgradePlan } = require('../controllers/userPlanController');
const { listPlans } = require('../controllers/plansController');

const router = express.Router();

// Index will attach verifyJWT('user') to this router
router.get('/me', getMyPlan);
router.get('/all', listPlans);
router.post('/upgrade', upgradePlan);

module.exports = router;


