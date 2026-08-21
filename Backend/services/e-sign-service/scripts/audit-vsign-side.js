/**
 * One-shot local-side VSign readiness audit (no secrets printed).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {
  resolveVSignCallbackUrl,
  resolveVSignEspResponseUrl,
  resolveVSignPfxPath,
  resolveVSignPfxCredentials,
  normalizeVSignPath,
} = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');
const baseDir = path.join(serviceRoot, 'uploads');

function fileOk(rel) {
  const abs = path.isAbsolute(rel) ? rel : path.join(serviceRoot, rel);
  return { path: rel, exists: fs.existsSync(abs), size: fs.existsSync(abs) ? fs.statSync(abs).size : 0 };
}

async function main() {
  const cred = resolveVSignPfxCredentials(serviceRoot);
  const checks = {
    env: {
      aspId: process.env.ASP_ID,
      vsignEnv: process.env.VSIGN_ENV,
      certMode: process.env.VSIGN_CERT_MODE,
      authPage: process.env.VSIGN_AUTHPAGE,
      espResponseUrl: resolveVSignEspResponseUrl(serviceRoot),
      callbackUrl: resolveVSignCallbackUrl(serviceRoot),
      utilityUrl: process.env.UTILITY_URL,
      pfxAliasSet: Boolean(cred.alias),
      pfxPasswordSet: Boolean(cred.password),
    },
    files: [
      fileOk('uploads/vSign/signCertificate.pfx'),
      fileOk('uploads/vSign/ITIO_PUBLIC_KEY.cer'),
      fileOk('uploads/vSign/dm_encryption_key.pfx'),
      fileOk('utility/esp-utility.jar'),
      fileOk('utility/application.properties'),
      fileOk('uploads/1785131367547-Annexure-A13-Sample-Signed-Document.pdf'),
    ],
  };

  const pdf = path.join(baseDir, '1785131367547-Annexure-A13-Sample-Signed-Document.pdf');
  const payload = {
    signedPdfPath: normalizeVSignPath(path.join(baseDir, 'signed', 'audit')),
    tempInfoPath: normalizeVSignPath(path.join(baseDir, 'vSignTemp')),
    pdfDestinationPath: normalizeVSignPath(path.join(baseDir, 'signed', 'audit', 't.pdf')),
    responseUrl: resolveVSignEspResponseUrl(serviceRoot),
    redirectUrl: resolveVSignCallbackUrl(serviceRoot),
    txn: String(Date.now()),
    aspId: process.env.ASP_ID,
    pfxPath: resolveVSignPfxPath(serviceRoot),
    pfxPassword: cred.password,
    pfxAlias: cred.alias,
    signingAlgorithm: 'RSA',
    maxWaitPeriod: '1440',
    ver: '21',
    AuthMode: '1',
    fileType: 'path',
    isresponseXML: '0',
    isrequestXML: '1',
    pdfdetails: [
      {
        pdfbase64val: normalizeVSignPath(pdf),
        docInfo: 'sample.pdf',
        signaturedetailsType: 'signaturedetailsString',
        signaturedetailsString: '1-120,450,250,60',
      },
    ],
  };

  const { data } = await axios.post(
    `${process.env.UTILITY_URL || 'http://127.0.0.1:7077'}/gettxnrefv4_1`,
    payload,
    { timeout: 120000 },
  );

  let aspInXml = '';
  let redirectInXml = '';
  if (data?.requestXML) {
    const xml = Buffer.from(data.requestXML, 'base64').toString('utf8');
    aspInXml = xml.match(/aspId="([^"]+)"/i)?.[1] || xml.match(/aspID="([^"]+)"/i)?.[1] || '';
    redirectInXml = xml.match(/redirectUrl="([^"]+)"/i)?.[1] || '';
  }

  checks.utility = {
    status: data?.status,
    errorCode: data?.errorCode || null,
    errorMessage: data?.errorMessage || null,
    hasRequestXml: Boolean(data?.requestXML),
    aspIdInRequestXml: aspInXml,
    redirectUrlInRequestXml: redirectInXml,
    txnref: data?.txnref || null,
  };

  try {
    const health = await axios.get('http://127.0.0.1:2103/health', { timeout: 5000 });
    checks.esignHealth = health.data;
  } catch (e) {
    checks.esignHealth = { ok: false, error: e.message };
  }

  console.log(JSON.stringify(checks, null, 2));
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});
