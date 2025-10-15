const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const PlanTemplate = require('../models/PlanTemplate');

// Get user's current plan details
const getUserPlan = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ 
        status: 401, 
        message: 'User not authenticated', 
        data: null 
      });
    }

    // Find user's active subscription
    const subscription = await Subscription.findOne({ 
      userId, 
      status: 'active' 
    }).populate('planTemplateId', 'name type price conversionsLimitType conversionsLimit description services');

    // If no active subscription, return free plan details
    if (!subscription) {
      // Create a default free plan response
      const freePlan = {
        name: 'Free Plan',
        type: 'free',
        price: 0,
        conversionsLimitType: 'number',
        conversionsLimit: 5, // 5 free conversions
        description: 'Free plan with limited conversions',
        services: ['pdf', 'esign'], // Available services for free users
        creditsBalance: 5,
        status: 'active',
        isFree: true
      };

      return res.status(200).json({
        status: 200,
        message: 'User plan retrieved successfully',
        data: freePlan
      });
    }

    // Return subscription details with plan template info
    const planData = {
      ...subscription.planTemplateId.toObject(),
      creditsBalance: subscription.creditsBalance,
      creditReserved: subscription.creditReserved,
      status: subscription.status,
      periodStart: subscription.periodStart,
      periodEnd: subscription.periodEnd,
      nextBillingAt: subscription.nextBillingAt,
      isFree: false
    };

    return res.status(200).json({
      status: 200,
      message: 'User plan retrieved successfully',
      data: planData
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal Server Error', 
      data: null 
    });
  }
};

// Create a free subscription for new users
const createFreeSubscription = async (userId) => {
  try {
    // Check if user already has a subscription
    const existingSubscription = await Subscription.findOne({ userId });
    if (existingSubscription) {
      return existingSubscription;
    }

    // Create a free subscription
    const freeSubscription = await Subscription.create({
      userId,
      planTemplateId: null, // No plan template for free users
      creditsBalance: 5, // 5 free credits
      creditReserved: 0,
      status: 'active',
      periodStart: new Date(),
      periodEnd: null, // No end date for free plan
      nextBillingAt: null
    });

    return freeSubscription;
  } catch (error) {
    console.error('Error creating free subscription:', error);
    throw error;
  }
};

// Update user's subscription plan
const updateUserPlan = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { planTemplateId, creditsBalance } = req.body;

    if (!userId) {
      return res.status(401).json({ 
        status: 401, 
        message: 'User not authenticated', 
        data: null 
      });
    }

    // Find existing subscription
    let subscription = await Subscription.findOne({ userId, status: 'active' });

    if (!subscription) {
      // Create new subscription if doesn't exist
      subscription = await Subscription.create({
        userId,
        planTemplateId: planTemplateId || null,
        creditsBalance: creditsBalance || 5,
        creditReserved: 0,
        status: 'active',
        periodStart: new Date(),
        periodEnd: null,
        nextBillingAt: null
      });
    } else {
      // Update existing subscription
      const updateData = {};
      if (planTemplateId) updateData.planTemplateId = planTemplateId;
      if (creditsBalance !== undefined) updateData.creditsBalance = creditsBalance;

      subscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        updateData,
        { new: true }
      ).populate('planTemplateId', 'name type price conversionsLimitType conversionsLimit description services');
    }

    return res.status(200).json({
      status: 200,
      message: 'User plan updated successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    return res.status(500).json({ 
      status: 500, 
      message: 'Internal Server Error', 
      data: null 
    });
  }
};

// Create free subscription endpoint (called by auth service)
const createFreeSubscriptionEndpoint = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        status: 400,
        message: 'User ID is required',
        data: null
      });
    }

    const subscription = await createFreeSubscription(userId);
    
    return res.status(201).json({
      status: 201,
      message: 'Free subscription created successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error creating free subscription:', error);
    return res.status(500).json({
      status: 500,
      message: 'Internal Server Error',
      data: null
    });
  }
};

module.exports = { 
  getUserPlan, 
  createFreeSubscription, 
  updateUserPlan,
  createFreeSubscriptionEndpoint
};
