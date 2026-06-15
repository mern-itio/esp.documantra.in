// models/RecipientPermission.js
const mongoose = require('mongoose'); 
const RecipientPermissionSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipient", index: true },
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", index: true },
role: {
  type: String,
  enum: ["signer", "approver", "carbon_copy","in_person_signer"],
  default: "signer"
}, 

// role: { type: String, enum: ["signer", "approver", "carbon_copy","in_person_signer"], default: "Signer" },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ["waiting","sent", "completed", "declined"], default: "waiting" },
  accepted_terms: { type: Boolean, default: false },
  authLevel: [
    {
      authMethodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AuthMethod"
      },
      status: {
        type: String,
        enum: ["pending", "completed", "rejected"],
        default: "pending"
      }
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('RecipientPermission', RecipientPermissionSchema);
