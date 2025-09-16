const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "RecipientPermission", required: true },
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", required: true },
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true }, // ⚠️ should encrypt before saving
  certPem:{ type: String, required: true },
  certSerial: { type: String, required: true },
  issuer: { type: String },
  issuedAt: { type: Date, default: Date.now },
  validTill: { type: Date }
});

const Certificate = mongoose.model("Certificate", CertificateSchema);

module.exports = { Certificate };
