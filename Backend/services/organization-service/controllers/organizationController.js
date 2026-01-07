const orgService = require('../services/organization.service');
const ALL_PERMISSIONS = {
    ENVELOPE_CREATE: true,
    ENVELOPE_SHARE: true,
    FOLDER_CREATE: true,
    FOLDER_SHARE: true,
    ORG_SHARE: true,
    ORG_SETTINGS_EDIT: true
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
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
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
    try{
        const result = await orgService.updateOrganizationDetails(orgId, payload);
        return res.status(200).json({
            success: true,
            message: `Organization ${orgId} updated successfully`,
            data: result
        });
    }catch(err){
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
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
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
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
        return res.status(500).json({
            success: false,
            message: err.message || "Internal server error"
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
    console.log("Requested User: ",requestingUser);
    console.log("Organization ID: ",organizationId);
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
    fetchFoldersInOrganization
};