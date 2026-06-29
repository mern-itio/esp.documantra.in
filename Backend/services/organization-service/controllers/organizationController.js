const { inviteTemplate } = require('../email/emailTemplates');
const organizationUser = require('../models/organizationUser');
const orgService = require('../services/organization.service');
const axios = require('axios');
const ALL_PERMISSIONS = {
    ENVELOPE_CREATE: true,
    ENVELOPE_SHARE: true,
    FOLDER_CREATE: true,
    FOLDER_SHARE: true,
    ORG_SHARE: true,
    ORG_SETTINGS_EDIT: true
};

const getOrganizationErrorStatus = (err) => {
    const message = String(err?.message || '').toLowerCase();
    if (message.includes('not found')) {
        return 404;
    }
    if (
        message.includes('required') ||
        message.includes('already in use') ||
        message.includes('conflict') ||
        message.includes('logo url') ||
        message.includes('invalid logo') ||
        message.includes('not allowed') ||
        message.includes('disallowed') ||
        message.includes('must use') ||
        message.includes('could not be resolved') ||
        message.includes('hostname') ||
        message.includes('too long')
    ) {
        return 400;
    }
    return 500;
};

const getOrganizationErrorMessage = (err) => {
    const message = String(err?.message || '');
    const lower = message.toLowerCase();
    if (
        lower.includes('logo url') ||
        lower.includes('invalid logo') ||
        lower.includes('not allowed') ||
        lower.includes('disallowed') ||
        lower.includes('hostname') ||
        lower.includes('must use https')
    ) {
        return 'Invalid or disallowed logo URL';
    }
    return message || 'Internal server error';
};

const createOrganization = async (req, res) => {
    const userId = req?.user?.data?.id; // Assuming user ID is available in req.user
    try {
        const organizationPayload = req.body;
        const result = await orgService.createOrganization(organizationPayload,userId);
        return res.status(201).json({
            success: true,
            message: "Organization created successfully",
            data: result
        });
    } catch (err) {
        return res.status(getOrganizationErrorStatus(err)).json({
            success: false,
            message: getOrganizationErrorMessage(err)
        });
    }
}
const verificationOrganization = async (req, res) => {
    const orgId = req.params.id;
    const payload = JSON.parse(req.body.organization || '{}');
    const files = req.files || [];
    if (files.length) {
    payload.$push = {
      verificationDocuments: {
        $each: files.map(file => ({
          filename: file.filename,
          type: file.mimetype,
          path: file.path,
          uploadedAt: new Date()
        }))
      }
    };
  }
  payload.isverifcationRequested = true;
  console.log("Verification payload:", payload);
    try{
        const result = await orgService.updateOrganizationDetails(orgId, payload);
    console.log("organization Id:", orgId);
    console.log(result);
        return res.status(200).json({
            success: true,
            message: `Organization ${orgId} updated successfully`,
            data: result
        });
    }catch(err){
        return res.status(getOrganizationErrorStatus(err)).json({
            success: false,
            message: getOrganizationErrorMessage(err)
        });
    }
}
const fetchAllOrganizationsVerificationRequest = async (req, res) => {
    try{
        const organizations = await orgService.getAllOrganizationsRquest();
        return res.status(200).json({
            success: true,
            data: organizations
        });
    }catch (err){
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const fetchUserOrganizations = async (req, res) => {
    const userId = req?.user?.data?.id;
    try {
        const organizations = await orgService.getOrganizationsByUserId(userId);
        return res.status(200).json({
            success: true,
            data: organizations
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const getOrganizationDetails = async (req, res) => {
    const orgId = req.params.id;
    try{
        const result = await orgService.getOrganizationDetails(orgId);
        return res.status(200).json({
            success: true,
            data: result
        });
    }catch(err){
        return res.status(getOrganizationErrorStatus(err)).json({
            success: false,
            message: getOrganizationErrorMessage(err)
        });
    }
}
const updateOrganizationDetails = async (req, res) => {
    const orgId = req.params.id;
    const payload = req.body;
    try{
        const result = await orgService.updateOrganizationDetails(orgId, payload);
        return res.status(200).json({
            success: true,
            message: `Organization ${orgId} updated successfully`,
            data: result
        });
    }catch(err){
        return res.status(getOrganizationErrorStatus(err)).json({
            success: false,
            message: getOrganizationErrorMessage(err)
        });
    }
}
const deleteOrganization = async (req, res) => {
    const orgId = req.params.id;
    try{
        await orgService.deleteOrganization(orgId);
        return res.status(200).json({
            success: true,
            message: `Organization ${orgId} deleted successfully`
        });
    }catch(err){
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const getOrganizationDetailsandAccess = async (req, res) => {
    const organizationId = req?.params?.orgId;
    const requestingUser = req?.user;
    try {
        if(!organizationId){
            return res.status(500).json({
                success: false,
                message: "Organization ID is required"
            });
        }
        const organization = await orgService.getOrganizationDetails(organizationId);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }
        // Check if the requesting user is the owner
        if (organization.createdBy.toString() === requestingUser?.data?.id.toString()) {
            // Normalize organization document to plain object if it's a Mongoose doc
            const orgPlain = (organization && typeof organization.toObject === 'function') ? organization.toObject() : organization;

            const organizationEnvelope = Object.assign({}, orgPlain, {
                access: {
                    isOwner: true,
                    role: { name: "OWNER" }
                },
                permissions: ALL_PERMISSIONS
            });

            return res.status(200).json({
                success: true,
                organization: organizationEnvelope
            });
        }
        //verify user membership in organization
        const orgUser = await orgService.getOrganizationUser(organizationId, requestingUser?.data?.id);
        if (!orgUser || orgUser.status !== "ACTIVE") {
            return res.status(403).json({
                success: false,
                message: "Access denied to this organization"
            });
        }
        const role = await orgService.getOrganizationRoleById(orgUser.roleId);
        if (!role) {
            return res.status(403).json({
                success: false,
                message: "Role not found for the user in this organization"
            });
        }
        const permissions = await orgService.getOrganizationPermissionsByRoleId(role._id);
        const orgPlain = (organization && typeof organization.toObject === 'function') ? organization.toObject() : organization;
        const perms = permissions || {
            ENVELOPE_CREATE: false,
            ENVELOPE_SHARE: false,
            FOLDER_CREATE: false,
            FOLDER_SHARE: false,
            ORG_SHARE: false,
            ORG_SETTINGS_EDIT: false
        };

        const organizationEnvelope = Object.assign({}, orgPlain, {
            access: {
                isOwner: false,
                role: { name: role.name }
            },
            permissions: perms
        });

        return res.status(200).json({
            success: true,
            organization: organizationEnvelope
        });
    } catch (err) {
        console.error("Error in getOrganizationDetailsandAccess:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const createFolderInOrganization = async (req, res) => {
    const userId = req?.user?.data?.id;
    const accountType  = req?.header('x-account-type');
    const organizationId  = req?.header('x-organization-id');
    if(accountType !== 'organization' || !organizationId){
        return res.status(400).json({
            success: false,
            message: "Invalid account type or missing organization ID"
        });
    }
    const folderData = req.body;
    try {
        const folder = await orgService.createFolderInOrganization(organizationId, folderData,userId);
        return res.status(201).json({
            success: true,
            message: "Folder created successfully",
            data: folder
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const fetchFoldersInOrganization = async (req, res) =>{
    const userId = req?.user?.data?.id;
    const organizationId = req.header('x-organization-id');
    const accountType = req.header('x-account-type');

    if(accountType !== 'organization' || !organizationId){
        return res.status(400).json({
            success:false,
            message:"Invalid account type or missing organization ID"
        });
    }
    try{
        const folders = await orgService.getFoldersInOrganization(organizationId, userId);

        return res.status(200).json({
            success:true,
            data:folders
        });
    }catch (err){
        return res.status(500).json({
            success:false,
            message:err.message || "Internal server error"
        });
    }
}
// Fetch Member of Organization
const fetchOrganizationMembers = async (req, res) => {
    const organizationId = req.params.orgId;
    try {
        const members = await orgService.getOrganizationMembers(organizationId);
        return res.status(200).json({
            success: true,
            data: members
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
// Fetch non-organization member users from authService by search query
const fetchNonMemberUsers = async (req, res) => {
  try {
    const organizationId = req.params.orgId;
    const q = String(req.query.q || '').trim();

    if (!organizationId) {
      return res.status(400).json({ success: false, message: 'Organization ID is required' });
    }

    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const members = await orgService.getOrganizationMembers(organizationId);
    const memberUserIds = members
      .map(m => m.userId)
      .filter(Boolean)
      .map(id => id.toString());

    const authResp = await axios.get(
      `${process.env.AUTH_SERVICE_URL}/api/users-list?q=${encodeURIComponent(q)}&limit=50`,
      { headers: { Authorization: req.headers.authorization } }
    );

    const users = (authResp.data?.data || []).filter(
      user => !memberUserIds.includes(String(user._id))
    );

    return res.status(200).json({
      success: true,
      data: users
    });

  } catch (err) {
    console.error('Error fetching non-member users:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch non-member users'
    });
  }
};

const createRole = async (req, res) => {
    const organizationId = req.params.orgId;
    const roleData = req.body;
    console.log("Creating role with data:", roleData);
    try {
        const role = await orgService.createOrganizationRole(organizationId, roleData);
        const permisions = await orgService.updateRolePermissions(role?._id, roleData.permissions || {});
        return res.status(201).json({
            success: true,
            message: "Role created successfully",
            data: role
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const updateRole = async (req, res) => {
    const roleId = req.params.roleId;
    const roleData = req.body;
    try {
        const role = await orgService.updateOrganizationRole(roleId, roleData);
        const permisions = await orgService.updateRolePermissions(roleId, roleData.permissions || {});
        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: role
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const fetchOrganizationRoles = async (req, res) => {
    const organizationId = req.params.orgId;
    try {
        const roles = await orgService.getOrganizationRoles(organizationId);
        return res.status(200).json({
            success: true,
            data: roles
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const getOrgNotifications = async (req, res) => {
  const organizationId = req.header('x-organization-id');
  const { userId, role } = req.user.data;

  const notifications = await orgService.getOrgNotifications(organizationId, userId, role);
  const readIds = await orgService.getNotificcatoinReadIds(userId, notifications);

  const unreadCount = notifications.filter(
    n => !readIds.includes(n._id.toString())
  ).length;

  return res.json({
    status: 'success',
    data: {
      notifications: notifications.map(n => ({
        ...n,
        isRead: readIds.includes(n._id.toString())
      })),
      unreadCount
    }
  });
};
const addMemberToOrganization = async (req, res) => {
    const userId = req.user.data.id;
    const organizationId = req.params.orgId;
    const payload = req.body;
    try {
        const organizationDetails = await orgService.getOrganizationDetails(organizationId);
        if(!organizationDetails){
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }
        const result = await orgService.addMemberToOrganization(organizationId, payload,userId);
        let Message = '';
        let subject = '';
        let link = `${process.env.FRONTEND_URL}/    `;
        let LinkButtonText = '';
        const recipientName = result.name || 'User';
        if(payload.userId){
            subject = `You've been invited to join ${organizationDetails?.name}`;
            Message = `You’ve been invited to join ${organizationDetails?.name}.
                       Please log in to your account to accept the organization invitation to start collaborating on document signing and management.`;
            LinkButtonText = 'Login to Your Account';
        }else{
            link = `${process.env.FRONTEND_URL}/auth/signup`;
            subject = `Invitation to join ${organizationDetails?.name}  – Create your account`;
            Message = `You’ve been invited to join ${organizationDetails?.name}.
                       Please sign up to your account to accept the organization invitation to start collaborating on document signing and management.`;
            LinkButtonText = 'Create Your Account';
        }
        const targetId = payload?.userId || null;
        const source = 'USER';
        const type = 'ORG_INVITATION';
        const title = subject;
        const invitationLink = `${process.env.FRONTEND_URL}/organization/invitations/${result?._id}`;
        const metadata = {
            organizationId: organizationId,
            inviteId: result._id,// Organization invited user ID
            redirectUrl: invitationLink
        };
        const notificationMessage = `You have a new invitation to join the organization ${organizationDetails?.name}. Click to view details.`;       
        const notificationPayload = {
            targetId,
            source,
            type,
            title,
            message: notificationMessage,
            metadata
        };
        try {
            const notificationResponse = await axios.post(
                `${process.env.AUTH_SERVICE_URL}/api/notifications/create`,
                notificationPayload,
                { headers: { Authorization: req.headers.authorization } }
            );
            console.log("Notification created in auth service:", notificationResponse.data);
        } catch (error) {
            console.error("Error creating notification in auth service:", error);
        }    
        const html = inviteTemplate(recipientName, subject, Message, link, LinkButtonText);
        //Send email via email service
        try{
            await axios.post(
                `${process.env.EMAIL_SERVICE_URL}/mail/send/${userId}`,
                {
                    toEmail: result.email,
                    subject: subject,
                    html: html
                },
                { headers: { Authorization: req.headers.authorization } }
            );
            console.log(`Invitation email sent to ${result.email}`);
        }catch (err){
            console.error("Error sending invitation email:", err);
        }
        return res.status(200).json({
            success: true,
            message: `User ${result._id} added to organization ${organizationId} successfully`,
            data: result
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const fetchUserInvitation = async (req, res) => {
    const invitationId = req.params.invitationId;
    const userId = req?.user?.data?.id;
    try {
        const invitation = await orgService.getUserInvitationById(invitationId,userId);
        if(!invitation){
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }
        return res.status(200).json({
            success: true,
            data: invitation
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const acceptInvitation = async (req, res) => {
    const invitationId = req.params.invitationId;
    const userId = req?.user?.data?.id;
    try {
        const result = await orgService.acceptOrganizationInvitation(invitationId,userId);
        return res.status(200).json({
            success: true,
            message: "Invitation accepted successfully",
            data: result
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const rejectInvitation = async (req, res) => {
    const invitationId = req.params.invitationId;
    const userId = req?.user?.data?.id;
    try {
        const result = await orgService.rejectOrganizationInvitation(invitationId,userId);
        return res.status(200).json({
            success: true,
            message: "Invitation rejected successfully",
            data: result
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
        });
    }
}
const shareFolder = async (req, res) => {
  const { shares } = req.body;
  const requestingUserId = req?.user?.data?.id;

  if (!Array.isArray(shares) || !shares.length) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request payload'
    });
  }

  try {
    const payloads = shares.map(share => ({
      folderId: share.folderId,
      sharedWithType: share.sharedWithType || 'USER',
      sharedWithId: share.sharedWithId,
      permission: share.permission,
      createdBy: requestingUserId
    }));

    const result = await orgService.shareFolder(payloads);

    return res.status(200).json({
      success: true,
      message: 'Folder shared successfully',
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error'
    });
  }
};
const fetchFolderById = async (req, res) => {
    const folderId = req.params.folderId;
    const userId = req?.user?.data?.id;
    const accountType = req.header('x-account-type');
    const organizationId = req.header('x-organization-id');
    if(accountType !== 'organization' || !organizationId){
        return res.status(400).json({
            success:false,
            message:"Invalid account type or missing organization ID"
        });
    }
    try{
        const folder = await orgService.fetchFolderById(folderId);
        if(!folder){
            return res.status(404).json({
                success:false,
                message:"Folder not found"
            });
        }
        return res.status(200).json({
            success:true,
            data:folder
        });
    }catch (err){
        return res.status(500).json({
            success:false,
            message:err.message || "Internal server error"
        });
    }
}
const fetchEnvelopesByFolder = async (req, res) => {
    const folderId = req.params.folderId;
    const userId = req?.user?.data?.id;
    const accountType = req.header('x-account-type');
    const organizationId = req.header('x-organization-id');
    if(accountType !== 'organization' || !organizationId){
        return res.status(400).json({
            success:false,
            message:"Invalid account type or missing organization ID"
        });
    }
    try{
            // Fetch allEnvelopeIds in the folder
        const envelopeIdsData = await orgService.fetchFolderEnvelopeIds(folderId);
        const envelopeIds = envelopeIdsData || [];
        if(envelopeIds.length === 0){
            return res.status(200).json({
                success:true,
                data:[]
            });
        }
        try{
            // Fetch Envelpes by Ids
            const envelopes = await axios.post(
                `${process.env.ESIGN_SERVICE_URL}/api/e-sign/envelopes/bulk-fetch`,
                { envelopeIds },
                { headers: { Authorization: req.headers.authorization } }
            );
            const authUrl = process.env.AUTH_SERVICE_URL;
            const eSignUrl = process.env.ESIGN_SERVICE_URL;

            const senderIds = Array.from(new Set((envelopes.data.envelopes || [])
              .map(e => e?.sender)
              .filter(Boolean)
              .map(s => s.toString ? s.toString() : String(s))
            ));

            const senderMap = {};
            if (authUrl && senderIds.length) {
              await Promise.all(senderIds.map(async (sid) => {
                try {
                  const { data: authRes } = await axios.get(
                    `${authUrl.replace(/\/$/, '')}/api/user-details/${sid}`,
                    { timeout: 8000 }
                  );
                  const u = authRes?.data;
                  if (u) {
                    senderMap[sid] = {
                      name: u.fullname || u.name || null,
                      email: u.email || null
                    };
                  }
                } catch (_) {
                  // ignore; fallback to null
                }
              }));
            }

            const enriched = (envelopes.data.envelopes || []).map((env) => {
              const senderId = env?.sender
                ? (env.sender.toString ? env.sender.toString() : String(env.sender))
                : null;

              const docs = Array.isArray(env?.documentIds) ? env.documentIds : [];
              const recs = Array.isArray(env?.recipientIds) ? env.recipientIds : [];
              const firstDoc = docs[0];
              const previewUrl = (eSignUrl && firstDoc?.filePath)
                ? `${eSignUrl.replace(/\/$/, '')}/uploads/${String(firstDoc.filePath).replace(/^\/+/, '')}`
                : null;

              return {
                _id: env?._id,
                name: env?.name || env?.subject || 'Untitled Envelope',
                status: env?._computedStatus || env?.status || 'draft',
                createdAt: env?.createdAt,
                updatedAt: env?.updatedAt,
                previewUrl,
                sharedBy: senderId ? (senderMap[senderId] || { name: null, email: null }) : null,
                recipients: recs.map(r => ({
                  _id: r?._id,
                  name: r?.name,
                  email: r?.email,
                  title: r?.title,
                  company: r?.company,
                  status: r?.permissionStatus || null
                })),
                documents: docs.map(d => ({
                  _id: d?._id,
                  fileName: d?.fileName,
                  filePath: d?.filePath,
                  mimeType: d?.mimeType
                }))
              };
            });
            return res.status(200).json({
                success:true,
                data: enriched
            });
        }catch(err){
            console.error("Error fetching envelopes from e-sign service:", err);
            return res.status(500).json({
                success:false,
                message:"Failed to fetch envelopes from e-sign service"
            });
        }
    }catch (err){
        return res.status(500).json({
            success:false,
            message:err.message || "Internal server error"
        });
    }
}
const fetchNoneFolderEnvelopes = async (req, res) =>{
    const folderId = req.params.folderId;
    const userId = req?.user?.data?.id;
    const accountType = req.header('x-account-type');
    const organizationId = req.header('x-organization-id');
    if(accountType !== 'organization' || !organizationId){
        return res.status(400).json({
            success:false,
            message:"Invalid account type or missing organization ID"
        });
    }
    try{
        //Fetch All EnvelopeIds of added in Folder
        const envelopeIdsData = await orgService.fetchFolderEnvelopeIds(folderId);
        console.log("Envelope IDs in folder:", envelopeIdsData);
        const envelopeIds = envelopeIdsData || [];
        try{
            // Fetch Envelopes and excluded already added in folder
            const envelopes = await axios.post(
                `${process.env.ESIGN_SERVICE_URL}/api/e-sign/envelopes/exclude`,
                { envelopeIds,organizationId },
                { headers: { Authorization: req.headers.authorization } }
            );
            return res.status(200).json({
                success:true,
                data:envelopes?.data?.data || []
            });
        }catch(err){
            console.log(err);
            return res.status(500).json({
                success:false,
                message:err.message || "Internal server error"
            });
        }
    }catch (err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"Internal Server Error"
        });
    }
}
const fetchRolesandUsers = async (req, res) =>{
    const folderId = req.params.folderId;
    try{
        const data =  await orgService.getRolesandUsersByFolderId(folderId);
        return res.status(200).json({
            success:true,
            data:data
        });
    }catch (err){
        return res.status(500).json({
            success:false,
            message:err.message || "Internal server error"
        });
    }
}
const insertEnvelopesToFolder = async (req, res) =>{
    const folderId = req.params.folderId;
    const {envelopeIds} = req.body;
    console.log(envelopeIds);
    const userId = req?.user?.data?.id;
    if (!folderId || !Array.isArray(envelopeIds) || envelopeIds.length === 0) {
        return res.status(400).json({
        success: false,
        message: 'folderId and envelopeIds are required'
        });
    }
    const existing  = await orgService.checkExistingEnvelope(folderId,envelopeIds);
    const existingSet = new Set(existing.map(id => id.toString()));
    console.log(existing);
    const newEnvelopeIds = envelopeIds.filter(
        id => !existingSet.has(id)
    );
    if(newEnvelopeIds.length ===0){
        return res.status(400).json({
        success: false,
        message: 'Chosen envelope already exist'
        });
    }
    try{
        const result  =  await orgService.insertEnvelopesToFolder(folderId,newEnvelopeIds, userId);
        return res.status(200).json({
            success: true,
            message: 'Envelopes added to folder successfully',
            insertedCount: result.insertedCount
        });
    }catch (err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message || "Internal server error"
        });
    }
}
const removeMemberFromOrganization = async( req, res) =>{
    const {orgId, memberId} = req.params;
    try{
        const deleted = await organizationUser.findOneAndDelete({
                        _id: memberId,
                        organizationId: orgId
                        });
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Member removed successfully"
        });

    }catch(err){
        console.log(err);
        return res.status(500).json({success:false, message:"Internal Server Error"});
    }

}
const updateOrganizationVerificationStatus = async (req, res) => {
    const orgId = req.params.id;
    const { status,remark } = req.body;
    console.log(`Updating organization ${orgId} with status: ${status} and remark: ${remark}`);
    try{
        const result = await orgService.updateOrganizationVerficationStatus(orgId, status, remark);
        return res.status(200).json({
            success: true,          
            data: result
        });

    }catch (err){
        console.log(err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    
}
const removeEnvelopeFromFolder = async (req, res) => {
    const { folderId, envelopeId } = req.params;
    try{
        const result = await orgService.removeEnvelopeFromFolder(folderId, envelopeId);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Envelope not found in folder"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Envelope removed from folder successfully"
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
const removeUserFromFolder = async (req, res) => {
    const { folderId, userId } = req.params;
    try{
        const result = await orgService.removeUserFromFolder(folderId, userId);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found in folder"
            });
        }
        return res.status(200).json({
            success: true,
            message: "User removed from folder successfully"
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
const removeRoleFromFolder = async (req, res) => {
    const { folderId, roleId } = req.params;
    try{
        const result = await orgService.removeRoleFromFolder(folderId, roleId);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Role not found in folder"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Role removed from folder successfully"
        });
    }catch(err){
        console.log(err);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
module.exports = {
    createOrganization,
    getOrganizationDetails,
    updateOrganizationDetails,
    deleteOrganization,
    fetchUserOrganizations,
    fetchAllOrganizationsVerificationRequest,
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
    updateOrganizationVerificationStatus,
    removeEnvelopeFromFolder,
    removeUserFromFolder,
    removeRoleFromFolder
};