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

const getPlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ status: 400, message: 'Plan ID is required', data: null });
    }

    const plan = await PlanTemplate.findById(id);
    
    if (!plan) {
      return res.status(404).json({ status: 404, message: 'Plan not found', data: null });
    }

    return res.status(200).json({ status: 200, message: 'Plan retrieved successfully', data: plan });
  } catch (error) {
    return res.status(400).json({ status: 400, message: error.message || 'Invalid request', data: null });
  }
};

const listPlans = async (req, res) => {
  try {
    const { page = 1, limit = 10, period, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (period) {
      filter.period = period;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const plans = await PlanTemplate.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await PlanTemplate.countDocuments(filter);

    return res.status(200).json({ 
      status: 200, 
      message: 'Plans retrieved successfully', 
      data: {
        plans,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    return res.status(400).json({ status: 400, message: error.message || 'Invalid request', data: null });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    
    if (!id) {
      return res.status(400).json({ status: 400, message: 'Plan ID is required', data: null });
    }

    // Check if plan exists
    const existingPlan = await PlanTemplate.findById(id);
    if (!existingPlan) {
      return res.status(404).json({ status: 404, message: 'Plan not found', data: null });
    }

    // Update the plan
    const updatedPlan = await PlanTemplate.findByIdAndUpdate(
      id,
      {
        ...payload,
        version: existingPlan.version + 1 // Increment version
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({ status: 200, message: 'Plan updated successfully', data: updatedPlan });
  } catch (error) {
    return res.status(400).json({ status: 400, message: error.message || 'Invalid request', data: null });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ status: 400, message: 'Plan ID is required', data: null });
    }

    // Check if plan exists
    const existingPlan = await PlanTemplate.findById(id);
    if (!existingPlan) {
      return res.status(404).json({ status: 404, message: 'Plan not found', data: null });
    }

    // Delete the plan
    await PlanTemplate.findByIdAndDelete(id);

    return res.status(200).json({ status: 200, message: 'Plan deleted successfully', data: null });
  } catch (error) {
    return res.status(400).json({ status: 400, message: error.message || 'Invalid request', data: null });
  }
};

module.exports = { createPlan, getPlan, listPlans, updatePlan, deletePlan };


