const mongoose = require('mongoose');

const FolderEnvelopeSchema = new mongoose.Schema({
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: "OrgFolder", required: true, index: true },
    envelopeId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // envelopeId coming from e-sign service
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model('FolderEnvelope', FolderEnvelopeSchema);
