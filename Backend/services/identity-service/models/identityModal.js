// src/models/identityModal.js
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  envelopeId: { type: mongoose.Schema.Types.ObjectId, default: null },
  authProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthProvider', required: true },
  provider: { type: String, default: 'didit' },
  sessionId: String,
  status: { type: String, default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('IdentitySession', schema);