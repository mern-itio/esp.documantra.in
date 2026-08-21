require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const {
  resolveVSignCallbackUrl,
  resolveVSignEspResponseUrl,
  resolveVSignPfxPath,
  resolveVSignPfxCredentials,
  normalizeVSignPath,
} = require('../utils/vsignAssets');

const serviceRoot = path.join(__dirname, '..');
const baseDir = path.join(serviceRoot, 'uploads');
const cred = resolveVSignPfxCredentials(serviceRoot);

async function main() {
  const propsPath = path.join(serviceRoot, 'utility', 'application.properties');
  const props = fs.existsSync(propsPath) ? fs.readFileSync(propsPath, 'utf8') : '';
  const esp21 = props.match(/^esp21\.url\.value=(.+)$/m)?.[1]?.trim() || 'missing';
  const esp32 = props.match(/^esp32\.url\.value=(.+)$/m)?.[1]?.trim() || 'missing';

  const payload = {
    signedPdfPath: normalizeVSignPath(path.join(baseDir, 'signed', 'diag')),
    tempInfoPath: normalizeVSignPath(path.join(baseDir, 'vSignTemp')),
    pdfDestinationPath: normalizeVSignPath(path.join(baseDir, 'signed', 'diag', `${Date.now()}.pdf`)),
    responseUrl: resolveVSignEspResponseUrl(serviceRoot),
    redirectUrl: resolveVSignCallbackUrl(serviceRoot),
    txn: `proof-${Date.now()}`,
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
      pdfbase64val: normalizeVSignPath(path.join(baseDir, '1785131367547-Annexure-A13-Sample-Signed-Document.pdf')),
      docInfo: 'sample.pdf',
      signaturedetailsType: 'signaturedetailsString',
      signaturedetailsString: '1-120,450,250,60',
    }],
  };

  const { data } = await axios.post(
    `${process.env.UTILITY_URL || 'http://127.0.0.1:7077'}/gettxnrefv4_1`,
    payload,
    { timeout: 120000 },
  );

  let xmlUrls = [];
  let aspInXml = '';
  if (data?.requestXML) {
    const xml = Buffer.from(data.requestXML, 'base64').toString('utf8');
    xmlUrls = [...new Set([...xml.matchAll(/https?:\/\/[^"'\s<>]+/g)].map((m) => m[0]))];
    aspInXml = xml.match(/aspId="([^"]+)"/i)?.[1] || '';
  }

  const report = {
    timestamp: new Date().toISOString(),
    applicationProperties: { esp21, esp32 },
    appConfig: {
      aspId: process.env.ASP_ID,
      vsignEnv: process.env.VSIGN_ENV,
      responseUrl: payload.responseUrl,
      redirectUrl: payload.redirectUrl,
      authPage: process.env.VSIGN_AUTHPAGE,
    },
    utilityResult: {
      status: data?.status,
      errorCode: data?.errorCode,
      errorMessage: data?.errorMessage,
      aspIdInXml: aspInXml,
      urlsInXml: xmlUrls,
      containsUatUrl: xmlUrls.some((u) => /esignuat\.vsign\.in/i.test(u)),
      containsProductionUrl: xmlUrls.some((u) => /esign\.verasys\.in/i.test(u)),
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});
