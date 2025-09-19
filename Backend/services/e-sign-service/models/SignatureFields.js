// models/Recipient.js
const mongoose = require('mongoose');

const SignatureFields = new mongoose.Schema({
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", index: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipient", index: true },
  page: { type: Number, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  type: { type: String, enum: ["signature", "initials", "date", "text", "checkbox"], required: true },
  status: { type: String, enum: ["pending", "completed", "declined","submitted"], default: "pending" },
  signature: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SignatureFields', SignatureFields);
