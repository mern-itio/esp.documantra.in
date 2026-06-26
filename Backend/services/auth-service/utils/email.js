const {
  sendEmail: globalSendEmail,
  getEmailProvider,
  isMailgunConfigured,
  isBrevoConfigured,
  isSmtpConfigured,
} = require('@draftnsign/email-lib');

const { getBrandName } = require('@draftnsign/validators/brandConfig');

const APP_NAME = getBrandName();

function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

function isEmailConfigured() {
  const provider = getEmailProvider(process.env);
  if (provider === 'smtp') {
    return isSmtpConfigured(process.env);
  }
  if (provider === 'brevo') {
    return isBrevoConfigured(process.env);
  }
  return isMailgunConfigured(process.env);
}

async function sendEmail({ to, subject, html }) {
  if (!isEmailConfigured()) {
    console.warn('Email not sent: email provider configuration is missing');
    return false;
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || undefined;
    const fromName = getFromDisplayName();
    const from = fromEmail ? `${fromName} <${fromEmail}>` : undefined;

    await globalSendEmail({
      to,
      subject,
      html,
      from,
    });
    return true;
  } catch (err) {
    console.error('Global email send error:', err);
    return false;
  }
}

/**
 * Build HTML body for password reset email (responsive, modern template).
 */
function simpleEmailHtml(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:24px 16px; background-color:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px 28px; border:1px solid #e2e8f0;">
    <h1 style="margin:0 0 20px; font-size:20px; font-weight:700; color:#0f172a;">${escapeHtml(title)}</h1>
    ${bodyHtml}
  </div>
</body>
</html>`.trim();
}

function getPasswordResetHtml(resetLink, recipientEmail, expiresInMinutes = 60) {
  return simpleEmailHtml('Reset your password', `
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">Hi${recipientEmail ? ` <strong>${escapeHtml(recipientEmail)}</strong>` : ''},</p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #475569;">We received a request to reset the password for your ${escapeHtml(APP_NAME)} account. This link expires in <strong>${expiresInMinutes} minutes</strong>.</p>
    <p style="text-align:center; margin: 0 0 24px;">
      <a href="${resetLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; background:#4D0080; text-decoration:none; border-radius:10px;">Reset password</a>
    </p>
    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b;">If you did not request this, you can safely ignore this email.</p>
    <p style="margin: 12px 0 0; font-size: 12px; word-break: break-all; color: #4D0080;"><a href="${resetLink}" style="color: #4D0080;">${resetLink}</a></p>
  `);
}

/**
 * Build HTML body for signup verification OTP email.
 */
function getVerificationOtpHtml(otpCode, recipientName = null, expiresInMinutes = 10) {
  return simpleEmailHtml('Verify your email', `
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">Hi${recipientName ? ` <strong>${escapeHtml(recipientName)}</strong>` : ''},</p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #475569;">Use the code below to verify your ${escapeHtml(APP_NAME)} account. This code expires in <strong>${expiresInMinutes} minutes</strong>.</p>
    <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 12px; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #4D0080;">${otpCode}</div>
    <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8;">If you did not sign up, you can safely ignore this email.</p>
  `);
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
 * Resolve IANA timezone string from an IP address using ip-api.com (free, no key needed).
 * Falls back to 'Asia/Kolkata' for private/loopback IPs, and 'UTC' on any error.
 */
async function resolveTimezoneFromIp(ip) {
  if (!ip || ip === 'Unknown IP') return 'Asia/Kolkata';

  // Unwrap IPv4-mapped IPv6 addresses (e.g. ::ffff:49.36.179.233 → 49.36.179.233)
  const normalised = ip.replace(/^::ffff:/i, '').trim();

  const privateRanges = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^::1$/,
    /^localhost$/i,
  ];
  if (privateRanges.some((re) => re.test(normalised))) {
    // Private / loopback — default to IST as the app is India-based
    return 'Asia/Kolkata';
  }

  try {
    const axios = require('axios');
    const { data } = await axios.get(
      `http://ip-api.com/json/${normalised}?fields=status,timezone`,
      { timeout: 3000 }
    );
    if (data && data.status === 'success' && data.timezone) return data.timezone;
  } catch (err) {
    console.warn('IP timezone lookup failed, falling back to UTC:', err.message);
  }
  return 'UTC';
}

/**
 * Format a Date in the given IANA timezone with a human-readable layout.
 * Example output: "25 March 2026, 06:24 PM IST"
 */
function formatTimeInZone(date, timezone) {
  try {
    return new Date(date).toLocaleString('en-IN', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    // Intl may not recognise unusual timezone strings on some Node versions
    return new Date(date).toUTCString();
  }
}

/**
 * Build HTML body for New Login Alert email.
 * @param {string} recipientName
 * @param {string} deviceInfo
 * @param {string} ipAddress
 * @param {Date|string} time
 * @param {string} [userTimezone='UTC']  IANA timezone resolved from the user's IP
 */
function getNewLoginAlertHtml(recipientName, deviceInfo, ipAddress, time, userTimezone = 'UTC') {
  const formattedTime = formatTimeInZone(time, userTimezone);

  return simpleEmailHtml('New login detected', `
    <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">Hi${recipientName ? ` <strong>${escapeHtml(recipientName)}</strong>` : ''},</p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #475569;">We noticed a new login to your ${escapeHtml(APP_NAME)} account.</p>
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #334155;"><strong>Device/Browser:</strong> <span style="color: #64748b;">${escapeHtml(deviceInfo || 'Unknown Device')}</span></p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #334155;"><strong>IP Address:</strong> <span style="color: #64748b;">${escapeHtml(ipAddress || 'Unknown IP')}</span></p>
      <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Time:</strong> <span style="color: #64748b;">${formattedTime}</span></p>
    </div>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: #475569;">If this was you, you can safely ignore this email.</p>
    <p style="margin: 0; font-size: 15px; line-height: 1.65; color: #d32f2f; font-weight: bold;">If this was not you, review active sessions and change your password immediately.</p>
  `);
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

  // Resolve user's timezone from their IP before building the email
  const userTimezone = await resolveTimezoneFromIp(ipAddress);
  const html = getNewLoginAlertHtml(fullname, deviceInfo, ipAddress, time, userTimezone);
  
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
