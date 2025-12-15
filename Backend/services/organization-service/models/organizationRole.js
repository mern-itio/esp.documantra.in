const mongoose = require('mongoose');

const OrganizationRoleSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },

    name: { type: String, required: true },
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('OrganizationRole', OrganizationRoleSchema);
