/**
 * Decode embedded responseUrl from utility gettxnref (no secrets logged).
 * Usage: node scripts/diagnose-vsign-gettxnref.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const path = require('path');
const {
  resolveVSignCallbackUrl,
  resolveVSignEspResponseUrl,
  normalizeVSignPath,
} = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');
const baseDir = path.join(serviceRoot, 'uploads');

async function main() {
  const aspCallbackUrl = resolveVSignCallbackUrl(serviceRoot);
  const txn = `diag-${Date.now()}`;

  const payload = {
    signedPdfPath: normalizeVSignPath(path.join(baseDir, 'signed', 'diag')),
    tempInfoPath: normalizeVSignPath(path.join(baseDir, 'vSignTemp')),
    pdfDestinationPath: normalizeVSignPath(path.join(baseDir, 'signed', 'diag', `${txn}.pdf`)),
    responseUrl: aspCallbackUrl,
    redirectUrl: aspCallbackUrl,
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
    isresponseXML: '0',
    isrequestXML: '1',
    pdfdetails: [
      {
        pdfbase64val: normalizeVSignPath(
          path.join(baseDir, '1785131367547-Annexure-A13-Sample-Signed-Document.pdf'),
        ),
        docInfo: 'sample.pdf',
        docUrl: '',
        reason: 'diagnostic',
        signaturedetails: '',
        signaturedetailsType: 'signaturedetailsString',
        signaturedetailsString: '1-120,450,250,60',
      },
    ],
  };

  console.log('aspCallbackUrl:', aspCallbackUrl);
  console.log('mode: responseUrl + redirectUrl = ASP callback (VSign production)');

  const { data } = await axios.post(`${process.env.UTILITY_URL || 'http://127.0.0.1:7077'}/gettxnrefv4_1`, payload, {
    timeout: 120000,
  });

  console.log('utility status:', data?.status, 'txnref:', data?.txnref);
  if (data && typeof data === 'object') {
    console.log('utility keys:', Object.keys(data));
    if (data.msg || data.message || data.error || data.errorMessage) {
      console.log('utility message:', data.msg || data.message || data.error || data.errorMessage);
    }
    if (data.errorCode) console.log('utility errorCode:', data.errorCode);
  }
  if (data?.requestXML) {
    const xml = Buffer.from(data.requestXML, 'base64').toString('utf8');
    const responseUrl = xml.match(/responseUrl="([^"]+)"/)?.[1];
    console.log('embedded responseUrl in EsignReq:', responseUrl);
  } else {
    console.log('no requestXML in response, keys:', Object.keys(data || {}));
  }
}

main().catch((err) => {
  console.error('diagnostic failed:', err.response?.data || err.message);
  process.exit(1);
});
