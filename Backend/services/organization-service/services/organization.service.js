const Organization = require('../models/organization');
const createOrganization = async (payload, files = [], userId) => {
    const { name, logo, website, gst } = payload;
    if (!name || !logo || !website || !gst) {
        throw new Error('Missing required fields');
    }

    // Normalize inputs for consistent uniqueness checks
    const normalizedWebsite = String(website).trim().toLowerCase();
    const normalizedGst = String(gst).trim().toUpperCase();

    // Check if website or GST already exist
    const existing = await Organization.findOne({
        $or: [
            { website: normalizedWebsite },
            { gst: normalizedGst }
        ]
    }).lean();

    if (existing) {
        if (existing.website && String(existing.website).trim().toLowerCase() === normalizedWebsite) {
            throw new Error('Website already in use');
        }
        if (existing.gst && String(existing.gst).trim().toUpperCase() === normalizedGst) {
            throw new Error('GST number already in use');
        }
        // Fallback generic duplicate error
        throw new Error('Organization with provided website or GST already exists');
    }

    // Map files to document metadata
    const verificationDocuments = (files || []).map(file => ({
        filename: file.filename,
        type: file.mimetype,
        path: file.path,
        uploadedAt: new Date()
    }));

    const org = await Organization.create({
        name,
        logo,
        website: normalizedWebsite,
        gst: normalizedGst,
        verificationDocuments,
        createdBy: userId,
        status: "PENDING",
        remark: "",
    });

    return org;
}
const getOrganizationDetails = async (orgId) => {  
    const result = await Organization.findById(orgId);
    if (!result) {
        res.status(404).send('Organization not found');
        return;
    }
    return result;
}
const updateOrganizationDetails = async (orgId,payload) => {
    const result = await Organization.findByIdAndUpdate(orgId, payload, { new: true });
    if (!result) {
        throw new Error('Organization not found');
    }
    return result;
}
const deleteOrganization = async (orgId) => {
    const result = await Organization.findByIdAndDelete(orgId);
    if (!result) {
        throw new Error('Organization not found');
    }
    return true;
}
const getOrganizationsByUserId = async (userId) => {
    const organizations = await Organization.find({ createdBy: userId });
    return organizations;
}
module.exports = {
    createOrganization,
    getOrganizationDetails,
    updateOrganizationDetails,
    deleteOrganization,
    getOrganizationsByUserId
};