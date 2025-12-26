const orgService = require('../services/organization.service');
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
module.exports = {
    createOrganization,
    getOrganizationDetails,
    updateOrganizationDetails,
    deleteOrganization,
    fetchUserOrganizations,
    fetchAllOrganizationsVerificationRequest,
    verificationOrganization
};