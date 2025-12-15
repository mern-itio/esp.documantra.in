const mongoose = require('mongoose');

const OrganizationUserSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationRole", required: true },

    status: { 
        type: String, 
        enum: ["ACTIVE", "DISABLED"],
        default: "ACTIVE"
    },

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

OrganizationUserSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('OrganizationUser', OrganizationUserSchema);
