// models/Recipient.js
const mongoose = require('mongoose');

const RecipientSchema = new mongoose.Schema({
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ["Signer", "Approver", "Observer"], default: "Signer" },
  authLevel: { type: String, enum: ["Basic", "Medium", "Advanced"], default: "Basic" }
}, { timestamps: true });

module.exports = mongoose.model('Recipient', RecipientSchema);
