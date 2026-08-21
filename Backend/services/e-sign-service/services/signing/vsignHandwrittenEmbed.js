const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const {
  HANDWRITTEN_HEIGHT_RATIO,
  computeHandwrittenStripHeight,
} = require('../../utils/vsignAssets');

const BASE_PAGE_WIDTH = 800;

async function embedHandwrittenSignaturesInPdf(pdfPath, signatureFields, signatureImageBase64) {
  if (!signatureImageBase64 || !pdfPath || !fs.existsSync(pdfPath)) {
    return pdfPath;
  }

  const cleanBase64 = String(signatureImageBase64).replace(/^data:image\/\w+;base64,/, '');
  if (!cleanBase64) return pdfPath;

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  const mime = (String(signatureImageBase64).split(';')[0] || '').toLowerCase();
  const bytes = Buffer.from(cleanBase64, 'base64');
  let img;
  if (mime.includes('jpeg') || mime.includes('jpg')) {
    img = await pdfDoc.embedJpg(bytes);
  } else {
    img = await pdfDoc.embedPng(bytes);
  }

  const targets = (signatureFields || []).filter((f) => f.type === 'signature');
  for (const field of targets) {
    const pageIndex = Math.max(0, Number(field.page || 1) - 1);
    const page = pdfDoc.getPages()[pageIndex];
    if (!page) continue;

    const scale = page.getWidth() / BASE_PAGE_WIDTH;
    const x = Number(field.x || 0) * scale;
    const w = Math.max(1, Number(field.width || 150) * scale);
    const fullH = Math.max(1, Number(field.height || 40) * scale);
    const handH = computeHandwrittenStripHeight(fullH);
    const yTop = Number(field.y || 0) * scale;
    const y = page.getHeight() - yTop - handH;

    const imgAspect = img.width / img.height;
    let drawW = w;
    let drawH = handH;
    if (imgAspect > w / handH) {
      drawH = w / imgAspect;
    } else {
      drawW = handH * imgAspect;
    }
    const drawX = x;
    const drawY = y + (handH - drawH) / 2;

    page.drawImage(img, { x: drawX, y: drawY, width: drawW, height: drawH });
  }

  fs.writeFileSync(pdfPath, Buffer.from(await pdfDoc.save({ useObjectStreams: false })));
  return pdfPath;
}

module.exports = {
  embedHandwrittenSignaturesInPdf,
  HANDWRITTEN_HEIGHT_RATIO,
};
