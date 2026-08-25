#!/usr/bin/env node
/**
 * One-shot live VSign fix for esp.documantra.in server.
 * - Ensures live.env + .env docker vars
 * - Auto-discovers PKCS12 alias via keytool
 * - Patches Mongo VSignConfig (callback + creds)
 * - Probes utility gettxnref from host
 *
 * Run ON THE HOST (not inside Docker):
 *   cd Backend/services/e-sign-service
 *   node scripts/fix-vsign-live-production.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execFileSync } = require('child_process');
const axios = require('axios');
const mongoose = require('mongoose');
const VSignConfig = require('../models/VSignConfig');

const serviceRoot = path.join(__dirname, '..');
const envPath = path.join(serviceRoot, '.env');
const secretsDir = path.join(serviceRoot, 'config', 'vsign', 'secrets');
const liveEnvPath = path.join(secretsDir, 'live.env');
const pfxPath = path.join(serviceRoot, 'uploads', 'vSign', 'signCertificate.pfx');

const PRODUCTION_CALLBACK =
  'https://esp.documantra.in/esign/api/e-sign/public/v-sign/response';

const REQUIRED_ENV = {
  VSIGN_ENV: 'production',
  VSIGN_CERT_MODE: 'live',
  VSIGN_ACTIVE_PROFILE: 'live',
  ASP_ID: 'IIPL001',
  VSIGN_AUTHPAGE: 'https://esign.verasys.in/esp',
  VSIGN_ESP_RESPONSE_URL: 'https://esign.verasys.in/esign/2.1/signature',
  VSIGN_CALLBACK_URL: PRODUCTION_CALLBACK,
  UTILITY_URL: 'http://172.17.0.1:7078',
  VSIGN_HOST_PATH_PREFIX: '/root/Draft-and-Sign/Backend/services/e-sign-service',
  VSIGN_DOCKER_PATH_PREFIX: '/app/services/e-sign-service',
  PFX_PATH: 'uploads/vSign/signCertificate.pfx',
};

function upsertEnvLine(text, key, value) {
  const re = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (re.test(text)) return text.replace(re, line);
  return `${text.trim()}\n${line}\n`;
}

function loadLiveSecrets() {
  if (!fs.existsSync(liveEnvPath)) return {};
  try {
    return dotenv.parse(fs.readFileSync(liveEnvPath));
  } catch {
    return {};
  }
}

function discoverAlias(password) {
  const out = execFileSync(
    'keytool',
    ['-list', '-keystore', pfxPath, '-storetype', 'PKCS12', '-storepass', password],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const line = out.split('\n').find((l) => /, \d{4}-\d{2}-\d{2},/.test(l));
  if (!line) throw new Error('keytool did not return an alias line');
  return line.split(',')[0].trim();
}

function pickSamplePdf() {
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return null;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory() && name !== 'vSign') {
        const nested = walk(full);
        if (nested) return nested;
      } else if (name.toLowerCase().endsWith('.pdf')) {
        return full;
      }
    }
    return null;
  };
  return walk(path.join(serviceRoot, 'uploads'));
}

async function probeUtility(password, alias) {
  const pdf = pickSamplePdf();
  if (!pdf) return { skipped: true, reason: 'no sample PDF in uploads/' };

  const utilityUrl = (process.env.UTILITY_URL || REQUIRED_ENV.UTILITY_URL).replace(/\/+$/, '');
  const hostRoot = process.env.VSIGN_HOST_PATH_PREFIX || REQUIRED_ENV.VSIGN_HOST_PATH_PREFIX;
  const txn = `fix-live-${Date.now()}`;
  const signedDir = path.join(hostRoot, 'uploads/signed/fix-live');
  fs.mkdirSync(signedDir, { recursive: true });
  fs.mkdirSync(path.join(hostRoot, 'uploads/vSignTemp'), { recursive: true });

  const payload = {
    signedPdfPath: signedDir.replace(/\\/g, '/'),
    tempInfoPath: path.join(hostRoot, 'uploads/vSignTemp').replace(/\\/g, '/'),
    pdfDestinationPath: path.join(signedDir, `${txn}.pdf`).replace(/\\/g, '/'),
    responseUrl: PRODUCTION_CALLBACK,
    redirectUrl: PRODUCTION_CALLBACK,
    txn,
    aspId: process.env.ASP_ID || REQUIRED_ENV.ASP_ID,
    pfxPath: path.join(hostRoot, 'uploads/vSign/signCertificate.pfx').replace(/\\/g, '/'),
    pfxPassword: password,
    pfxAlias: alias,
    signingAlgorithm: 'RSA',
    maxWaitPeriod: '1440',
    ver: '21',
    AuthMode: '1',
    fileType: 'path',
    isresponseXML: '0',
    isrequestXML: '1',
    pdfdetails: [{
      pdfbase64val: pdf.replace(/\\/g, '/'),
      docInfo: 'fix-live.pdf',
      signaturedetailsType: 'signaturedetailsString',
      signaturedetailsString: '1-120,450,250,60',
    }],
  };

  try {
    const res = await axios.post(`${utilityUrl}/gettxnrefv4_1`, payload, { timeout: 90000 });
    const data = res.data;
    const empty = !data || (typeof data === 'object' && Object.keys(data).length === 0);
    return {
      ok: !empty && (data?.status == 1 || data?.status == '1'),
      empty,
      status: data?.status,
      txnref: data?.txnref || null,
      errorMessage: data?.errorMessage || data?.message || null,
      utilityUrl,
    };
  } catch (err) {
    return {
      ok: false,
      httpError: err.message,
      utilityUrl,
    };
  }
}

async function main() {
  console.log('=== VSign live production fix ===\n');

  if (!fs.existsSync(pfxPath)) {
    console.error('Missing live PFX:', pfxPath);
    console.error('Copy dmsignaturekey.pfx → uploads/vSign/signCertificate.pfx');
    process.exit(1);
  }

  fs.mkdirSync(secretsDir, { recursive: true });
  const liveSecrets = loadLiveSecrets();
  let password = (liveSecrets.PFX_PASSWORD || process.env.PFX_PASSWORD || '').trim();
  let alias = (liveSecrets.PFX_ALIAS || process.env.PFX_ALIAS || '')
    .trim()
    .replace(/^"|"$/g, '');

  if (!password) {
    console.error('Set PFX_PASSWORD in config/vsign/secrets/live.env first, e.g.:');
    console.error('  PFX_PASSWORD=your_live_pfx_password');
    process.exit(1);
  }

  try {
    const discovered = discoverAlias(password);
    if (!alias || alias !== discovered) {
      console.log(`PFX alias from keytool: "${discovered}"`);
      if (alias && alias !== discovered) {
        console.log(`(was "${alias}" — updating to keytool value)`);
      }
      alias = discovered;
    } else {
      console.log(`PFX alias OK: "${alias}"`);
    }
  } catch (err) {
    console.error('Could not unlock PFX — wrong PFX_PASSWORD in live.env');
    if (err.stderr) console.error(String(err.stderr).trim());
    process.exit(1);
  }

  fs.writeFileSync(
    liveEnvPath,
    `# Live signing credentials — never commit\nPFX_PASSWORD=${password}\nPFX_ALIAS=${alias}\n`,
  );
  console.log('Updated', liveEnvPath);

  let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    envText = upsertEnvLine(envText, key, value);
  }
  envText = upsertEnvLine(envText, 'PFX_PASSWORD', password);
  envText = upsertEnvLine(envText, 'PFX_ALIAS', alias);
  fs.writeFileSync(envPath, envText);
  console.log('Updated .env (docker path mapping + production callback)');

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  await VSignConfig.updateOne(
    { key: 'default' },
    {
      $set: {
        pfxPassword: password,
        pfxAlias: alias,
        aspId: REQUIRED_ENV.ASP_ID,
        vsignEnv: 'production',
        certMode: 'live',
        vsignCallbackUrl: PRODUCTION_CALLBACK,
        vsignAuthPage: REQUIRED_ENV.VSIGN_AUTHPAGE,
        vsignEspResponseUrl: REQUIRED_ENV.VSIGN_ESP_RESPONSE_URL,
        utilityUrl: REQUIRED_ENV.UTILITY_URL,
        enabled: true,
      },
    },
    { upsert: true },
  );
  await mongoose.disconnect();
  console.log('Mongo VSignConfig patched');

  dotenv.config({ path: envPath, override: true });
  const probe = await probeUtility(password, alias);
  console.log('\nUtility probe:', JSON.stringify(probe, null, 2));

  if (!probe.ok) {
    console.error('\nUtility still failing. Check:');
    console.error('  systemctl status vsign-utility   # or JAR on port 7078');
    console.error('  curl -s http://127.0.0.1:7078/');
    process.exit(1);
  }

  console.log('\nOK — restart e-sign-service then test a NEW envelope:');
  console.log('  cd /root/Draft-and-Sign/Backend && docker compose restart e-sign-service');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
