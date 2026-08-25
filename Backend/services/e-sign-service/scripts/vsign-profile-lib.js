/**
 * Shared helpers: load VSign UAT/live profiles and apply to .env + MongoDB + utility.
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const VSignConfig = require('../models/VSignConfig');
const { patchUtilityEspUrls } = require('./vsign-utility-props');
const {
  buildVSignAuthDataString,
  encodeVSignAuthDataSegment,
} = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');
const configRoot = path.join(serviceRoot, 'config', 'vsign');
const envPath = path.join(serviceRoot, '.env');

const VSIGN_ENV_KEYS = [
  'VSIGN_ACTIVE_PROFILE',
  'VSIGN_ENV',
  'VSIGN_CERT_MODE',
  'ASP_ID',
  'VSIGN_AUTHPAGE',
  'VSIGN_AUTH_LOGO_URL',
  'VSIGN_ESP_RESPONSE_URL',
  'VSIGN_CALLBACK_URL',
  'UTILITY_URL',
  'PFX_PATH',
  'PFX_PASSWORD',
  'PFX_ALIAS',
  'DM_ENCRYPTION_KEY_PATH',
  'VSIGN_USE_JAR',
  'VSIGN_APPEARANCE_MODE',
  'VSIGN_SIGNATURE_FONT_SIZE',
];

function profilePath(name) {
  return path.join(configRoot, 'profiles', `${name}.json`);
}

function secretsPath(name) {
  return path.join(configRoot, 'secrets', `${name}.env`);
}

function loadProfile(name) {
  const file = profilePath(name);
  if (!fs.existsSync(file)) {
    throw new Error(`Profile not found: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadSecrets(name) {
  const file = secretsPath(name);
  if (!fs.existsSync(file)) return {};
  return dotenv.parse(fs.readFileSync(file));
}

function readActiveProfile() {
  const file = path.join(configRoot, 'active.profile');
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8').trim().toLowerCase() || null;
}

function writeActiveProfile(name) {
  fs.mkdirSync(configRoot, { recursive: true });
  fs.writeFileSync(path.join(configRoot, 'active.profile'), `${name}\n`);
}

function readTunnelUrl() {
  const file = path.join(configRoot, 'tunnel.url');
  if (!fs.existsSync(file)) return '';
  return fs.readFileSync(file, 'utf8').trim().replace(/\/+$/, '');
}

function writeTunnelUrl(url) {
  if (!url) return;
  fs.mkdirSync(configRoot, { recursive: true });
  fs.writeFileSync(path.join(configRoot, 'tunnel.url'), `${url.replace(/\/+$/, '')}\n`);
}

function upsertEnv(key, value) {
  let text = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const re = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (re.test(text)) text = text.replace(re, line);
  else text = `${text.trim()}\n${line}\n`;
  fs.writeFileSync(envPath, text);
}

function removeEnv(key) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  const re = new RegExp(`^${key}=`);
  fs.writeFileSync(envPath, lines.filter((line) => !re.test(line)).join('\n'));
}

function clearTunnelUrl() {
  const file = path.join(configRoot, 'tunnel.url');
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

function resolveCallbackUrl(profile, tunnelBase) {
  const tunnelExplicit = Boolean(tunnelBase && String(tunnelBase).trim());
  // Live without explicit tunnel → production callback (ignore stale tunnel.url from local tests).
  if (profile.name === 'live' && !tunnelExplicit) {
    return profile.productionCallbackUrl || profile.localCallbackUrl;
  }
  const tunnel = (tunnelExplicit ? tunnelBase : readTunnelUrl() || '').replace(/\/+$/, '');
  if (tunnel.startsWith('https://')) {
    return `${tunnel}/api/e-sign/public/v-sign/response`;
  }
  if (profile.productionCallbackUrl && profile.name === 'live') {
    return profile.productionCallbackUrl;
  }
  return profile.localCallbackUrl;
}

function buildEnvValues(profile, secrets, callbackUrl) {
  const values = {
    VSIGN_ACTIVE_PROFILE: profile.name,
    VSIGN_ENV: profile.vsignEnv,
    VSIGN_CERT_MODE: profile.certMode,
    ASP_ID: profile.aspId,
    VSIGN_AUTHPAGE: profile.vsignAuthPage,
    VSIGN_AUTH_LOGO_URL: profile.vsignAuthLogoUrl || '',
    VSIGN_ESP_RESPONSE_URL: profile.vsignEspResponseUrl,
    VSIGN_CALLBACK_URL: callbackUrl,
    UTILITY_URL: profile.utilityUrl,
    PFX_PATH: profile.pfxPath,
    DM_ENCRYPTION_KEY_PATH: profile.dmEncryptionKeyPath,
    VSIGN_USE_JAR: profile.vsignUseJar || '1',
    VSIGN_APPEARANCE_MODE: profile.vsignAppearanceMode || 'custom-tick',
    VSIGN_SIGNATURE_FONT_SIZE: profile.vsignSignatureFontSize || '10',
  };

  if (profile.useKitPfxDefaults) {
    values._removePfxSecrets = true;
  } else {
    values.PFX_PASSWORD = secrets.PFX_PASSWORD || '';
    values.PFX_ALIAS = secrets.PFX_ALIAS || '';
    if (!values.PFX_PASSWORD || !values.PFX_ALIAS) {
      throw new Error(
        `Live profile requires config/vsign/secrets/live.env with PFX_PASSWORD and PFX_ALIAS`,
      );
    }
  }

  return values;
}

function applyToDotEnv(values) {
  if (values._removePfxSecrets) {
    removeEnv('PFX_PASSWORD');
    removeEnv('PFX_ALIAS');
    delete values._removePfxSecrets;
  }
  for (const key of VSIGN_ENV_KEYS) {
    if (values[key] !== undefined && values[key] !== '') {
      upsertEnv(key, values[key]);
    }
  }
}

function fileExists(relativePath) {
  const abs = path.join(serviceRoot, relativePath);
  return fs.existsSync(abs);
}

function buildMongoPatch(profile, secrets, callbackUrl) {
  const patch = {
    vsignEnv: profile.vsignEnv,
    certMode: profile.certMode,
    aspId: profile.aspId,
    vsignAuthPage: profile.vsignAuthPage,
    vsignAuthLogoUrl: '',
    vsignEspResponseUrl: profile.vsignEspResponseUrl,
    vsignCallbackUrl: callbackUrl,
    utilityUrl: profile.utilityUrl,
    pfxPath: profile.pfxPath,
    publicCertPath: profile.publicCertPath,
    dmEncryptionKeyPath: profile.dmEncryptionKeyPath,
    useJar: profile.vsignUseJar !== '0',
    appearanceMode: profile.vsignAppearanceMode || 'custom-tick',
    signatureFontSize: profile.vsignSignatureFontSize || '10',
  };

  if (profile.useKitPfxDefaults) {
    patch._unsetPfxSecrets = true;
  } else {
    patch.pfxPassword = (secrets.PFX_PASSWORD || '').trim();
    patch.pfxAlias = (secrets.PFX_ALIAS || '').trim().replace(/^"|"$/g, '');
  }

  return patch;
}

async function applyToMongo(profile, secrets, callbackUrl) {
  require('dotenv').config({ path: envPath });
  const patch = buildMongoPatch(profile, secrets, callbackUrl);
  const unset = patch._unsetPfxSecrets ? { pfxPassword: '', pfxAlias: '' } : null;
  delete patch._unsetPfxSecrets;

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const update = { $set: patch };
  if (unset) update.$unset = unset;
  const doc = await VSignConfig.findOneAndUpdate({ key: 'default' }, update, {
    new: true,
    upsert: true,
  }).select('+pfxPassword +pfxAlias');
  await mongoose.disconnect();
  return doc;
}

function buildUatAuthExample(profile) {
  if (profile.name !== 'uat') return null;
  const authData = buildVSignAuthDataString({
    logoUrl: profile.vsignAuthLogoUrl,
    aadhaarNumber: '999999999999',
  });
  return {
    authDataExample: authData,
    authUrlExample: `${profile.vsignAuthPage}/${encodeVSignAuthDataSegment(authData)}/authpagev4`,
  };
}

async function switchProfile(profileName, tunnelBase = '') {
  const name = String(profileName || '').trim().toLowerCase();
  if (!['uat', 'live'].includes(name)) {
    throw new Error('Profile must be "uat" or "live"');
  }

  const profile = loadProfile(name);
  const secrets = loadSecrets(name);
  if (tunnelBase) {
    writeTunnelUrl(tunnelBase);
  } else if (name === 'live') {
    clearTunnelUrl();
  }

  const callbackUrl = resolveCallbackUrl(profile, tunnelBase);
  const envValues = buildEnvValues(profile, secrets, callbackUrl);
  applyToDotEnv(envValues);

  const utilityPropsPath = patchUtilityEspUrls(profile.utilityEspMode);
  const doc = await applyToMongo(profile, secrets, callbackUrl);
  writeActiveProfile(name);

  const readiness = [];
  if (!fileExists(profile.pfxPath)) {
    readiness.push(`Missing PFX: ${profile.pfxPath}`);
  }
  if (name === 'uat' && !fileExists(profile.publicCertPath)) {
    readiness.push(`Optional UAT public cert missing: ${profile.publicCertPath}`);
  }

  return {
    switchedTo: name,
    label: profile.label,
    aspId: doc.aspId,
    vsignEnv: doc.vsignEnv,
    certMode: doc.certMode,
    authPage: doc.vsignAuthPage,
    authLogoUrl: doc.vsignAuthLogoUrl || null,
    espResponseUrl: doc.vsignEspResponseUrl,
    callbackUrl: doc.vsignCallbackUrl,
    utilityUrl: doc.utilityUrl,
    utilityEspProps: utilityPropsPath,
    pfxPath: profile.pfxPath,
    pfxPresent: fileExists(profile.pfxPath),
    enabled: doc.enabled,
    readinessIssues: readiness,
    ...buildUatAuthExample(profile),
    nextSteps: [
      'Restart VSign utility JAR (utility/application.properties changed)',
      'Restart e-sign-service (nodemon may auto-restart on .env change)',
      name === 'uat'
        ? 'Place VSign UAT kit PFX at uploads/vSign/signCertificate.uat.pfx if not present'
        : 'Live keys stay at uploads/vSign/signCertificate.pfx — do not replace with UAT file',
    ],
  };
}

function status() {
  const active = readActiveProfile();
  const tunnel = readTunnelUrl();
  const profiles = ['uat', 'live'].map((name) => {
    const p = loadProfile(name);
    return {
      name,
      label: p.label,
      aspId: p.aspId,
      pfxPath: p.pfxPath,
      pfxPresent: fileExists(p.pfxPath),
    };
  });
  return { activeProfile: active, tunnelUrl: tunnel || null, profiles };
}

module.exports = {
  switchProfile,
  status,
  loadProfile,
  readActiveProfile,
  configRoot,
  serviceRoot,
};
