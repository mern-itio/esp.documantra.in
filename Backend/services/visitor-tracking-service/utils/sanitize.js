const SENSITIVE_QUERY_KEYS = new Set([
  'password',
  'passwd',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'auth',
  'otp',
  'code',
  'session',
  'api_key',
  'apikey',
  'secret',
  'card',
  'cvv',
  'ssn',
]);

function trimStr(value, max = 2048) {
  if (value == null) return '';
  return String(value).trim().slice(0, max);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ''),
  );
}

function sanitizeUrl(raw, max = 2048) {
  const input = trimStr(raw, max);
  if (!input) return '';
  try {
    const u = new URL(input);
    for (const key of [...u.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        u.searchParams.set(key, '[redacted]');
      }
    }
    return u.toString().slice(0, max);
  } catch {
    return input.slice(0, max);
  }
}

function pagePathFromUrl(raw) {
  try {
    return new URL(raw).pathname || '/';
  } catch {
    return trimStr(raw, 512);
  }
}

function referringDomain(raw) {
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return '';
  }
}

module.exports = {
  trimStr,
  isUuid,
  sanitizeUrl,
  pagePathFromUrl,
  referringDomain,
  SENSITIVE_QUERY_KEYS,
};
