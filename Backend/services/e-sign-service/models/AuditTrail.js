const mongoose = require("mongoose");

const AuditTrailSchema = new mongoose.Schema({
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "RecipientPermission" },
  action: { type: String, required: true }, // e.g., "OTP_SENT", "DOC_SIGNED", "TSA_TIMESTAMPED"
  details: { type: mongoose.Schema.Types.Mixed }, // flexible JSON
  docHash: { type: String }, // hash of PDF state at that point
  ip: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const AuditTrail = mongoose.model("AuditTrail", AuditTrailSchema);

module.exports = { AuditTrail };
