const mongoose = require('mongoose');

const SelfSignerSchema = new mongoose.Schema({
envelopeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Envelope", index: true },
formId:{ type: mongoose.Schema.Types.ObjectId},
signerSlotId: { type: String },
data: { type: Map, of: String }, 
status: { type: String, enum: ["pending","initiated","submitted", "completed"], default: "initiated" },
signingOrder: { type: Number, default: 0 },
role: { type: String },
signature: { type: String, default: null }

},{ timestamps: true } );

module.exports = mongoose.model('SelfSigner', SelfSignerSchema);
