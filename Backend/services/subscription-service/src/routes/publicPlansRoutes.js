const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/SubscriptionPlan');

// Public: Free plan info (no auth)
router.get('/free-plan', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findOne({ type: 'free', isActive: true }).sort({ createdAt: -1 });
    if (!plan) return res.status(200).json({ type: 'free', limitType: 'number', limit: 10 });
    const limitType = plan.conversionsLimitType || 'number';
    const limit = limitType === 'number' ? (plan.conversionsLimit ?? 10) : null;
    return res.status(200).json({ type: 'free', limitType, limit });
  } catch (e) {
    return res.status(200).json({ type: 'free', limitType: 'number', limit: 10 });
  }
});

module.exports = router;


