const express = require('express');
const router = express.Router();

const {fetchAllOrganizationsVerificationRequest} = require('../controllers/organizationController');

router.get('/organization-request-list', fetchAllOrganizationsVerificationRequest);
module.exports = router;