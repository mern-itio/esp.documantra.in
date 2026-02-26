// src/models/identityModal.js
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: String, required: true },
  provider: { type: String, default: 'didit' },
  sessionId: String,
  status: { type: String, default: 'pending' },
  decision: String,

  metadata: Object

}, { timestamps: true });

module.exports = mongoose.model('IdentitySession', schema);