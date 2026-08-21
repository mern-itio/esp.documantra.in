#!/usr/bin/env node
/**
 * Test UAT PFX against ESP utility (gettxnrefv4_1). Does not log passwords.
 * Usage: node scripts/verify-vsign-uat-pfx.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {
  resolveVSignPfxPath,
  resolveVSignPfxCredentials,
  resolveVSignAspId,
  resolveVSignUtilityUrl,
  normalizeVSignPath,
} = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');
const samplePdf = path.join(
  serviceRoot,
  '..',
  '..',
  '..',
  'deploy',
  'docs',
  'asp-audit-annexures',
  'Annexure-A13-Sample-Signed-Document.pdf',
);

async function main() {
  const pfxPath = resolveVSignPfxPath(serviceRoot);
  const { password, alias, usesLiveCert } = resolveVSignPfxCredentials(serviceRoot);
  const aspId = resolveVSignAspId(serviceRoot);
  const pdf = fs.existsSync(samplePdf)
    ? samplePdf
    : path.join(serviceRoot, 'uploads', 'prepared', fs.readdirSync(path.join(serviceRoot, 'uploads', 'prepared'))[0]);

  if (!fs.existsSync(pfxPath.replace(/\//g, path.sep))) {
    console.error(JSON.stringify({ ok: false, error: `PFX missing: ${pfxPath}` }, null, 2));
    process.exit(1);
  }
  if (usesLiveCert) {
    console.error(JSON.stringify({ ok: false, error: 'Active profile is live — run switch-vsign-env uat first' }, null, 2));
    process.exit(1);
  }

  const txn = `verify-uat-${Date.now()}`;
  const payload = {
    signedPdfPath: normalizeVSignPath(path.join(serviceRoot, 'uploads', 'signed', 'verify-uat')),
    tempInfoPath: normalizeVSignPath(path.join(serviceRoot, 'uploads', 'vSignTemp')),
    pdfDestinationPath: normalizeVSignPath(path.join(serviceRoot, 'uploads', 'signed', 'verify-uat', `${txn}.pdf`)),
    responseUrl: 'http://127.0.0.1:2103/api/e-sign/public/v-sign/response',
    txn,
    aspId,
    pfxPath,
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
      pdfbase64val: normalizeVSignPath(pdf),
      docInfo: 'verify-uat.pdf',
      signaturedetailsType: 'signaturedetailsString',
      signaturedetailsString: '1-100,100,280,88',
    }],
  };

  fs.mkdirSync(path.join(serviceRoot, 'uploads', 'signed', 'verify-uat'), { recursive: true });

  let data;
  try {
    const res = await axios.post(`${resolveVSignUtilityUrl()}/gettxnrefv4_1`, payload, { timeout: 60000 });
    data = res.data;
  } catch (err) {
    console.log(JSON.stringify({
      ok: false,
      aspId,
      pfxPath,
      utilityUrl: resolveVSignUtilityUrl(),
      error: err.message,
      hint: 'Check utility log esignutility.log — "keystore password was incorrect" means wrong UAT PFX file',
    }, null, 2));
    process.exit(1);
  }

  const ok = data?.status == 1 || data?.status == '1';
  console.log(JSON.stringify({
    ok,
    aspId,
    pfxPath,
    utilityUrl: resolveVSignUtilityUrl(),
    status: data?.status,
    txnRef: data?.txnref || null,
    hint: ok ? 'UAT PFX OK — create new envelope and sign' : 'PFX wrong or ESP rejected — use VSign UAT kit signCertificate.pfx from onboarding email',
  }, null, 2));
  process.exit(ok ? 0 : 2);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
