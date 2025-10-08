const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['free', 'pro', 'custom'], required: true },
  price: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true },
  conversionsLimitType: { type: String, enum: ['number', 'unlimited'], default: 'number' },
  conversionsLimit: { type: Number, min: 0 },
  description: { type: String, trim: true },
  services: [{ type: String }], // empty or undefined => applies to all
  createdBy: { type: String },
}, { timestamps: true });

SubscriptionPlanSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);


