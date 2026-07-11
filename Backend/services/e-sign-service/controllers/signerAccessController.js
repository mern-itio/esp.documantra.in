const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const Recipient = require('../models/Recipient');
const RecipientPermission = require('../models/RecipientPermission');
const Envelope = require('../models/Envelope');
const SignerAccessOtp = require('../models/SignerAccessOtp');
const { recipientPortalOtpTemplate } = require('../emails/emailTemplates');
const {
  createSignerSessionToken,
  verifySignerAccessToken,
  isSignerAccessOtpEnabled,
} = require('../helpers/signerAccessToken');
const {
  maskEmail,
  extractSignerAccessToken,
  evaluateSignerAccess,
} = require('../helpers/signerAccessGate');

const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = Number(process.env.OTP_MAX_VERIFY_ATTEMPTS || 10);
const MAX_OTP_SEND_ATTEMPTS = Number(process.env.OTP_MAX_SEND_ATTEMPTS || 10);
const OTP_SEND_WINDOW_MS =
  Number(process.env.OTP_SEND_WINDOW_HOURS || 24) * 60 * 60 * 1000;

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function dispatchSignerAccessEmail({ toEmail, subject, html }) {
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

async function loadSignerContext(envelopeId, recipientId) {
  if (!mongoose.Types.ObjectId.isValid(envelopeId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
    return null;
  }

  const [recipient, permission, envelope] = await Promise.all([
    Recipient.findById(recipientId).select('name email').lean(),
    RecipientPermission.findOne({ envelopeId, recipientId }).lean(),
    Envelope.findById(envelopeId).select('status subject').lean(),
  ]);

  if (!recipient || !permission || !envelope) return null;
  return { recipient, permission, envelope };
}

function recipientShouldUseStatusPage(permission, envelope) {
  const permStatus = String(permission?.status || '').toLowerCase();
  const envStatus = String(envelope?.status || '').toLowerCase();
  return (
    ['completed', 'signed', 'declined'].includes(permStatus) ||
    envStatus === 'completed' ||
    envStatus === 'declined'
  );
}

const checkSignerAccess = async (req, res) => {
  try {
    const envelopeId = req.query.envelopeId || req.body?.envelopeId;
    const recipientId = req.query.recipientId || req.body?.recipientId;

    if (!envelopeId || !recipientId) {
      return res.status(400).json({ message: 'envelopeId and recipientId are required' });
    }

    const context = await loadSignerContext(envelopeId, recipientId);
    if (!context) {
      return res.status(404).json({ message: 'Signer access not found' });
    }

    if (recipientShouldUseStatusPage(context.permission, context.envelope)) {
      return res.status(200).json({
        status: 'success',
        verified: true,
        redirectToStatus: true,
        requiresAccessVerification: false,
        recipientStatus: context.permission.status,
        envelopeStatus: context.envelope.status,
      });
    }

    if (!isSignerAccessOtpEnabled()) {
      return res.status(200).json({
        status: 'success',
        verified: true,
        requiresAccessVerification: false,
      });
    }

    const gate = await evaluateSignerAccess(req, envelopeId, recipientId);
    if (gate.ok) {
      return res.status(200).json({
        status: 'success',
        verified: true,
        requiresAccessVerification: false,
      });
    }

    return res.status(200).json({
      status: 'success',
      verified: false,
      requiresAccessVerification: true,
      expired: !!gate.expired,
      maskedEmail: gate.maskedEmail || null,
      message: gate.message,
    });
  } catch (error) {
    console.error('checkSignerAccess error:', error);
    return res.status(500).json({ message: 'Failed to check signer access' });
  }
};

const requestSignerAccessCode = async (req, res) => {
  try {
    const envelopeId = req.body?.envelopeId;
    const recipientId = req.body?.recipientId;

    if (!envelopeId || !recipientId) {
      return res.status(400).json({ message: 'envelopeId and recipientId are required' });
    }

    const context = await loadSignerContext(envelopeId, recipientId);
    if (!context) {
      return res.status(404).json({ message: 'Signer access not found' });
    }

    if (recipientShouldUseStatusPage(context.permission, context.envelope)) {
      return res.status(200).json({
        status: 'success',
        message: 'Signing is already complete for this recipient.',
        redirectToStatus: true,
      });
    }

    const email = String(context.recipient.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Recipient email is unavailable' });
    }

    const existing = await SignerAccessOtp.findOne({ envelopeId, recipientId })
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

    const recentSendCount = await SignerAccessOtp.countDocuments({
      envelopeId,
      recipientId,
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

    await SignerAccessOtp.create({
      envelopeId,
      recipientId,
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
      await dispatchSignerAccessEmail({
        toEmail: email,
        subject: `Your access code for ${context.envelope.subject || 'document signing'}`,
        html,
      });
    } catch (mailErr) {
      console.error('signer access OTP email failed:', mailErr?.message || mailErr);
      return res.status(502).json({ message: 'Unable to send access code email right now' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Access code sent if this recipient email is valid.',
      maskedEmail: maskEmail(email),
      resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error('requestSignerAccessCode error:', error);
    return res.status(500).json({ message: 'Failed to request access code' });
  }
};

const verifySignerAccessCode = async (req, res) => {
  try {
    const envelopeId = req.body?.envelopeId;
    const recipientId = req.body?.recipientId;
    const code = String(req.body?.code || '').trim();

    if (!envelopeId || !recipientId || !code) {
      return res.status(400).json({ message: 'envelopeId, recipientId, and code are required' });
    }

    const context = await loadSignerContext(envelopeId, recipientId);
    if (!context) {
      return res.status(404).json({ message: 'Signer access not found' });
    }

    const otpRecord = await SignerAccessOtp.findOne({ envelopeId, recipientId })
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

    const token = createSignerSessionToken({
      envelopeId,
      recipientId,
      email: context.recipient.email,
    });

    return res.status(200).json({
      status: 'success',
      token,
      maskedEmail: maskEmail(context.recipient.email),
      expiresInHours: 24,
    });
  } catch (error) {
    console.error('verifySignerAccessCode error:', error);
    return res.status(500).json({ message: 'Failed to verify access code' });
  }
};

module.exports = {
  checkSignerAccess,
  requestSignerAccessCode,
  verifySignerAccessCode,
  extractSignerAccessToken,
  verifySignerAccessToken,
};
