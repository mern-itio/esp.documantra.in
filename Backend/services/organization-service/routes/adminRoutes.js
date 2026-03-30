const express = require('express');
const router = express.Router();

const {fetchAllOrganizationsVerificationRequest,updateOrganizationVerificationStatus} = require('../controllers/organizationController');

router.get('/organization-request-list', fetchAllOrganizationsVerificationRequest);
router.patch('/organization/:id/status', updateOrganizationVerificationStatus);
module.exports = router;