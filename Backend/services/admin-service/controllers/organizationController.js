const { serviceGet, servicePatch } = require("../utils/apiHelper");

const listOrganizations = async (req, res) => {
    try {
        const result = await serviceGet(req, 'organization', {
            url: '/admin/organization-request-list'
        });
        if (result.status == 200) {
            return res.status(200).json({
                status: 200,
                message: 'Organizations fetched successfully',
                data: result.data.data
            });
        } else {
            return res.status(404).json({
                status: 404,
                message: 'No organizations found.'
            });
        }
    }catch (err){
        console.log(err);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
    }
};

const updateOrganizationVerificationStatus = async (req, res) => { 
    const orgId = req.params.id;
    const { status, remark } = req.body;
    console.log(`Updating organization ${orgId} with status: ${status} and remark: ${remark}`);
    const result = await servicePatch(req, 'organization', {
        url: `/admin/organization/${orgId}/status`,
        data: { status, remark }
    });
    if (result.status == 200) {
        return res.status(200).json({
            status: 200,
            message: 'Organization verification status updated successfully',
            data: result.data.data
        });
    } else {
        return res.status(400).json({
            status: 400,
            message: 'Failed to update organization verification status.'
        });
    }
};      

module.exports = { listOrganizations, updateOrganizationVerificationStatus };