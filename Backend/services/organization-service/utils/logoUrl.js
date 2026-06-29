const https = require('https');
const axios = require('axios');
const net = require('net');
const { assertSafeExternalHttpsUrl, isPrivateOrReservedIp } = require('./ssrfGuard');

const IMAGE_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const shouldProbeLogoUrl = () => String(process.env.ORG_LOGO_URL_PROBE || '').toLowerCase() === 'true';

const createPinnedHttpsAgent = (hostname, allowedAddresses) => {
  const pool = allowedAddresses.map((entry) => entry.address);

  return new https.Agent({
    keepAlive: false,
    lookup: (lookupHost, options, callback) => {
      if (lookupHost !== hostname) {
        callback(new Error('Unexpected lookup host'));
        return;
      }
      const next = pool.shift();
      if (!next) {
        callback(new Error('No allowed address available'));
        return;
      }
      const family = net.isIP(next) === 6 ? 6 : 4;
      callback(null, next, family);
    },
  });
};

const verifyLogoUrlAccessible = async (safeUrl) => {
  const parsed = new URL(safeUrl);
  const hostname = parsed.hostname.toLowerCase();
  const dns = require('dns').promises;
  const resolved = await dns.lookup(hostname, { all: true });
  const publicAddresses = resolved.filter((entry) => !isPrivateOrReservedIp(entry.address));

  if (!publicAddresses.length) {
    throw new Error('Logo URL resolves to a disallowed address');
  }

  const agent = createPinnedHttpsAgent(hostname, publicAddresses);

  const response = await axios({
    method: 'GET',
    url: safeUrl,
    timeout: 8000,
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 300,
    responseType: 'stream',
    maxContentLength: 512 * 1024,
    httpsAgent: agent,
    headers: {
      Accept: 'image/*',
      Host: hostname,
      'User-Agent': 'Documantra-LogoValidator/1.0',
    },
  });

  const contentType = String(response.headers['content-type'] || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (response.data && typeof response.data.destroy === 'function') {
    response.data.destroy();
  }

  if (!IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new Error('Logo URL must point to a supported image file');
  }
};

const validateLogoUrl = async (rawLogo) => {
  if (rawLogo == null || rawLogo === '') {
    return undefined;
  }

  const safeUrl = await assertSafeExternalHttpsUrl(String(rawLogo));

  // Default: no outbound HTTP request (prevents blind SSRF on organization/create).
  if (shouldProbeLogoUrl()) {
    await verifyLogoUrlAccessible(safeUrl);
  }

  return safeUrl;
};

module.exports = {
  validateLogoUrl,
};
