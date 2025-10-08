// models/Document.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", index: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true }, // relative path in uploads folder
  fileSize: { type: Number }, // optional
  signedFileName: { type: String }, // optional
  signedFilePath: { type: String }, // optional
  signedFileSize: { type: Number }, // optional
  mimeType: { type: String }, // optional
  preparedDoc:{type: String} // path to the document prepared for final signing
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
