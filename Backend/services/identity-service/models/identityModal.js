// src/models/identityModal.js
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  // Optional for admin/test sessions (no eSign recipient yet)
  userId: { type: mongoose.Schema.Types.ObjectId, default: null },
  envelopeId: { type: mongoose.Schema.Types.ObjectId, default: null },
  authProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthProvider', default: null },
  provider: { type: String, default: 'didit' },
  sessionId: { type: String, index: true },
  workflowId: { type: String, default: null },
  status: { type: String, default: 'pending' },
  decisionStatus: { type: String, default: null },
  verificationUrl: { type: String, default: null },
  isAdminTest: { type: Boolean, default: false },
  vendorData: { type: String, default: null },
}, { timestamps: true });

schema.index({ workflowId: 1 });
schema.index({ envelopeId: 1, userId: 1 });

module.exports = mongoose.model('IdentitySession', schema);
