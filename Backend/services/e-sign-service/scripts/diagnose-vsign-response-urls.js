require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const path = require('path');
const { normalizeVSignPath, resolveVSignCallbackUrl } = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');
const baseDir = path.join(serviceRoot, 'uploads');
const cb = resolveVSignCallbackUrl(serviceRoot);

async function test(label, responseUrl) {
  const txn = `t-${label}-${Date.now()}`;
  const payload = {
    signedPdfPath: normalizeVSignPath(path.join(baseDir, 'signed', 'diag')),
    tempInfoPath: normalizeVSignPath(path.join(baseDir, 'vSignTemp')),
    pdfDestinationPath: normalizeVSignPath(path.join(baseDir, 'signed', 'diag', `${txn}.pdf`)),
    responseUrl,
    redirectUrl: cb,
    txn,
    aspId: process.env.ASP_ID,
    pfxPath: normalizeVSignPath(path.join(baseDir, 'vSign', 'signCertificate.pfx')),
    pfxPassword: process.env.PFX_PASSWORD,
    pfxAlias: process.env.PFX_ALIAS,
    signingAlgorithm: 'RSA',
    maxWaitPeriod: '1440',
    ver: '21',
    AuthMode: '1',
    fileType: 'path',
    isresponseXML: '0',
    isrequestXML: '1',
    pdfdetails: [
      {
        pdfbase64val: normalizeVSignPath(path.join(baseDir, '1785131367547-Annexure-A13-Sample-Signed-Document.pdf')),
        docInfo: 's.pdf',
        docUrl: '',
        reason: 'd',
        signaturedetails: '',
        signaturedetailsType: 'signaturedetailsString',
        signaturedetailsString: '1-120,450,250,60',
      },
    ],
  };
  const { data } = await axios.post(`${process.env.UTILITY_URL || 'http://127.0.0.1:7077'}/gettxnrefv4_1`, payload, {
    timeout: 120000,
  });
  let embedded = '?';
  if (data.requestXML) {
    const xml = Buffer.from(data.requestXML, 'base64').toString('utf8');
    embedded = xml.match(/responseUrl="([^"]+)"/)?.[1] || embedded;
  }
  console.log(`${label}: embedded=${embedded}`);
}

async function main() {
  console.log('redirectUrl (ASP callback):', cb);
  await test('cloudflare-direct', cb);
  await test('localhost-7077', 'http://127.0.0.1:7077/');
  await test('vsign-esp', 'https://esignuat.vsign.in/esp/2.1.1/aspesignresponse');
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});
