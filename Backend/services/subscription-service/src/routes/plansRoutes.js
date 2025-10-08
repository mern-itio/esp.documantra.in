const express = require('express');
const router = express.Router();
const { createPlan, listPlans, getPlan, updatePlan, deletePlan } = require('../controllers/plansController');
const SubscriptionPlan = require('../models/SubscriptionPlan');

router.get('/', listPlans);
router.post('/', createPlan);
router.get('/:id', getPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

// moved to publicPlansRoutes

module.exports = router;


