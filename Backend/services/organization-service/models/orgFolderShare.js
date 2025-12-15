const mongoose = require('mongoose');

const OrgFolderShareSchema = new mongoose.Schema({
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: "OrgFolder", required: true, index: true },

    sharedWithType: { 
        type: String, 
        enum: ["USER", "ROLE"], 
        required: true 
    },
    sharedWithId: { type: mongoose.Schema.Types.ObjectId, required: true },

    permission: {
        view: { type: Boolean, default: true },
        edit: { type: Boolean, default: false },
        share: { type: Boolean, default: false }
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model('OrgFolderShare', OrgFolderShareSchema);
