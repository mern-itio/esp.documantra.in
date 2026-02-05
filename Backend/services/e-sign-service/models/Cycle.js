const mongoose = require('mongoose');

const CompletionCertificateSchema = new mongoose.Schema({
  filename: { type: String },
  path: { type: String },   // server filesystem path (if stored locally)
  url: { type: String },    // external URL (S3, CDN, signed URL), prefer this in prod
  mimeType: { type: String, default: 'application/pdf' },
  size: { type: Number },   // bytes
  storage: { type: String, enum: ['local', 's3', 'gridfs', 'other'], default: 'local' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false }); // embed only, no separate id


const CycleSchema = new mongoose.Schema({
    envelopeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Envelope", index: true },
    signers: [{ type: mongoose.Schema.Types.ObjectId, ref: "SelfSigner" }],
    preparedDoc: { type: String, default: null },
    signedFileName: { type: String }, // optional
    signedFilePath: { type: String }, // optional
    signedFileSize: { type: Number }, // optional
    completionCertificate: { type: CompletionCertificateSchema, default: null },
    status: { type: String, enum: ["pending", "in-progress", "completed", "cancelled"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model('Cycle', CycleSchema);