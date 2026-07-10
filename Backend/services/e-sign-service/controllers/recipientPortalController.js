const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const Envelope = require('../models/Envelope');
const RecipientPortalOtp = require('../models/RecipientPortalOtp');
const {
  recipientPortalOtpTemplate,
} = require('../emails/emailTemplates');
const {
  signRecipientPortalToken,
  normalizePortalEmail,
} = require('../helpers/recipientPortalToken');

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

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
        subject: 'Your document access code',
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

    const token = signRecipientPortalToken(email);
    return res.status(200).json({
      status: 'success',
      token,
      email,
      maskedEmail: maskEmail(email),
      expiresInHours: 24,
    });
  } catch (error) {
    console.error('verifyRecipientPortalCode error:', error);
    return res.status(500).json({ message: 'Failed to verify access code' });
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

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

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
        signUrl: `${frontendUrl}/e-sign/signer/${envelope._id}/${recipient._id}`,
      });
    }

    rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return res.status(200).json({
      status: 'success',
      data: rows,
      total: rows.length,
      tab,
      email,
      maskedEmail: maskEmail(email),
    });
  } catch (error) {
    console.error('listRecipientPortalDocuments error:', error);
    return res.status(500).json({ message: 'Failed to load documents' });
  }
};

module.exports = {
  requestRecipientPortalCode,
  verifyRecipientPortalCode,
  listRecipientPortalDocuments,
  maskEmail,
};
