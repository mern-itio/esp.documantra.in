const mongoose = require('mongoose');
const CycleSchema = new mongoose.Schema({
    envelopeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Envelope", index: true },
    signers: [{ type: mongoose.Schema.Types.ObjectId, ref: "SelfSigner" }],
    preparedDoc: { type: String, default: null },
    signedFileName: { type: String }, // optional
    signedFilePath: { type: String }, // optional
    signedFileSize: { type: Number }, // optional
    status: { type: String, enum: ["pending", "in-progress", "completed", "cancelled"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model('Cycle', CycleSchema);