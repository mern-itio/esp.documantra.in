const mongoose = require('mongoose');

const OrgFolderSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
    color: { type: String },
    icon: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { timestamps: true });

module.exports = mongoose.model('OrgFolder', OrgFolderSchema);
