const FederatedLoginConfig = require('../models/FederatedLoginConfig');

const PROVIDER_ORDER = ['google', 'facebook', 'linkedin', 'twitter'];

const PROVIDER_META = {
  google: {
    label: 'Google',
    developerUrl: 'https://console.cloud.google.com/apis/credentials',
    defaultCallbackPath: '/oauth/callback/google',
    defaultScopes: 'openid email profile',
    secretEnvFallback: 'GOOGLE_CLIENT_SECRET',
    clientIdEnvFallback: 'GOOGLE_CLIENT_ID',
  },
  facebook: {
    label: 'Facebook',
    developerUrl: 'https://developers.facebook.com/apps/',
    defaultCallbackPath: '/oauth/callback/facebook',
    defaultScopes: 'email,public_profile',
    secretEnvFallback: 'FACEBOOK_APP_SECRET',
    clientIdEnvFallback: 'FACEBOOK_APP_ID',
  },
  linkedin: {
    label: 'LinkedIn',
    developerUrl: 'https://www.linkedin.com/developers/apps',
    defaultCallbackPath: '/oauth/callback/linkedin',
    defaultScopes: 'openid profile email',
    secretEnvFallback: 'LINKEDIN_CLIENT_SECRET',
    clientIdEnvFallback: 'LINKEDIN_CLIENT_ID',
  },
  twitter: {
    label: 'X (Twitter)',
    developerUrl: 'https://developer.x.com/en/portal/dashboard',
    defaultCallbackPath: '/oauth/callback/twitter',
    defaultScopes: 'tweet.read users.read users.read.email offline.access',
    secretEnvFallback: 'TWITTER_CLIENT_SECRET',
    clientIdEnvFallback: 'TWITTER_CLIENT_ID',
  },
};

const defaultProviders = () =>
  PROVIDER_ORDER.map((provider) => ({
    provider,
    enabled: false,
    clientId: '',
    clientSecret: '',
    callbackUrl: '',
    scopes: PROVIDER_META[provider].defaultScopes,
  }));

let cachedDoc = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 1000;

function resolveSecret(providerRow) {
  const meta = PROVIDER_META[providerRow.provider] || {};
  if (providerRow.clientSecret) return providerRow.clientSecret;
  const envKey = meta.secretEnvFallback;
  if (envKey && process.env[envKey]) return process.env[envKey];
  return '';
}

function resolveClientId(providerRow) {
  if (providerRow.clientId) return providerRow.clientId;
  const meta = PROVIDER_META[providerRow.provider] || {};
  const envKey = meta.clientIdEnvFallback;
  if (envKey && process.env[envKey]) return process.env[envKey];
  return '';
}

function mergeWithDefaults(doc) {
  const stored = Array.isArray(doc?.providers) ? doc.providers : [];
  const byId = new Map(stored.map((p) => [p.provider, p]));
  return defaultProviders().map((base) => {
    const row = byId.get(base.provider) || {};
    return {
      provider: base.provider,
      enabled: Boolean(row.enabled),
      clientId: String(row.clientId || ''),
      clientSecret: String(row.clientSecret || ''),
      callbackUrl: String(row.callbackUrl || ''),
      scopes: String(row.scopes || base.scopes),
    };
  });
}

async function getOrCreateFederatedLoginDoc() {
  let doc = await FederatedLoginConfig.findOne({ key: 'default' }).select('+providers.clientSecret');
  if (!doc) {
    doc = await FederatedLoginConfig.create({ key: 'default', providers: defaultProviders() });
    doc = await FederatedLoginConfig.findById(doc._id).select('+providers.clientSecret');
  } else if (!doc.providers?.length) {
    doc.providers = defaultProviders();
    await doc.save();
  }
  return doc;
}

async function refreshFederatedLoginCache() {
  const doc = await getOrCreateFederatedLoginDoc();
  cachedDoc = mergeWithDefaults(doc);
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return cachedDoc;
}

async function getEffectiveProviders() {
  if (!cachedDoc || Date.now() >= cacheExpiresAt) {
    await refreshFederatedLoginCache();
  }
  return cachedDoc;
}

function maskSecret(secret) {
  if (!secret) return '';
  if (secret.length <= 4) return '••••';
  return `••••${secret.slice(-4)}`;
}

function getPublicBaseUrl() {
  return String(
    process.env.FRONTEND_BASE_URL || process.env.BASE_URL || 'https://esp.documantra.in'
  ).replace(/\/$/, '');
}

function defaultCallbackUrl(provider) {
  const meta = PROVIDER_META[provider];
  if (!meta) return '';
  return `${getPublicBaseUrl()}${meta.defaultCallbackPath}`;
}

function toAdminProviderView(row, includeSecret = false) {
  const meta = PROVIDER_META[row.provider] || {};
  const clientId = resolveClientId(row);
  const secret = resolveSecret(row);
  const configured = Boolean(clientId && secret);
  return {
    provider: row.provider,
    label: meta.label,
    enabled: Boolean(row.enabled),
    clientId,
    clientSecretSet: Boolean(secret),
    ...(includeSecret ? { clientSecret: row.clientSecret || '' } : {}),
    clientSecretMasked: maskSecret(secret),
    callbackUrl: row.callbackUrl || defaultCallbackUrl(row.provider),
    scopes: row.scopes || meta.defaultScopes,
    developerUrl: meta.developerUrl,
    configured,
    ready: Boolean(row.enabled && clientId && secret),
  };
}

async function getAdminFederatedLoginConfig() {
  const doc = await getOrCreateFederatedLoginDoc();
  const providers = mergeWithDefaults(doc).map((row) => toAdminProviderView(row, false));
  return {
    config: {
      key: doc.key,
      providers,
      updatedAt: doc.updatedAt,
    },
    meta: PROVIDER_META,
    effectiveBaseUrl: getPublicBaseUrl(),
  };
}

async function getPublicFederatedProviders() {
  const providers = await getEffectiveProviders();
  return providers
    .filter((row) => row.enabled && resolveClientId(row) && resolveSecret(row))
    .map((row) => ({
      provider: row.provider,
      label: PROVIDER_META[row.provider]?.label || row.provider,
      clientId: resolveClientId(row),
      callbackUrl: row.callbackUrl || defaultCallbackUrl(row.provider),
      scopes: row.scopes || PROVIDER_META[row.provider]?.defaultScopes || '',
    }));
}

function getGoogleOAuthClientId() {
  const envId = String(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const row = (cachedDoc || []).find((p) => p.provider === 'google');
  const fromDb = row ? resolveClientId(row) : '';
  return fromDb || envId;
}

module.exports = {
  PROVIDER_ORDER,
  PROVIDER_META,
  defaultProviders,
  getOrCreateFederatedLoginDoc,
  refreshFederatedLoginCache,
  getEffectiveProviders,
  getAdminFederatedLoginConfig,
  getPublicFederatedProviders,
  getGoogleOAuthClientId,
  resolveClientId,
  resolveSecret,
  defaultCallbackUrl,
  mergeWithDefaults,
};
