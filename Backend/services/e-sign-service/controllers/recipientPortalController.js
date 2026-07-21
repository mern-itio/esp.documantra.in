const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const Envelope = require('../models/Envelope');
const RecipientPortalOtp = require('../models/RecipientPortalOtp');
const RecipientPortalSession = require('../models/RecipientPortalSession');
const {
  recipientPortalOtpTemplate,
} = require('../emails/emailTemplates');
const {
  signRecipientPortalToken,
  normalizePortalEmail,
  PORTAL_VIEW_PERMISSION,
} = require('../helpers/recipientPortalToken');
const { buildPublicSignerUrl } = require('../helpers/signerAccessToken');
const {
  createFileAccessToken,
  resolveLocalUploadPath,
  normalizeEsignPublicBase,
} = require('../helpers/documentDownloadAccess');
const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const PORTAL_SESSION_DAYS = Number(process.env.RECIPIENT_PORTAL_SESSION_DAYS || 365);
const MAX_VERIFY_ATTEMPTS = Number(process.env.OTP_MAX_VERIFY_ATTEMPTS || 10);
const MAX_OTP_SEND_ATTEMPTS = Number(process.env.OTP_MAX_SEND_ATTEMPTS || 10);
const OTP_SEND_WINDOW_MS =
  Number(process.env.OTP_SEND_WINDOW_HOURS || 24) * 60 * 60 * 1000;

function maskEmail(email) {
  const normalized = normalizePortalEmail(email);
  const [local, domain] = normalized.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function createRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getRecipientDisplayName(email) {
  const recipient = await Recipient.findOne({ email })
    .sort({ updatedAt: -1 })
    .select('name')
    .lean();
  return String(recipient?.name || '').trim();
}

async function upsertPortalSession(email, recipientName = '') {
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + PORTAL_SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await RecipientPortalSession.findOneAndUpdate(
    { email },
    {
      email,
      refreshTokenHash: hashRefreshToken(refreshToken),
      recipientName: recipientName || '',
      permissions: [PORTAL_VIEW_PERMISSION],
      verifiedAt: new Date(),
      expiresAt,
      lastSeenAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return { session, refreshToken };
}

function buildPortalAuthResponse({ email, session, refreshToken, recipientName }) {
  const token = signRecipientPortalToken(email, {
    sessionId: String(session._id),
    permissions: session.permissions,
  });

  return {
    status: 'success',
    token,
    refreshToken,
    email,
    maskedEmail: maskEmail(email),
    recipientName: recipientName || session.recipientName || '',
    permissions: session.permissions,
    sessionExpiresAt: session.expiresAt,
    accountCreated: true,
  };
}

async function dispatchPortalEmail({ toEmail, subject, html }) {
  const emailServiceUrl = String(process.env.EMAIL_SERVICE_URL || '').replace(/\/+$/, '');
  if (!emailServiceUrl) {
    throw new Error('EMAIL_SERVICE_URL is not configured');
  }

  await axios.post(
    `${emailServiceUrl}/mail/send-by-system`,
    { to: toEmail, subject, html, senderMode: 'dm' },
    { timeout: 30000 },
  );
}

async function emailHasRecipientDocuments(email) {
  const recipients = await Recipient.find({ email }).select('_id').lean();
  if (!recipients.length) return false;

  const recipientIds = recipients.map((r) => r._id);
  const permissionCount = await RecipientPermission.countDocuments({
    recipientId: { $in: recipientIds },
    role: { $nin: ['in_person_signer'] },
  });
  return permissionCount > 0;
}

const requestRecipientPortalCode = async (req, res) => {
  try {
    const email = normalizePortalEmail(req.body?.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const hasDocuments = await emailHasRecipientDocuments(email);
    const genericMessage =
      'If this email has documents waiting, we sent a one-time sign-in code.';

    if (!hasDocuments) {
      return res.status(200).json({
        status: 'success',
        message: genericMessage,
        maskedEmail: maskEmail(email),
        resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
      });
    }

    const existing = await RecipientPortalOtp.findOne({ email })
      .sort({ createdAt: -1 })
      .lean();

    if (existing?.lastSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existing.lastSentAt).getTime()) / 1000);
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({
          message: 'Please wait before requesting another code',
          resendAfterSeconds: RESEND_COOLDOWN_SECONDS - elapsedSeconds,
          maskedEmail: maskEmail(email),
        });
      }
    }

    const recentSendCount = await RecipientPortalOtp.countDocuments({
      email,
      createdAt: { $gte: new Date(Date.now() - OTP_SEND_WINDOW_MS) },
    });
    if (recentSendCount >= MAX_OTP_SEND_ATTEMPTS) {
      return res.status(429).json({
        message: `OTP send limit reached (${MAX_OTP_SEND_ATTEMPTS} codes per ${Number(process.env.OTP_SEND_WINDOW_HOURS || 24)} hours). Please try again later.`,
        maskedEmail: maskEmail(email),
      });
    }

    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await RecipientPortalOtp.create({
      email,
      otpHash: hashOtp(otpCode),
      expiresAt,
      lastSentAt: new Date(),
      attempts: 0,
    });

    const html = recipientPortalOtpTemplate({
      recipientEmail: email,
      otpCode,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

    try {
      await dispatchPortalEmail({
        toEmail: email,
        subject: 'Complete your sign-in',
        html,
      });
    } catch (mailErr) {
      console.error('recipient portal OTP email failed:', mailErr?.message || mailErr);
      return res.status(502).json({ message: 'Unable to send access code email right now' });
    }

    return res.status(200).json({
      status: 'success',
      message: genericMessage,
      maskedEmail: maskEmail(email),
      resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error('requestRecipientPortalCode error:', error);
    return res.status(500).json({ message: 'Failed to request access code' });
  }
};

const verifyRecipientPortalCode = async (req, res) => {
  try {
    const email = normalizePortalEmail(req.body?.email);
    const code = String(req.body?.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const otpRecord = await RecipientPortalOtp.findOne({ email })
      .sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Code expired. Request a new one.' });
    }

    if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many attempts. Request a new code.' });
    }

    if (otpRecord.otpHash !== hashOtp(code)) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid code' });
    }

    otpRecord.verifiedAt = new Date();
    await otpRecord.save();

    const recipientName = await getRecipientDisplayName(email);
    const { session, refreshToken } = await upsertPortalSession(email, recipientName);
    return res.status(200).json(
      buildPortalAuthResponse({ email, session, refreshToken, recipientName }),
    );
  } catch (error) {
    console.error('verifyRecipientPortalCode error:', error);
    return res.status(500).json({ message: 'Failed to verify access code' });
  }
};

const refreshRecipientPortalSession = async (req, res) => {
  try {
    const email = normalizePortalEmail(req.body?.email);
    const refreshToken = String(req.body?.refreshToken || '').trim();

    if (!email || !refreshToken) {
      return res.status(400).json({ message: 'Email and refresh token are required' });
    }

    const session = await RecipientPortalSession.findOne({ email });
    if (!session) {
      return res.status(401).json({ message: 'Portal account not found. Please verify your email again.' });
    }

    if (session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Portal session expired. Please verify your email again.' });
    }

    if (session.refreshTokenHash !== hashRefreshToken(refreshToken)) {
      return res.status(401).json({ message: 'Invalid portal session' });
    }

    session.lastSeenAt = new Date();
    await session.save();

    const recipientName = session.recipientName || (await getRecipientDisplayName(email));
    if (recipientName && !session.recipientName) {
      session.recipientName = recipientName;
      await session.save();
    }

    const accessToken = signRecipientPortalToken(email, {
      sessionId: String(session._id),
      permissions: session.permissions,
    });

    return res.status(200).json({
      status: 'success',
      token: accessToken,
      email,
      maskedEmail: maskEmail(email),
      recipientName,
      permissions: session.permissions,
      sessionExpiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('refreshRecipientPortalSession error:', error);
    return res.status(500).json({ message: 'Failed to refresh portal session' });
  }
};

function mapDocumentStatus(permissionStatus, envelopeStatus) {
  const perm = String(permissionStatus || '').toLowerCase();
  const env = String(envelopeStatus || '').toLowerCase();

  if (perm === 'completed' || env === 'completed') return 'SIGNED';
  if (perm === 'declined' || env === 'declined') return 'DECLINED';
  if (env === 'archived') return 'ARCHIVED';
  return 'PENDING';
}

function isArchivedDocument(permissionStatus, envelopeStatus) {
  const status = mapDocumentStatus(permissionStatus, envelopeStatus);
  return status === 'SIGNED' || status === 'DECLINED' || status === 'ARCHIVED';
}

async function fetchSenderNameMap(senderIds) {
  const uniqueIds = [...new Set(senderIds.filter(Boolean).map(String))];
  const senderMap = {};

  await Promise.all(
    uniqueIds.map(async (senderId) => {
      if (!mongoose.Types.ObjectId.isValid(senderId)) return;
      try {
        const response = await axios.get(
          `${process.env.AUTH_URL}/api/user-details/${senderId}`,
          { timeout: 8000 },
        );
        senderMap[senderId] =
          response?.data?.data?.fullname ||
          response?.data?.data?.email ||
          'Sender';
      } catch {
        senderMap[senderId] = 'Sender';
      }
    }),
  );

  return senderMap;
}

const listRecipientPortalDocuments = async (req, res) => {
  try {
    const email = req.recipientPortal?.email;
    const portalPermissions = req.recipientPortal?.permissions || [];
    if (!portalPermissions.includes(PORTAL_VIEW_PERMISSION)) {
      return res.status(403).json({ message: 'Insufficient portal permissions' });
    }
    const tab = String(req.query?.tab || 'inbox').toLowerCase();

    const recipients = await Recipient.find({ email }).select('_id name email').lean();
    if (!recipients.length) {
      return res.status(200).json({ status: 'success', data: [], total: 0, tab });
    }

    const recipientById = new Map(recipients.map((r) => [String(r._id), r]));
    const recipientIds = recipients.map((r) => r._id);

    const permissions = await RecipientPermission.find({
      recipientId: { $in: recipientIds },
      role: { $nin: ['in_person_signer'] },
    })
      .sort({ updatedAt: -1 })
      .lean();

    const envelopeIds = [...new Set(permissions.map((p) => String(p.envelopeId)).filter(Boolean))];
    const envelopes = await Envelope.find({
      _id: { $in: envelopeIds },
      status: { $nin: ['draft', 'deleted'] },
    })
      .select('subject name status sender updatedAt createdAt expirationDate')
      .lean();

    const envelopeById = new Map(envelopes.map((e) => [String(e._id), e]));
    const senderMap = await fetchSenderNameMap(envelopes.map((e) => e.sender));

    const rows = [];
    for (const permission of permissions) {
      const envelope = envelopeById.get(String(permission.envelopeId));
      if (!envelope) continue;

      const recipient = recipientById.get(String(permission.recipientId));
      if (!recipient) continue;

      const status = mapDocumentStatus(permission.status, envelope.status);
      const archived = isArchivedDocument(permission.status, envelope.status);
      if (tab === 'archived' ? !archived : archived) continue;

      rows.push({
        envelopeId: envelope._id,
        recipientId: recipient._id,
        name:
          String(envelope.subject || '').trim() ||
          String(envelope.name || '').trim() ||
          'Untitled document',
        from:
          senderMap[String(envelope.sender)] ||
          'Sender',
        status,
        role: permission.role,
        permissionStatus: permission.status,
        envelopeStatus: envelope.status,
        updatedAt: permission.updatedAt || envelope.updatedAt || envelope.createdAt,
        expiresAt: envelope.expirationDate || null,
        signUrl: buildPublicSignerUrl(envelope._id, recipient._id),
      });
    }

    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const recipientName =
      recipients.find((r) => String(r.name || '').trim())?.name?.trim() ||
      (await getRecipientDisplayName(email));

    return res.status(200).json({
      status: 'success',
      data: rows,
      total: rows.length,
      tab,
      email,
      maskedEmail: maskEmail(email),
      recipientName,
    });
  } catch (error) {
    console.error('listRecipientPortalDocuments error:', error);
    return res.status(500).json({ message: 'Failed to load documents' });
  }
};

async function assertPortalRecipientAccess(req, envelopeId, recipientId) {
  const email = req.recipientPortal?.email;
  const portalPermissions = req.recipientPortal?.permissions || [];
  if (!portalPermissions.includes(PORTAL_VIEW_PERMISSION)) {
    return { ok: false, status: 403, message: 'Insufficient portal permissions' };
  }
  if (!email) {
    return { ok: false, status: 401, message: 'Recipient portal session required' };
  }
  if (!mongoose.Types.ObjectId.isValid(String(envelopeId)) || !mongoose.Types.ObjectId.isValid(String(recipientId))) {
    return { ok: false, status: 400, message: 'Invalid document reference' };
  }

  const recipient = await Recipient.findById(recipientId).lean();
  if (!recipient || normalizePortalEmail(recipient.email) !== normalizePortalEmail(email)) {
    return { ok: false, status: 403, message: 'You do not have access to this document' };
  }

  const permission = await RecipientPermission.findOne({
    envelopeId,
    recipientId,
  }).lean();
  if (!permission) {
    return { ok: false, status: 404, message: 'Document not found' };
  }

  const envelope = await Envelope.findById(envelopeId).lean();
  if (!envelope || ['draft', 'deleted'].includes(String(envelope.status || '').toLowerCase())) {
    return { ok: false, status: 404, message: 'Document not found' };
  }

  return { ok: true, email, recipient, permission, envelope };
}

function resolvePreferredDocumentPath(doc) {
  const signedName = doc.signedFileName || (doc.signedFilePath ? path.basename(String(doc.signedFilePath)) : null);
  if (doc.signedFilePath && fs.existsSync(doc.signedFilePath)) {
    return { localPath: doc.signedFilePath, downloadName: signedName || 'signed-document.pdf' };
  }
  const localPath = resolveLocalUploadPath(doc, signedName || doc.fileName);
  if (localPath) {
    return {
      localPath,
      downloadName: path.basename(signedName || doc.fileName || 'document.pdf'),
    };
  }
  return null;
}

/** Metadata + PDF view URLs for in-portal iframe viewer. */
const getRecipientPortalDocumentViewer = async (req, res) => {
  try {
    const { envelopeId, recipientId } = req.params;
    const access = await assertPortalRecipientAccess(req, envelopeId, recipientId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const { envelope, permission, recipient } = access;
    const docs = await Document.find({ envelopeId }).lean();
    const publicBase =
      normalizeEsignPublicBase(
        process.env.PUBLIC_ESIGN_URL ||
          process.env.ESIGN_SERVICE_URL ||
          'https://esp.documantra.in',
      ) || 'https://esp.documantra.in/esign';

    const files = docs.map((doc) => {
      const fileToken = createFileAccessToken({
        envelopeId,
        documentId: doc._id,
        recipientId,
      });
      const params = new URLSearchParams({
        envelopeId: String(envelopeId),
        recipientId: String(recipientId),
      });
      if (fileToken) params.set('fileToken', fileToken);
      return {
        id: String(doc._id),
        name: doc.signedFileName || doc.fileName || 'document.pdf',
        viewUrl: `${publicBase}/api/e-sign/public/documents/${doc._id}/view?${params.toString()}`,
        hasSignedFile: Boolean(doc.signedFilePath),
      };
    });

    const status = mapDocumentStatus(permission.status, envelope.status);

    return res.status(200).json({
      status: 'success',
      data: {
        envelopeId,
        recipientId,
        title:
          String(envelope.subject || '').trim() ||
          String(envelope.name || '').trim() ||
          'Document',
        documentStatus: status,
        recipientName: recipient.name || '',
        recipientEmail: recipient.email || '',
        files,
        signUrl: buildPublicSignerUrl(envelopeId, recipientId),
        canForward: status === 'PENDING',
      },
    });
  } catch (error) {
    console.error('getRecipientPortalDocumentViewer error:', error);
    return res.status(500).json({ message: 'Failed to open document' });
  }
};

/** Stream preferred (signed) PDF for portal download/print. */
const downloadRecipientPortalDocument = async (req, res) => {
  try {
    const { envelopeId, recipientId, documentId } = req.params;
    const access = await assertPortalRecipientAccess(req, envelopeId, recipientId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const doc = await Document.findOne({ _id: documentId, envelopeId }).lean();
    if (!doc) {
      return res.status(404).json({ message: 'File not found' });
    }

    const preferred = resolvePreferredDocumentPath(doc);
    if (!preferred?.localPath) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    const asAttachment = String(req.query?.download || '') === '1';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${asAttachment ? 'attachment' : 'inline'}; filename="${preferred.downloadName}"`,
    );
    return res.sendFile(path.resolve(preferred.localPath));
  } catch (error) {
    console.error('downloadRecipientPortalDocument error:', error);
    return res.status(500).json({ message: 'Failed to download document' });
  }
};

module.exports = {
  requestRecipientPortalCode,
  verifyRecipientPortalCode,
  refreshRecipientPortalSession,
  listRecipientPortalDocuments,
  getRecipientPortalDocumentViewer,
  downloadRecipientPortalDocument,
  maskEmail,
};
