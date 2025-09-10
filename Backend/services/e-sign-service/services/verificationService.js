// services/verificationService.js
const fs = require('fs');
const crypto = require('crypto');
const forge = require('node-forge');

const Document = require('../models/Document');
const { DigitalSignature } = require('../models/DigitalSignature');
const { Certificate } = require('../models/Certificate');

/**
 * Compute SHA256 hex digest of a Buffer
 */
function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Find ByteRange and Contents hex in PDF buffer.
 * Returns { byteRange: [a,b,c,d], contentsHex: 'abcd...' } or null
 */
function extractPdfSignatureParts(pdfBuf) {
  const pdf = pdfBuf.toString('binary'); // preserve raw bytes
  // Find /ByteRange[ ... ] pattern
  const byteRangeMatch = /\/ByteRange\s*\[\s*([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s*\]/.exec(pdf);
  if (!byteRangeMatch) return null;

  const byteRange = [
    parseInt(byteRangeMatch[1], 10),
    parseInt(byteRangeMatch[2], 10),
    parseInt(byteRangeMatch[3], 10),
    parseInt(byteRangeMatch[4], 10)
  ];

  // Find /Contents <...> — hex with optional whitespace/newlines
  // We search near the byteRange match position for robustness
  const searchStart = Math.max(0, byteRangeMatch.index - 500);
  const searchStr = pdf.slice(searchStart, searchStart + 2000);
  const contentsMatch = /\/Contents\s*<([0-9A-Fa-f\s\r\n\t]+)>/.exec(searchStr);
  if (!contentsMatch) {
    // fallback: try global search
    const contentsMatch2 = /\/Contents\s*<([0-9A-Fa-f\s\r\n\t]+)>/.exec(pdf);
    if (!contentsMatch2) return { byteRange, contentsHex: null };
    return { byteRange, contentsHex: contentsMatch2[1].replace(/\s+/g, '') };
  }

  const contentsHex = contentsMatch[1].replace(/\s+/g, '');
  return { byteRange, contentsHex };
}

/**
 * Convert hex string to binary string for forge consumption
 */
function bufferFromHexString(hexStr) {
  return Buffer.from(hexStr, 'hex');
}

/**
 * Parse PKCS#7 (CMS) blob from DER buffer using node-forge
 * Returns { certificates: [ {pem, subject, serial} ], signerInfos: [...] } or throws
 */
function parsePkcs7FromDer(derBuffer) {
  // node-forge expects binary string
  const binary = derBuffer.toString('binary');
  const asn1 = forge.asn1.fromDer(binary);
  const p7 = forge.pkcs7.messageFromAsn1(asn1);

  const certs = (p7.certificates || []).map((c) => {
    return {
      pem: forge.pki.certificateToPem(c),
      subject: c.subject.attributes.map(a => `${a.name}=${a.value}`).join(', '),
      serial: c.serialNumber
    };
  });

  // signerInfos accessible via p7.rawCapture? node-forge doesn't expose high-level signerinfo easily
  // We'll return certs which is usually enough to identify the signer
  return { certificates: certs, raw: p7 };
}

/**
 * Main verification function:
 * - signedDocumentId: the Document id of the signed PDF OR pass documentId and signatureId
 */
async function verifySignedDocumentBySignedDocId(signedDocumentId) {
  // 1. find Document
  const doc = await Document.findById(signedDocumentId);
  if (!doc) throw new Error('Signed document not found');

  if (!doc.filePath || !fs.existsSync(doc.filePath)) {
    throw new Error('Signed PDF file not found at path: ' + doc.filePath);
  }

  // 2. find matching DigitalSignature record(s) for this document
  const signatures = await DigitalSignature.find({ envelopeId: doc.envelopeId, pdfHash: { $exists: true } }).lean();
  // Note: you may want to link DigitalSignature to signedDocumentId directly; adapt if you have that relation.

  // 3. read file and compute hash
  const pdfBuffer = fs.readFileSync(doc.filePath);
  const computedHash = sha256Hex(pdfBuffer);

  // 4. extract PDF signature parts
  const sigParts = extractPdfSignatureParts(pdfBuffer);
  const signatureFound = !!(sigParts && sigParts.contentsHex);

  let embeddedCertInfo = null;
  let embeddedCertPem = null;
  let signerCertSerial = null;

  if (signatureFound) {
    try {
      const derBuf = bufferFromHexString(sigParts.contentsHex);
      const parsed = parsePkcs7FromDer(derBuf);
      if (parsed.certificates && parsed.certificates.length > 0) {
        embeddedCertInfo = parsed.certificates[0]; // usual case: signer cert is first
        embeddedCertPem = embeddedCertInfo.pem;
        signerCertSerial = embeddedCertInfo.serial;
      }
    } catch (err) {
      // parsing failed — keep moving
      embeddedCertInfo = { error: 'Failed to parse PKCS7: ' + err.message };
    }
  }

  // 5. find DB signature record that matches computedHash (best heuristic)
  const matchingSig = await DigitalSignature.findOne({ pdfHash: computedHash }).lean();

  // 6. find stored certificate (if matchingSig exists)
  let storedCert = null;
  if (matchingSig) {
    storedCert = await Certificate.findById(matchingSig.certificateId).lean();
  }

  // 7. compare embedded cert serial vs stored cert serial (if available)
  let signerCertMatch = false;
  if (embeddedCertInfo && embeddedCertInfo.serial && storedCert && storedCert.certSerial) {
    // Normalize both serials: node-forge outputs hex serial w/out leading 0x sometimes
    const a = embeddedCertInfo.serial.replace(/^0+/, '').toLowerCase();
    const b = String(storedCert.certSerial || '').replace(/^0+/, '').toLowerCase();
    signerCertMatch = (a === b);
  } else if (embeddedCertPem && storedCert && storedCert.certPem) {
    // fallback compare PEM
    signerCertMatch = (embeddedCertPem.trim() === storedCert.certPem.trim());
  }

  return {
    signedDocumentId: signedDocumentId,
    computedHash,
    signatureFound,
    byteRange: sigParts ? sigParts.byteRange : null,
    embeddedCertInfo,
    matchingSignatureRecord: matchingSig || null,
    storedCertificate: storedCert || null,
    signerCertMatch,
    notes: [
      signatureFound ? 'Signature blob located in PDF' : 'No signature blob found in PDF',
      matchingSig ? 'Found DigitalSignature record with matching pdfHash' : 'No matching DigitalSignature record for computed hash',
      signerCertMatch ? 'Embedded signer cert matches stored certificate' : 'Embedded signer cert DOES NOT match stored certificate (or stored cert missing)'
    ]
  };
}

module.exports = { verifySignedDocumentBySignedDocId };
