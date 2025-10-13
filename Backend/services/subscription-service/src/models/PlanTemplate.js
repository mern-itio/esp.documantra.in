// PlanTemplate.js
const mongoose = require('mongoose');
const PlanTemplateSchema = new mongoose.Schema({
  name: String,
  // list of allowed tools and their per-use credit cost in this plan
  services: [String], // e.g. ["pdf","esign","auth"]
  toolCosts: [{
    toolId: {type: mongoose.Schema.Types.ObjectId, ref: 'Tool' },
    credits: Number
  }],
  // list of allowed auth providers and their costs (can differ from default)
  authCosts: [{
    authId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuthProvider' },
    credits: Number
  }],
  monthlyCredits: Number,   // or other currency (topup amount)
  pricePerPeriod: Number,
  period: { type: String, enum: ['monthly','yearly'] },
  version: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('PlanTemplate', PlanTemplateSchema);