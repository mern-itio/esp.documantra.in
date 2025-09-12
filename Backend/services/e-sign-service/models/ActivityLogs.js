const mongoose = require("mongoose");

const ActivityLogsSchema = new mongoose.Schema({
  envelopeId: { type: mongoose.Schema.Types.ObjectId, ref: "Envelope", required: true },
  action: { type: String, required: true }, // e.g., "OTP_SENT", "DOC_SIGNED", "TSA_TIMESTAMPED"
  details: { type: mongoose.Schema.Types.Mixed }, // flexible JSON
  type: { type: String, enum: ["Sender", "Recipient"] },
  timestamp: { type: Date, default: Date.now }
});

const ActivityLogs = mongoose.model("ActivityLogs", ActivityLogsSchema);

module.exports = { ActivityLogs };
