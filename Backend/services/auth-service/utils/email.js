const nodemailer = require('nodemailer');

const APP_NAME = process.env.APP_NAME || 'Draft and Sign';

/** Returns true if string looks like a valid email (has @ and no URL). */
function isValidEmailAddress(value) {
  if (!value || typeof value !== 'string') return false;
  const s = value.trim();
  if (s.includes('http') || s.includes('://') || s.length > 254) return false;
  return s.includes('@') && s.indexOf('@') > 0 && s.indexOf('@') < s.length - 1;
}

function getFromDisplayName() {
  return (process.env.EMAIL_FROM_NAME || APP_NAME).trim().replace(/"/g, '');
}

function getEmailTransportConfig() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
  if (!user || !pass) {
    return null;
  }

  const service = process.env.EMAIL_SERVICE;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = port === 465;

  if (service) {
    return {
      service,
      auth: { user, pass },
    };
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
  };
}

function isEmailConfigured() {
  return !!getEmailTransportConfig();
}

let cachedTransport = null;
function getTransport() {
  if (cachedTransport) return cachedTransport;
  const config = getEmailTransportConfig();
  if (!config) return null;
  cachedTransport = nodemailer.createTransport(config);
  return cachedTransport;
}

async function sendEmail({ to, subject, html }) {
  const transport = getTransport();
  if (!transport) {
    console.warn('Email not sent: SMTP / email configuration is missing');
    return false;
  }

  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const fromName = getFromDisplayName();
  const from = fromEmail ? `${fromName} <${fromEmail}>` : fromName;

  await transport.sendMail({
    from,
    to,
    subject,
    html,
  });
  return true;
}

/**
 * Build HTML body for password reset email (responsive, modern template).
 */
function getPasswordResetHtml(resetLink, recipientEmail, expiresInMinutes = 60) {
  const fromName = getFromDisplayName();
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
 * Build HTML body for signup verification OTP email.
 */
function getVerificationOtpHtml(otpCode, recipientName = null, expiresInMinutes = 10) {
  const fromName = getFromDisplayName();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); background: #ffffff;">
          <tr>
            <td style="background: linear-gradient(90deg, #4D0080, #8E2DE2); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">${fromName}</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Verify your account</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 36px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">Hi${recipientName ? ` <strong>${recipientName}</strong>` : ''},</p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #475569;">Use the code below to verify your email. This code expires in <strong>${expiresInMinutes} minutes</strong>.</p>
              <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 12px; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #4D0080;">${otpCode}</div>
              <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8;">If you didn't sign up for an account, you can safely ignore this email.</p>
            </td>
          </tr>
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
 * Send signup verification OTP email. Resolves to true if sent, false if skipped.
 */
async function sendVerificationOtpEmail(toEmail, otpCode, recipientName = null, expiresInMinutes = 10) {
  if (!isValidEmailAddress(toEmail)) {
    console.warn('Verification OTP email skipped: invalid recipient email:', toEmail);
    return false;
  }
  if (!isEmailConfigured()) {
    // Development fallback: log OTP so local signup flow can continue without SMTP
    console.warn('Verification OTP email not sent: SMTP/email not configured');
    console.log(`[EMAIL OTP fallback] To ${toEmail}: Your verification code is ${otpCode}`);
    return true;
  }
  const html = getVerificationOtpHtml(otpCode, recipientName, expiresInMinutes);
  try {
    await sendEmail({
      to: toEmail,
      subject: `Verify your email – ${APP_NAME}`,
      html,
    });
    return true;
  } catch (err) {
    console.error('Send verification OTP email error:', err);
    console.log(`[EMAIL OTP fallback] To ${toEmail}: Your verification code is ${otpCode}`);
    return false;
  }
}

/**
 * Send password reset email. Resolves to true if sent, false if skipped (e.g. no SMTP config).
 */
async function sendPasswordResetEmail(toEmail, resetLink, recipientName = null) {
  if (!isEmailConfigured()) {
    console.warn('Password reset email skipped: SMTP/email not configured');
    return false;
  }

  const html = getPasswordResetHtml(resetLink, recipientName || toEmail, 60);

  try {
    await sendEmail({
      to: toEmail,
      subject: `Reset your password - ${APP_NAME}`,
      html,
    });
    return true;
  } catch (err) {
    console.error('Send password reset email error:', err);
    return false;
  }
}

/**
 * Build HTML body for New Login Alert email.
 */
function getNewLoginAlertHtml(recipientName, deviceInfo, ipAddress, time) {
  const fromName = getFromDisplayName();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert: New Login Detected</title>
</head>
<body style="margin:0; padding:0; background-color:#f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); background: #ffffff;">
          <tr>
            <td style="background: linear-gradient(90deg, #d32f2f, #f44336); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">${fromName} Security Alert</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">New login detected</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 36px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">Hi${recipientName ? ` <strong>${recipientName}</strong>` : ''},</p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #475569;">We noticed a new login to your account from a device or location we haven't seen before.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #334155;"><strong>Device/Browser:</strong> <span style="color: #64748b;">${deviceInfo || 'Unknown Device'}</span></p>
                <p style="margin: 0 0 8px; font-size: 14px; color: #334155;"><strong>IP Address:</strong> <span style="color: #64748b;">${ipAddress || 'Unknown IP'}</span></p>
                <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Time:</strong> <span style="color: #64748b;">${new Date(time).toUTCString()}</span></p>
              </div>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: #475569;">If this was you, you can safely ignore this email.</p>
              <p style="margin: 0; font-size: 15px; line-height: 1.65; color: #d32f2f; font-weight: bold;">If this wasn't you, your account may be compromised.</p>
              <p style="margin: 8px 0 0; font-size: 14px; line-height: 1.6; color: #475569;">Please log in to your account, review your active sessions in Profile > Session Management, and log out any unrecognized devices immediately. You should also change your password.</p>
            </td>
          </tr>
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
 * Send new login alert email. Resolves to true if sent, false if skipped.
 */
async function sendNewLoginAlertEmail(toEmail, fullname, deviceInfo, ipAddress, time) {
  if (!isValidEmailAddress(toEmail)) {
    return false;
  }
  if (!isEmailConfigured()) {
    console.warn('New login alert email skipped: SMTP/email not configured');
    return false;
  }
  
  const html = getNewLoginAlertHtml(fullname, deviceInfo, ipAddress, time);
  
  try {
    await sendEmail({
      to: toEmail,
      subject: `Security Alert: New Login Detected - ${APP_NAME}`,
      html,
    });
    return true;
  } catch (err) {
    console.error('Send new login alert email error:', err);
    return false;
  }
}

module.exports = {
  getPasswordResetHtml,
  getVerificationOtpHtml,
  sendPasswordResetEmail,
  sendVerificationOtpEmail,
  sendNewLoginAlertEmail,
};
