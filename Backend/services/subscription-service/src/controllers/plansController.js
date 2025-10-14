const PlanTemplate = require('../models/PlanTemplate');
const SubscriptionPlan = require('../models/SubscriptionPlan');

const createPlan = async (req, res) => {
  try {
    const payload = req.body || {};
    if(!payload || !payload.name || payload.pricePerPeriod === undefined) {
      return res.status(400).json({ status: 400, message: 'Missing required fields', data: null });
    }
    const plan = await PlanTemplate.create({
      name: payload?.name,
      services: payload?.services,
      toolCosts: payload?.toolCosts,
      authCosts: payload?.authCosts,
      monthlyCredits:payload?.monthlyCredits,
      pricePerPeriod: payload?.pricePerPeriod,
      period: payload?.period || 'monthly',
    });
    return res.status(201).json({ status: 201, message: 'Plan created', data: plan });
  } catch (error) {
    return res.status(400).json({ status: 400, message: error.message || 'Invalid request', data: null });
  }
};

const listPlans = async (req, res) => {
  try {
    const { active, type, service } = req.query;
    const filter = {};
    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;
    if (type) filter.type = type;
    if (service) filter.$or = [{ services: service }, { services: { $exists: false } }, { services: { $size: 0 } }];
    const plans = await SubscriptionPlan.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ status: 200, message: 'OK', data: plans });
  } catch (error) {
    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null });
  }
};

const getPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ status: 404, message: 'Not found', data: null });
    return res.status(200).json({ status: 200, message: 'OK', data: plan });
  } catch (error) {
    return res.status(404).json({ status: 404, message: 'Not found', data: null });
  }
};

const updatePlan = async (req, res) => {
  try {
    const payload = req.body || {};
    const setDoc = { ...payload };

    if (setDoc.conversionsLimitType === 'unlimited') {
      setDoc.conversionsLimit = undefined;
    }

    const updateOps = {};
    const $set = {};
    const $unset = {};

    // Handle services: empty array => unset to apply to all services
    if (Object.prototype.hasOwnProperty.call(setDoc, 'services')) {
      if (Array.isArray(setDoc.services) && setDoc.services.length === 0) {
        $unset.services = "";
      } else if (setDoc.services !== undefined) {
        $set.services = setDoc.services;
      }
      delete setDoc.services;
    }

    // Remaining fields go to $set (excluding undefined)
    for (const [k, v] of Object.entries(setDoc)) {
      if (v !== undefined) $set[k] = v;
    }

    if (Object.keys($set).length) updateOps.$set = $set;
    if (Object.keys($unset).length) updateOps.$unset = $unset;

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      updateOps,
      { new: true, runValidators: true }
    );
    if (!plan) return res.status(404).json({ status: 404, message: 'Not found', data: null });
    return res.status(200).json({ status: 200, message: 'Updated', data: plan });
  } catch (error) {
    return res.status(400).json({ status: 400, message: error.message || 'Invalid request', data: null });
  }
};

const deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ status: 404, message: 'Not found', data: null });
    return res.status(200).json({ status: 200, message: 'Deleted', data: null });
  } catch (error) {
    return res.status(400).json({ status: 400, message: error.message || 'Invalid request', data: null });
  }
};

module.exports = { createPlan, listPlans, getPlan, updatePlan, deletePlan };


