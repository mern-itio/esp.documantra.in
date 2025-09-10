const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { SignPdf } = require('node-signpdf');
const plainAddPlaceholder = require('node-signpdf/dist/helpers').plainAddPlaceholder;
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

const signer = new SignPdf();

function normalizePem(pem) {
  if (!pem) return pem;
  return pem.toString().replace(/\r/g, '\n').replace(/\n+/g, '\n').trim() + '\n';
}

function createP12FromPem(privateKeyPem, certPem, password = 'changeit') {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const cert = forge.pki.certificateFromPem(certPem);
  const newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
    privateKey,
    [cert],
    password,
    { generateLocalKeyId: true, friendlyName: 'temp' }
  );
  const newPkcs12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();
  return Buffer.from(newPkcs12Der, 'binary');
}

async function signAndEmbed({ envelopeId, documentId, recipientId, certificateId, signerName, signatureImageBase64 }) {
  const certDoc = await Certificate.findById(certificateId);
  if (!certDoc) throw new Error('Certificate not found');

  const docRecord = await Document.findById(documentId);
  if (!docRecord) throw new Error('Document not found');
  if (!docRecord.filePath || !fs.existsSync(docRecord.filePath)) {
    throw new Error('Document file not found at path: ' + docRecord.filePath);
  }

  const pdfBuffer = fs.readFileSync(docRecord.filePath);

  const encPrivateKey = certDoc.privateKey;
  const decPrivateKey = decrypt(encPrivateKey);
  const rawPrivateKey = decPrivateKey;
  const rawCertPem = certDoc.certPem || certDoc.cert || certDoc.certificate;
  if (!rawPrivateKey || !rawCertPem) throw new Error('Certificate missing PEM key or cert');

  const privateKeyPem = normalizePem(rawPrivateKey);
  const certPem = normalizePem(rawCertPem);

  const sField = await SignatureFields.findOne({ documentId, recipientId, type: 'signature' });

  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  const targetPageIndex = Math.max(0, (sField && sField.page ? Number(sField.page) - 1 : 0));
  const targetPage = pdfDoc.getPages()[targetPageIndex];

  const x = Number((sField && sField.x) || 50);
  const w = Number((sField && sField.width) || 150);
  const h = Number((sField && sField.height) || 40);
  const topY = Number((sField && sField.y) || 50);
  const y = targetPage.getHeight() - topY - h;

  if (signatureImageBase64) {
    const imageBuffer = Buffer.from(signatureImageBase64.split(',')[1], 'base64');
    const signatureImage = await pdfDoc.embedPng(imageBuffer);
    targetPage.drawImage(signatureImage, { x, y, width: w, height: h });
  }

  const normalizedBytes = await pdfDoc.save({ useObjectStreams: false });
  const normalizedBuffer = Buffer.from(normalizedBytes);

  const placeholderOptions = {
    pdfBuffer: normalizedBuffer,
    reason: signerName ? `Signed by ${signerName}` : 'Signed by recipient',
    name: signerName || 'Signer',
    signatureLength: 8192,
    rect: [x, y, x + w, y + h],
    page: targetPageIndex + 1
  };

  const pdfWithPlaceholder = plainAddPlaceholder(placeholderOptions);

  let signedPdfBuffer;
  try {
    signedPdfBuffer = signer.sign(pdfWithPlaceholder, { key: privateKeyPem, cert: certPem, passphrase: '' });
    if (!Buffer.isBuffer(signedPdfBuffer)) {
      signedPdfBuffer = Buffer.from(signedPdfBuffer);
    }
  } catch (pemErr) {
    await AuditTrail.create({ envelopeId, recipientId, action: 'PEM_SIGNING_FAILED', details: { error: pemErr.message } });

    try {
      const p12Buffer = createP12FromPem(privateKeyPem, certPem, 'changeit');
      signedPdfBuffer = signer.sign(pdfWithPlaceholder, p12Buffer, { passphrase: 'changeit' });
      if (!Buffer.isBuffer(signedPdfBuffer)) signedPdfBuffer = Buffer.from(signedPdfBuffer);
      await AuditTrail.create({ envelopeId, recipientId, action: 'P12_SIGNING_SUCCESS', details: { note: 'Used node-forge generated p12' } });
    } catch (p12Err) {
      await AuditTrail.create({ envelopeId, recipientId, action: 'P12_SIGNING_FAILED', details: { error: p12Err.message } });
      throw new Error('PDF signing failed (PEM & P12 fallback failed): ' + (p12Err.message || pemErr.message));
    }
  }

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

  if (sField) {
    sField.status = 'completed';
    sField.signature = signatureImageBase64;
    await sField.save();
    // Make recipient completed in recipientPermission doc.
    const SignedRecipient = await RecipientPermission.findOne({
        envelopeId: sField.envelopeId,
        recipientId:sField.recipientId
      });
      if(SignedRecipient){
        SignedRecipient.status = 'completed';
        await SignedRecipient.save();
      }

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
      signature: signatureImageBase64
    });
  }

  await AuditTrail.create({
    envelopeId,
    recipientId,
    action: 'DOC_SIGNED',
    details: { signatureId: signatureRecord._id, signedDocumentId: signedDocument._id, pdfHash: signedPdfHash }
  });

  try {
    const tsaRes = await requestTimestamp({ digitalSignatureId: signatureRecord._id });
    if (tsaRes && tsaRes.token) {
      signatureRecord.tsaToken = tsaRes.token;
      await signatureRecord.save();
      await AuditTrail.create({ envelopeId, recipientId, action: 'TSA_TOKEN_ATTACHED', details: { signatureId: signatureRecord._id } });
    }
  } catch (tsaErr) {
    await AuditTrail.create({ envelopeId, recipientId, action: 'TSA_REQUEST_FAILED', details: { error: tsaErr.message } });
  }

  return {
    signatureRecord,
    signedDocument,
    pdfHash: signedPdfHash,
    tsaAttached: !!signatureRecord.tsaToken
  };
}

module.exports = { signAndEmbed };
