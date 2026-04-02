const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

const { createOrganization, 
        getOrganizationDetails, 
        updateOrganizationDetails, 
        deleteOrganization,
        fetchUserOrganizations,
        verificationOrganization,
        getOrganizationDetailsandAccess,
        createFolderInOrganization,
        fetchFoldersInOrganization,
        fetchOrganizationMembers,
        fetchNonMemberUsers,
        createRole,
        updateRole,
        fetchOrganizationRoles,
        getOrgNotifications,
        addMemberToOrganization,
        fetchUserInvitation,
        acceptInvitation,
        rejectInvitation,
        shareFolder,
        fetchFolderById,
        fetchEnvelopesByFolder,
        fetchNoneFolderEnvelopes,
        fetchRolesandUsers,
        insertEnvelopesToFolder,
        removeMemberFromOrganization,
        removeEnvelopeFromFolder,
        removeUserFromFolder,
        removeRoleFromFolder
        } = require('../controllers/organizationController');
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
router.get('/fetch-folder/:folderId', fetchFolderById);
router.get('/members/:orgId', fetchOrganizationMembers);
router.post('/members/:orgId', addMemberToOrganization);
router.get('/fetch-available-users/:orgId', fetchNonMemberUsers);
router.post('/create-role/:orgId', createRole);
router.post('/update-role/:roleId', updateRole);
router.get('/fetch-roles/:orgId', fetchOrganizationRoles);
router.get('/notifications', getOrgNotifications);
router.get('/invitation/:invitationId',fetchUserInvitation); 
router.post('/invitation/accept/:invitationId', acceptInvitation);
router.post('/invitation/reject/:invitationId', rejectInvitation);
router.post('/share-folder',shareFolder);
router.get('/fetch-folder-envelopes/:folderId',fetchEnvelopesByFolder);
router.delete('/remove-envelope/:folderId/:envelopeId', removeEnvelopeFromFolder);
router.delete('/remove-user/:folderId/:userId', removeUserFromFolder);
router.delete('/remove-role/:folderId/:roleId', removeRoleFromFolder);
router.get('/fetch-non-folder-envelopes/:folderId',fetchNoneFolderEnvelopes);
router.get('/fetch-roles-and-users/:folderId', fetchRolesandUsers );
router.post('/insert-envelopes/:folderId', insertEnvelopesToFolder);
router.delete('/remove/:orgId/members/:memberId',removeMemberFromOrganization);

module.exports = router;