/**
 * Compare gettxnref embedding when responseUrl is ASP callback directly.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const path = require('path');
const { resolveVSignCallbackUrl, normalizeVSignPath } = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');
const baseDir = path.join(serviceRoot, 'uploads');

async function run(label, extra) {
  const aspCallbackUrl = resolveVSignCallbackUrl(serviceRoot);
  const txn = `diag-${label}-${Date.now()}`;
  const payload = {
    signedPdfPath: normalizeVSignPath(path.join(baseDir, 'signed', 'diag')),
    tempInfoPath: normalizeVSignPath(path.join(baseDir, 'vSignTemp')),
    pdfDestinationPath: normalizeVSignPath(path.join(baseDir, 'signed', 'diag', `${txn}.pdf`)),
    responseUrl: aspCallbackUrl,
    txn,
    aspId: process.env.ASP_ID || 'IIPLUAT001',
    pfxPath: normalizeVSignPath(path.join(baseDir, 'vSign', 'signCertificate.pfx')),
    pfxPassword: process.env.PFX_PASSWORD,
    pfxAlias: process.env.PFX_ALIAS,
    signingAlgorithm: 'RSA',
    maxWaitPeriod: '1440',
    ver: '21',
    AuthMode: '1',
    fileType: 'path',
    isresponseXML: '1',
    isrequestXML: '1',
    pdfdetails: [
      {
        pdfbase64val: normalizeVSignPath(path.join(baseDir, '1785131367547-Annexure-A13-Sample-Signed-Document.pdf')),
        docInfo: 'sample.pdf',
        docUrl: '',
        reason: 'diagnostic',
        signaturedetails: '',
        signaturedetailsType: 'signaturedetailsString',
        signaturedetailsString: '1-120,450,250,60',
      },
    ],
    ...extra,
  };

  const { data } = await axios.post(`${process.env.UTILITY_URL || 'http://127.0.0.1:7077'}/gettxnrefv4_1`, payload, {
    timeout: 120000,
  });

  let embedded = '(none)';
  if (data?.requestXML) {
    const xml = Buffer.from(data.requestXML, 'base64').toString('utf8');
    embedded = xml.match(/responseUrl="([^"]+)"/)?.[1] || embedded;
  }
  console.log(`[${label}] status=${data?.status} embedded responseUrl=${embedded}`);
}

async function main() {
  console.log('ASP callback:', resolveVSignCallbackUrl(serviceRoot));
  await run('direct-cloudflare', {});
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});
