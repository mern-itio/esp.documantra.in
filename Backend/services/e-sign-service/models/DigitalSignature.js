// models/DigitalSignature.js
const mongoose = require('mongoose');

const DigitalSignatureSchema = new mongoose.Schema({
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Envelope', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecipientPermission', required: true },
  certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate', required: true },
  signedDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  signatureValue: { type: String }, // store signature hash or description
  signedAt: { type: Date, default: Date.now },
  hashAlgorithm: { type: String, default: 'SHA256' },
  pdfHash: { type: String, required: true },
  signatureBlob: { type: String },  // raw signature blob (PKCS#7) base64
  tsaToken: { type: String },  // TSA token (RFC3161) base64
  // anchoring info (one anchor or array later)
  anchoring: {
    chain: { type: String },
    txHash: { type: String },
    merkleProof: { type: mongoose.Schema.Types.Mixed }
  }
}, { timestamps: true });

module.exports = mongoose.model('DigitalSignature', DigitalSignatureSchema);
