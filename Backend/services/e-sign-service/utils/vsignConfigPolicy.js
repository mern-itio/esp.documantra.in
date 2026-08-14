const fs = require('fs');
const path = require('path');
const VSignConfig = require('../models/VSignConfig');

const serviceRoot = path.join(__dirname, '..');

let cachedConfig = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 30 * 1000;

function defaultConfig() {
  return {
    key: 'default',
    enabled: false,
    vsignEnv: 'uat',
    certMode: 'live',
    aspId: process.env.ASP_ID || 'IIPLUAT001',
    vsignAuthPage: process.env.VSIGN_AUTHPAGE || 'https://esignuat.vsign.in/esp',
    vsignCallbackUrl:
      process.env.VSIGN_CALLBACK_URL
      || 'https://esp.documantra.in/esign/api/e-sign/public/v-sign/response',
    vsignEspResponseUrl: process.env.VSIGN_ESP_RESPONSE_URL || '',
    utilityUrl: process.env.UTILITY_URL || 'http://127.0.0.1:7077',
    pfxPath: process.env.PFX_PATH || 'uploads/vSign/signCertificate.pfx',
    pfxPassword: process.env.PFX_PASSWORD || '',
    pfxAlias: process.env.PFX_ALIAS || '',
    publicCertPath: 'uploads/vSign/ITIO_PUBLIC_KEY.cer',
    dmEncryptionKeyPath: process.env.DM_ENCRYPTION_KEY_PATH || 'uploads/vSign/dm_encryption_key.pfx',
    dmEncryptionKeyPassword: '',
    appearanceMode: process.env.VSIGN_APPEARANCE_MODE || 'custom-tick',
    useJar: process.env.VSIGN_USE_JAR !== '0',
    signatureFontSize: process.env.VSIGN_SIGNATURE_FONT_SIZE || '10',
  };
}

async function getOrCreateVSignConfigDoc() {
  let doc = await VSignConfig.findOne({ key: 'default' }).select('+pfxPassword +dmEncryptionKeyPassword');
  if (!doc) {
    doc = await VSignConfig.create(defaultConfig());
    doc = await VSignConfig.findById(doc._id).select('+pfxPassword +dmEncryptionKeyPassword');
  }
  return doc;
}

function maskSecret(secret) {
  if (!secret) return '';
  if (secret.length <= 4) return '••••';
  return `••••${secret.slice(-4)}`;
}

function resolveAbsolutePath(relativeOrAbsolute) {
  const raw = String(relativeOrAbsolute || '').trim();
  if (!raw) return '';
  return path.isAbsolute(raw) ? raw : path.join(serviceRoot, raw);
}

function docToEffective(doc) {
  const base = defaultConfig();
  if (!doc) {
    return {
      ...base,
      enabled: false,
      source: 'legacy-env',
      adminConfigured: false,
    };
  }
  return {
    enabled: doc.enabled === true,
    vsignEnv: doc.vsignEnv || base.vsignEnv,
    certMode: doc.certMode || base.certMode,
    aspId: (doc.aspId || base.aspId || '').trim(),
    vsignAuthPage: (doc.vsignAuthPage || base.vsignAuthPage || '').replace(/\/+$/, ''),
    vsignCallbackUrl: (doc.vsignCallbackUrl || base.vsignCallbackUrl || '').trim(),
    vsignEspResponseUrl: (doc.vsignEspResponseUrl || '').trim(),
    utilityUrl: (doc.utilityUrl || base.utilityUrl || '').trim(),
    pfxPath: doc.pfxPath || base.pfxPath,
    pfxPassword: doc.pfxPassword || base.pfxPassword,
    pfxAlias: (doc.pfxAlias || base.pfxAlias || '').trim(),
    publicCertPath: doc.publicCertPath || base.publicCertPath,
    dmEncryptionKeyPath: doc.dmEncryptionKeyPath || base.dmEncryptionKeyPath,
    dmEncryptionKeyPassword: doc.dmEncryptionKeyPassword || '',
    appearanceMode: doc.appearanceMode || base.appearanceMode,
    useJar: doc.useJar !== false,
    signatureFontSize: doc.signatureFontSize || base.signatureFontSize,
    source: 'db',
    adminConfigured: true,
  };
}

function isLegacyEnvMode(cfg = getCachedEffectiveConfig()) {
  return cfg.source !== 'db' || !cfg.adminConfigured;
}

/** Pre-admin-deploy behaviour: .env + existing PFX on disk (production unchanged until admin enables). */
function legacyEnvVSignOperational(cfg = getCachedEffectiveConfig()) {
  if (!process.env.ASP_ID && !cfg.aspId) return false;
  const legacyCfg = { ...cfg, certMode: 'uat' };
  if (!legacyCfg.pfxPassword) legacyCfg.pfxPassword = process.env.PFX_PASSWORD || 'abc1234';
  if (!legacyCfg.pfxAlias) {
    legacyCfg.pfxAlias = process.env.PFX_ALIAS || '{05AE2E10-4F6D-41A6-9F83-4D0025CA28A0}';
  }
  return isVSignPfxReady(legacyCfg);
}

function qualifiesEnvelopeForVSign(envelopeMeta) {
  const isQualified =
    envelopeMeta?.signatureType === 'qualified'
    || String(envelopeMeta?.envelopetype || '').toLowerCase() === 'qualified';

  if (isLegacyEnvMode()) {
    if (process.env.NODE_ENV !== 'production' && process.env.ASP_ID) {
      return true;
    }
    return isQualified && legacyEnvVSignOperational();
  }

  return isVSignEnabledAndReady() && isQualified;
}

function getCachedEffectiveConfig() {
  if (cachedConfig && Date.now() < cacheExpiresAt) {
    return cachedConfig;
  }
  return docToEffective(null);
}

async function refreshVSignConfigCache() {
  try {
    const doc = await VSignConfig.findOne({ key: 'default' }).select('+pfxPassword +dmEncryptionKeyPassword');
    cachedConfig = docToEffective(doc);
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    if (isLegacyEnvMode(cachedConfig)) {
      console.log('[VSign] legacy env mode — production flow unchanged until admin enables VSign in settings');
    }
    return cachedConfig;
  } catch (err) {
    console.warn('[VSign] refreshVSignConfigCache failed:', err.message);
    cachedConfig = docToEffective(null);
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return cachedConfig;
  }
}

function resolveEspResponseUrl(cfg) {
  if (cfg.vsignEspResponseUrl) return cfg.vsignEspResponseUrl;
  const base = (cfg.vsignAuthPage || '').replace(/\/+$/, '');
  return base ? `${base}/2.1.1/aspesignresponse` : '';
}

function isVSignPfxReady(cfg) {
  const pfxAbs = resolveAbsolutePath(cfg.pfxPath);
  if (!pfxAbs || !fs.existsSync(pfxAbs)) return false;
  if (cfg.certMode === 'live') {
    return Boolean(cfg.pfxPassword && cfg.pfxAlias);
  }
  return Boolean(cfg.pfxPassword || cfg.pfxAlias);
}

function isVSignEnabledAndReady(cfg = getCachedEffectiveConfig()) {
  if (isLegacyEnvMode(cfg)) {
    return legacyEnvVSignOperational(cfg);
  }
  return Boolean(cfg.enabled && cfg.aspId && isVSignPfxReady(cfg));
}

function getVSignReadinessIssues(cfg = getCachedEffectiveConfig()) {
  if (isLegacyEnvMode(cfg)) {
    return legacyEnvVSignOperational(cfg) ? [] : ['Legacy env: ASP_ID or PFX not configured'];
  }
  const issues = [];
  if (!cfg.enabled) issues.push('VSign is disabled in admin settings');
  if (!cfg.aspId) issues.push('ASP ID is required');
  if (!resolveAbsolutePath(cfg.pfxPath) || !fs.existsSync(resolveAbsolutePath(cfg.pfxPath))) {
    issues.push('Signing PFX file is missing');
  }
  if (cfg.certMode === 'live' && !cfg.pfxPassword) issues.push('Live PFX password is required');
  if (cfg.certMode === 'live' && !cfg.pfxAlias) issues.push('Live PFX alias is required');
  if (!cfg.vsignCallbackUrl) issues.push('Callback URL is required');
  if (!cfg.utilityUrl) issues.push('ESP Utility URL is required');
  return issues;
}

async function getAdminVSignConfigPayload() {
  const doc = await VSignConfig.findOne({ key: 'default' }).select('+pfxPassword +dmEncryptionKeyPassword');
  const cfg = docToEffective(doc);
  const pfxAbs = resolveAbsolutePath(cfg.pfxPath);
  const publicCertAbs = resolveAbsolutePath(cfg.publicCertPath);
  const encAbs = resolveAbsolutePath(cfg.dmEncryptionKeyPath);
  return {
    enabled: cfg.enabled,
    vsignEnv: cfg.vsignEnv,
    certMode: cfg.certMode,
    aspId: cfg.aspId,
    vsignAuthPage: cfg.vsignAuthPage,
    vsignCallbackUrl: cfg.vsignCallbackUrl,
    vsignEspResponseUrl: resolveEspResponseUrl(cfg),
    utilityUrl: cfg.utilityUrl,
    pfxPath: cfg.pfxPath,
    pfxPasswordSet: Boolean(cfg.pfxPassword),
    pfxPasswordMasked: maskSecret(cfg.pfxPassword),
    pfxAlias: cfg.pfxAlias,
    publicCertPath: cfg.publicCertPath,
    publicCertPresent: publicCertAbs ? fs.existsSync(publicCertAbs) : false,
    dmEncryptionKeyPath: cfg.dmEncryptionKeyPath,
    dmEncryptionKeyPresent: encAbs ? fs.existsSync(encAbs) : false,
    dmEncryptionKeyPasswordSet: Boolean(cfg.dmEncryptionKeyPassword),
    appearanceMode: cfg.appearanceMode,
    useJar: cfg.useJar,
    signatureFontSize: cfg.signatureFontSize,
    ready: isVSignEnabledAndReady(cfg),
    readinessIssues: getVSignReadinessIssues(cfg),
    legacyMode: isLegacyEnvMode(cfg),
    pfxPresent: pfxAbs ? fs.existsSync(pfxAbs) : false,
    updatedAt: doc?.updatedAt || null,
  };
}

function getPublicVSignStatus() {
  const cfg = getCachedEffectiveConfig();
  const legacy = isLegacyEnvMode(cfg);
  const operational = isVSignEnabledAndReady(cfg);
  return {
    enabled: legacy ? operational : cfg.enabled,
    ready: operational,
    legacyMode: legacy,
    certMode: cfg.certMode,
    vsignEnv: cfg.vsignEnv,
    aspIdConfigured: Boolean(cfg.aspId || process.env.ASP_ID),
  };
}

module.exports = {
  serviceRoot,
  defaultConfig,
  getOrCreateVSignConfigDoc,
  refreshVSignConfigCache,
  getCachedEffectiveConfig,
  getAdminVSignConfigPayload,
  getPublicVSignStatus,
  isVSignEnabledAndReady,
  isLegacyEnvMode,
  qualifiesEnvelopeForVSign,
  legacyEnvVSignOperational,
  getVSignReadinessIssues,
  resolveAbsolutePath,
  resolveEspResponseUrl,
  isVSignPfxReady,
  maskSecret,
  docToEffective,
};
