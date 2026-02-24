const nodemailer = require('nodemailer');

const APP_NAME = process.env.APP_NAME || 'Draft and Sign';

/** Returns true if string looks like a valid email (has @ and no URL). */
function isValidEmailAddress(value) {
  if (!value || typeof value !== 'string') return false;
  const s = value.trim();
  if (s.includes('http') || s.includes('://') || s.length > 254) return false;
  return s.includes('@') && s.indexOf('@') > 0 && s.indexOf('@') < s.length - 1;
}

/**
 * Create nodemailer transporter from env (EMAIL_USER, EMAIL_PASSWORD, EMAIL_SERVICE).
 * Returns null if not configured.
 */
function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null;
  try {
    const isSendGrid = process.env.EMAIL_SERVICE === 'sendgrid';
    const config = isSendGrid
      ? {
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: { user: 'apikey', pass: process.env.EMAIL_PASSWORD },
        }
      : {
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        };
    return nodemailer.createTransport(config);
  } catch (e) {
    console.error('Email transporter error:', e);
    return null;
  }
}

/**
 * Build HTML body for password reset email (responsive, modern template).
 */
function getPasswordResetHtml(resetLink, recipientEmail, expiresInMinutes = 60) {
  const fromName = process.env.EMAIL_FROM_NAME || APP_NAME;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); background: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(90deg, #4D0080, #8E2DE2); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">${fromName}</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Password reset request</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 36px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">Hi${recipientEmail ? ` <strong>${recipientEmail}</strong>` : ''},</p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #475569;">We received a request to reset the password for your account. Click the button below to set a new password. This link will expire in <strong>${expiresInMinutes} minutes</strong>.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${resetLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; background: linear-gradient(90deg, #4D0080, #8E2DE2); text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(8,75,220,0.35);">Reset password</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b;">If the button doesn’t work, copy and paste this link into your browser:</p>
              <p style="margin: 8px 0 0; font-size: 12px; word-break: break-all; color: #4D0080;"><a href="${resetLink}" style="color: #4D0080;">${resetLink}</a></p>
              <p style="margin: 28px 0 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">If you didn’t request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send password reset email. Resolves to true if sent, false if skipped (e.g. no SMTP config).
 */
async function sendPasswordResetEmail(toEmail, resetLink, recipientName = null) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('Password reset email skipped: EMAIL_USER/EMAIL_PASSWORD not set');
    return false;
  }

  // Inbox should show only "DraftandSign": From header = display name only; real address in envelope for SMTP
  const fromName = (process.env.EMAIL_FROM_NAME || APP_NAME).trim().replace(/"/g, '');
  let envelopeEmail = (process.env.EMAIL_FROM || process.env.EMAIL_USER || '').trim();
  if (!isValidEmailAddress(envelopeEmail)) envelopeEmail = (process.env.EMAIL_USER || '').trim();
  if (!isValidEmailAddress(envelopeEmail)) {
    console.warn('Password reset email: EMAIL_FROM/EMAIL_USER is not a valid email; sender may show incorrectly.');
  }
  const html = getPasswordResetHtml(resetLink, recipientName || toEmail, 60);

  try {
    await transporter.sendMail({
      from: envelopeEmail ? `"${fromName}"` : fromName,
      to: toEmail,
      subject: `Reset your password – ${APP_NAME}`,
      html,
      envelope: envelopeEmail ? { from: envelopeEmail } : undefined,
    });
    return true;
  } catch (err) {
    console.error('Send password reset email error:', err);
    return false;
  }
}

module.exports = {
  getTransporter,
  getPasswordResetHtml,
  sendPasswordResetEmail,
};
