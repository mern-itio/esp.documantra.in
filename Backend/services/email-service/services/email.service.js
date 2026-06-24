const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const SmtpConfiguration = require('../models/SmtpConfiguration');

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

const sendEmailByUserId = async ({ userId, toEmail, subject, html, attachments = [] }) => {

  const hasValidUserId =
    userId &&
    userId !== 'undefined' &&
    userId !== 'null' &&
    mongoose.Types.ObjectId.isValid(String(userId));

  const smtpConfig = hasValidUserId
    ? await SmtpConfiguration.findOne({
        userId,
        isDefault: true,
        isVerified: true,
        status: 'active',
      })
    : null;

  let host = 'smtp.gmail.com';
  let port = 587;
  let secure = false;
  let auth = {
    user: 'draftnsign@gmail.com',
    pass: 'tbqhooitksgusmpc'
  };
  let fromName = 'DraftandSign';
  let fromEmail = 'draftnsign@gmail.com';

  if (smtpConfig) {
    host = smtpConfig.smtp.host;
    port = smtpConfig.smtp.port;
    secure = smtpConfig.smtp.secure;
    auth = {
      user: smtpConfig?.fromEmail,
      pass: smtpConfig.credentials.password
    };
    fromName = smtpConfig.fromName;
    fromEmail = smtpConfig.fromEmail;
  }

  const transporter = createSmtpTransporter({ host, port, secure, auth });
  const normalizedAttachments = attachments.map(file => ({
  filename: file.filename,
  content:
    typeof file.content === 'string'
      ? Buffer.from(file.content, 'base64')
      : file.content?.data
      ? Buffer.from(file.content.data)
      : file.content,
  contentType: file.contentType
}));

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject,
    html,
    attachments:normalizedAttachments
  };

  const info = await withSmtpRetry(() => transporter.sendMail(mailOptions));

  if (smtpConfig) {
    await SmtpConfiguration.updateOne(
      { _id: smtpConfig._id },
      {
        $set: {
          isVerified: true,
          lastTestedAt: new Date(),
          lastError: null
        }
      }
    );
  }

  return info;
};
const sendEmailBySystem = async ({ to, subject, html, attachments = [] }) => {

  const transporter = createSmtpTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'draftnsign@gmail.com',
      pass: 'tbqhooitksgusmpc',
    },
  });

  const mailOptions = {
    from: '"DraftandSign" <draftnsign@gmail.com>',
    to: to,
    subject,
    html,
    attachments
  };

  const info = await withSmtpRetry(() => transporter.sendMail(mailOptions));

  return info;
};

module.exports = { sendEmailByUserId, sendEmailBySystem };
