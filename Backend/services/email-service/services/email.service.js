const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const SmtpConfiguration = require('../models/SmtpConfiguration');
const { sendWithMailgun } = require('@draftnsign/email-lib');
const {
  getEffectivePlatformEmailConfig,
  buildMailgunEnv,
  isPlatformMailgunReady,
  resolveDmFromEmail,
  resolveDmFromName,
} = require('../utils/platformEmailPolicy');

const SMTP_RETRYABLE = /ECONNRESET|ETIMEDOUT|ESOCKET|ECONNREFUSED|socket hang up/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withSmtpRetry = async (fn, { retries = 2, delayMs = 2000 } = {}) => {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const transient = SMTP_RETRYABLE.test(err?.message || '');
      if (!transient || attempt === retries) {
        throw err;
      }
      await sleep(delayMs * (attempt + 1));
    }
  }
  throw lastErr;
};

const createSmtpTransporter = ({ host, port, secure, auth }) =>
  nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
    pool: true,
    maxConnections: 1,
    maxMessages: 5,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    requireTLS: !secure && port === 587,
  });

const normalizeAttachments = (attachments = []) =>
  attachments.map((file) => ({
    filename: file.filename,
    content:
      typeof file.content === 'string'
        ? Buffer.from(file.content, 'base64')
        : file.content?.data
          ? Buffer.from(file.content.data)
          : file.content,
    contentType: file.contentType,
  }));

async function loadUserSmtpConfig(userId) {
  const hasValidUserId =
    userId &&
    userId !== 'undefined' &&
    userId !== 'null' &&
    mongoose.Types.ObjectId.isValid(String(userId));

  if (!hasValidUserId) return null;

  return SmtpConfiguration.findOne({
    userId,
    isDefault: true,
    isVerified: true,
    status: 'active',
  });
}

function resolveSenderIdentity(platformDoc, smtpConfig, { senderMode } = {}) {
  const mode = senderMode || platformDoc?.defaultSenderMode || 'dm';
  const dmEmail = resolveDmFromEmail(platformDoc);
  const dmName = resolveDmFromName(platformDoc);

  if (mode === 'user' && smtpConfig?.fromEmail) {
    return {
      from: `"${smtpConfig.fromName || dmName}" <${smtpConfig.fromEmail}>`,
      replyTo: smtpConfig.fromEmail,
      mode: 'user',
    };
  }

  if (mode === 'user' && platformDoc?.userFallbackReplyTo !== false && smtpConfig?.fromEmail) {
    return {
      from: dmEmail ? `"${smtpConfig.fromName || dmName}" <${dmEmail}>` : undefined,
      replyTo: smtpConfig.fromEmail,
      mode: 'user_reply_to',
    };
  }

  return {
    from: dmEmail ? `"${dmName}" <${dmEmail}>` : undefined,
    replyTo: undefined,
    mode: 'dm',
  };
}

async function sendViaMailgunPlatform({ platformDoc, toEmail, subject, html, attachments, senderMode }) {
  const smtpConfig = null;
  const identity = resolveSenderIdentity(platformDoc, smtpConfig, { senderMode });
  const env = buildMailgunEnv(platformDoc);

  const result = await sendWithMailgun(
    {
      to: toEmail,
      subject,
      html,
      from: identity.from,
      replyTo: identity.replyTo,
    },
    env
  );

  if (result?.skipped) {
    throw new Error(result.reason || 'Mailgun send skipped');
  }

  return { provider: 'mailgun', ...result, senderMode: identity.mode };
}

async function sendViaUserSmtp({ smtpConfig, toEmail, subject, html, attachments }) {
  const transporter = createSmtpTransporter({
    host: smtpConfig.smtp.host,
    port: smtpConfig.smtp.port,
    secure: smtpConfig.smtp.secure,
    auth: {
      user: smtpConfig.fromEmail,
      pass: smtpConfig.credentials.password,
    },
  });

  const info = await withSmtpRetry(() =>
    transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: toEmail,
      subject,
      html,
      attachments: normalizeAttachments(attachments),
    })
  );

  await SmtpConfiguration.updateOne(
    { _id: smtpConfig._id },
    { $set: { isVerified: true, lastTestedAt: new Date(), lastError: null } }
  );

  return { provider: 'user_smtp', ...info };
}

async function sendViaEnvMailgun({ toEmail, subject, html, senderMode }) {
  const result = await sendWithMailgun({ to: toEmail, subject, html }, process.env);
  if (result?.skipped) throw new Error(result.reason || 'Mailgun not configured');
  return { provider: 'mailgun_env', ...result, senderMode };
}

const sendEmailByUserId = async ({
  userId,
  toEmail,
  subject,
  html,
  attachments = [],
  senderMode,
}) => {
  const platformDoc = await getEffectivePlatformEmailConfig();
  const smtpConfig = await loadUserSmtpConfig(userId);
  const mode = senderMode || platformDoc?.defaultSenderMode || 'dm';

  if (isPlatformMailgunReady(platformDoc)) {
    const identity = resolveSenderIdentity(platformDoc, smtpConfig, { senderMode: mode });
    const env = buildMailgunEnv(platformDoc);
    const result = await sendWithMailgun(
      {
        to: toEmail,
        subject,
        html,
        from: identity.from,
        replyTo: identity.replyTo,
      },
      env
    );
    if (!result?.skipped) {
      return { provider: 'mailgun', ...result, senderMode: identity.mode };
    }
  }

  if (smtpConfig && platformDoc?.allowUserSmtpFallback !== false) {
    return sendViaUserSmtp({ smtpConfig, toEmail, subject, html, attachments });
  }

  return sendViaEnvMailgun({ toEmail, subject, html, senderMode: mode });
};

const sendEmailBySystem = async ({ to, subject, html, attachments = [], senderMode = 'dm' }) => {
  const platformDoc = await getEffectivePlatformEmailConfig();

  if (isPlatformMailgunReady(platformDoc)) {
    return sendViaMailgunPlatform({
      platformDoc,
      toEmail: to,
      subject,
      html,
      attachments,
      senderMode,
    });
  }

  try {
    return await sendViaEnvMailgun({ toEmail: to, subject, html, senderMode });
  } catch (envErr) {
    if (platformDoc?.allowUserSmtpFallback === false) {
      throw envErr;
    }
    throw new Error(
      envErr.message ||
        'Platform Mailgun is not configured. Set up Mailgun in Admin → Platform Email.'
    );
  }
};

module.exports = { sendEmailByUserId, sendEmailBySystem };
