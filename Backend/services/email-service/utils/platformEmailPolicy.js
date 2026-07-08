const PlatformEmailConfig = require('../models/PlatformEmailConfig');
const { getBrandName, normalizeBrandName } = require('@draftnsign/validators/brandConfig');

let cachedConfig = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 1000;

const defaultConfig = () => ({
  key: 'default',
  enabled: false,
  provider: 'mailgun',
  mailgunApiKey: '',
  mailgunDomain: '',
  mailgunRegion: 'us',
  mailgunHost: '',
  dmFromEmail: '',
  dmFromName: 'DocuMantra',
  defaultSenderMode: 'dm',
  userFallbackReplyTo: true,
  allowUserSmtpFallback: true,
});

async function getOrCreatePlatformEmailDoc() {
  let doc = await PlatformEmailConfig.findOne({ key: 'default' }).select('+mailgunApiKey');
  if (!doc) {
    doc = await PlatformEmailConfig.create(defaultConfig());
    doc = await PlatformEmailConfig.findById(doc._id).select('+mailgunApiKey');
  }
  return doc;
}

function maskSecret(secret) {
  if (!secret) return '';
  if (secret.length <= 4) return '••••';
  return `••••${secret.slice(-4)}`;
}

function resolveApiKey(doc) {
  if (doc?.mailgunApiKey) return doc.mailgunApiKey;
  return process.env.MAILGUN_API_KEY || '';
}

function resolveDomain(doc) {
  if (doc?.mailgunDomain) return doc.mailgunDomain;
  return process.env.MAILGUN_DOMAIN || '';
}

function resolveDmFromEmail(doc) {
  if (doc?.dmFromEmail) return doc.dmFromEmail;
  const envFrom = process.env.MAILGUN_FROM || process.env.EMAIL_FROM || '';
  const match = envFrom.match(/<([^>]+)>/);
  return match ? match[1] : envFrom;
}

function resolveDmFromName(doc) {
  const raw = doc?.dmFromName || process.env.EMAIL_FROM_NAME || process.env.APP_NAME || '';
  return raw ? normalizeBrandName(raw) : getBrandName();
}

function buildMailgunEnv(doc) {
  const region = doc?.mailgunRegion || process.env.MAILGUN_REGION || 'us';
  const dmEmail = resolveDmFromEmail(doc);
  const dmName = resolveDmFromName(doc);
  return {
    EMAIL_PROVIDER: 'mailgun',
    MAILGUN_API_KEY: resolveApiKey(doc),
    MAILGUN_DOMAIN: resolveDomain(doc),
    MAILGUN_FROM: dmEmail ? `"${dmName}" <${dmEmail}>` : '',
    MAILGUN_REGION: region,
    MAILGUN_HOST: doc?.mailgunHost || process.env.MAILGUN_HOST || '',
    MAILGUN_DISABLED: doc?.enabled === false && !resolveApiKey(doc) ? 'true' : 'false',
  };
}

function isPlatformMailgunReady(doc) {
  const env = buildMailgunEnv(doc);
  const { isMailgunConfigured } = require('@draftnsign/email-lib');
  return Boolean(doc?.enabled) && isMailgunConfigured(env);
}

async function refreshPlatformEmailCache() {
  const doc = await getOrCreatePlatformEmailDoc();
  cachedConfig = doc.toObject();
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return cachedConfig;
}

async function getEffectivePlatformEmailConfig() {
  if (!cachedConfig || Date.now() >= cacheExpiresAt) {
    await refreshPlatformEmailCache();
  }
  return cachedConfig;
}

async function getAdminPlatformEmailConfig() {
  const doc = await getOrCreatePlatformEmailDoc();
  const apiKey = resolveApiKey(doc);
  return {
    config: {
      key: doc.key,
      enabled: Boolean(doc.enabled),
      provider: doc.provider,
      mailgunDomain: doc.mailgunDomain || resolveDomain(doc),
      mailgunRegion: doc.mailgunRegion || 'us',
      mailgunHost: doc.mailgunHost || '',
      dmFromEmail: resolveDmFromEmail(doc),
      dmFromName: resolveDmFromName(doc),
      defaultSenderMode: doc.defaultSenderMode || 'dm',
      userFallbackReplyTo: doc.userFallbackReplyTo !== false,
      allowUserSmtpFallback: doc.allowUserSmtpFallback !== false,
      apiKeySet: Boolean(apiKey),
      apiKeyMasked: maskSecret(apiKey),
      ready: isPlatformMailgunReady(doc),
      updatedAt: doc.updatedAt,
    },
    hints: {
      mailgunDashboard: 'https://app.mailgun.com/app/sending/domains',
      setup: [
        'Create a Mailgun account and verify your sending domain (e.g. mg.documantra.in).',
        'Copy the API key and domain into the fields below.',
        'Set DM From Email to an address on your verified domain (e.g. noreply@mg.documantra.in).',
        'For user emails: users configure From Name / From Email in Account → Email Configuration; Mailgun sends with that identity when Sender Mode = User.',
        'If user has no from-email, platform uses DM address with Reply-To set to the user email.',
      ],
    },
  };
}

module.exports = {
  defaultConfig,
  getOrCreatePlatformEmailDoc,
  refreshPlatformEmailCache,
  getEffectivePlatformEmailConfig,
  getAdminPlatformEmailConfig,
  buildMailgunEnv,
  isPlatformMailgunReady,
  resolveApiKey,
  resolveDomain,
  resolveDmFromEmail,
  resolveDmFromName,
  maskSecret,
};
