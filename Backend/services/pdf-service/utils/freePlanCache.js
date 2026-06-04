const axios = require('axios');

let cached = { limitType: 'number', limit: 10, fetchedAt: 0 };
const TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchFreePlanLimit() {
  const now = Date.now();
  if (now - cached.fetchedAt < TTL_MS) return cached;

  const baseUrl = process.env.SUBSCRIPTION_SERVICE_URL || 'https://esp.documantra.in/subscription';
  try {
    const res = await axios.get(`${baseUrl}/admin/plans/public/free-plan`);
    const data = res.data || {};
    const limitType = data.limitType || 'number';
    const limit = limitType === 'number' ? (data.limit ?? 10) : null;
    cached = { limitType, limit, fetchedAt: now };
  } catch {
    cached = { limitType: 'number', limit: 10, fetchedAt: now };
  }
  return cached;
}

module.exports = { fetchFreePlanLimit };


