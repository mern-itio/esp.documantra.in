const BRAND_NAME = String(process.env.APP_NAME || process.env.BRAND_NAME || 'DocuMantra').trim();

const DEFAULT_SUPABASE_URL = String(
  process.env.DOCUMANTRA_SUPABASE_URL || 'https://tgkqdagmnbgmrtjpymbz.supabase.co',
).replace(/\/$/, '');

const DEFAULT_SUPABASE_KEY = String(
  process.env.DOCUMANTRA_SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_GOc0CTdxDy_MG1BMbKkk5g_rvFOkQ-n',
).trim();

const DEFAULT_BRAND_LOGO_URL = `${DEFAULT_SUPABASE_URL}/storage/v1/object/public/branding/logo.png`;
const DEFAULT_BRAND_FAVICON_URL = `${DEFAULT_SUPABASE_URL}/storage/v1/object/public/branding/favicon.png`;

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedLogoUrl = null;
let cachedFaviconUrl = null;
let cacheExpiresAt = 0;

const formatEnvelopeSubject = (documentName) => {
  const label = String(documentName || '').trim() || 'Document';
  return `Complete with ${BRAND_NAME}: ${label}`;
};

function cacheBust(url, token) {
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(token)}`;
}

async function fetchBrandingAssetUrl(assetKey) {
  try {
    const res = await fetch(`${DEFAULT_SUPABASE_URL}/storage/v1/object/list/branding`, {
      method: 'POST',
      headers: {
        apikey: DEFAULT_SUPABASE_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix: '', limit: 100 }),
    });

    if (!res.ok) return null;

    const files = await res.json();
    const match = files
      .filter((file) => file.name.startsWith(`${assetKey}.`))
      .sort((a, b) =>
        String(b.updated_at || '').localeCompare(String(a.updated_at || '')),
      )[0];

    if (!match) return null;

    return cacheBust(
      `${DEFAULT_SUPABASE_URL}/storage/v1/object/public/branding/${match.name}`,
      match.updated_at || match.id,
    );
  } catch {
    return null;
  }
}

async function refreshBrandingCache() {
  const [logoUrl, faviconUrl] = await Promise.all([
    fetchBrandingAssetUrl('logo'),
    fetchBrandingAssetUrl('favicon'),
  ]);

  if (logoUrl) cachedLogoUrl = logoUrl;
  if (faviconUrl) cachedFaviconUrl = faviconUrl;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
}

const getBrandLogoUrl = () => {
  const fromEnv = String(process.env.BRAND_LOGO_URL || '').trim();
  if (fromEnv) return fromEnv;
  if (cachedLogoUrl && Date.now() < cacheExpiresAt) return cachedLogoUrl;
  return DEFAULT_BRAND_LOGO_URL;
};

const getBrandFaviconUrl = () => {
  const fromEnv = String(process.env.BRAND_FAVICON_URL || '').trim();
  if (fromEnv) return fromEnv;
  if (cachedFaviconUrl && Date.now() < cacheExpiresAt) return cachedFaviconUrl;
  return DEFAULT_BRAND_FAVICON_URL;
};

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Centered logo block for transactional email HTML. */
const renderEmailLogoHeader = () => {
  const logoUrl = escapeHtml(getBrandLogoUrl());
  const brandName = escapeHtml(BRAND_NAME);
  return `<div style="text-align:center;margin:0 0 24px;">
    <img src="${logoUrl}" alt="${brandName}" width="180" style="max-width:180px;height:auto;display:inline-block;" />
  </div>`;
};

/** Shared outer wrapper for branded transactional emails. */
const wrapBrandedEmailBody = (contentHtml) => `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px 16px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 28px 24px; border: 1px solid #e2e8f0;">
      ${renderEmailLogoHeader()}
      ${contentHtml}
      <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8; text-align: center;">Sent via ${escapeHtml(BRAND_NAME)}</p>
    </div>
  </div>`;

refreshBrandingCache().catch(() => {});
setInterval(() => {
  refreshBrandingCache().catch(() => {});
}, CACHE_TTL_MS);

module.exports = {
  BRAND_NAME,
  getBrandName: () => BRAND_NAME,
  formatEnvelopeSubject,
  getBrandLogoUrl,
  getBrandFaviconUrl,
  refreshBrandingCache,
  renderEmailLogoHeader,
  wrapBrandedEmailBody,
};
