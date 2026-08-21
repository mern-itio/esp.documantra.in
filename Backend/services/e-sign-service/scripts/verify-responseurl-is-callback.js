/** Verify responseUrl in EsignReq XML equals ASP callback (VSign requirement). */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const path = require('path');
const {
  resolveVSignCallbackUrl,
  normalizeVSignPath,
  resolveVSignPfxPath,
  resolveVSignPfxCredentials,
} = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');
const cb = resolveVSignCallbackUrl(serviceRoot);
const base = path.join(serviceRoot, 'uploads');
const cred = resolveVSignPfxCredentials(serviceRoot);

async function main() {
  const payload = {
    signedPdfPath: normalizeVSignPath(path.join(base, 'signed', 'diag')),
    tempInfoPath: normalizeVSignPath(path.join(base, 'vSignTemp')),
    pdfDestinationPath: normalizeVSignPath(path.join(base, 'signed', 'diag', `verify-${Date.now()}.pdf`)),
    responseUrl: cb,
    redirectUrl: cb,
    txn: `verify-${Date.now()}`,
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
    pdfdetails: [{
      pdfbase64val: normalizeVSignPath(path.join(base, '1785131367547-Annexure-A13-Sample-Signed-Document.pdf')),
      docInfo: 's.pdf',
      signaturedetailsType: 'signaturedetailsString',
      signaturedetailsString: '1-120,450,250,60',
    }],
  };

  const { data } = await axios.post(
    `${process.env.UTILITY_URL}/gettxnrefv4_1`,
    payload,
    { timeout: 120000 },
  );

  const xml = data.requestXML ? Buffer.from(data.requestXML, 'base64').toString('utf8') : '';
  const embedded = xml.match(/responseUrl="([^"]+)"/)?.[1] || '';

  console.log(JSON.stringify({
    utilityStatus: data.status,
    callbackSent: cb,
    embeddedResponseUrl: embedded,
    match: embedded === cb,
    hasVerasysEspUrl: embedded.includes('esign.verasys.in/esign'),
  }, null, 2));
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});
