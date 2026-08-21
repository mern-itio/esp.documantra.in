require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const path = require('path');
const {
  resolveVSignCallbackUrl,
  resolveVSignEspResponseUrl,
  resolveVSignPfxPath,
  resolveVSignPfxCredentials,
  resolveVSignAuthPage,
  normalizeVSignPath,
} = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');
const baseDir = path.join(serviceRoot, 'uploads');
const cred = resolveVSignPfxCredentials(serviceRoot);
const pdf = path.join(baseDir, '1785131367547-Annexure-A13-Sample-Signed-Document.pdf');

async function main() {
  const payload = {
    signedPdfPath: normalizeVSignPath(path.join(baseDir, 'signed', 'diag')),
    tempInfoPath: normalizeVSignPath(path.join(baseDir, 'vSignTemp')),
    pdfDestinationPath: normalizeVSignPath(path.join(baseDir, 'signed', 'diag', 't.pdf')),
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
    pdfdetails: [{
      pdfbase64val: normalizeVSignPath(pdf),
      docInfo: 'a.pdf',
      signaturedetailsType: 'signaturedetailsString',
      signaturedetailsString: '1-120,450,250,60',
    }],
  };

  console.log('Our app sends:');
  console.log(JSON.stringify({
    aspId: process.env.ASP_ID,
    vsignEnv: process.env.VSIGN_ENV,
    responseUrl: payload.responseUrl,
    redirectUrl: payload.redirectUrl,
    authPage: resolveVSignAuthPage(serviceRoot),
  }, null, 2));

  const { data } = await axios.post(
    `${process.env.UTILITY_URL || 'http://127.0.0.1:7077'}/gettxnrefv4_1`,
    payload,
    { timeout: 120000 },
  );

  if (!data?.requestXML) {
    console.log('Utility response (no XML):', {
      status: data?.status,
      errorCode: data?.errorCode,
      errorMessage: data?.errorMessage,
    });
    return;
  }

  const xml = Buffer.from(data.requestXML, 'base64').toString('utf8');
  const urls = [...new Set([...xml.matchAll(/https?:\/\/[^"'\s<>]+/g)].map((m) => m[0]))];
  const aspId = xml.match(/aspId="([^"]+)"/i)?.[1] || xml.match(/aspID="([^"]+)"/i)?.[1];
  console.log('\nUtility XML contains:');
  console.log(JSON.stringify({ aspId, urls, hasUat: urls.some((u) => /esignuat|vsign\.in\/asp/i.test(u)) }, null, 2));
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});
