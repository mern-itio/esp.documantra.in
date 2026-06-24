const dns = require('dns').promises;
const net = require('net');

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  'metadata.google.internal',
  'metadata.google',
  'instance-data',
]);

const isPrivateOrReservedIp = (ip) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80')) return true;
    return false;
  }

  return true;
};

const hostnameMatchesAllowlist = (hostname) => {
  const raw = process.env.ORG_LOGO_URL_HOST_ALLOWLIST;
  if (!raw || !String(raw).trim()) {
    return true;
  }

  const allowed = String(raw)
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!allowed.length) {
    return true;
  }

  return allowed.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
  );
};

const assertSafeExternalHttpsUrl = async (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Invalid logo URL');
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error('Invalid logo URL');
  }
  if (trimmed.length > 2048) {
    throw new Error('Logo URL is too long');
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid logo URL format');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Logo URL must use HTTPS');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Logo URL must not contain credentials');
  }
  if (!parsed.hostname) {
    throw new Error('Invalid logo URL hostname');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  ) {
    throw new Error('Logo URL hostname is not allowed');
  }

  if (net.isIP(hostname)) {
    throw new Error('Logo URL must be a domain name, not an IP address');
  }

  if (!hostnameMatchesAllowlist(hostname)) {
    throw new Error('Logo URL domain is not allowed');
  }

  const resolved = await dns.lookup(hostname, { all: true });
  if (!resolved.length) {
    throw new Error('Logo URL hostname could not be resolved');
  }

  for (const entry of resolved) {
    if (isPrivateOrReservedIp(entry.address)) {
      throw new Error('Logo URL resolves to a disallowed address');
    }
  }

  return parsed.toString();
};

module.exports = {
  assertSafeExternalHttpsUrl,
  isPrivateOrReservedIp,
};
