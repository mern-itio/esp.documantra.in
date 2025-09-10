// services/digitalSignatureService.js
const fs = require('fs');
const os = require('os');
const path = require('path');

const { PDFDocument } = require('pdf-lib');
const { SignPdf } = require('node-signpdf');
const plainAddPlaceholder = require('node-signpdf/dist/helpers').plainAddPlaceholder;
const forge = require('node-forge');

const { saveSignedPdf } = require('./storageService'); // your existing utility
const { hashBuffer } = require('../utils/hashUtil');
const { Certificate } = require('../models/Certificate');
const Document = require('../models/Document');
const DigitalSignature = require('../models/DigitalSignature');
const { AuditTrail } = require('../models/AuditTrail');
const SignatureFields = require('../models/SignatureFields');
const { requestTimestamp } = require('./tsaService');
const { decrypt } = require('../utils/keyEncryption');

const signer = new SignPdf();

/**
 * Normalize PEM string endings
 */
function normalizePem(pem) {
  if (!pem) return pem;
  return pem.toString().replace(/\r/g, '\n').replace(/\n+/g, '\n').trim() + '\n';
}

/**
 * Rebuild PDF into a fresh PDFDocument (normalizes xref / broken refs)
 * then add a ByteRange placeholder using node-signpdf helper at given rect/page.
 *
 * sField can be null; if so a default small placeholder on page 1 is inserted.
 * sField expected: { x, y, width, height, page } where y is top-origin (UI).
 */
async function rebuildPdfAndAddPlaceholder(originalPdfBuffer, sField, signerName) {
  // 1) load (try normal, fallback to ignoreEncryption)
  let loaded;
  try {
    loaded = await PDFDocument.load(originalPdfBuffer);
  } catch (err) {
    // try ignoring encryption if that's the reason
    if (err && /encrypted/i.test(err.message)) {
      loaded = await PDFDocument.load(originalPdfBuffer, { ignoreEncryption: true });
    } else {
      throw err;
    }
  }

  // 2) create new PDF and copy pages to normalize structure
  const newPdf = await PDFDocument.create();
  const pageCount = loaded.getPageCount();
  const indices = Array.from({ length: pageCount }, (_, i) => i);
  const copiedPages = await newPdf.copyPages(loaded, indices);
  copiedPages.forEach((p) => newPdf.addPage(p));

  // 3) compute rect
  const targetPageIndex = Math.max(0, (sField && sField.page ? Number(sField.page) - 1 : 0));
  const targetPage = copiedPages[targetPageIndex] || copiedPages[0];
  const { width: pageWidth, height: pageHeight } = targetPage.getSize();

  const x = Number((sField && sField.x) || 50);
  const w = Number((sField && sField.width) || 150);
  const h = Number((sField && sField.height) || 40);

  // assume stored y is top-origin (common in UIs). Convert to bottom-origin used in pdf-lib.
  const topY = Number((sField && sField.y) || 50);
  const y = pageHeight - topY - h;

  // 4) save normalized PDF
  const normalizedBytes = await newPdf.save({ useObjectStreams: false });
  const normalizedBuffer = Buffer.from(normalizedBytes);

  // 5) create placeholder using plainAddPlaceholder (page is 1-indexed)
  const placeholderOptions = {
    pdfBuffer: normalizedBuffer,
    reason: signerName ? `Signed by ${signerName}` : 'Signed by recipient',
    name: signerName || 'Signer',
    signatureLength: 8192,
    rect: [x, y, x + w, y + h],
    page: targetPageIndex + 1
  };

  // plainAddPlaceholder returns a Buffer with ByteRange and empty signature slot
  const withPlaceholder = plainAddPlaceholder(placeholderOptions);
  return withPlaceholder;
}

/**
 * Create a PKCS#12 (p12) Buffer from PEM key+cert using node-forge
 * (pure JS fallback — avoids calling external openssl).
 *
 * Returns Buffer
 */
function createP12FromPem(privateKeyPem, certPem, password = 'changeit') {
  // parse
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const cert = forge.pki.certificateFromPem(certPem);

  // create PFX
  const newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
    privateKey,
    [cert],
    password,
    { generateLocalKeyId: true, friendlyName: 'temp' }
  );
  const newPkcs12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();
  const p12Buffer = Buffer.from(newPkcs12Der, 'binary');
  return p12Buffer;
}

/**
 * Main exported function to sign and embed.
 * params: { envelopeId, documentId, recipientId, certificateId, signerName }
 */
async function signAndEmbed({ envelopeId, documentId, recipientId, certificateId, signerName }) {
  // 0. load certificate record
  const certDoc = await Certificate.findById(certificateId);
  if (!certDoc) throw new Error('Certificate not found');

  // 1. load document record and PDF from disk
  const docRecord = await Document.findById(documentId);
  if (!docRecord) throw new Error('Document not found');

  if (!docRecord.filePath || !fs.existsSync(docRecord.filePath)) {
    throw new Error('Document file not found at path: ' + docRecord.filePath);
  }
  const pdfBuffer = fs.readFileSync(docRecord.filePath);

  // 2. prepare PEM
  const encPrivateKey = certDoc.privateKey;
  const decPrivateKey = decrypt(encPrivateKey);
  const rawPrivateKey = decPrivateKey;
  const rawCertPem = certDoc.certPem || certDoc.cert || certDoc.certificate;
  if (!rawPrivateKey || !rawCertPem) throw new Error('Certificate record missing PEM key or cert');

  const privateKeyPem = normalizePem(rawPrivateKey);
  const certPem = normalizePem(rawCertPem);

  // 3. find signature field coords (if any)
  const sField = await SignatureFields.findOne({ documentId, recipientId, type: 'signature' });

  // 4. rebuild PDF and add placeholder
  let pdfToSignBuffer;
  try {
    pdfToSignBuffer = await rebuildPdfAndAddPlaceholder(pdfBuffer, sField, signerName);
    await AuditTrail.create({ envelopeId, recipientId, action: 'PLACEHOLDER_INJECTED', details: { signatureFieldId: sField?._id?.toString(), documentId }});
  } catch (err) {
    await AuditTrail.create({ envelopeId, recipientId, action: 'PLACEHOLDER_INJECTION_FAILED', details: { error: err.message }});
    throw new Error('Failed to prepare PDF for signing: ' + err.message);
  }

  // 5. try signing with PEM (pass PEM object as 2nd arg)
  let signedPdfBuffer;
  try {
    signedPdfBuffer = signer.sign(pdfToSignBuffer, { key: privateKeyPem, cert: certPem, passphrase: '' });
    if (!Buffer.isBuffer(signedPdfBuffer)) {
      // some environments may return string — convert
      signedPdfBuffer = Buffer.from(signedPdfBuffer);
    }
  } catch (pemErr) {
    // record pem failure
    await AuditTrail.create({ envelopeId, recipientId, action: 'PEM_SIGNING_FAILED', details: { error: pemErr.message }});

    // 6. fallback — create P12 with node-forge and try again
    try {
      const p12Buffer = createP12FromPem(privateKeyPem, certPem, 'changeit');
      signedPdfBuffer = signer.sign(pdfToSignBuffer, p12Buffer, { passphrase: 'changeit' });
      if (!Buffer.isBuffer(signedPdfBuffer)) signedPdfBuffer = Buffer.from(signedPdfBuffer);
      await AuditTrail.create({ envelopeId, recipientId, action: 'P12_SIGNING_SUCCESS', details: { note: 'Used node-forge generated p12' }});
    } catch (p12Err) {
      await AuditTrail.create({ envelopeId, recipientId, action: 'P12_SIGNING_FAILED', details: { error: p12Err.message }});
      throw new Error('PDF signing failed (PEM & P12 fallback failed): ' + (p12Err.message || pemErr.message));
    }
  }

  // 7. compute hash and persist signed PDF
  const signedPdfHash = hashBuffer(signedPdfBuffer);

  const saved = await saveSignedPdf(envelopeId, documentId, signedPdfBuffer);
  const relativePath = saved.filePath;

  const signedDocument = await Document.create({
    envelopeId,
    fileName: saved.fileName,
    filePath: relativePath,
    fileSize: saved.size,
    mimeType: 'application/pdf'
  });
  const signatureRecord = await DigitalSignature.create({
    envelopeId,
    recipientId,
    certificateId,
    signatureValue: signedPdfHash,
    signedAt: new Date(),
    hashAlgorithm: 'SHA256',
    pdfHash: signedPdfHash
  });

  // 8. update signature field
  if (sField) {
    sField.status = 'completed';
    sField.signature = relativePath;
    await sField.save();
  } else {
    await SignatureFields.create({
      envelopeId,
      documentId,
      recipientId,
      page: 1,
      x: 50,
      y: 50,
      width: 150,
      height: 40,
      type: 'signature',
      status: 'completed',
      signature: relativePath
    });
  }

  // 9. audit record
  await AuditTrail.create({
    envelopeId,
    recipientId,
    action: 'DOC_SIGNED',
    details: { signatureId: signatureRecord._id, signedDocumentId: signedDocument._id, pdfHash: signedPdfHash }
  });

  // 10. request TSA (non-fatal)
  try {
    const tsaRes = await requestTimestamp({ digitalSignatureId: signatureRecord._id });
    if (tsaRes && tsaRes.token) {
      signatureRecord.tsaToken = tsaRes.token;
      await signatureRecord.save();
      await AuditTrail.create({ envelopeId, recipientId, action: 'TSA_TOKEN_ATTACHED', details: { signatureId: signatureRecord._id }});
    }
  } catch (tsaErr) {
    await AuditTrail.create({ envelopeId, recipientId, action: 'TSA_REQUEST_FAILED', details: { error: tsaErr.message }});
    // don't throw - signing succeeded
  }

  return {
    signatureRecord,
    signedDocument,
    pdfHash: signedPdfHash,
    tsaAttached: !!signatureRecord.tsaToken
  };
}

module.exports = { signAndEmbed };
