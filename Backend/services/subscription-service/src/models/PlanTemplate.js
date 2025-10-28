// PlanTemplate.js
const mongoose = require('mongoose');
const PlanTemplateSchema = new mongoose.Schema({
  name: String,
  // list of allowed tools and their per-use credit cost in this plan
  services: [String], // e.g. ["pdf","esign","auth"]
  type: { type: String, enum: ['free','paid'], default: 'paid' },
  toolCosts: [{
    toolId: {type: mongoose.Schema.Types.ObjectId },
    credits: Number
  }],
  // list of allowed auth providers and their costs (can differ from default)
  authCosts: [{
    authId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthProvider' },
    credits: Number
  }],
  // credits cost per document upload
  documentCosts: {
    credits: { type: Number, default: 0 }
  },
  // credits cost per document share
  shareCosts: {
    credits: { type: Number, default: 0 }
  },
  // credits cost per PDF share
  pdfShareCosts: {
    credits: { type: Number, default: 0 }
  },
  monthlyCredits: Number,   // or other currency (topup amount)
  pricePerPeriod: Number,
  period: { type: String, enum: ['monthly','yearly'] },
  version: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('PlanTemplate', PlanTemplateSchema);