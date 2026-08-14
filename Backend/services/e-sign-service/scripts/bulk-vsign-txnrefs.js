/**
 * Bulk-create VSign transaction refs via ESP Utility (gettxnrefv4_1).
 *
 * Prerequisites:
 *   1. ESP Utility JAR running (default http://127.0.0.1:7077)
 *   2. uploads/vSign/signCertificate.pfx + PFX_PASSWORD / PFX_ALIAS in env
 *   3. A sample PDF path (fileType=path)
 *
 * Usage (from e-sign-service folder):
 *   node scripts/bulk-vsign-txnrefs.js --count 50
 *   node scripts/bulk-vsign-txnrefs.js --count 50 --pdf "E:/path/to/sample.pdf"
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const UTILITY_URL = process.env.UTILITY_URL || 'http://127.0.0.1:7077';
const VSIGN_AUTHPAGE = process.env.VSIGN_AUTHPAGE || 'https://esignuat.vsign.in/esp';
const ASP_ID = process.env.ASP_ID || 'IIPLUAT001';
const RESPONSE_URL =
  process.env.VSIGN_CALLBACK_URL ||
  'http://127.0.0.1:2103/api/e-sign/public/v-sign/response';
const PFX_PASSWORD = process.env.PFX_PASSWORD || 'abc1234';
const PFX_ALIAS =
  process.env.PFX_ALIAS || '{05AE2E10-4F6D-41A6-9F83-4D0025CA28A0}';

const baseDir = path.join(__dirname, '..', 'uploads');
const pfxPath = path.join(baseDir, 'vSign', 'signCertificate.pfx');
const signedPdfPath = path.join(baseDir, 'signed', 'bulk-vsign');
const tempInfoPath = path.join(baseDir, 'vSignTemp', 'bulk');

function parseArgs() {
  const args = process.argv.slice(2);
  let count = 50;
  let pdfPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'deploy',
    'docs',
    'asp-audit-annexures',
    'Annexure-A13-Sample-Signed-Document.pdf'
  );

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--count' && args[i + 1]) {
      count = Number(args[i + 1]);
      i += 1;
    } else if (args[i] === '--pdf' && args[i + 1]) {
      pdfPath = args[i + 1];
      i += 1;
    }
  }

  return { count, pdfPath: path.resolve(pdfPath) };
}

function buildPayload(txn, pdfPath, pdfDestinationPath, signedFileName) {
  return {
    signedPdfPath,
    tempInfoPath,
    pdfDestinationPath,
    responseUrl: RESPONSE_URL,
    txn,
    aspId: ASP_ID,
    pfxPath,
    pfxPassword: PFX_PASSWORD,
    pfxAlias: PFX_ALIAS,
    signingAlgorithm: 'RSA',
    maxWaitPeriod: '1440',
    ver: '21',
    AuthMode: '1',
    fileType: 'path',
    isresponseXML: '0',
    isrequestXML: '0',
    pdfdetails: [
      {
        pdfbase64val: pdfPath,
        docInfo: signedFileName,
        docUrl: '',
        reason: 'Bulk VSign UAT transaction',
        signaturedetails: '',
        signaturedetailsType: 'signaturedetailsString',
        signaturedetailsString: '1-120,450,250,60',
      },
    ],
  };
}

async function createTxnRef(index, pdfPath) {
  const txn = `${Date.now()}-${index}`;
  const signedFileName = `${txn}-sample.pdf`;
  const pdfDestinationPath = path.join(signedPdfPath, signedFileName);

  fs.mkdirSync(signedPdfPath, { recursive: true });
  fs.mkdirSync(tempInfoPath, { recursive: true });

  const payload = buildPayload(txn, pdfPath, pdfDestinationPath, signedFileName);
  const { data } = await axios.post(`${UTILITY_URL}/gettxnrefv4_1`, payload, {
    timeout: 120000,
  });

  if (data?.status !== '1' && data?.status !== 1) {
    throw new Error(`Utility rejected txn ${txn}: ${JSON.stringify(data)}`);
  }

  const authUrl = `${VSIGN_AUTHPAGE}/${Buffer.from('-|-|999999999999').toString('base64')}/authpagev4`;

  return {
    index,
    txn,
    txnRef: data.txnref,
    authUrl,
  };
}

async function main() {
  const { count, pdfPath } = parseArgs();

  if (!fs.existsSync(pfxPath)) {
    console.error(`Missing PFX: ${pfxPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(pdfPath)) {
    console.error(`Missing PDF: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`Utility: ${UTILITY_URL}`);
  console.log(`Creating ${count} VSign txn refs...\n`);

  const results = [];
  const errors = [];

  for (let i = 1; i <= count; i += 1) {
    try {
      const row = await createTxnRef(i, pdfPath);
      results.push(row);
      console.log(`${i}/${count} txn=${row.txn} txnRef=${row.txnRef}`);
    } catch (err) {
      const message = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      errors.push({ index: i, error: message });
      console.error(`${i}/${count} FAILED: ${message}`);
    }
  }

  const outFile = path.join(__dirname, `vsign-txnrefs-${Date.now()}.json`);
  fs.writeFileSync(
    outFile,
    JSON.stringify({ created: results.length, results, errors }, null, 2)
  );

  console.log(`\nDone. Success: ${results.length}, Failed: ${errors.length}`);
  console.log(`Saved: ${outFile}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
