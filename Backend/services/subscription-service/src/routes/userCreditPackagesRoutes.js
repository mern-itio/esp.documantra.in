const express = require('express');
const router = express.Router();

const {listCreditPackages, createCheckoutSession, confirmCheckoutSession,getFlexiblePackage} = require('../controllers/creditPackageController');
router.get('/', listCreditPackages);
router.post('/stripe/create-checkout-session',createCheckoutSession);
router.post('/stripe/confirm',confirmCheckoutSession);
router.get('/flexible/fetch',getFlexiblePackage)

module.exports = router;


