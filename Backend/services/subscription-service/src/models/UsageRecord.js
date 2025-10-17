// UsageRecord.js (ledger)
const mongoose = require('mongoose');
const UsageRecordSchema = new mongoose.Schema({
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  userId: {type: mongoose.Schema.Types.ObjectId }, // actor
  action: String,           // "pdf:convert", "esign:recipientSign", "auth:otp"
  toolId: String,
  authId: String,           // if authentication consumed credits
  creditsDelta: Number,     // negative for debit, positive for credit/topup
  balanceAfter: Number,
  success: Boolean,
  reason: String,
}, { timestamps: true });

module.exports = mongoose.model('UsageRecord', UsageRecordSchema);