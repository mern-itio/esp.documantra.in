const express = require('express');
const router = express.Router();

const {listCreditPackages, createCreditPackage, getCreditPackage, updateCreditPackage, deleteCreditPackage,getFlexiblePackage,upsertFlexiblePackage} = require('../controllers/creditPackageController');
const adminMutationLimiter = require('../middleware/adminMutationLimiter');

router.get('/flexible/fetch', getFlexiblePackage);
router.put('/flexible', adminMutationLimiter, upsertFlexiblePackage);
router.put('/flexible/:id', adminMutationLimiter, upsertFlexiblePackage);
router.post('/flexible', adminMutationLimiter, upsertFlexiblePackage);

router.get('/', listCreditPackages);
router.post('/', adminMutationLimiter, createCreditPackage);
router.get('/:id', getCreditPackage);
router.put('/:id', adminMutationLimiter, updateCreditPackage);
router.delete('/:id', deleteCreditPackage);

// moved to publicPlansRoutes

module.exports = router;


