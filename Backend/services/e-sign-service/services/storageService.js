// services/storageService.js
const fs = require('fs');
const path = require('path');

/**
 * Config: adjust base uploads dir if your project uses a different location.
 * This uses a folder one level up from services: PROJECT_ROOT/uploads
 */
const BASE_UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

/**
 * Ensure directory exists (synchronous, safe during request handling)
 * @param {string} dirPath
 */
function ensureDirSync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Save signed PDF buffer to disk grouped by envelopeId.
 * Returns { fileName, filePath, size }
 *
 * @param {string|ObjectId} envelopeId
 * @param {string|ObjectId} documentId
 * @param {Buffer} buffer
 */
function saveSignedPdf(envelopeId, documentId, buffer) {
  if (!buffer || !(Buffer.isBuffer(buffer) || buffer instanceof Uint8Array)) {
    throw new Error('saveSignedPdf: buffer must be a Buffer or Uint8Array');
  }

  // normalize IDs to string
  const envId = String(envelopeId || 'no-envelope');
  const docId = String(documentId || 'no-doc');

  // Compose directory: <BASE_UPLOADS_DIR>/signed/<envelopeId>
  const dir = path.join(BASE_UPLOADS_DIR, 'signed', envId);
  ensureDirSync(dir);

  const time = Date.now();
  const fileName = `${time}-signed-${docId}.pdf`;
  const filePath = path.join(dir, fileName);

  // Write file synchronously (simpler). If you prefer async, convert to fs.promises.writeFile.
  fs.writeFileSync(filePath, Buffer.from(buffer));

  const stats = fs.statSync(filePath);
  return { fileName, filePath, size: stats.size };
}

module.exports = {
  saveSignedPdf,
  BASE_UPLOADS_DIR
};
