const fs = require('fs');
const { plainAddPlaceholder } = require('node-signpdf/dist/helpers');
const { PDFDocument } = require('pdf-lib');
const SignatureFields = require('../models/SignatureFields');
const Document = require('../models/Document');

async function preparePlaceholdersForDocument(documentId, options = {}) {
  const signatureLength = options.signatureLength || 64000;

  const docRecord = await Document.findById(documentId);
  if (!docRecord) throw new Error('Document not found: ' + documentId);
  if (!docRecord.filePath || !fs.existsSync(docRecord.filePath)) {
    throw new Error('Document file not found at path: ' + docRecord.filePath);
  }

  const fields = await SignatureFields.find({ documentId, type: 'signature' }).sort({ order: 1, createdAt: 1 }).lean();
  if (!fields.length) {
    throw new Error('No signature fields found for document: ' + documentId);
  }

  let pdfBuffer = fs.readFileSync(docRecord.filePath);
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  for (let idx = 0; idx < fields.length; idx++) {
    const f = fields[idx];
    const placeholderName = f.placeholderName || `sig_${documentId}_${idx + 1}`;

    const pageIndex = Math.max(0, (f.page ? Number(f.page) - 1 : 0));
    const page = pdfDoc.getPages()[pageIndex];
    const pageHeight = page.getHeight();

    const x = Number(f.x || 50);
    const w = Number(f.width || 150);
    const h = Number(f.height || 40);
    const topY = Number(f.y || 50);
    const yBottom = pageHeight - topY - h;

    const rect = [x, yBottom, x + w, yBottom + h];

    const placeholderOptions = {
      pdfBuffer,
      reason: `Placeholder ${placeholderName}`,
      signatureLength,
      rect,
      page: pageIndex + 1,
      name: placeholderName
    };

    pdfBuffer = plainAddPlaceholder(placeholderOptions);

    if (!f.placeholderName) {
      await SignatureFields.findByIdAndUpdate(f._id, { $set: { placeholderName } });
    }
  }

  fs.writeFileSync(docRecord.filePath, pdfBuffer);

  await Document.findByIdAndUpdate(documentId, { $set: { placeholdersPrepared: true } });

  return { filePath: docRecord.filePath, placeholderCount: fields.length };
}

module.exports = { preparePlaceholdersForDocument };
