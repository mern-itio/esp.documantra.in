
const mongoose = require('mongoose');
const SubscriptionSchema = new mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId},
  planTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanTemplate' },
  creditsBalance: { type: Number, default: 0 },
  status: { type: String, enum: ['active','paused','cancelled','trial'] },
  periodStart: Date,
  periodEnd: Date,
  nextBillingAt: Date,
  /** Benefits granted via referral rewards (display + future billing integration). */
  referralPerks: [{
    type: { type: String, default: 'custom' },
    label: { type: String, default: '' },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
    source: { type: String, default: 'referral' },
    referralId: { type: mongoose.Schema.Types.ObjectId, default: null },
    reason: { type: String, default: '' },
    createdAt: { type: Date, default: () => new Date() },
  }],
}, { timestamps: true });
module.exports = mongoose.model('Subscription', SubscriptionSchema);