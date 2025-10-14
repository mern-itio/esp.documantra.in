// Subscription.js  <-- important
const mongoose = require('mongoose');
const SubscriptionSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId},
  planTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanTemplate' },
  creditsBalance: { type: Number, default: 0 },
  creditReserved: { type: Number, default: 0 }, // optional for pre-reservation
  status: { type: String, enum: ['active','paused','cancelled','trial'] },
  periodStart: Date,
  periodEnd: Date,
  nextBillingAt: Date,
}, { timestamps: true });
module.exports = mongoose.model('Subscription', SubscriptionSchema);