const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// Purchase subscription (assign plan to user)
const purchase = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.body.userId; // fallback for admin-created
    const { planId, startDate, endDate } = req.body;
    if (!userId || !planId) return res.status(400).json({ status: 400, message: 'userId and planId required', data: null });

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) return res.status(400).json({ status: 400, message: 'Invalid or inactive plan', data: null });

    const sub = await Subscription.create({
      userId,
      planId: plan._id,
      planSnapshot: plan.toObject(),
      status: 'active',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      usage: { totalConversions: 0, perService: {} },
      services: plan.services,
      createdBy: req.user?.email || undefined,
    });
    return res.status(201).json({ status: 201, message: 'Subscription created', data: sub });
  } catch (error) {
    return res.status(400).json({ status: 400, message: error.message || 'Invalid request', data: null });
  }
};

// Get current user's subscriptions
const mySubscriptions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const subs = await Subscription.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({ status: 200, message: 'OK', data: subs });
  } catch (error) {
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

// Admin: list subscriptions
const listSubscriptions = async (req, res) => {
  try {
    const { userId, status } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    const subs = await Subscription.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ status: 200, message: 'OK', data: subs });
  } catch (error) {
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

module.exports = { purchase, mySubscriptions, listSubscriptions };


