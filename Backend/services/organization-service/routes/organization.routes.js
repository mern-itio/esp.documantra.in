const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

const { createOrganization, getOrganizationDetails, updateOrganizationDetails, deleteOrganization,fetchUserOrganizations,verificationOrganization } = require('../controllers/organizationController');
//upload.array('documents')
router.post('/create', createOrganization);
router.post('/verify/:id', upload.array('documents'), verificationOrganization);
router.get('/user-organizations', fetchUserOrganizations);
router.get('/details/:id', getOrganizationDetails);
router.patch('/update/:id', updateOrganizationDetails);
router.delete('/delete/:id', deleteOrganization);
module.exports = router;