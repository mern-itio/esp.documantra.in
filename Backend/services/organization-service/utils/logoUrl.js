const axios = require('axios');
const { assertSafeExternalHttpsUrl } = require('./ssrfGuard');

const IMAGE_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]);

const verifyLogoUrlAccessible = async (safeUrl) => {
  const response = await axios({
    method: 'GET',
    url: safeUrl,
    timeout: 8000,
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
    responseType: 'stream',
    maxContentLength: 512 * 1024,
    headers: {
      Accept: 'image/*',
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
  await verifyLogoUrlAccessible(safeUrl);
  return safeUrl;
};

module.exports = {
  validateLogoUrl,
};
