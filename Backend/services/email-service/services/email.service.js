const nodemailer = require('nodemailer');
const SmtpConfiguration = require('../models/SmtpConfiguration');

const sendEmailByUserId = async ({ userId, toEmail, subject, html, attachments = [] }) => {

  const smtpConfig = await SmtpConfiguration.findOne({
    userId,
    isDefault: true,
    isVerified: true,
    status: 'active'
  });

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

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth
  });
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

  const info = await transporter.sendMail(mailOptions);

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

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'draftnsign@gmail.com',
      pass: 'tbqhooitksgusmpc'
    }
  });

  const mailOptions = {
    from: '"DraftandSign" <draftnsign@gmail.com>',
    to: to,
    subject,
    html,
    attachments
  };

  const info = await transporter.sendMail(mailOptions);

  return info;
};

module.exports = { sendEmailByUserId, sendEmailBySystem };
