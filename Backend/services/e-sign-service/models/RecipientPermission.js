// models/RecipientPermission.js
const mongoose = require('mongoose'); 
const RecipientPermissionSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipient", index: true },
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", index: true },
  role: { type: String, enum: ["signer", "approver", "carbon_copy","in_person_signer"], default: "Signer" },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ["waiting","sent", "completed", "declined"], default: "waiting" },
  authLevel: { type: String, enum: ["email", "sms", "access_code","phone"], default: "email" },
}, { timestamps: true });

module.exports = mongoose.model('RecipientPermission', RecipientPermissionSchema);
