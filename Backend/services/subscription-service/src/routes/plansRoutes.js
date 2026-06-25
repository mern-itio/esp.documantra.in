const express = require('express');
const router = express.Router();
const { createPlan, listPlans, getPlan, updatePlan, deletePlan } = require('../controllers/plansController');
const adminMutationLimiter = require('../middleware/adminMutationLimiter');

router.get('/', listPlans);
router.post('/', adminMutationLimiter, createPlan);
router.get('/:id', getPlan);
router.put('/:id', adminMutationLimiter, updatePlan);
router.delete('/:id', deletePlan);

// moved to publicPlansRoutes

module.exports = router;


