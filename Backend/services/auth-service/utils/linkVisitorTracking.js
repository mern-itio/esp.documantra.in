const axios = require('axios');

/**
 * Soft-link anonymous visitor UUID to customer after successful signup/login.
 * Never throws — tracking DB outages must not break registration.
 */
async function linkVisitorToCustomer({ customerId, visitorId, signupPageUrl, linkSource = 'signup' }) {
  const base = process.env.VISITOR_TRACKING_URL || 'http://visitor-tracking-service:2116';
  const secret = process.env.TRACKING_INTERNAL_SECRET || '';
  if (!customerId || !visitorId || !secret) return null;

  try {
    const res = await axios.post(
      `${base.replace(/\/$/, '')}/internal/v1/link-customer`,
      {
        customerId: String(customerId),
        visitorId: String(visitorId),
        signupPageUrl: signupPageUrl || '',
        linkSource,
      },
      {
        headers: { 'x-tracking-secret': secret },
        timeout: 3000,
      },
    );
    return res.data;
  } catch (err) {
    console.warn('[auth] visitor link soft-fail:', err?.message || err);
    return null;
  }
}

module.exports = { linkVisitorToCustomer };
