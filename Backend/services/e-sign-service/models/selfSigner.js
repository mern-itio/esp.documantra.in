const mongoose = require('mongoose');

const SelfSignerSchema = new mongoose.Schema({
  envelopeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Envelope", index: true },
  signerSlotId: { type: String },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ["pending","initiated","submitted", "completed"], default: "initiated" },
  signingOrder: { type: Number, default: 0 },
  role: { type: String },
  signature: { type: String, default: null },
  initials: { type: String, default: null },
  signatureFields: {
    type: [
        {
        fieldId: { type: mongoose.Schema.Types.ObjectId, ref: "SignatureFields" },
        state: { type: String, enum: ["pending", "signed"], default: "pending" },
        signedAt: { type: Date }
        }
    ],
    default: []
},
  nonSignatureFields: {
    type: [
        {
        fieldId: { type: mongoose.Schema.Types.ObjectId, ref: "SignatureFields" },
        state: { type: String, enum: ["pending", "submited"], default: "pending" },
        value: { type: String, default: null },
        submitedAt: { type: Date }
        }
    ],
    default: []
},
accepted_terms:{type:Boolean,default:false}
}, { timestamps: true });

module.exports = mongoose.model('SelfSigner', SelfSignerSchema);
