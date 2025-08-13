// models/Document.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", index: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true }, // relative path in uploads folder
  fileSize: { type: Number }, // optional
  mimeType: { type: String } // optional
}, { timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);
