const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

const { createOrganization, getOrganizationDetails, updateOrganizationDetails, deleteOrganization,fetchUserOrganizations } = require('../controllers/organizationController');

router.post('/create', upload.array('documents'), createOrganization);
router.get('/user-organizations', fetchUserOrganizations);
router.get('/details/:id', getOrganizationDetails);
router.patch('/update/:id', updateOrganizationDetails);
router.delete('/delete/:id', deleteOrganization);
module.exports = router;