const mongoose = require('mongoose');

const OrganizationPermissionSchema = new mongoose.Schema({
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganizationRole", required: true, index: true },

    permissions: {
        ENVELOPE_CREATE: { type: Boolean, default: false },
        ENVELOPE_SHARE: { type: Boolean, default: false },
        FOLDER_CREATE: { type: Boolean, default: false },
        FOLDER_SHARE: { type: Boolean, default: false },
        ORG_SHARE: { type: Boolean, default: false },
        ORG_SETTINGS_EDIT: { type: Boolean, default: false }
    }
}, { timestamps: true });

module.exports = mongoose.model('OrganizationPermission', OrganizationPermissionSchema);
