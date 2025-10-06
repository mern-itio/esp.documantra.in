/*
Refactored signing service to support per-recipient initiation and a final 'prepare & finalize' flow.
Exports:
  - initiateRecipientSignature(opts)
  - prepareDocumentForFinalSigning(envelopeId, documentId)
  - finalizeSigning(envelopeId, documentId)

Assumptions:
  - Existing models: Certificate, Document, DigitalSignature, SignatureFields, RecipientPermission, AuditTrail
  - Utilities: decrypt, hashBuffer, requestTimestamp, saveSignedPdf, logActivity
  - node-signpdf, pdf-lib and node-forge installed
  - storageService.saveSignedPdf returns { filePath, fileName, size }

Usage:
  1) When recipient clicks: call initiateRecipientSignature({ envelopeId, documentId, recipientId, signatureImageBase64, otp... })
     This will create Certificate (if generated here), save signature base64 into SignatureFields and RecipientPermission and write audit entries.
  2) After all recipients completed: call prepareDocumentForFinalSigning(envelopeId, documentId)
     This will embed all visual signatures into a prepared PDF and create placeholders for each signature field. The prepared PDF path is stored in Document.preparedDoc.
  3) call finalizeSigning(envelopeId, documentId)
     This will sequentially sign the prepared PDF with each recipient's certificate (order by SignatureFields.order or recipient list), create DigitalSignature records, request TSA tokens and save final signed PDF as the Document.filePath (replacing previous file if needed). AuditTrail entries and logging are added.

Notes: signing is done incrementally (sign -> sign the signed result -> ...). For PKCS12 fallback we use node-forge to generate an in-memory p12.
*/

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { SignPdf } = require('node-signpdf');
const plainAddPlaceholder = require('node-signpdf/dist/helpers/plainAddPlaceholder').default;
const forge = require('node-forge');

const { saveSignedPdf } = require('./storageService');
const { hashBuffer } = require('../utils/hashUtil');
const { Certificate } = require('../models/Certificate');
const Document = require('../models/Document');
const DigitalSignature = require('../models/DigitalSignature');
const { AuditTrail } = require('../models/AuditTrail');
const SignatureFields = require('../models/SignatureFields');
const { requestTimestamp } = require('./tsaService');
const { decrypt } = require('../utils/keyEncryption');
const RecipientPermission = require('../models/RecipientPermission');
const { logActivity } = require('./activityLogService');
const selfSigner = require('../models/selfSigner');

const signer = new SignPdf();

function normalizePem(pem) {
  if (!pem) return pem;
  return pem.toString().replace(/\r/g, '\n').replace(/\n+/g, '\n').trim() + '\n';
}

function createP12FromPem(privateKeyPem, certPem, password = 'changeit') {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const cert = forge.pki.certificateFromPem(certPem);
  const newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(privateKey, [cert], password, { generateLocalKeyId: true, friendlyName: 'temp' });
  const newPkcs12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();
  return Buffer.from(newPkcs12Der, 'binary');
}

async function addPlaceholderToPdf(pdfBuffer, field) {
  const rect = [
    Number(field.x || 50),
    Number(field.y || 50),
    Number(field.x || 50) + Number(field.width || 150),
    Number(field.y || 50) + Number(field.height || 40)
  ];
  const options = {
    pdfBuffer,
    reason: field.reason || (field.name ? `Signed by ${field.name}` : 'Signature'),
    name: field.name || 'Signer',
    // increase default reserved bytes to avoid overflow (was 8192)
    signatureLength: field.signatureLength || 65536,
    rect,
    page: Number(field.page || 1)
  };
  return plainAddPlaceholder(options);
}

async function signPdfWithCert(pdfBuffer, privateKeyPem, certPem, envelopeId, recipientId, fallbackPassword = 'changeit') {
  try {
    const signed = signer.sign(pdfBuffer, { key: privateKeyPem, cert: certPem, passphrase: '' });
    return Buffer.isBuffer(signed) ? signed : Buffer.from(signed);
  } catch (pemErr) {
    await AuditTrail.create({ envelopeId, recipientId, action: 'PEM_SIGNING_FAILED', details: { error: pemErr.message } }).catch(() => {});
    try {
      const p12Buffer = createP12FromPem(privateKeyPem, certPem, fallbackPassword);
      const signed = signer.sign(pdfBuffer, p12Buffer, { passphrase: fallbackPassword });
      return Buffer.isBuffer(signed) ? signed : Buffer.from(signed);
    } catch (p12Err) {
      await AuditTrail.create({ envelopeId, recipientId, action: 'P12_SIGNING_FAILED', details: { error: p12Err.message } }).catch(() => {});
      throw new Error('PDF signing failed (PEM & P12 fallback failed): ' + (p12Err.message || pemErr.message));
    }
  }
}

async function initiateRecipientSignature({fieldId, envelopeId, documentId, recipientId, signatureImageBase64, selfValue }) {
  let sField = await SignatureFields.findOne({ _id: fieldId });
  if (!sField) {
    sField = await SignatureFields.create({ envelopeId, documentId, recipientId, page: 1, x: 50, y: 50, width: 150, height: 40, type: 'signature', status: 'pending' });
  }
  if(selfValue !== "1"){ 
    if (signatureImageBase64) {
      sField.signature = signatureImageBase64;
      sField.status = 'completed';
      await sField.save();
      await AuditTrail.create({ envelopeId, recipientId, action: 'VISUAL_SIGNATURE_SAVED', details: { signaturePresent: true } }).catch(() => {});
    }
    const rp = await RecipientPermission.findOne({ envelopeId, recipientId });
    if (rp) {
      rp.status = 'completed';
      await rp.save();
    }
  }else{
    if (signatureImageBase64) {
        const rp = await selfSigner.findOne({ _id:recipientId });
        if (rp) {
          rp.signature = signatureImageBase64;
          rp.status = 'submitted';
          await rp.save();
          await AuditTrail.create({ envelopeId, recipientId, action: 'VISUAL_SIGNATURE_SAVED', details: { signaturePresent: true } }).catch(() => {});
        }
    }
  }

  try {
    const pseudoSig = { envelopeId: envelopeId, recipientId, note: 'visual-signature' };
    const tsaRes = await requestTimestamp({ metadata: pseudoSig }).catch(() => null);
    await AuditTrail.create({ envelopeId, recipientId, action: 'TSA_VISUAL_ATTEMPT', details: { ok: !!tsaRes } }).catch(() => {});
  } catch (e) {
    await AuditTrail.create({ envelopeId, recipientId, action: 'TSA_VISUAL_FAILED', details: { error: e.message } }).catch(() => {});
  }

  return { signatureField: sField };
}

async function prepareDocumentForFinalSigning(envelopeId, documentId) {
  const docRecord = await Document.findById(documentId);
  if (!docRecord) throw new Error('Document not found');
  if (!docRecord.filePath || !fs.existsSync(docRecord.filePath)) throw new Error('Original document file missing');

  let pdfBuffer = fs.readFileSync(docRecord.filePath);
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  const sigFields = await SignatureFields.find({ documentId }).sort({ order: 1, _id: 1 }).lean();

  for (const f of sigFields) {
    if (!f.signature) continue;
    try {
      const pageIndex = Math.max(0, (f.page ? Number(f.page) - 1 : 0));
      const page = pdfDoc.getPages()[pageIndex] || pdfDoc.getPages()[0];
      const x = Number(f.x || 50);
      const w = Number(f.width || 150);
      const h = Number(f.height || 40);
      const topY = Number(f.y || 50);
      const y = page.getHeight() - topY - h;
      const imageBuffer = Buffer.from((f.signature || '').split(',')[1] || '', 'base64');
      if (imageBuffer.length === 0) continue;
      const img = await pdfDoc.embedPng(imageBuffer);
      page.drawImage(img, { x, y, width: w, height: h });
    } catch (e) {
      await AuditTrail.create({ envelopeId, recipientId: f.recipientId, action: 'EMBED_IMAGE_FAILED', details: { error: e.message, fieldId: f._id } }).catch(() => {});
    }
  }

  const normalizedBytes = await pdfDoc.save({ useObjectStreams: false });
  let workingBuffer = Buffer.from(normalizedBytes);

  for (const f of sigFields) {
    const targetPage = Math.max(1, Number(f.page || 1));
    const x = Number(f.x || 50);
    const y = Number(f.y || 50);
    const w = Number(f.width || 150);
    const h = Number(f.height || 40);
    const placeholderField = {
      page: targetPage,
      x,
      y,
      width: w,
      height: h,
      name: `sig_${String(f._id)}`,
      reason: `Signature placeholder for recipient ${f.recipientId}`,
      // increase reserved bytes here too
      signatureLength: 65536
    };
    try {
      workingBuffer = await addPlaceholderToPdf(workingBuffer, placeholderField);
    } catch (e) {
      await AuditTrail.create({ envelopeId, recipientId: f.recipientId, action: 'PLACEHOLDER_ADD_FAILED', details: { error: e.message, fieldId: f._id } }).catch(() => {});
    }
  }

  const outName = `prepared_${Date.now()}_${path.basename(docRecord.filePath)}`;
  const preparedDir = path.join(process.cwd(), 'uploads', 'prepared');
  if (!fs.existsSync(preparedDir)) fs.mkdirSync(preparedDir, { recursive: true });
  const outPath = path.join(preparedDir, outName);
  fs.writeFileSync(outPath, workingBuffer);

  docRecord.preparedDoc = outPath;
  await docRecord.save();

  await AuditTrail.create({ envelopeId, action: 'DOCUMENT_PREPARED', details: { preparedPath: outPath } }).catch(() => {});

  return { preparedPath: outPath };
}

async function finalizeSigning(envelopeId, documentId) {
  const docRecord = await Document.findById(documentId);
  if (!docRecord) throw new Error('Document not found');
  if (!docRecord.preparedDoc || !fs.existsSync(docRecord.preparedDoc)) throw new Error('Prepared document not found. Call prepareDocumentForFinalSigning first.');

  let pdfBuffer = fs.readFileSync(docRecord.preparedDoc);

  const sigFields = await SignatureFields.find({ documentId }).sort({ order: 1, _id: 1 });

  for (const field of sigFields) {
    const certDoc = await Certificate.findOne({ recipientId: field.recipientId, envelopeId: envelopeId }).sort({ createdAt: -1 });
    if (!certDoc) {
      await AuditTrail.create({ envelopeId, recipientId: field.recipientId, action: 'NO_CERT_FOUND', details: { fieldId: field._id } }).catch(() => {});
      continue;
    }

    const encPrivateKey = certDoc.privateKey;
    const decPrivateKey = decrypt(encPrivateKey);
    const rawPrivateKey = decPrivateKey;
    const rawCertPem = certDoc.certPem || certDoc.cert || certDoc.certificate;
    if (!rawPrivateKey || !rawCertPem) {
      await AuditTrail.create({ envelopeId, recipientId: field.recipientId, action: 'CERT_MALFORMED', details: { fieldId: field._id } }).catch(() => {});
      continue;
    }

    const privateKeyPem = normalizePem(rawPrivateKey);
    const certPem = normalizePem(rawCertPem);

    try {
      const signedBuffer = await signPdfWithCert(pdfBuffer, privateKeyPem, certPem, envelopeId, field.recipientId);

      const signedHash = hashBuffer(signedBuffer);

      const saved = await saveSignedPdf(envelopeId, documentId, signedBuffer);
      const relativePath = saved.filePath;

      const sigRecord = await DigitalSignature.create({
        envelopeId,
        recipientId: field.recipientId,
        certificateId: certDoc._id,
        signatureValue: signedHash,
        signedAt: new Date(),
        hashAlgorithm: 'SHA256',
        pdfHash: signedHash
      });

      try {
        const tsaRes = await requestTimestamp({ digitalSignatureId: sigRecord._id });
        if (tsaRes && tsaRes.token) {
          sigRecord.tsaToken = tsaRes.token;
          await sigRecord.save();
          await AuditTrail.create({ envelopeId, recipientId: field.recipientId, action: 'TSA_TOKEN_ATTACHED', details: { signatureId: sigRecord._id } }).catch(() => {});
        }
      } catch (tsaErr) {
        await AuditTrail.create({ envelopeId, recipientId: field.recipientId, action: 'TSA_REQUEST_FAILED', details: { error: tsaErr.message } }).catch(() => {});
      }

      field.status = 'completed';
      await field.save();

      const rp = await RecipientPermission.findOne({ envelopeId, recipientId: field.recipientId });
      if (rp) {
        rp.status = 'completed';
        await rp.save();
      }
      await AuditTrail.create({ envelopeId, recipientId: field.recipientId, action: 'DOC_SIGNED', details: { signatureId: sigRecord._id, savedPath: relativePath, pdfHash: signedHash } }).catch(() => {});

      pdfBuffer = signedBuffer;
    } catch (e) {
      await AuditTrail.create({ envelopeId, recipientId: field.recipientId, action: 'SIGNING_FAILED', details: { error: e.message, fieldId: field._id } }).catch(() => {});
      continue;
    }
  }

  const finalSaved = await saveSignedPdf(envelopeId, documentId, pdfBuffer);
  if (finalSaved) {
    docRecord.signedFilePath = finalSaved.filePath;
    docRecord.signedFileName = finalSaved.fileName;
    docRecord.signedFileSize = finalSaved.size;
    await docRecord.save();
    await AuditTrail.create({ envelopeId, action: 'FINAL_SIGNED_SAVED', details: { path: finalSaved.filePath } }).catch(() => {});
  }

  return { finalPath: docRecord.signedFilePath };
}

module.exports = {
  initiateRecipientSignature,
  prepareDocumentForFinalSigning,
  finalizeSigning
};
