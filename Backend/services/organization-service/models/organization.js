const mongoose = require('mongoose');
const upload = require('../middleware/upload');

const VerificationDocumentSchema = new mongoose.Schema({
    filename: { type: String },
    type: { type: String },
    path: { type: String },
    uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    logo: { type: String },
    website: { type: String },
    gst: { type: String },

    verificationDocuments: [VerificationDocumentSchema],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    status: { 
        type: String, 
        enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
        default: "PENDING"
    },

    remark: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Organization', OrganizationSchema);
