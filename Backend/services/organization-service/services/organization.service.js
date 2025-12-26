const Organization = require('../models/organization');
const createOrganization = async (payload, userId) => {
    const { name, logo, website, gst } = payload;

    if (!name?.trim()) {
        throw new Error('Organization name is required');
    }

    const normalizedWebsite = website
        ? String(website).trim().toLowerCase()
        : undefined;

    const normalizedGst = gst
        ? String(gst).trim().toUpperCase()
        : undefined;

    // Build dynamic duplicate check
    const orConditions = [];
    if (normalizedWebsite) orConditions.push({ website: normalizedWebsite });
    if (normalizedGst) orConditions.push({ gst: normalizedGst });

    if (orConditions.length) {
        const existing = await Organization.findOne({ $or: orConditions }).lean();

        if (existing) {
            if (
                normalizedWebsite &&
                existing.website?.toLowerCase() === normalizedWebsite
            ) {
                throw new Error('Website already in use');
            }

            if (
                normalizedGst &&
                existing.gst?.toUpperCase() === normalizedGst
            ) {
                throw new Error('GST number already in use');
            }

            throw new Error('Organization already exists');
        }
    }

    const org = await Organization.create({
        name: name.trim(),
        logo: logo || undefined,
        website: normalizedWebsite,
        gst: normalizedGst,
        createdBy: userId,
        status: true,
        remark: "",
    });

    return org;
};

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
const getAllOrganizations = async () => {
    const organizations = await Organization.find();
    return organizations;
}
const getAllOrganizationsRquest = async () => {
    const organizations = await Organization.find({ isverifcationRequested: true });
    return organizations;
}
module.exports = {
    createOrganization,
    getOrganizationDetails,
    updateOrganizationDetails,
    deleteOrganization,
    getOrganizationsByUserId,
    getAllOrganizations,
    getAllOrganizationsRquest
};