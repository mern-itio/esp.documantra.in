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
  if (!doc) return { ...base, source: 'env' };
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
  };
}

function getCachedEffectiveConfig() {
  if (cachedConfig && Date.now() < cacheExpiresAt) {
    return cachedConfig;
  }
  return docToEffective(null);
}

async function refreshVSignConfigCache() {
  try {
    const doc = await getOrCreateVSignConfigDoc();
    cachedConfig = docToEffective(doc);
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
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
  return Boolean(cfg.enabled && cfg.aspId && isVSignPfxReady(cfg));
}

function getVSignReadinessIssues(cfg = getCachedEffectiveConfig()) {
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
  const doc = await getOrCreateVSignConfigDoc();
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
    pfxPresent: pfxAbs ? fs.existsSync(pfxAbs) : false,
    updatedAt: doc.updatedAt,
  };
}

function getPublicVSignStatus() {
  const cfg = getCachedEffectiveConfig();
  return {
    enabled: cfg.enabled,
    ready: isVSignEnabledAndReady(cfg),
    certMode: cfg.certMode,
    vsignEnv: cfg.vsignEnv,
    aspIdConfigured: Boolean(cfg.aspId),
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
  getVSignReadinessIssues,
  resolveAbsolutePath,
  resolveEspResponseUrl,
  isVSignPfxReady,
  maskSecret,
  docToEffective,
};
