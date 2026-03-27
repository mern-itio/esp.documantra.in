const express = require('express');
const router = express.Router();

const {listCreditPackages, createCheckoutSession, confirmCheckoutSession,getFlexiblePackage,createFlexCheckoutSession,flexiConfirmCheckoutSession} = require('../controllers/creditPackageController');
router.get('/', listCreditPackages);
router.post('/stripe/create-checkout-session',createCheckoutSession);
router.post('/flexible/stripe/create-checkout-session',createFlexCheckoutSession);
router.post('/stripe/confirm',confirmCheckoutSession);
router.post('/flexible/stripe/confirm',flexiConfirmCheckoutSession)
router.get('/flexible/fetch',getFlexiblePackage)

module.exports = router;


