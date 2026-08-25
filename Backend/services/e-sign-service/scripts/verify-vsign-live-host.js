#!/usr/bin/env node
/**
 * Run ON THE HOST (not inside Docker): tests live PFX against local JAR on 7078.
 * Does not print the password.
 *
 *   cd Backend/services/e-sign-service
 *   node scripts/verify-vsign-live-host.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

const serviceRoot = path.join(__dirname, '..');
const liveEnvPath = path.join(serviceRoot, 'config', 'vsign', 'secrets', 'live.env');
if (fs.existsSync(liveEnvPath)) {
  Object.assign(process.env, dotenv.parse(fs.readFileSync(liveEnvPath)));
}

const HOST_ROOT = process.env.VSIGN_HOST_PATH_PREFIX
  || '/root/Draft-and-Sign/Backend/services/e-sign-service';
const pfxPath = path.join(HOST_ROOT, 'uploads/vSign/signCertificate.pfx');
const password = (process.env.PFX_PASSWORD || '').trim();
const alias = (process.env.PFX_ALIAS || 'arun dixit').trim().replace(/^"|"$/g, '');
const aspId = process.env.ASP_ID || 'IIPL001';
const utilityUrl = (process.env.UTILITY_URL || 'http://127.0.0.1:7078').replace(/\/+$/, '');

function pickPdf() {
  const prepared = path.join(HOST_ROOT, 'uploads/prepared');
  const uploads = path.join(HOST_ROOT, 'uploads');
  const candidates = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory() && name !== 'vSign' && name !== 'signed' && name !== 'vSignTemp') {
        walk(full);
      } else if (name.toLowerCase().endsWith('.pdf')) {
        candidates.push(full);
      }
    }
  };
  if (fs.existsSync(prepared)) walk(prepared);
  walk(uploads);
  // Prefer paths without spaces (Verasys NPE risk on spaced file paths)
  const noSpace = candidates.find((p) => !/\s/.test(p));
  return noSpace || candidates[0] || null;
}

async function main() {
  const pdf = pickPdf();
  console.log(JSON.stringify({
    pfxExists: fs.existsSync(pfxPath),
    pfxPath,
    alias,
    aspId,
    utilityUrl,
    pdf: pdf || null,
    pdfExists: Boolean(pdf && fs.existsSync(pdf)),
  }, null, 2));

  if (!fs.existsSync(pfxPath) || !pdf || !password || !alias) {
    console.error('Missing PFX, PDF, PFX_PASSWORD, or PFX_ALIAS');
    process.exit(1);
  }

  const txn = `live-host-${Date.now()}`;
  const signedDir = path.join(HOST_ROOT, 'uploads/signed/live-host-verify');
  fs.mkdirSync(signedDir, { recursive: true });
  fs.mkdirSync(path.join(HOST_ROOT, 'uploads/vSignTemp'), { recursive: true });

  const tickPath = path.join(HOST_ROOT, 'utility/tick.png');
  const payload = {
    signedPdfPath: signedDir.replace(/\\/g, '/'),
    tempInfoPath: path.join(HOST_ROOT, 'uploads/vSignTemp').replace(/\\/g, '/'),
    pdfDestinationPath: path.join(signedDir, `${txn}.pdf`).replace(/\\/g, '/'),
    responseUrl: 'https://esp.documantra.in/esign/api/e-sign/public/v-sign/response',
    redirectUrl: 'https://esp.documantra.in/esign/api/e-sign/public/v-sign/response',
    txn,
    aspId,
    pfxPath: pfxPath.replace(/\\/g, '/'),
    pfxPassword: password,
    pfxAlias: alias,
    signingAlgorithm: 'RSA',
    maxWaitPeriod: '1440',
    ver: '21',
    AuthMode: '1',
    fileType: 'path',
    isresponseXML: '1',
    isrequestXML: '1',
    signatureFontSize: '10',
    pdfdetails: [{
      pdfbase64val: pdf.replace(/\\/g, '/'),
      docInfo: 'live-host-verify.pdf',
      docUrl: '',
      reason: '',
      signaturedetailsType: 'signaturedetailsString',
      signaturedetailsString: '1-100,100,280,88',
    }],
  };
  if (fs.existsSync(tickPath)) {
    payload.tickImgPath = tickPath.replace(/\\/g, '/');
  }

  try {
    const res = await axios.post(`${utilityUrl}/gettxnrefv4_1`, payload, { timeout: 60000 });
    const data = res.data;
    console.log(JSON.stringify({
      ok: data?.status == 1 || data?.status == '1',
      httpStatus: res.status,
      type: typeof data,
      keys: data && typeof data === 'object' ? Object.keys(data) : [],
      status: data?.status,
      txnref: data?.txnref || null,
      errorCode: data?.errorCode || data?.errorcode || null,
      errorMessage: data?.errorMessage || data?.error || data?.message || null,
      preview: typeof data === 'string' ? data.slice(0, 800) : JSON.stringify(data || {}).slice(0, 800),
    }, null, 2));
  } catch (err) {
    console.error(JSON.stringify({
      ok: false,
      error: err.message,
      data: err.response?.data || null,
    }, null, 2));
    process.exit(1);
  }
}

main();
