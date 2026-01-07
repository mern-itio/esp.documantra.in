const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

const { createOrganization, getOrganizationDetails, updateOrganizationDetails, deleteOrganization,fetchUserOrganizations,verificationOrganization,getOrganizationDetailsandAccess,createFolderInOrganization,fetchFoldersInOrganization } = require('../controllers/organizationController');
//upload.array('documents')
router.post('/create', createOrganization);
router.post('/verify/:id', upload.array('documents'), verificationOrganization);
router.get('/user-organizations', fetchUserOrganizations);
router.get('/details/:id', getOrganizationDetails);
router.get('/details-and-permission/:orgId', getOrganizationDetailsandAccess);
router.patch('/update/:id', updateOrganizationDetails);
router.delete('/delete/:id', deleteOrganization);
router.post('/create-folder', createFolderInOrganization);
router.get('/fetch-organization-folders', fetchFoldersInOrganization);
module.exports = router;