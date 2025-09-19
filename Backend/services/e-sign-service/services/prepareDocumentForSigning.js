// services/prepareDocumentForSigning.js
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const plainAddPlaceholder = require('node-signpdf/dist/helpers').plainAddPlaceholder;
const Document = require('../models/Document');
const SignatureFields = require('../models/SignatureFields');

const DEFAULT_SIGNATURE_LENGTH = 32768; // increased placeholder size to avoid overflow

async function prepareDocumentForSigning(envelopeId, documentId) {
  console.log(`[prepareDocumentForSigning] start for doc ${documentId} envelope ${envelopeId}`);

  const docRecord = await Document.findById(documentId);
  if (!docRecord || !docRecord.filePath || !fs.existsSync(docRecord.filePath)) {
    throw new Error('Original document not found at path: ' + (docRecord?.filePath || 'N/A'));
  }

  const originalPdfBuffer = fs.readFileSync(docRecord.filePath);

  // Rewrite to plain xref (no object streams) so node-signpdf can work reliably.
  const pdfDoc = await PDFDocument.load(originalPdfBuffer, { ignoreEncryption: true });
  const rewrittenBytes = await pdfDoc.save({ useObjectStreams: false });
  let bufferWithPlaceholders = Buffer.from(rewrittenBytes);

  const signatureFields = await SignatureFields.find({ documentId, type: 'signature' }).sort({ _id: 1 });
  if (!signatureFields || !signatureFields.length) {
    // save the rewritten PDF as preparedDoc so later code has consistent file
    const preparedFileNameNoFields = `prepared_${Date.now()}.pdf`;
    const preparedFilePathNoFields = path.join('uploads', 'prepared', preparedFileNameNoFields);
    fs.mkdirSync(path.dirname(preparedFilePathNoFields), { recursive: true });
    fs.writeFileSync(preparedFilePathNoFields, bufferWithPlaceholders);

    docRecord.preparedDoc = preparedFilePathNoFields;
    await docRecord.save();
    console.log('[prepareDocumentForSigning] saved prepared PDF (no signature fields) at:', preparedFilePathNoFields);
    return { preparedFilePath: preparedFilePathNoFields, preparedFileName: preparedFileNameNoFields };
  }

  // Add placeholders in a deterministic order (sorted by _id)
  let idx = 0;
  for (const sField of signatureFields) {
    try {
      const loader = await PDFDocument.load(bufferWithPlaceholders, { ignoreEncryption: true });
      const pages = loader.getPages();
      const pageIndex = Math.max(0, Number(sField.page) - 1);
      if (pageIndex >= pages.length) {
        throw new Error(`Invalid page index ${pageIndex} for signature field ${sField._id}`);
      }
      const pageHeight = pages[pageIndex].getHeight();

      const x = Number(sField.x);
      const w = Number(sField.width);
      const h = Number(sField.height);
      const topY = Number(sField.y);
      const y = pageHeight - topY - h;

      // create a unique placeholder name and persist it for later mapping
      const placeholderName = `sig_${String(sField._id)}`;

      bufferWithPlaceholders = plainAddPlaceholder({
        pdfBuffer: bufferWithPlaceholders,
        reason: `Prepared for ${sField.recipientId}`,
        name: placeholderName,
        signatureLength: DEFAULT_SIGNATURE_LENGTH,
        rect: [x, y, x + w, y + h],
        page: pageIndex + 1
      });

      if (!Buffer.isBuffer(bufferWithPlaceholders)) bufferWithPlaceholders = Buffer.from(bufferWithPlaceholders);

      // persist placeholderName and index to SignatureFields so signing service can cross-check
      await SignatureFields.findByIdAndUpdate(sField._id, {
        $set: { placeholderName, placeholderIndex: idx }
      });

      console.log(`[prepareDocumentForSigning] added placeholder for field ${sField._id} on page ${pageIndex + 1} name=${placeholderName}`);
      idx++;
    } catch (err) {
      console.error(`[prepareDocumentForSigning] failed to add placeholder for field ${sField._id}:`, err);
      throw err;
    }
  }

  // Save prepared PDF
  const preparedFileName = `prepared_${Date.now()}.pdf`;
  const preparedFilePath = path.join('uploads', 'prepared', preparedFileName);
  fs.mkdirSync(path.dirname(preparedFilePath), { recursive: true });
  fs.writeFileSync(preparedFilePath, bufferWithPlaceholders);

  // Update Document record
  docRecord.preparedDoc = preparedFilePath;
  await docRecord.save();

  console.log(`[prepareDocumentForSigning] saved prepared PDF at: ${preparedFilePath}`);
  return { preparedFilePath, preparedFileName };
}

module.exports = { prepareDocumentForSigning };
