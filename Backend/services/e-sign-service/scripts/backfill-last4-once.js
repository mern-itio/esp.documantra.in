#!/usr/bin/env node
/** One-off: backfill signingEvidence.aadhaarLast4 and repaint Aadhaar appearance on signed PDF. */
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const { paintAadhaarAppearanceOnPdf } = require('../services/signing/vsignAppearanceEmbed');

const envelopeId = process.argv[2] || '6a86907b1d12d05767984e49';
const recipientId = process.argv[3] || '6a2fb41e2db99ae2775dd9a5';
const serviceRoot = path.join(__dirname, '..');

async function main() {
  const client = new MongoClient(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/draftnsign');
  await client.connect();
  const db = client.db();
  const eid = new ObjectId(envelopeId);
  const rid = new ObjectId(recipientId);

  const recipient = await db.collection('recipients').findOne({ _id: rid });
  const last4 = String(recipient?.aadhaarNumber || '').replace(/\D/g, '').slice(-4);
  if (last4.length !== 4) {
    throw new Error(`No Aadhaar last-4 on recipient ${recipientId}`);
  }

  await db.collection('recipientpermissions').updateOne(
    { envelopeId: eid, recipientId: rid },
    { $set: { 'signingEvidence.aadhaarLast4': last4 } },
  );

  const doc = await db.collection('documents').findOne({ envelopeId: eid });
  const pdfPath = doc?.signedFilePath || doc?.preparedDoc;
  if (!pdfPath) {
    console.log('Backfilled last4 only (no signed PDF yet):', last4);
    await client.close();
    return;
  }

  const fields = await db.collection('signaturefields').find({
    envelopeId: eid,
    recipientId: rid,
    type: 'signature',
  }).toArray();

  const boxes = fields.map((f) => ({
    pageNum: Number(f.page || 1),
    x: Number(f.x || 0),
    y: Number(f.y || 0),
    w: Number(f.width || 280),
    h: Number(f.height || 85),
  }));

  if (boxes.length) {
    await paintAadhaarAppearanceOnPdf(pdfPath, {
      boxes,
      recipient: { ...recipient, aadhaarLast4: last4 },
      verifiedAt: new Date(),
      serviceRoot,
    });
    console.log('Repainted PDF:', pdfPath, 'last4:', last4);
  } else {
    console.log('Backfilled last4:', last4, '(no signature field boxes)');
  }

  await client.close();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
