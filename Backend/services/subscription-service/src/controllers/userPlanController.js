const Subscription = require('../models/Subscription');
const PlanTemplate = require('../models/PlanTemplate');

// Extract userId from various possible JWT payload shapes
const getUserIdFromRequest = (req) => {
  // auth-lib attaches full decoded token to req.user
  // Our auth tokens embed user data under data: { id, email, fullname }
  const decoded = req.user || {};
  return decoded?.data?.id || decoded?.id || decoded?._id || decoded?.data?._id || null;
};

// GET /user-plan/me
const getMyPlan = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }

    let subscription = await Subscription.findOne({ userId }).lean();

    if (!subscription) {
      // Auto-provision a free baseline subscription with 0 credits
      subscription = await Subscription.create({
        userId,
        creditsBalance: 0,
        creditReserved: 0,
        status: 'active'
      });
      subscription = subscription.toObject();
    }

    let planTemplate = null;
    if (subscription.planTemplateId) {
      planTemplate = await PlanTemplate.findById(subscription.planTemplateId).lean();
    }

    // Normalize response for frontend consumption
    const response = {
      id: subscription._id,
      userId: subscription.userId,
      planTemplateId: subscription.planTemplateId || null,
      creditsBalance: subscription.creditsBalance || 0,
      creditReserved: subscription.creditReserved || 0,
      status: subscription.status || 'active',
      periodStart: subscription.periodStart || null,
      periodEnd: subscription.periodEnd || null,
      nextBillingAt: subscription.nextBillingAt || null,
      // Derived fields for UI compatibility
      name: planTemplate?.name || 'Free Plan',
      type: planTemplate ? (planTemplate.pricePerPeriod > 0 ? 'paid' : 'free') : 'free',
      price: planTemplate?.pricePerPeriod || 0,
      conversionsLimitType: planTemplate?.monthlyCredits === -1 ? 'unlimited' : 'number',
      conversionsLimit: planTemplate?.monthlyCredits ?? 0,
      description: planTemplate ? `${planTemplate.name} subscription` : 'Free plan with limited access',
      services: planTemplate?.services || [],
      isFree: !planTemplate || (planTemplate?.pricePerPeriod || 0) === 0
    };

    return res.status(200).json({ status: 200, message: 'User plan fetched', data: response });
  } catch (error) {
    console.error('getMyPlan error:', error);
    return res.status(500).json({ status: 500, message: error.message || 'Server error', data: null });
  }
};

// POST /user-plan/create-free
const createFreePlanForUser = async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ status: 400, message: 'userId is required', data: null });
    }

    let subscription = await Subscription.findOne({ userId });
    if (subscription) {
      return res.status(200).json({ status: 200, message: 'Subscription already exists', data: subscription });
    }

    subscription = await Subscription.create({
      userId,
      creditsBalance: 0,
      creditReserved: 0,
      status: 'active'
    });

    return res.status(201).json({ status: 201, message: 'Free subscription created', data: subscription });
  } catch (error) {
    console.error('createFreePlanForUser error:', error);
    return res.status(500).json({ status: 500, message: error.message || 'Server error', data: null });
  }
};

module.exports = { getMyPlan, createFreePlanForUser };


