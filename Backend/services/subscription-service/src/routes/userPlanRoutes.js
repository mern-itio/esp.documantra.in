const express = require('express');
const {
  getMyPlan,
  upgradePlan,
  createCheckoutSession,
  confirmCheckoutSession,
} = require('../controllers/userPlanController');
const { listPlans } = require('../controllers/plansController');

const router = express.Router();

// Index will attach verifyJWT('user') to this router
router.get('/me', getMyPlan);
router.get('/all', listPlans);
router.post('/upgrade', upgradePlan);
router.post('/stripe/create-checkout-session', createCheckoutSession);
router.post('/stripe/confirm', confirmCheckoutSession);

module.exports = router;


