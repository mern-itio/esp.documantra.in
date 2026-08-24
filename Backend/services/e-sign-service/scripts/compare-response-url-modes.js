require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const path = require('path');

const cb = process.env.VSIGN_CALLBACK_URL
  || 'https://exotic-generally-thereof-care.trycloudflare.com/api/e-sign/public/v-sign/response';
const base = path.join(__dirname, '..', 'uploads');
const p = (x) => path.resolve(x).replace(/\\/g, '/');

async function test(label, responseUrl) {
  const txn = `cmp-${label}-${Date.now()}`;
  const payload = {
    signedPdfPath: p(path.join(base, 'signed', 'diag')),
    tempInfoPath: p(path.join(base, 'vSignTemp')),
    pdfDestinationPath: p(path.join(base, 'signed', 'diag', `${txn}.pdf`)),
    responseUrl,
    redirectUrl: cb,
    txn,
    aspId: process.env.ASP_ID,
    pfxPath: p(path.join(base, 'vSign', 'signCertificate.pfx')),
    pfxPassword: process.env.PFX_PASSWORD,
    pfxAlias: process.env.PFX_ALIAS,
    signingAlgorithm: 'RSA',
    maxWaitPeriod: '1440',
    ver: '21',
    AuthMode: '1',
    fileType: 'path',
    isresponseXML: '0',
    isrequestXML: '1',
    pdfdetails: [{
      pdfbase64val: p(path.join(base, '1785131367547-Annexure-A13-Sample-Signed-Document.pdf')),
      docInfo: 's.pdf',
      signaturedetailsType: 'signaturedetailsString',
      signaturedetailsString: '1-120,450,250,60',
    }],
  };
  const { data } = await axios.post(
    `${process.env.UTILITY_URL || 'http://127.0.0.1:7078'}/gettxnrefv4_1`,
    payload,
    { timeout: 120000 },
  );
  let embedded = '?';
  if (data.requestXML) {
    const xml = Buffer.from(data.requestXML, 'base64').toString('utf8');
    embedded = xml.match(/responseUrl="([^"]+)"/)?.[1] || embedded;
  }
  console.log(`${label}: status=${data.status} embedded=${embedded}`);
}

async function main() {
  await test('esp-response', 'https://esign.verasys.in/esign/2.1/signature');
  await test('callback-as-response', cb);
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});
