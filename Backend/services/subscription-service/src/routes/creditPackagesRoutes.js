const express = require('express');
const router = express.Router();

const {listCreditPackages, createCreditPackage, getCreditPackage, updateCreditPackage, deleteCreditPackage,getFlexiblePackage} = require('../controllers/creditPackageController');
const adminMutationLimiter = require('../middleware/adminMutationLimiter');

router.get('/', listCreditPackages);
router.post('/', adminMutationLimiter, createCreditPackage);
router.get('/:id', getCreditPackage);
router.put('/:id', adminMutationLimiter, updateCreditPackage);
router.delete('/:id', deleteCreditPackage);
router.get('/flexible/fetch',getFlexiblePackage)

// moved to publicPlansRoutes

module.exports = router;


