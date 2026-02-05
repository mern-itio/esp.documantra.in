// generateAndStoreCompletionCertificate(envelopeId)
// - Generates a completion certificate PDF (pdfkit).
// - Ensures uploads/certificates exists and writes the PDF file there.
// - Returns { buffer, filename, filepath } on success.
// - Throws on failure.
//
// Dependencies: npm i pdfkit
// Models: Envelope, Certificate, DigitalSignature, SignatureField, AuditLog, Recipient
// Adjust require paths to match your repo structure if needed.

const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

function toDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d === 'number') return new Date(d);
  if (d && d.$date && d.$date.$numberLong) return new Date(Number(d.$date.$numberLong));
  if (d && d.$date) return new Date(d.$date);
  return new Date(d);
}

/**
 * Generate certificate PDF for an envelope and save it to uploads/certificates/
 * @param {String|ObjectId} envelopeId
 * @returns {Promise<{buffer: Buffer, filename: string, filepath: string}>}
 */
async function generateAndStoreCompletionCertificate(envelopeId) {
  // Replace these requires to match your project's structure if needed
  const Envelope = require('../models/Envelope');
  const { Certificate } = require('../models/Certificate');
  const DigitalSignature = require('../models/DigitalSignature');
  const SignatureField = require('../models/SignatureFields');
  const { AuditTrail } = require('../models/AuditTrail');
  const Recipient = require('../models/Recipient');

  // load envelope
  const envelope = await Envelope.findById(envelopeId).lean();
  if (!envelope) throw new Error('Envelope not found');

  // load related data
  const [certs, signatures, fields, auditLogs] = await Promise.all([
    Certificate.find({ envelopeId }).lean(),
    DigitalSignature.find({ envelopeId }).lean(),
    SignatureField.find({ envelopeId }).lean(),
    AuditTrail.find({ envelopeId }).sort({ timestamp: 1 }).lean()
  ]);

  // gather recipient ids and recipients
  const recipientIdsSet = new Set();
  certs.forEach(c => c.recipientId && recipientIdsSet.add(String(c.recipientId)));
  signatures.forEach(s => s.recipientId && recipientIdsSet.add(String(s.recipientId)));
  fields.forEach(f => f.recipientId && recipientIdsSet.add(String(f.recipientId)));
  const recipientIds = Array.from(recipientIdsSet);

  const recipients = recipientIds.length ? await Recipient.find({ _id: { $in: recipientIds } }).lean() : [];
  const recipientMap = {};
  recipients.forEach(r => { recipientMap[String(r._id)] = r; });

  const certMap = {}; certs.forEach(c => { if (c.recipientId) certMap[String(c.recipientId)] = c; });
  const sigMap = {}; signatures.forEach(s => { if (s.recipientId) sigMap[String(s.recipientId)] = s; });

  // PDF generation
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];
  doc.on('data', chunk => buffers.push(chunk));

  // Header
  doc.fontSize(20).text('Certificate of Completion', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Envelope Subject: ${envelope.subject || ''}`);
  doc.text(`Message: ${envelope.message || ''}`);
  doc.text(`Signature Type: ${envelope.signatureType || ''}`);
  doc.moveDown(1);

  // Per-signer info
  doc.fontSize(14).text('Signers & Certificate Summary', { underline: true });
  doc.moveDown(0.3);

  for (const rid of recipientIds) {
    const r = recipientMap[rid] || { _id: rid, name: 'Unknown', email: '' };
    const c = certMap[rid];
    const s = sigMap[rid];

    doc.fontSize(12).text(`Name: ${r.name || r.fullName || r.email || 'Unknown'}`);
    doc.fontSize(10).text(`Email: ${r.email || ''}`);

    if (c) {
      doc.text(`Certificate Serial: ${c.certSerial || ''}`);
      doc.text(`Issuer: ${c.issuer || ''}`);
      doc.text(`Issued At: ${toDate(c.issuedAt) ? toDate(c.issuedAt).toISOString() : ''}`);
      doc.text(`Valid Till: ${toDate(c.validTill) ? toDate(c.validTill).toISOString() : ''}`);
    } else {
      doc.text('Certificate: Not found');
    }

    if (s) {
      doc.text(`Signature Value: ${s.signatureValue || ''}`);
      doc.text(`Signed At: ${toDate(s.signedAt) ? toDate(s.signedAt).toISOString() : ''}`);
      doc.text(`Hash Algorithm: ${s.hashAlgorithm || ''}`);
      doc.text(`PDF Hash: ${s.pdfHash || ''}`);
    } else {
      doc.text('Digital Signature: Not found');
    }

    // embed visible signature image if present
    const matchingField = fields.find(f => String(f.recipientId) === String(rid) && f.signature);
    if (matchingField && matchingField.signature) {
      try {
        const imgData = matchingField.signature.split(',')[1] || matchingField.signature;
        const imgBuffer = Buffer.from(imgData, 'base64');
        doc.moveDown(0.2);
        doc.image(imgBuffer, { fit: [150, 50] });
      } catch (e) {
        doc.text('[Signature image could not be embedded]');
      }
    }

    doc.moveDown(0.8);
  }

  // Audit trail
  doc.addPage();
  doc.fontSize(14).text('Audit Trail', { underline: true });
  doc.moveDown(0.5);
  (auditLogs || []).forEach(log => {
    const t = toDate(log.timestamp);
    doc.fontSize(10).text(`${t ? t.toISOString() : ''} — ${log.action || ''} — ${JSON.stringify(log.details || {})}`);
  });

  // Footer page
  doc.addPage();
  doc.fontSize(10).text('This certificate confirms that the signatures and events recorded above are captured by the system audit logs and cryptographic records.');
  doc.moveDown(1);
  doc.text(`Generated At: ${new Date().toISOString()}`);

  doc.end();

  // wait for doc to finish
  await new Promise((resolve, reject) => { doc.on('end', resolve); doc.on('error', reject); });

  const finalBuffer = Buffer.concat(buffers);

  // prepare filename and path
  const safeFilename = `completion-certificate-${String(envelope._id)}.pdf`;
  const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
  const filepath = path.join(uploadsDir, safeFilename);

  // ensure directory exists and write file
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(filepath, finalBuffer);

  // return buffer + location so caller can also store DB ref / email it
  return { buffer: finalBuffer, filename: safeFilename, filepath };
}
/**
 * Generate certificate PDF for a Power Form cycle and save it to uploads/certificates/
 * Similar to generateAndStoreCompletionCertificate but scoped to one cycle and its SelfSigners.
 * @param {String|ObjectId} envelopeId
 * @param {String|ObjectId} cycleId
 * @returns {Promise<{buffer: Buffer, filename: string, filepath: string}>}
 */
async function generateAndStoreCompletionCertificateOfPowerForm(envelopeId, cycleId) {
  const Envelope = require('../models/Envelope');
  const Cycle = require('../models/Cycle');
  const { Certificate } = require('../models/Certificate');
  const DigitalSignature = require('../models/DigitalSignature');
  const SignatureField = require('../models/SignatureFields');
  const { AuditTrail } = require('../models/AuditTrail');

  const envelope = await Envelope.findById(envelopeId).lean();
  if (!envelope) throw new Error('Envelope not found');

  const cycle = await Cycle.findById(cycleId)
    .populate({
      path: 'signers',
      model: 'SelfSigner',
      options: { sort: { signingOrder: 1 } }
    })
    .lean();
  if (!cycle) throw new Error('Cycle not found');

  const signerIds = (cycle.signers || []).map(s => s._id);
  if (signerIds.length === 0) throw new Error('Cycle has no signers');

  const [certs, signatures, auditLogs] = await Promise.all([
    Certificate.find({ envelopeId, recipientId: { $in: signerIds } }).lean(),
    DigitalSignature.find({ envelopeId, recipientId: { $in: signerIds } }).lean(),
    AuditTrail.find({ envelopeId, recipientId: { $in: signerIds } }).sort({ timestamp: 1 }).lean()
  ]);

  const certMap = {};
  certs.forEach(c => { if (c.recipientId) certMap[String(c.recipientId)] = c; });
  const sigMap = {};
  signatures.forEach(s => { if (s.recipientId) sigMap[String(s.recipientId)] = s; });

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];
  doc.on('data', chunk => buffers.push(chunk));

  doc.fontSize(20).text('Certificate of Completion (Power Form)', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Envelope Subject: ${envelope.subject || ''}`);
  doc.text(`Message: ${envelope.message || ''}`);
  doc.text(`Signature Type: ${envelope.signatureType || ''}`);
  doc.text(`Cycle ID: ${String(cycleId)}`);
  doc.text(`Cycle Status: ${cycle.status || ''}`);
  doc.moveDown(1);

  doc.fontSize(14).text('Signers & Certificate Summary', { underline: true });
  doc.moveDown(0.3);

  for (const signer of cycle.signers || []) {
    const rid = String(signer._id);
    const name = (signer.data && (signer.data.name || signer.data.fullName)) || (signer.data && signer.data.email) || 'Unknown';
    const email = (signer.data && signer.data.email) || '';

    doc.fontSize(12).text(`Name: ${name}`);
    doc.fontSize(10).text(`Email: ${email}`);
    doc.text(`Signing Order: ${signer.signingOrder != null ? signer.signingOrder : '-'}`);
    doc.text(`Status: ${signer.status || ''}`);

    const c = certMap[rid];
    if (c) {
      doc.text(`Certificate Serial: ${c.certSerial || ''}`);
      doc.text(`Issuer: ${c.issuer || ''}`);
      doc.text(`Issued At: ${toDate(c.issuedAt) ? toDate(c.issuedAt).toISOString() : ''}`);
      doc.text(`Valid Till: ${toDate(c.validTill) ? toDate(c.validTill).toISOString() : ''}`);
    } else {
      doc.text('Certificate: Not found');
    }

    const s = sigMap[rid];
    if (s) {
      doc.text(`Signature Value: ${s.signatureValue || ''}`);
      doc.text(`Signed At: ${toDate(s.signedAt) ? toDate(s.signedAt).toISOString() : ''}`);
      doc.text(`Hash Algorithm: ${s.hashAlgorithm || ''}`);
      doc.text(`PDF Hash: ${s.pdfHash || ''}`);
    } else {
      doc.text('Digital Signature: Not found');
    }

    if (signer.signature) {
      try {
        const imgData = signer.signature.split(',')[1] || signer.signature;
        const imgBuffer = Buffer.from(imgData, 'base64');
        doc.moveDown(0.2);
        doc.image(imgBuffer, { fit: [150, 50] });
      } catch (e) {
        doc.text('[Signature image could not be embedded]');
      }
    }

    doc.moveDown(0.8);
  }

  doc.addPage();
  doc.fontSize(14).text('Audit Trail (this cycle)', { underline: true });
  doc.moveDown(0.5);
  (auditLogs || []).forEach(log => {
    const t = toDate(log.timestamp);
    doc.fontSize(10).text(`${t ? t.toISOString() : ''} — ${log.action || ''} — ${JSON.stringify(log.details || {})}`);
  });

  doc.addPage();
  doc.fontSize(10).text('This certificate confirms that the signatures and events recorded above are captured for this Power Form cycle and its signers.');
  doc.moveDown(1);
  doc.text(`Generated At: ${new Date().toISOString()}`);
  doc.text(`Envelope: ${String(envelopeId)} | Cycle: ${String(cycleId)}`);

  doc.end();

  await new Promise((resolve, reject) => { doc.on('end', resolve); doc.on('error', reject); });

  const finalBuffer = Buffer.concat(buffers);
  const safeFilename = `completion-certificate-powerform-${String(envelopeId)}-${String(cycleId)}.pdf`;
  const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
  const filepath = path.join(uploadsDir, safeFilename);

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(filepath, finalBuffer);

  return { buffer: finalBuffer, filename: safeFilename, filepath };
}

module.exports = { generateAndStoreCompletionCertificate, generateAndStoreCompletionCertificateOfPowerForm };
