const Subscription = require('../models/Subscription');
const PlanTemplate = require('../models/PlanTemplate');
const UsageRecord = require('../models/UsageRecord');

// Helper to extract userId from verified JWT (align with userPlanController)
const getUserIdFromRequest = (req) => {
  try {
    const decoded = req.user || {};
    return decoded?.data?.id || decoded?.id || decoded?._id || decoded?.data?._id || null;
  } catch (_) {
    return null;
  }
};

// GET /usage/balance
const getBalance = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });

    const subscription = await Subscription.findOne({ userId }).lean();
    if (!subscription) return res.status(404).json({ status: 404, message: 'Subscription not found', data: null });

    return res.status(200).json({ status: 200, data: { creditsBalance: subscription.creditsBalance } });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message, data: null });
  }
};

// POST /usage/consume { slug: 'pdf-to-excel' }
const consumeCredits = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });

    const subscription = await Subscription.findOne({ userId });
    if (!subscription) return res.status(404).json({ status: 404, message: 'Subscription not found', data: null });

    // Handle document/PDF share actions with credits (derive when not provided)
    if (['document:upload', 'document:share', 'pdf:share'].includes(req.body.action)) {
      const action = req.body.action;

      // Determine required from provided credits or plan template
      let required = Number(req.body.credits || 0);

      if (!required || required <= 0) {
        const planTemplate = subscription.planTemplateId ? await PlanTemplate.findById(subscription.planTemplateId).lean() : null;
        if (planTemplate) {
          if (action === 'document:upload') {
            required = Number(planTemplate?.documentCosts?.credits || 0);
          } else if (action === 'document:share') {
            required = Number(planTemplate?.shareCosts?.credits || 0);
          } else if (action === 'pdf:share') {
            required = Number(planTemplate?.pdfShareCosts?.credits || 0);
          }
        }
      }

      if (required <= 0) {
        return res.status(200).json({ status: 200, data: { creditsBalance: subscription.creditsBalance, debited: 0 } });
      }

      if (subscription.creditsBalance < required) {
        await UsageRecord.create({ subscriptionId: subscription._id, userId, action, creditsDelta: 0, balanceAfter: subscription.creditsBalance, success: false, reason: 'insufficient_credits' });
        return res.status(402).json({ status: 402, message: 'Insufficient credits', data: { required, creditsBalance: subscription.creditsBalance } });
      }

      subscription.creditsBalance = subscription.creditsBalance - required;
      await subscription.save();

      await UsageRecord.create({ subscriptionId: subscription._id, userId, action, creditsDelta: -required, balanceAfter: subscription.creditsBalance, success: true });

      return res.status(200).json({ status: 200, data: { creditsBalance: subscription.creditsBalance, debited: required } });
    }

    // Handle PDF tool consumption (existing logic)
    const { slug, toolId } = req.body || {};
    if (!slug && !toolId) return res.status(400).json({ status: 400, message: 'slug or toolId is required', data: null });

    // Resolve tool objectId from slug using PlanTemplate toolCosts list if toolId not provided
    let effectiveToolId = toolId;
    if (!effectiveToolId && subscription.planTemplateId) {
      const planTemplate = await PlanTemplate.findById(subscription.planTemplateId).lean();
      if (planTemplate) {
        const match = (planTemplate.toolCosts || []).find(tc => String(tc.toolId) === slug || String(tc.toolId) === toolId);
        if (match) effectiveToolId = String(match.toolId);
      }
    }

    // Fallback: trust provided toolId
    effectiveToolId = effectiveToolId || toolId;

    // Determine required credits from plan template
    const planTemplate = subscription.planTemplateId ? await PlanTemplate.findById(subscription.planTemplateId).lean() : null;
    const required = (planTemplate?.toolCosts || []).find(tc => String(tc.toolId) === String(effectiveToolId))?.credits || 0;

    if (required <= 0) {
      return res.status(200).json({ status: 200, data: { creditsBalance: subscription.creditsBalance, debited: 0 } });
    }

    if (subscription.creditsBalance < required) {
      // Record failed attempt
      await UsageRecord.create({ subscriptionId: subscription._id, userId, action: 'pdf:convert', toolId: effectiveToolId, creditsDelta: 0, balanceAfter: subscription.creditsBalance, success: false, reason: 'insufficient_credits' });
      return res.status(402).json({ status: 402, message: 'Insufficient credits', data: { required, creditsBalance: subscription.creditsBalance } });
    }

    subscription.creditsBalance = subscription.creditsBalance - required;
    await subscription.save();

    await UsageRecord.create({ subscriptionId: subscription._id, userId, action: 'pdf:convert', toolId: effectiveToolId, creditsDelta: -required, balanceAfter: subscription.creditsBalance, success: true });

    return res.status(200).json({ status: 200, data: { creditsBalance: subscription.creditsBalance, debited: required } });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message, data: null });
  }
};

module.exports = { getBalance, consumeCredits };
// List usage records
const listUsage = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ status: 401, message: 'Unauthorized', data: null });

    const { page = 1, limit = 20 } = req.query || {};
    const skip = (Number(page) - 1) * Number(limit);
    const records = await UsageRecord.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await UsageRecord.countDocuments({ userId });
    return res.status(200).json({ status: 200, data: { records, pagination: { currentPage: Number(page), itemsPerPage: Number(limit), totalItems: total, totalPages: Math.ceil(total / Number(limit)) } } });
  } catch (e) {
    return res.status(500).json({ status: 500, message: e.message, data: null });
  }
};

module.exports.listUsage = listUsage;


