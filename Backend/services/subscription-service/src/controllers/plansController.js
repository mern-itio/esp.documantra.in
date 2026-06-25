const PlanTemplate = require('../models/PlanTemplate');
const { validatePlanPayload } = require('../utils/billingValidation');

const createPlan = async (req, res) => {
  try {
    const payload = req.body || {};
    const validation = validatePlanPayload(payload);
    if (!validation.ok) {
      return res.status(400).json({ status: 400, message: validation.message, data: null });
    }

    const sanitized = validation.sanitized;

    if (sanitized.type === 'free') {
      const existingFreePlan = await PlanTemplate.findOne({ type: 'free' });
      if (existingFreePlan) {
        return res.status(400).json({
          status: 400,
          message: 'A free plan already exists. You cannot create another.',
          data: null,
        });
      }
    }

    const plan = await PlanTemplate.create({
      name: sanitized.name,
      services: sanitized.services,
      type: sanitized.type || 'paid',
      toolCosts: sanitized.toolCosts,
      authCosts: sanitized.authCosts,
      documentCosts: sanitized.documentCosts || { credits: 0 },
      shareCosts: sanitized.shareCosts || { credits: 0 },
      pdfShareCosts: sanitized.pdfShareCosts || { credits: 0 },
      monthlyCredits: sanitized.monthlyCredits,
      pricePerPeriod: sanitized.pricePerPeriod,
      period: sanitized.period || 'monthly',
    });

    return res.status(201).json({ status: 201, message: 'Plan created', data: plan });
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(400).json({ status: 400, message: 'Invalid request', data: null });
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
    return res.status(400).json({ status: 400, message: 'Invalid request', data: null });
  }
};

const listPlans = async (req, res) => {
  try {
    const { page = 1, limit = 10, period, search } = req.query;
    const skip = (page - 1) * limit;

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
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    return res.status(400).json({ status: 400, message: 'Invalid request', data: null });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    if (!id) {
      return res.status(400).json({ status: 400, message: 'Plan ID is required', data: null });
    }

    const existingPlan = await PlanTemplate.findById(id);
    if (!existingPlan) {
      return res.status(404).json({ status: 404, message: 'Plan not found', data: null });
    }

    const validation = validatePlanPayload(payload, { isUpdate: true, existingPlan });
    if (!validation.ok) {
      return res.status(400).json({ status: 400, message: validation.message, data: null });
    }

    const sanitized = validation.sanitized;
    const updateData = {
      ...sanitized,
      version: existingPlan.version + 1,
    };

    if (!updateData.documentCosts && sanitized.services?.includes('document')) {
      updateData.documentCosts = { credits: 0 };
    }

    const updatedPlan = await PlanTemplate.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({ status: 200, message: 'Plan updated successfully', data: updatedPlan });
  } catch (error) {
    console.error('Error updating plan:', error);
    return res.status(400).json({ status: 400, message: 'Invalid request', data: null });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ status: 400, message: 'Plan ID is required', data: null });
    }

    const existingPlan = await PlanTemplate.findById(id);
    if (!existingPlan) {
      return res.status(404).json({ status: 404, message: 'Plan not found', data: null });
    }

    await PlanTemplate.findByIdAndDelete(id);

    return res.status(200).json({ status: 200, message: 'Plan deleted successfully', data: null });
  } catch (error) {
    return res.status(400).json({ status: 400, message: 'Invalid request', data: null });
  }
};

module.exports = { createPlan, getPlan, listPlans, updatePlan, deletePlan };
