const express = require('express');
const router = express.Router();

const {listCreditPackages, createCreditPackage, getCreditPackage, updateCreditPackage, deleteCreditPackage,getFlexiblePackage} = require('../controllers/creditPackageController');
router.get('/', listCreditPackages);
router.post('/', createCreditPackage);
router.get('/:id', getCreditPackage);
router.put('/:id', updateCreditPackage);
router.delete('/:id', deleteCreditPackage);
router.get('/flexible/fetch',getFlexiblePackage)

// moved to publicPlansRoutes

module.exports = router;


