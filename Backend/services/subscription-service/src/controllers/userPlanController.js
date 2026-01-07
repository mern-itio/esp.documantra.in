const Subscription = require('../models/Subscription');
const PlanTemplate = require('../models/PlanTemplate');
const { createInvoiceForUpgrade } = require('./invoiceController');

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
    console.log('getMyPlan called');
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }

    let subscription = await Subscription.findOne({ userId }).lean();

    if (!subscription) {
      const freePlanTemplate = await PlanTemplate.findOne({
        $or: [{ type: 'free' }, { pricePerPeriod: 0 }]
      }).lean();

      if (freePlanTemplate) {
        const now = new Date();
        const nextBilling = freePlanTemplate.period === 'monthly'
          ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
          : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        subscription = await Subscription.create({
          userId,
          planTemplateId: freePlanTemplate._id,
          creditsBalance: freePlanTemplate.monthlyCredits || 0,
          status: 'active',
          periodStart: now,
          periodEnd: nextBilling,
          nextBillingAt: nextBilling,
        });
      } else {
        return res.status(404).json({ status: 404, message: 'No free plan template found', data: null });
      }
    }

    const planTemplate = subscription.planTemplateId
      ? await PlanTemplate.findById(subscription.planTemplateId).lean()
      : null;

    const response = {
      id: subscription._id,
      userId: subscription.userId,
      planTemplateId: subscription.planTemplateId || null,
      name: planTemplate?.name || 'Free Plan',
      description: planTemplate ? `${planTemplate.name} subscription` : 'Free plan with limited access',
      services: planTemplate?.services || [],
      type: planTemplate?.type || (planTemplate?.pricePerPeriod > 0 ? 'paid' : 'free'),
      price: planTemplate?.pricePerPeriod || 0,
      conversionsLimit: planTemplate?.monthlyCredits ?? 0,
      creditsBalance: subscription.creditsBalance || 0,
      toolCosts: planTemplate?.toolCosts || [],
      authCosts: planTemplate?.authCosts || [],
      documentCosts: planTemplate?.documentCosts || { credits: 0 },
      shareCosts: planTemplate?.shareCosts || { credits: 0 },
      pdfShareCosts: planTemplate?.pdfShareCosts || { credits: 0 },
      status: subscription.status || 'active',
      periodStart: subscription.periodStart || null,
      periodEnd: subscription.periodEnd || null,
      nextBillingAt: subscription.nextBillingAt || null,
      isFree: (planTemplate?.type === 'free') || (planTemplate?.pricePerPeriod === 0),
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


// POST /user-plan/upgrade
const upgradePlan = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });
    }

    const { planId } = req.body || {};
    if (!planId) {
      return res.status(400).json({ status: 400, message: 'planId is required', data: null });
    }

    const planTemplate = await PlanTemplate.findById(planId).lean();
    if (!planTemplate) {
      return res.status(404).json({ status: 404, message: 'Plan template not found', data: null });
    }

    // Find or create subscription
    let subscription = await Subscription.findOne({ userId });
    const now = new Date();
    const nextBilling = planTemplate.period === 'monthly'
      ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (!subscription) {
      subscription = await Subscription.create({
        userId,
        planTemplateId: planTemplate._id,
        creditsBalance: planTemplate.monthlyCredits || 0,
        status: 'active',
        periodStart: now,
        periodEnd: nextBilling,
        nextBillingAt: nextBilling,
      });
    } else {
      subscription.planTemplateId = planTemplate._id;
      // Reset credits to plan monthlyCredits on upgrade
      subscription.creditsBalance = planTemplate.monthlyCredits || 0;
      subscription.status = 'active';
      subscription.periodStart = now;
      subscription.periodEnd = nextBilling;
      subscription.nextBillingAt = nextBilling;
      await subscription.save();
    }

    const response = {
      id: subscription._id,
      userId: subscription.userId,
      planTemplateId: subscription.planTemplateId || null,
      name: planTemplate.name,
      description: `${planTemplate.name} subscription`,
      services: planTemplate.services || [],
      type: planTemplate.type || (planTemplate.pricePerPeriod > 0 ? 'paid' : 'free'),
      price: planTemplate.pricePerPeriod || 0,
      conversionsLimit: planTemplate.monthlyCredits ?? 0,
      creditsBalance: subscription.creditsBalance || 0,
      toolCosts: planTemplate.toolCosts || [],
      authCosts: planTemplate.authCosts || [],
      documentCosts: planTemplate.documentCosts || { credits: 0 },
      shareCosts: planTemplate.shareCosts || { credits: 0 },
      pdfShareCosts: planTemplate.pdfShareCosts || { credits: 0 },
      status: subscription.status || 'active',
      periodStart: subscription.periodStart || null,
      periodEnd: subscription.periodEnd || null,
      nextBillingAt: subscription.nextBillingAt || null,
      isFree: (planTemplate.type === 'free') || (planTemplate.pricePerPeriod === 0),
    };

    // Create invoice for this upgrade
    let invoice = null;
    try {
      invoice = await createInvoiceForUpgrade({ userId, subscription, planTemplate });
    } catch (invoiceErr) {
      console.error('Failed to create invoice on upgrade:', invoiceErr);
    }

    return res.status(200).json({
      status: 200,
      message: 'Plan upgraded',
      data: { plan: response, invoice },
    });
  } catch (error) {
    console.error('upgradePlan error:', error);
    return res.status(500).json({ status: 500, message: error.message || 'Server error', data: null });
  }
};

module.exports = { getMyPlan, createFreePlanForUser, upgradePlan };

