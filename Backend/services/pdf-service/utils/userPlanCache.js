const axios = require('axios');

const cache = new Map(); // key: userId -> { type, limitType, limit, fetchedAt }
const toolSettingsCache = new Map(); // key: toolId -> { settings, fetchedAt }
const TTL_MS = 5 * 60 * 1000;

async function fetchUserPlan(req, userId) {
  const cached = cache.get(userId);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < TTL_MS) return cached;

  const baseUrl = process.env.SUBSCRIPTION_SERVICE_URL || 'https://esp.documantra.in/subscription';
  try {
    const token = req.headers?.authorization;
    const res = await axios.get(`${baseUrl}/subscriptions/me`, {
      headers: token ? { Authorization: token } : {}
    });
    const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    // pick latest active
    const active = list.find((s) => s.status === 'active') || list[0];
    if (!active) {
      // Fallback: check user's plan field from auth service
      const authToken = req.headers?.authorization;
      if (authToken) {
        try {
          const authRes = await axios.get(`${process.env.AUTH_SERVICE_URL || 'https://esp.documantra.in/auth'}/api/auth/me`, {
            headers: { Authorization: authToken }
          });
          const userPlan = authRes.data?.plan || 'free';
          if (userPlan === 'pro' || userPlan === 'custom') {
            const plan = { type: userPlan, limitType: 'unlimited', limit: null, fetchedAt: now };
            cache.set(userId, plan);
            return plan;
          }
        } catch (authError) {
          console.warn('Could not fetch user plan from auth service:', authError.message);
        }
      }
      const plan = { type: 'free', limitType: 'number', limit: 10, fetchedAt: now };
      cache.set(userId, plan);
      return plan;
    }
    const snap = active.planSnapshot || {};
    const type = snap.type || 'custom';
    const limitType = snap.conversionsLimitType || 'number';
    const limit = limitType === 'number' ? (snap.conversionsLimit ?? 10) : null;
    const plan = { type, limitType, limit, fetchedAt: now };
    cache.set(userId, plan);
    return plan;
  } catch (e) {
    // Fallback: check user's plan field from auth service
    const authToken = req.headers?.authorization;
    if (authToken) {
      try {
        const authRes = await axios.get(`${process.env.AUTH_SERVICE_URL || 'https://esp.documantra.in/auth'}/api/auth/me`, {
          headers: { Authorization: authToken }
        });
        const userPlan = authRes.data?.plan || 'free';
        if (userPlan === 'pro' || userPlan === 'custom') {
          const plan = { type: userPlan, limitType: 'unlimited', limit: null, fetchedAt: now };
          cache.set(userId, plan);
          return plan;
        }
      } catch (authError) {
        console.warn('Could not fetch user plan from auth service:', authError.message);
      }
    }
    const fallback = { type: 'free', limitType: 'number', limit: 10, fetchedAt: now };
    cache.set(userId, fallback);
    return fallback;
  }
}

// Fetch tool-specific settings
async function fetchToolSettings(toolId) {
  const cached = toolSettingsCache.get(toolId);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < TTL_MS) {
    return cached;
  }

  const baseUrl = process.env.ADMIN_SERVICE_URL;
  const url = `${baseUrl}/admin/public/tool-settings/${toolId}`;
  console.log(`[fetchToolSettings] Fetching from URL: ${url}`);
  
  try {
    const res = await axios.get(url);
    const settings = res.data?.data;
    if (settings) {
      const cached = { settings, fetchedAt: now };
      toolSettingsCache.set(toolId, cached);
      return cached;
    }
  } catch (error) {
    console.warn(`Could not fetch tool settings for ${toolId}:`, error.message);
  }
  
  return null;
}

// Check if user can access a specific tool
async function canUserAccessTool(toolId, userPlan, isAuthenticated) {
  const toolData = await fetchToolSettings(toolId);
  if (!toolData) {
    console.log(`[canUserAccessTool] No tool data found for ${toolId}`);
    return false;
  }
  
  // Since admin service only returns active tools, we can assume isActive is true
  // if (!toolData.settings.isActive) {
  //   return false;
  // }

  const { accessControl, features } = toolData.settings;
  console.log(`[canUserAccessTool] Tool ${toolId} access control:`, accessControl.allowedFor);
  console.log(`[canUserAccessTool] Tool ${toolId} features:`, features);

  // Check feature requirements
  if (features.requiresAuth && !isAuthenticated) {
    console.log(`[canUserAccessTool] Tool ${toolId} requires auth but user not authenticated`);
    return false;
  }

  if (features.requiresPremium && userPlan !== 'pro' && userPlan !== 'custom') {
    console.log(`[canUserAccessTool] Tool ${toolId} requires premium but user plan is ${userPlan}`);
    return false;
  }

  // Check access control
  switch (accessControl.allowedFor) {
    case 'all':
      console.log(`[canUserAccessTool] Tool ${toolId} is free for all - returning true`);
      return true;
    
    case 'logged_in_only':
      return isAuthenticated;
    
    case 'pro':
      return isAuthenticated && (userPlan === 'pro' || userPlan === 'custom');
    
    case 'custom':
      if (!isAuthenticated) {
        return accessControl.customRules.guests.enabled;
      } else if (userPlan === 'pro' || userPlan === 'custom') {
        return accessControl.customRules.proUsers.enabled;
      } else {
        return accessControl.customRules.freeUsers.enabled;
      }
    
    default:
      return false;
  }
}

// Get user limits for a specific tool
async function getUserLimitsForTool(toolId, userPlan, isAuthenticated) {
  console.log(`[getUserLimitsForTool] Getting limits for ${toolId}, userPlan: ${userPlan}, isAuthenticated: ${isAuthenticated}`);
  
  const toolData = await fetchToolSettings(toolId);
  if (!toolData) {
    console.log(`[getUserLimitsForTool] No tool data found for ${toolId}`);
    return { limitType: 'number', limit: 0, timeWindow: 'daily' };
  }

  const { accessControl } = toolData.settings;
  console.log(`[getUserLimitsForTool] Access control for ${toolId}:`, accessControl);

  if (accessControl.allowedFor === 'all') {
    console.log(`[getUserLimitsForTool] Tool ${toolId} is free for all - returning unlimited`);
    return { limitType: 'unlimited', limit: null, timeWindow: 'daily' };
  }

  if (accessControl.allowedFor === 'custom') {
    if (!isAuthenticated) {
      return {
        limitType: accessControl.customRules.guests.limitType,
        limit: accessControl.customRules.guests.limit,
        timeWindow: accessControl.customRules.guests.timeWindow
      };
    } else if (userPlan === 'pro' || userPlan === 'custom') {
      return {
        limitType: accessControl.customRules.proUsers.limitType,
        limit: accessControl.customRules.proUsers.limit,
        timeWindow: accessControl.customRules.proUsers.timeWindow
      };
    } else {
      return {
        limitType: accessControl.customRules.freeUsers.limitType,
        limit: accessControl.customRules.freeUsers.limit,
        timeWindow: accessControl.customRules.freeUsers.timeWindow
      };
    }
  }

  // For logged_in_only and pro, return unlimited for now
  return { limitType: 'unlimited', limit: null, timeWindow: 'daily' };
}

module.exports = { 
  fetchUserPlan, 
  fetchToolSettings, 
  canUserAccessTool, 
  getUserLimitsForTool 
};


