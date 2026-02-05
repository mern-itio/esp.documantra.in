const mongoose = require('mongoose');

const OrganizationUserSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    email: { type: String},
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationRole", required: true },
    status: { 
        type: String, 
        enum: ["PENDING","ACTIVE", "DISABLED","REJECTED"],
        default: "PENDING"
    },

    addedBy: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

OrganizationUserSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('OrganizationUser', OrganizationUserSchema);
