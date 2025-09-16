// models/Envelope.js
const mongoose = require('mongoose');

const EnvelopeSchema = new mongoose.Schema({
  subject: { type: String },
  message: { type: String },
  sender: { type: mongoose.Schema.Types.ObjectId, required: true },
  priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
  signingOrder: { type: String, enum: ["In-Order", "Parallel","sequential"], default: "In-Order" },
  expirationDate: { type: Date },
  isReminder: { type: Boolean, default: false },
  reminderInterval: { type: Number }, // in days
  isAll: { type: Boolean, default: false }, // require all signers to sign
  canDecline: { type: Boolean, default: true },
  documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
  recipientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipient" }],
  signatureType: { type: String, enum: ["standard", "advanced", "qualified"], default: "standard" },
  status: { type: String, enum: ["draft", "in-progress", "completed", "archived"], default: "draft" }
}, { timestamps: true });

module.exports = mongoose.model('Envelope', EnvelopeSchema);
