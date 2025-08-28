// models/Recipient.js
const mongoose = require('mongoose'); 

const RecipientSchema = new mongoose.Schema({
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ["signer", "approver", "carbon_copy","in_person_signer"], default: "Signer" },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ["waiting","sent", "completed", "declined"], default: "waiting" },
  authLevel: { type: String, enum: ["email", "sms", "access_code","phone"], default: "email" }
}, { timestamps: true });

module.exports = mongoose.model('Recipient', RecipientSchema);
