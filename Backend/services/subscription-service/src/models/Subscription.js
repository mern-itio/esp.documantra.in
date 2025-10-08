const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  planSnapshot: { type: Object, required: true }, // snapshot of plan at purchase time
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'pending' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  // if plan is limited, track usage counters per service optionally
  usage: {
    totalConversions: { type: Number, default: 0 },
    perService: { type: Map, of: Number, default: {} }
  },
  services: [{ type: String }], // derived from plan at time of purchase
  createdBy: { type: String },
}, { timestamps: true });

SubscriptionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);


