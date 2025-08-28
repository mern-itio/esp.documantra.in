const mongoose = require('mongoose');

const ESignApiKeySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  apiKey: { type: String, required: true, unique: true },
  mode: { type: String, enum: ['sandbox', 'production'], required: true }, // allow both modes
  createdAt: { type: Date, default: Date.now },
  fieldIds: [{ type: String }],
  lastUsedAt: { type: Date, default: null },
  usageCount: { type: Number, default: 0 },
  usageLogs: [{
  year: Number,         // e.g. 2025
  month: Number,        // e.g. 8 (August)
  count: Number         // e.g. 7 (this month's envelope use count)
}],
  limit: { type: Number, default: function() { return this.mode === 'sandbox' ? 10 : null; } },
  isActive: { type: Boolean, default: true }
});


module.exports = mongoose.model('ESignApiKey', ESignApiKeySchema);
