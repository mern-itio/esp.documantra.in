const axios = require('axios');

const SUBSCRIPTION_BASE = (
  process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:2110'
).replace(/\/+$/, '');

function parseAuthMethodIds(authentication) {
  if (!authentication) return [];
  let authArray = [];
  if (Array.isArray(authentication)) {
    authArray = authentication;
  } else if (typeof authentication === 'string') {
    try {
      const parsed = JSON.parse(authentication);
      authArray = Array.isArray(parsed) ? parsed : [];
    } catch {
      authArray = [];
    }
  }
  return authArray
    .map((item) => (typeof item === 'string' ? item : item?.authMethodId))
    .filter((id) => typeof id === 'string' && id.trim().length > 0);
}

function isAadhaarVSignMethodRecord(method) {
  const type = String(method?.providerType || '').toLowerCase();
  if (type === 'aadhaar_vsign') return true;
  return /aadhaar\s*e?sign|vsign/i.test(String(method?.name || ''));
}

async function authMethodIdsIncludeAadhaar(methodIds) {
  const unique = [...new Set((methodIds || []).map(String).filter(Boolean))];
  if (!unique.length) return false;
  try {
    const res = await axios.post(`${SUBSCRIPTION_BASE}/api/authproviders/bulk/details`, {
      methodIds: unique,
    });
    const methods = res.data?.methods || [];
    return methods.some(isAadhaarVSignMethodRecord);
  } catch (err) {
    console.warn('[VSign] authMethodIdsIncludeAadhaar failed:', err.message);
    return false;
  }
}

async function recipientAuthenticationRequiresAadhaar(authentication) {
  return authMethodIdsIncludeAadhaar(parseAuthMethodIds(authentication));
}

async function permissionRequiresAadhaar(authLevel) {
  return authMethodIdsIncludeAadhaar(parseAuthMethodIds(authLevel));
}

module.exports = {
  parseAuthMethodIds,
  authMethodIdsIncludeAadhaar,
  recipientAuthenticationRequiresAadhaar,
  permissionRequiresAadhaar,
};
