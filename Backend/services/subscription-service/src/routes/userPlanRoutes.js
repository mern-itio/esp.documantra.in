const express = require('express');
const { getMyPlan } = require('../controllers/userPlanController');

const router = express.Router();

// Index will attach verifyJWT('user') to this router
router.get('/me', getMyPlan);

module.exports = router;


