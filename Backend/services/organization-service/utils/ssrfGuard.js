const dns = require('dns').promises;
const net = require('net');

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  'metadata.google.internal',
  'metadata.google',
  'instance-data',
  'metadata',
  'aws.amazon.com',
]);

const BLOCKED_HOST_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.nip.io',
  '.xip.io',
  '.sslip.io',
  '.burpcollaborator.net',
  '.oastify.com',
  '.interact.sh',
  '.svc',
  '.cluster.local',
];

const DOMAIN_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

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
    if (a === 192 && b === 0) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80')) return true;
    if (lower.startsWith('::ffff:')) {
      const mapped = lower.slice('::ffff:'.length);
      if (net.isIPv4(mapped)) {
        return isPrivateOrReservedIp(mapped);
      }
    }
    return false;
  }

  return true;
};

const isBlockedHostname = (hostname) => {
  const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith('.localhost') || host === 'localhost') return true;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host === suffix.slice(1) || host.endsWith(suffix))) {
    return true;
  }
  if (/^\d+$/.test(host)) return true;
  if (net.isIP(host)) return true;
  return false;
};

const assertValidDomainHostname = (hostname) => {
  const labels = hostname.split('.').filter(Boolean);
  if (labels.length < 2) {
    throw new Error('Logo URL must use a fully qualified domain name');
  }
  for (const label of labels) {
    if (!DOMAIN_LABEL_RE.test(label)) {
      throw new Error('Logo URL hostname contains invalid characters');
    }
  }
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
  if (/[\u0000-\u001F\u007F\s]/.test(trimmed)) {
    throw new Error('Invalid logo URL format');
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
  if (parsed.port && parsed.port !== '443') {
    throw new Error('Logo URL must use the default HTTPS port');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (isBlockedHostname(hostname)) {
    throw new Error('Logo URL hostname is not allowed');
  }

  assertValidDomainHostname(hostname);

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
  isBlockedHostname,
};
