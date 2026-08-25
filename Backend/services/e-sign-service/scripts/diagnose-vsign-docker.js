#!/usr/bin/env node
/**
 * VSign readiness audit for Docker e-sign → host utility.
 * Safe: does not print PFX password.
 *
 *   docker compose exec e-sign-service node scripts/diagnose-vsign-docker.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const VSignConfig = require('../models/VSignConfig');
const { refreshVSignConfigCache, getPublicVSignStatus } = require('../utils/vsignConfigPolicy');
const {
  resolveVSignPfxPath,
  resolveVSignPfxCredentials,
  resolveVSignUtilityUrl,
  toHostUtilityPath,
  normalizeVSignPath,
} = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');

function fileInfo(absPath) {
  try {
    if (!absPath || !fs.existsSync(absPath)) {
      return { exists: false, path: absPath, size: 0 };
    }
    const st = fs.statSync(absPath);
    return { exists: true, path: absPath, size: st.size };
  } catch (err) {
    return { exists: false, path: absPath, size: 0, error: err.message };
  }
}

function maskAlias(alias) {
  const s = String(alias || '');
  if (!s) return '(empty)';
  if (s.length <= 8) return `${s.slice(0, 2)}…${s.slice(-2)}`;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

async function probeUtility(payload) {
  const utilityUrl = resolveVSignUtilityUrl();
  try {
    const res = await axios.post(`${utilityUrl}/gettxnrefv4_1`, payload, { timeout: 60000 });
    const data = res.data;
    const empty = !data || (typeof data === 'object' && Object.keys(data).length === 0);
    return {
      ok: !empty && (data?.status == 1 || data?.status == '1'),
      httpStatus: res.status,
      empty,
      status: data?.status,
      txnref: data?.txnref || null,
      errorCode: data?.errorCode || data?.errorcode || null,
      errorMessage: data?.errorMessage || data?.message || null,
      keys: data && typeof data === 'object' ? Object.keys(data) : [],
    };
  } catch (err) {
    return {
      ok: false,
      httpError: err.message,
      response: err.response?.data || null,
    };
  }
}

async function main() {
  await refreshVSignConfigCache();
  const cred = resolveVSignPfxCredentials(serviceRoot);
  const containerPfx = resolveVSignPfxPath(serviceRoot);
  const hostPfx = toHostUtilityPath(containerPfx);
  const publicStatus = getPublicVSignStatus();

  let mongo = null;
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (uri) {
      await mongoose.connect(uri);
      mongo = await VSignConfig.findOne({ key: 'default' }).select('+pfxPassword +pfxAlias');
    }
  } catch (err) {
    mongo = { connectError: err.message };
  }

  const hostPrefix = (process.env.VSIGN_HOST_PATH_PREFIX || '').trim();
  const dockerPrefix = (process.env.VSIGN_DOCKER_PATH_PREFIX || '/app/services/e-sign-service').trim();
  const utilityUrl = resolveVSignUtilityUrl();

  const report = {
    timestamp: new Date().toISOString(),
    dockerPathMapping: {
      VSIGN_HOST_PATH_PREFIX: hostPrefix || '(NOT SET — utility likely gets wrong PFX path)',
      VSIGN_DOCKER_PATH_PREFIX: dockerPrefix,
      containerPfxPath: containerPfx,
      hostPfxPathSentToUtility: hostPfx,
      pathsMatch: containerPfx === hostPfx,
    },
    utility: {
      url: utilityUrl,
      reachableFromContainer: null,
    },
    credentials: {
      alias: maskAlias(cred.alias),
      aliasLength: String(cred.alias || '').length,
      passwordSet: Boolean(cred.password),
      passwordLength: String(cred.password || '').length,
      usesLiveCert: cred.usesLiveCert,
      mongoAlias: mongo?.pfxAlias ? maskAlias(mongo.pfxAlias) : null,
      mongoPasswordSet: mongo?.pfxPassword ? true : false,
    },
    files: {
      containerPfx: fileInfo(containerPfx),
      hostMappedPfx: fileInfo(hostPfx),
    },
    publicStatus,
    mongoSummary: mongo && !mongo.connectError ? {
      enabled: mongo.enabled,
      aspId: mongo.aspId,
      certMode: mongo.certMode,
      vsignEnv: mongo.vsignEnv,
      utilityUrl: mongo.utilityUrl,
    } : mongo,
  };

  // Pick any PDF for a minimal gettxnref probe
  const uploads = path.join(serviceRoot, 'uploads');
  const findPdf = (dir) => {
    if (!fs.existsSync(dir)) return null;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory() && name !== 'vSign') {
        const nested = findPdf(full);
        if (nested) return nested;
      } else if (name.toLowerCase().endsWith('.pdf')) {
        return full;
      }
    }
    return null;
  };
  const samplePdf = findPdf(uploads);

  if (samplePdf && cred.password && cred.alias) {
    const txn = `diag-${Date.now()}`;
    const signedDir = path.join(uploads, 'signed', 'diag-docker');
    fs.mkdirSync(signedDir, { recursive: true });
    const payload = {
      signedPdfPath: toHostUtilityPath(normalizeVSignPath(signedDir)),
      tempInfoPath: toHostUtilityPath(normalizeVSignPath(path.join(uploads, 'vSignTemp'))),
      pdfDestinationPath: toHostUtilityPath(normalizeVSignPath(path.join(signedDir, `${txn}.pdf`))),
      responseUrl: 'https://esp.documantra.in/esign/api/e-sign/public/v-sign/response',
      redirectUrl: 'https://esp.documantra.in/esign/api/e-sign/public/v-sign/response',
      txn,
      aspId: mongo?.aspId || process.env.ASP_ID || 'IIPL001',
      pfxPath: hostPfx,
      pfxPassword: cred.password,
      pfxAlias: cred.alias,
      signingAlgorithm: 'RSA',
      maxWaitPeriod: '1440',
      ver: '21',
      AuthMode: '1',
      fileType: 'path',
      isresponseXML: '0',
      isrequestXML: '1',
      pdfdetails: [{
        pdfbase64val: toHostUtilityPath(normalizeVSignPath(samplePdf)),
        docInfo: 'diag.pdf',
        signaturedetailsType: 'signaturedetailsString',
        signaturedetailsString: '1-120,450,250,60',
      }],
    };
    report.utilityProbe = await probeUtility(payload);
  } else {
    report.utilityProbe = { skipped: true, reason: 'Missing PDF sample or PFX credentials' };
  }

  const issues = [];
  if (!hostPrefix) {
    issues.push(
      'Set VSIGN_HOST_PATH_PREFIX=/root/Draft-and-Sign/Backend/services/e-sign-service in e-sign .env (Docker → host utility path mapping).',
    );
  }
  if (!cred.password || !cred.alias) {
    issues.push('PFX password or alias missing — fix in /e-sign/admin/vsign or config/vsign/secrets/live.env + patch-live-mongo-creds.js');
  }
  if (!report.files.containerPfx.exists) {
    issues.push('signCertificate.pfx missing at uploads/vSign/signCertificate.pfx');
  }
  if (report.utilityProbe?.empty) {
    issues.push(
      hostPrefix
        ? 'Utility returned empty response (HTTP 200). Check utility/esignutility.log for NullPointerException during PDF hash — often Java keystore/cert chain issue with live PFX, not wrong password. Restart Verasays JAR on Java 8 and retest from host: node scripts/verify-vsign-live-host.js'
        : 'Utility returned empty response — most often missing VSIGN_HOST_PATH_PREFIX (utility cannot read /app/... paths on host).',
    );
  }
  if (report.utilityProbe?.httpError) {
    issues.push(`Cannot reach utility at ${utilityUrl} from container — set UTILITY_URL=http://172.17.0.1:7078 (or host IP).`);
  }
  report.issues = issues;
  report.fixHint = issues.length
    ? 'After fixing .env: docker compose restart e-sign-service && create a NEW envelope.'
    : 'Configuration looks OK — create a new envelope and retry Sign.';

  console.log(JSON.stringify(report, null, 2));

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  process.exitCode = issues.length ? 1 : 0;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
