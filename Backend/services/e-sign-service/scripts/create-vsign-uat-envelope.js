/**
 * Create one public VSign UAT envelope via API (upload → recipient → field → send).
 *
 * Usage:
 *   node scripts/create-vsign-uat-envelope.js
 *   node scripts/create-vsign-uat-envelope.js --aadhaar 123456789012 --email you@example.com
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');
const Recipient = require('../models/Recipient');

const BASE = process.env.ESIGN_PUBLIC_API || 'http://127.0.0.1:2103/api/e-sign/public';
const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

function parseArgs() {
  const args = process.argv.slice(2);
  let aadhaar = process.env.VSIGN_TEST_AADHAAR || '';
  let email = process.env.VSIGN_TEST_EMAIL || 'shivamg@itio.in';
  let name = process.env.VSIGN_TEST_NAME || 'Shivam Test';
  let pdf = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'deploy',
    'docs',
    'asp-audit-annexures',
    'Annexure-A13-Sample-Signed-Document.pdf',
  );

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--aadhaar' && args[i + 1]) {
      aadhaar = args[i + 1];
      i += 1;
    } else if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1];
      i += 1;
    } else if (args[i] === '--name' && args[i + 1]) {
      name = args[i + 1];
      i += 1;
    } else if (args[i] === '--pdf' && args[i + 1]) {
      pdf = path.resolve(args[i + 1]);
      i += 1;
    }
  }

  return { aadhaar, email, name, pdf };
}

async function resolveAadhaar(aadhaar, email) {
  if (/^\d{12}$/.test(String(aadhaar))) return aadhaar;
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/draftnsign';
  await mongoose.connect(mongoUri);
  const recipient = await Recipient.findOne({
    email,
    aadhaarNumber: { $exists: true, $ne: '' },
  })
    .sort({ _id: -1 })
    .select('aadhaarNumber')
    .lean();
  await mongoose.disconnect();
  return recipient?.aadhaarNumber || '';
}

function guestHeaders(guestId) {
  return {
    'x-public-guest-id': guestId,
    Cookie: `publicGuestId=${guestId}`,
  };
}

async function main() {
  let { aadhaar, email, name, pdf } = parseArgs();
  aadhaar = await resolveAadhaar(aadhaar, email);

  if (!fs.existsSync(pdf)) {
    console.error(`PDF not found: ${pdf}`);
    process.exit(1);
  }
  if (!/^\d{12}$/.test(String(aadhaar))) {
    console.error('Set 12-digit Aadhaar: --aadhaar 123456789012 or VSIGN_TEST_AADHAAR in Backend/.env');
    process.exit(1);
  }

  const guestId = crypto.randomUUID();
  const headers = guestHeaders(guestId);
  const ts = Date.now();

  console.log('Creating VSign UAT envelope...\n');

  const form = new FormData();
  form.append('files', fs.createReadStream(pdf), {
    filename: `vsign-uat-${ts}.pdf`,
    contentType: 'application/pdf',
  });
  form.append('name', `VSign UAT ${ts}`);
  form.append('subject', `VSign UAT transaction ${ts}`);
  form.append('message', 'Local UAT test');
  form.append('envelopetype', 'qualified');

  const uploadRes = await axios.post(`${BASE}/upload`, form, {
    headers: { ...headers, ...form.getHeaders() },
    maxBodyLength: Infinity,
  });

  const envelopeId = uploadRes.data?.data?.envelopeId || uploadRes.data?.envelopeId;
  if (!envelopeId) {
    console.error('Upload failed:', uploadRes.data);
    process.exit(1);
  }

  const detailRes = await axios.get(`${BASE}/envelope/${envelopeId}`, { headers });
  const envData = detailRes.data?.data || detailRes.data;
  const documentId =
    envData?.documents?.[0]?.id ||
    envData?.documents?.[0]?._id ||
    envData?.documentIds?.[0];
  if (!documentId) {
    console.error('Could not resolve documentId:', detailRes.data);
    process.exit(1);
  }
  console.log(`Envelope: ${envelopeId}`);
  console.log(`Document: ${documentId}`);

  const recipRes = await axios.post(
    `${BASE}/add-recipients`,
    {
      envelopeId,
      recipients: [
        {
          name,
          email,
          role: 'signer',
          order: 1,
          status: 'waiting',
          authentication: [],
        },
      ],
    },
    { headers },
  );

  const recipientId =
    recipRes.data?.recipients?.[0]?._id ||
    recipRes.data?.recipients?.[0]?.id ||
    recipRes.data?.recipientIds?.[0] ||
    recipRes.data?.signingLinks?.[0]?.recipientId;
  if (!recipientId) {
    console.error('add-recipients failed:', recipRes.data);
    process.exit(1);
  }
  console.log(`Recipient: ${recipientId}`);

  await axios.post(
    `${BASE}/save-aadhaar`,
    { currentUserId: recipientId, aadhaarNumber: aadhaar },
    { headers },
  );

  await axios.post(
    `${BASE}/save-signature-fields`,
    {
      envelopeId,
      signatureFields: [
        {
          documentId,
          recipientId,
          page: 1,
          x: 6,
          y: 4.625,
          width: 240,
          height: 34,
          type: 'signature',
          label: 'Signature',
          status: 'pending',
        },
      ],
    },
    { headers },
  );

  const sendRes = await axios.post(`${BASE}/send-envelope/${envelopeId}`, {}, { headers });
  const signLink =
    sendRes.data?.signLink ||
    sendRes.data?.recipients?.[0]?.signLink ||
    null;

  console.log('\n--- Ready to sign ---');
  console.log(`Sign link: ${signLink}`);
  console.log(`Open in browser: ${FRONTEND}/sent?envelopeId=${envelopeId}`);
  console.log(`Callback URL: ${process.env.VSIGN_CALLBACK_URL || '(not set)'}`);
  console.log('\nComplete: save signature → Sign → enter OTP on esignuat.vsign.in');
  console.log('Then run: node scripts/export-vsign-uat-excel.js');
}

main().catch((err) => {
  const detail = err.response?.data || err.message;
  console.error('Failed:', detail);
  process.exit(1);
});
