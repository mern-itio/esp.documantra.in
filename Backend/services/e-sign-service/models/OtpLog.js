const mongoose = require("mongoose");

const OtpLogSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "RecipientPermission", required: true },
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", required: true },
  otpTxnId: { type: String, required: true },
  otpCode: { type: String, required: true }, // hashed
  verifiedAt: { type: Date },
  status: { type: String, enum: ["pending", "verified", "failed"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

const OtpLog = mongoose.model("OtpLog", OtpLogSchema);

module.exports = { OtpLog };
