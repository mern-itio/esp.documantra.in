const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
const Document = require('../models/Document');
const { uploadsDir } = require('../utils/secureUpload');
const RecipientPermission = require('../models/RecipientPermission');
const {
  getUserId,
  isValidObjectId,
  isAnonymousDraftEnvelope,
  userHasEnvelopeAccess,
  loadEnvelope,
} = require('./envelopeAccess');

const FILE_TOKEN_PURPOSE = 'esign-file';

const getFileTokenSecret = () =>
  process.env.FILE_ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET;

const createFileAccessToken = ({ envelopeId, documentId, recipientId } = {}) => {
  const secret = getFileTokenSecret();
  if (!secret || !envelopeId) return null;

  const payload = {
    typ: FILE_TOKEN_PURPOSE,
    envelopeId: String(envelopeId),
  };
  if (documentId) payload.documentId = String(documentId);
  if (recipientId) payload.recipientId = String(recipientId);

  return jwt.sign(payload, secret, { expiresIn: '8h' });
};

const verifyFileAccessToken = (token, { envelopeId, documentId } = {}) => {
  if (!token) return null;
  const secret = getFileTokenSecret();
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret);
    if (decoded?.typ !== FILE_TOKEN_PURPOSE) return null;
    if (envelopeId && String(decoded.envelopeId) !== String(envelopeId)) return null;
    if (documentId && decoded.documentId && String(decoded.documentId) !== String(documentId)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};

const normalizeEsignPublicBase = (baseUrl) => {
  const raw = String(baseUrl || process.env.PUBLIC_ESIGN_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (!raw) {
    return '';
  }
  if (raw.endsWith('/esign')) {
    return raw;
  }
  if (raw.includes('esp.documantra.in')) {
    return `${raw}/esign`;
  }
  return raw;
};

const buildPublicUploadUrl = (rawPath, { envelopeId, documentId, recipientId, baseUrl } = {}) => {
  if (!rawPath) return null;

  const normalized = String(rawPath).replace(/\\/g, '/');
  const uploadRelative = decodeURIComponent(
    normalized
      .replace(/^.*\/uploads\//, '')
      .replace(/^uploads\//, '')
      .replace(/^\/+/, '')
      .split('?')[0]
  );

  const base = normalizeEsignPublicBase(baseUrl);
  const fileToken = createFileAccessToken({ envelopeId, documentId, recipientId });
  const query = new URLSearchParams();
  if (fileToken) query.set('fileToken', fileToken);
  if (envelopeId) query.set('envelopeId', String(envelopeId));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return `${base}/uploads/${encodeURIComponent(uploadRelative)}${suffix}`;
};

const recipientBelongsToEnvelope = async (recipientId, envelopeId) => {
  if (!isValidObjectId(recipientId) || !isValidObjectId(envelopeId)) return false;
  const permission = await RecipientPermission.findOne({
    envelopeId,
    recipientId,
  }).lean();
  return Boolean(permission);
};

const findDocumentByFilename = async (filename) => {
  if (!filename) return null;
  const safeName = path.basename(decodeURIComponent(String(filename)));
  if (!safeName) return null;

  const byFileName = await Document.findOne({ fileName: safeName }).lean();
  if (byFileName) return byFileName;

  const escaped = safeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEncoded = encodeURIComponent(safeName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Document.findOne({
    $or: [
      { fileName: safeName },
      { filePath: new RegExp(`${escaped}$`) },
      { filePath: new RegExp(`${escapedEncoded}$`) },
      { signedFilePath: new RegExp(`${escaped}$`) },
      { signedFilePath: new RegExp(`${escapedEncoded}$`) },
      { preparedDoc: new RegExp(`${escaped}$`) },
      { preparedDoc: new RegExp(`${escapedEncoded}$`) },
    ],
  }).lean();
};

const resolveLocalUploadPath = (doc, filename) => {
  const safeName = path.basename(
    decodeURIComponent(String(filename || doc?.fileName || ''))
  );
  if (!safeName) return null;

  const diskPath = path.join(uploadsDir, safeName);
  if (fs.existsSync(diskPath)) return diskPath;

  const candidates = [doc?.signedFilePath, doc?.filePath, doc?.preparedDoc].filter(Boolean);
  for (const entry of candidates) {
    const normalized = String(entry).replace(/\\/g, '/');
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      continue;
    }
    if (path.isAbsolute(normalized) && fs.existsSync(normalized)) {
      return normalized;
    }
  }

  return null;
};

const assertEnvelopeDownloadAccess = async (req, envelopeId) => {
  if (!isValidObjectId(envelopeId)) {
    return { ok: false, status: 400, message: 'Invalid envelope ID' };
  }

  const envelope = await loadEnvelope(envelopeId);
  if (!envelope) {
    return { ok: false, status: 404, message: 'Envelope not found' };
  }

  if (verifyFileAccessToken(req.query?.fileToken, { envelopeId })) {
    return { ok: true, envelope };
  }

  const userId = getUserId(req);
  if (userId) {
    if (req.userType === 'admin' || (await userHasEnvelopeAccess(req, envelope))) {
      return { ok: true, envelope };
    }
    return { ok: false, status: 403, message: 'Access denied' };
  }

  const recipientId = req.query?.recipientId;
  if (recipientId && (await recipientBelongsToEnvelope(recipientId, envelopeId))) {
    return { ok: true, envelope };
  }

  return { ok: false, status: 403, message: 'Access denied' };
};

const assertDocumentDownloadAccess = async (req, documentId) => {
  if (!isValidObjectId(documentId)) {
    return { ok: false, status: 400, message: 'Invalid document ID' };
  }

  const doc = await Document.findById(documentId).lean();
  if (!doc) {
    return { ok: false, status: 404, message: 'Document not found' };
  }

  const envelope = await loadEnvelope(doc.envelopeId);
  if (!envelope) {
    return { ok: false, status: 404, message: 'Envelope not found' };
  }

  if (verifyFileAccessToken(req.query?.fileToken, { envelopeId: doc.envelopeId, documentId: doc._id })) {
    return { ok: true, doc, envelope };
  }

  const userId = getUserId(req);
  if (userId && (await userHasEnvelopeAccess(req, envelope))) {
    return { ok: true, doc, envelope };
  }

  const recipientId = req.query?.recipientId;
  if (recipientId && (await recipientBelongsToEnvelope(recipientId, doc.envelopeId))) {
    return { ok: true, doc, envelope };
  }

  if (isAnonymousDraftEnvelope(envelope)) {
    return { ok: true, doc, envelope };
  }

  return { ok: false, status: 403, message: 'Access denied' };
};

const assertUploadFileAccess = async (req, filename) => {
  const safeName = path.basename(decodeURIComponent(String(filename || '')));
  if (!safeName) {
    return { ok: false, status: 400, message: 'Invalid file name' };
  }

  const doc = await findDocumentByFilename(safeName);
  if (!doc) {
    return { ok: false, status: 404, message: 'File not found' };
  }

  const envelope = await loadEnvelope(doc.envelopeId);
  if (!envelope) {
    return { ok: false, status: 404, message: 'Envelope not found' };
  }

  if (verifyFileAccessToken(req.query?.fileToken, { envelopeId: doc.envelopeId, documentId: doc._id })) {
    const localPath = resolveLocalUploadPath(doc, safeName);
    if (!localPath) return { ok: false, status: 404, message: 'File not found' };
    return { ok: true, localPath };
  }

  const userId = getUserId(req);
  if (userId && (await userHasEnvelopeAccess(req, envelope))) {
    const localPath = resolveLocalUploadPath(doc, safeName);
    if (!localPath) return { ok: false, status: 404, message: 'File not found' };
    return { ok: true, localPath };
  }

  const recipientId = req.query?.recipientId;
  if (recipientId && (await recipientBelongsToEnvelope(recipientId, doc.envelopeId))) {
    const localPath = resolveLocalUploadPath(doc, safeName);
    if (!localPath) return { ok: false, status: 404, message: 'File not found' };
    return { ok: true, localPath };
  }

  if (isAnonymousDraftEnvelope(envelope)) {
    const localPath = resolveLocalUploadPath(doc, safeName);
    if (!localPath) return { ok: false, status: 404, message: 'File not found' };
    return { ok: true, localPath };
  }

  const queryEnvelopeId = req.query?.envelopeId;
  if (
    queryEnvelopeId &&
    String(doc.envelopeId) === String(queryEnvelopeId) &&
    String(envelope.status || '').toLowerCase() === 'draft'
  ) {
    const localPath = resolveLocalUploadPath(doc, safeName);
    if (!localPath) return { ok: false, status: 404, message: 'File not found' };
    return { ok: true, localPath };
  }

  return { ok: false, status: 403, message: 'Access denied' };
};

module.exports = {
  createFileAccessToken,
  verifyFileAccessToken,
  buildPublicUploadUrl,
  normalizeEsignPublicBase,
  assertDocumentDownloadAccess,
  assertEnvelopeDownloadAccess,
  assertUploadFileAccess,
  findDocumentByFilename,
  resolveLocalUploadPath,
};
