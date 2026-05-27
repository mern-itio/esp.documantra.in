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
const { PDFDocument, rgb } = require('pdf-lib');
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
const Cycle = require('../models/Cycle');

const signer = new SignPdf();

// Match frontend base page width so coordinates scale identically
const BASE_PAGE_WIDTH = 800;
// Small nudge (in frontend pixels) to correct minor alignment differences
const NUDGE_PX_X = 3; // move right by 3 frontend pixels
const NUDGE_PX_Y = 3; // move down by 3 frontend pixels
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

async function signPdfWithCert(pdfBuffer, privateKeyPem, certPem, options = {}) {
  const envelopeId = options && options.envelopeId ? options.envelopeId : undefined;
  const recipientId = options && options.recipientId ? options.recipientId : undefined;
  const placeholderName = options && options.placeholderName ? options.placeholderName : undefined;
  const fallbackPassword = options && options.fallbackPassword ? options.fallbackPassword : 'changeit';

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
          rp.status = 'submitted';
          
          // Update signatureFields array to mark this field as signed
          if (fieldId && sField) {
            const existingFieldEntry = rp.signatureFields.find(
              (sf) => sf.fieldId && sf.fieldId.toString() === sField._id.toString()
            );
            
            if (existingFieldEntry) {
              existingFieldEntry.state = 'signed';
              existingFieldEntry.signedAt = new Date();
            } else {
              rp.signatureFields.push({
                fieldId: sField._id,
                state: 'signed',
                signedAt: new Date()
              });
            }
          }
          
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


async function prepareDocumentForFinalSigning(
  envelopeId,
  documentId,
  cycleId,
  isSelfSign = false
) {
  const docRecord = await Document.findById(documentId);
  if (!docRecord) throw new Error('Document not found');
  const localPath = decodeURIComponent(docRecord.filePath.split('/uploads/')[1] || '');

const actualPath = `/app/services/e-sign-service/uploads/${localPath}`;

console.log('Checking actual path:', actualPath);

if (!fs.existsSync(actualPath)) {
    throw new Error('Original document file missing');
}

docRecord.filePath = actualPath;

  const pdfBuffer = fs.readFileSync(docRecord.filePath);
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  const allFields = await SignatureFields
    .find({ documentId })
    .sort({ order: 1, _id: 1 })
    .lean();

  /* ---------------- RESOLVE VALUES ---------------- */

  const resolvedFieldMap = new Map();

  if (isSelfSign && cycleId) {
    const cycle = await Cycle.findById(cycleId)
      .populate({
        path: 'signers',
        model: 'SelfSigner',
        options: { sort: { signingOrder: 1 } }
      })
      .lean();

    if (!cycle) throw new Error('Cycle not found');

    for (const signer of cycle.signers || []) {
      for (const f of signer.nonSignatureFields || []) {
        resolvedFieldMap.set(String(f.fieldId), {
          type: 'text',
          value: f.value
        });
      }

      if (signer.signature) {
        for (const f of signer.signatureFields || []) {
          resolvedFieldMap.set(String(f.fieldId), {
            type: 'signature',
            value: signer.signature
          });
        }
      }
    }
  }

  /* 🔥 CRITICAL STEP — FLATTEN FORM */
  try {
    const form = pdfDoc.getForm();
    form.flatten();
  } catch (e) {
    // no form present — safe to ignore
  }
  /* ---------------- EMBED VALUES ---------------- */

  for (const f of allFields) {
    const resolved = isSelfSign
      ? resolvedFieldMap.get(String(f._id))
      : (f.value || f.signature
          ? { type: f.type, value: f.value || f.signature }
          : null);

    if (!resolved || !resolved.value) continue;
    const rawX = Number(f.x || 50);
    const rawY = Number(f.y || 50);
    const rawW = Number(f.width || 150);
    const rawH = Number(f.height || 40);
    const pageIndex = Math.max(0, Number(f.page || 1) - 1);
    const page = pdfDoc.getPages()[pageIndex] || pdfDoc.getPages()[0];

    // Scale coordinates from frontend base (pixels @ BASE_PAGE_WIDTH) to PDF points
    const scale = page.getWidth() / BASE_PAGE_WIDTH;
    const x = rawX * scale;
    const w = Math.max(1, rawW * scale);
    const h = Math.max(1, rawH * scale);
    const yTop = rawY * scale;
    const y = page.getHeight() - yTop - h + NUDGE_PX_Y;

    const isDataImage =
      typeof resolved.value === 'string' && resolved.value.startsWith('data:image');

    // Embed image for signature/stamp/initial if value is a data URL.
    if (isDataImage && ['signature', 'stamp', 'initial'].includes(String(resolved.type))) {
      const dataUrl = resolved.value;
      const b64 = dataUrl.split(',')[1] || '';
      const bytes = Buffer.from(b64, 'base64');
      const mime = (dataUrl.split(';')[0] || '').toLowerCase(); // e.g. "data:image/png"

      let img;
      if (mime.includes('image/jpeg') || mime.includes('image/jpg')) {
        img = await pdfDoc.embedJpg(bytes);
      } else {
        img = await pdfDoc.embedPng(bytes);
      }

      page.drawImage(img, { x, y, width: w, height: h });
    } else {
      // scale text size to match frontend appearance
      const textSize = Math.max(8, 10 * (page.getWidth() / BASE_PAGE_WIDTH));
      page.drawText(String(resolved.value), {
        x,
        y,
        size: textSize,
        color: rgb(0, 0, 0)
      });
    }
  }

  /* ---------------- NORMALIZE ---------------- */

  let workingBuffer = Buffer.from(
    await pdfDoc.save({ useObjectStreams: false })
  );

  /* ---------------- PLACEHOLDERS  ---------------- */
   
  const sigFields = allFields.filter(f => f.type === 'signature');

  for (const f of sigFields) {
  const pageIndex = Math.max(0, Number(f.page || 1) - 1);
  const page = pdfDoc.getPages()[pageIndex] || pdfDoc.getPages()[0];

  const scale = page.getWidth() / BASE_PAGE_WIDTH;

  const px = f.x * scale;
  const pw = f.width * scale;
  const ph = f.height * scale;
  const py = page.getHeight() - (f.y * scale) - ph + NUDGE_PX_Y;

    const placeholderField = {
      page: pageIndex + 1,
      x: px,
      y: py,
      width: pw,
      height: ph,
      name: `sig_${f._id}`,
      reason: `Signature placeholder for field ${f._id}`,
      signatureLength: 65536,
    };


    try {
      workingBuffer = await addPlaceholderToPdf(
        workingBuffer,
        placeholderField
      );
    } catch (e) {
      await AuditTrail.create({
        envelopeId,
        action: 'PLACEHOLDER_ADD_FAILED',
        details: {
          fieldId: f._id,
          error: e.message,
        },
      }).catch(() => {});
    }
  }

  /* ---------------- SAVE ---------------- */

  const preparedDir = path.join(process.cwd(), 'uploads', 'prepared');
  if (!fs.existsSync(preparedDir)) {
    fs.mkdirSync(preparedDir, { recursive: true });
  }
  const outPath = path.join(
    preparedDir,
    `${isSelfSign ? 'cycle' : 'prepared'}_${Date.now()}_${path.basename(docRecord.filePath)}`
  );

  fs.writeFileSync(outPath, workingBuffer);

  if (isSelfSign) {
    await Cycle.findByIdAndUpdate(cycleId, { preparedDoc: outPath });
  } else {
    docRecord.preparedDoc = outPath;
    await docRecord.save();
  }

  return { preparedPath: outPath };
}




async function finalizeSigning(envelopeId, documentId,cycleId=null, isSelfSign = false) {
  let docRecord = null;
  if(!isSelfSign && !cycleId){
     docRecord = await Document.findById(documentId);
    if (!docRecord) throw new Error('Document not found');
    if (!docRecord.preparedDoc || !fs.existsSync(docRecord.preparedDoc)) throw new Error('Prepared document not found. Call prepareDocumentForFinalSigning first.');
  }else{
     docRecord = await Cycle.findById(cycleId);
    if (!docRecord) throw new Error('Cycle not found');
    if (!docRecord.preparedDoc || !fs.existsSync(docRecord.preparedDoc)) throw new Error('Prepared document not found in Cycle. Call prepareDocumentForFinalSigning first.');

  }
  // Read the current prepared (or partially-signed) PDF
  let pdfBuffer = fs.readFileSync(docRecord.preparedDoc);

  // Only process signature-type fields that are not yet completed
  const sigFields = await SignatureFields.find({
    documentId,
    type: 'signature'
  }).sort({ order: 1, _id: 1 });
  // Find all signers using cycleId if self-sign
  const signerByFieldId = new Map();
  if (isSelfSign && cycleId) {
    const cycle = await Cycle.findById(cycleId)
      .populate({
        path: 'signers',
        model: 'SelfSigner',
        options: { sort: { signingOrder: 1 } }
      })
      .lean();
      for (const signer of cycle.signers) {
        for (const sf of signer.signatureFields || []) {
          signerByFieldId.set(
            sf.fieldId.toString(),
            signer
          );
        }
      }
  }
  for (const field of sigFields) {
    // The placeholder name must match what prepareDocumentForFinalSigning created:
    const placeholderName = `sig_${String(field._id)}`;
      let recipientIdToUse = field.recipientId;
      // Self-sign override
      if (isSelfSign && cycleId) {
        const signer = signerByFieldId.get(field._id.toString());
        if (!signer) {
          await AuditTrail.create({
            envelopeId,
            action: 'NO_SIGNER_FOR_FIELD',
            details: { fieldId: field._id }
          }).catch(() => {});
          continue;
        }

        recipientIdToUse = signer._id;
      }
    // load the certificate for this recipient
    const certDoc = await Certificate.findOne({ recipientId: recipientIdToUse, envelopeId }).sort({ createdAt: -1 });
    if (!certDoc) {
      await AuditTrail.create({ envelopeId, recipientId: recipientIdToUse, action: 'NO_CERT_FOUND', details: { fieldId: field._id } }).catch(() => {});
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
      // IMPORTANT: signPdfWithCert MUST accept and use the placeholderName so it signs the specific placeholder
      // and must perform an incremental/append signature that preserves prior signatures.
      // I call it with an options object; update signPdfWithCert accordingly if necessary.
      const signedBuffer = await signPdfWithCert(pdfBuffer, privateKeyPem, certPem, {
        envelopeId,
        recipientId: recipientIdToUse,
        placeholderName // crucial
      });

      // compute hash for audit & DB
      const signedHash = hashBuffer(signedBuffer);

      // Save an archive copy for this signature (optional but good for audits)
      // saveSignedPdf might already create a new file; keep that behavior to maintain history
      const archiveSaved = await saveSignedPdf(envelopeId, documentId, signedBuffer);

      // Overwrite the preparedDoc so the next signer gets the updated PDF (single evolving file)
      try {
        // if you want to keep preparedDoc path stable, overwrite it directly
        fs.writeFileSync(docRecord.preparedDoc, signedBuffer);
        // ensure any returned save path is used for docRecord.preparedDoc if you prefer that
        // docRecord.preparedDoc = archiveSaved.filePath || docRecord.preparedDoc;
        await docRecord.save();
      } catch (fsErr) {
        // If overwriting fails, record and continue (but this is serious)
        await AuditTrail.create({ envelopeId, recipientId: field.recipientId, action: 'PREPARED_OVERWRITE_FAILED', details: { error: fsErr.message, fieldId: field._id } }).catch(() => {});
      }

      // create DigitalSignature record
      const sigRecord = await DigitalSignature.create({
        envelopeId,
        recipientId: recipientIdToUse,
        certificateId: certDoc._id,
        signatureValue: signedHash,
        signedAt: new Date(),
        hashAlgorithm: 'SHA256',
        pdfHash: signedHash
      });

      // Optional: request TSA token and attach
      try {
        const tsaRes = await requestTimestamp({ digitalSignatureId: sigRecord._id });
        if (tsaRes && tsaRes.token) {
          sigRecord.tsaToken = tsaRes.token;
          await sigRecord.save();
          await AuditTrail.create({ envelopeId, recipientId: field.recipientId, action: 'TSA_TOKEN_ATTACHED', details: { signatureId: sigRecord._id } }).catch(() => {});
        }
      } catch (tsaErr) {
        await AuditTrail.create({ envelopeId, recipientId: field.recipientId, action: 'TSA_REQUEST_FAILED', details: { error: tsaErr.message }}).catch(()=>{});
      }

      // mark field completed
      if(!isSelfSign){
        field.status = 'completed';
        await field.save();

        // update recipient permission
        const rp = await RecipientPermission.findOne({ envelopeId, recipientId: field.recipientId });
        if (rp) {
          rp.status = 'completed';
          await rp.save();
        }
      }
      await AuditTrail.create({ envelopeId, recipientId: recipientIdToUse, action: 'DOC_SIGNED', details: { signatureId: sigRecord._id, savedPath: archiveSaved?.filePath, pdfHash: signedHash } }).catch(() => {});

      // update pdfBuffer to the newly signed PDF for the next signer
      pdfBuffer = signedBuffer;

    } catch (e) {
      // If signing failed, audit and continue with the next recipient
      await AuditTrail.create({ envelopeId, recipientId: recipientIdToUse, action: 'SIGNING_FAILED', details: { error: e.message, fieldId: field._id } }).catch(() => {});
      continue;
    }
  }

  // All individual signatures attempted — the docRecord.preparedDoc file should now be the latest signed PDF.
  // If you want a 'final' signed copy (move to signedFilePath), create or save it now:
  try {
    const finalSaved = await saveSignedPdf(envelopeId, documentId, fs.readFileSync(docRecord.preparedDoc));
    if (finalSaved) {
      docRecord.signedFilePath = finalSaved.filePath;
      docRecord.signedFileName = finalSaved.fileName;
      docRecord.signedFileSize = finalSaved.size;
      // Optionally: clear preparedDoc if you want to mark it as finalized
      // docRecord.preparedDoc = undefined;
      await docRecord.save();
      await AuditTrail.create({ envelopeId, action: 'FINAL_SIGNED_SAVED', details: { path: finalSaved.filePath } }).catch(() => {});
    }
  } catch (finalErr) {
    await AuditTrail.create({ envelopeId, action: 'FINAL_SAVE_FAILED', details: { error: finalErr.message } }).catch(() => {});
  }

  // Optional: release the lock here (if you implemented locking)
  return { finalPath: docRecord.signedFilePath,signedFileName:docRecord.signedFileName};
}


module.exports = {
  initiateRecipientSignature,
  prepareDocumentForFinalSigning,
  finalizeSigning
};
