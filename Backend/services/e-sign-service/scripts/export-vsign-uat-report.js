/**
 * Export VSign UAT transaction report (CSV) for submission to Verasys/VSign.
 *
 * Usage (from e-sign-service folder):
 *   node scripts/export-vsign-uat-report.js
 *   node scripts/export-vsign-uat-report.js --limit 50 --out ./vsign-uat-report.csv
 *
 * Requires MONGO_URI (loads Backend/.env via dotenv).
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const SignatureTransaction = require('../models/signatureTransactions');
const Envelope = require('../models/Envelope');
const Document = require('../models/Document');
const Recipient = require('../models/Recipient');

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 50;
  let out = path.join(__dirname, `vsign-uat-report-${Date.now()}.csv`);

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = Number(args[i + 1]);
      i += 1;
    } else if (args[i] === '--out' && args[i + 1]) {
      out = path.resolve(args[i + 1]);
      i += 1;
    }
  }

  return { limit, out };
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fileExists(p) {
  try {
    return Boolean(p && fs.existsSync(p));
  } catch {
    return false;
  }
}

async function main() {
  const { limit, out } = parseArgs();
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/draftnsign';
  const aspId = process.env.ASP_ID || 'IIPLUAT001';

  await mongoose.connect(mongoUri);

  const txns = await SignatureTransaction.find({})
    .sort({ _id: -1 })
    .limit(limit)
    .lean();

  const rows = [];
  rows.push([
    'Sr No',
    'ASP ID',
    'Transaction ID (txn)',
    'Transaction Ref (txnRef)',
    'Envelope ID',
    'Document Name',
    'Recipient Name',
    'Signed PDF Path',
    'Status',
    'Environment',
    'Created At',
  ].join(','));

  let successCount = 0;

  for (let i = 0; i < txns.length; i += 1) {
    const t = txns[i];
    const [envelope, document, recipient] = await Promise.all([
      Envelope.findById(t.envelopeId).lean(),
      Document.findById(t.documentId).lean(),
      Recipient.findById(t.recipientId).lean(),
    ]);

    const signedOk = fileExists(t.signedFilePath);
    if (signedOk) successCount += 1;

    rows.push([
      i + 1,
      aspId,
      t.txn,
      t.txnRef,
      String(t.envelopeId || ''),
      document?.fileName || '',
      recipient?.name || '',
      t.signedFilePath || '',
      signedOk ? 'Success' : 'Initiated (awaiting callback)',
      'UAT (esignuat.vsign.in)',
      t._id ? new mongoose.Types.ObjectId(t._id).getTimestamp().toISOString() : '',
    ].map(csvEscape).join(','));
  }

  fs.writeFileSync(out, rows.join('\n'), 'utf8');

  const signedDir = path.join(__dirname, '..', 'uploads', 'signed');
  const samplePdfs = [];
  if (fs.existsSync(signedDir)) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.toLowerCase().endsWith('.pdf')) samplePdfs.push(full);
      }
    };
    walk(signedDir);
  }

  console.log(`Report: ${out}`);
  console.log(`Transactions exported: ${txns.length}`);
  console.log(`Successful (signed PDF exists): ${successCount}`);
  if (samplePdfs.length) {
    console.log('\nSample signed PDFs for VSign submission:');
    samplePdfs.slice(0, 5).forEach((p, idx) => console.log(`  ${idx + 1}. ${p}`));
  } else {
    console.log('\nNo signed PDFs found yet under uploads/signed/');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
