const axios = require('axios');

const { getBrandName, wrapBrandedEmailBody } = require('@draftnsign/validators/brandConfig');

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

function getEmailServiceUrl() {
  return String(process.env.EMAIL_SERVICE_URL || '').trim().replace(/\/$/, '');
}

function isEmailConfigured() {
  return Boolean(getEmailServiceUrl());
}

async function sendEmail({ to, subject, html }) {
  const emailServiceUrl = getEmailServiceUrl();
  if (!emailServiceUrl) {
    console.warn('Email not sent: EMAIL_SERVICE_URL is not configured');
    return false;
  }

  try {
    const response = await axios.post(
      `${emailServiceUrl}/mail/send-by-system`,
      { to, subject, html, senderMode: 'dm' },
      { timeout: 15000 }
    );
    if (response.data?.success) {
      return true;
    }
    console.error('Email service returned failure:', response.data);
    return false;
  } catch (err) {
    console.error('Email service send error:', err?.response?.data?.message || err.message);
    return false;
  }
}

/**
 * Build HTML body for password reset email (responsive, modern template).
 */
function simpleEmailHtml(title, bodyHtml) {
  return wrapBrandedEmailBody(`
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#333333;text-align:center;line-height:1.3;">${escapeHtml(title)}</h1>
    ${bodyHtml}
  `);
}

function getPasswordResetHtml(resetLink, recipientEmail, expiresInMinutes = 60) {
  return simpleEmailHtml('Reset your password', `
    <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.6; color: #1f2937;">Hello${recipientEmail ? ` <strong>${escapeHtml(recipientEmail)}</strong>` : ''},</p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #6b7280;">We received a request to reset the password for your ${escapeHtml(APP_NAME)} account. This link expires in <strong>${expiresInMinutes} minutes</strong>.</p>
    <p style="text-align:center; margin: 0 0 24px;">
      <a href="${resetLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:16px 40px; font-size:14px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#ffffff; background:#248567; text-decoration:none; border-radius:4px;">Reset password</a>
    </p>
    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b7280; text-align:center;">If you did not request this, you can safely ignore this email.</p>
    <p style="margin: 12px 0 0; font-size: 12px; word-break: break-all; color: #4D0080; text-align:center;"><a href="${resetLink}" rel="noopener noreferrer" style="color: #4D0080;">${escapeHtml(resetLink)}</a></p>
  `);
}

/**
 * Build HTML body for signup verification OTP email.
 */
function getVerificationOtpHtml(otpCode, recipientName = null, expiresInMinutes = 10) {
  const safeOtp = escapeHtml(otpCode);
  return simpleEmailHtml('Complete your sign-in', `
    <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.6; color: #1f2937;">Hello${recipientName ? ` <strong>${escapeHtml(recipientName)}</strong>` : ''},</p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #6b7280;">Use the code below to verify your ${escapeHtml(APP_NAME)} account. This code expires in <strong>${expiresInMinutes} minutes</strong>.</p>
    <div style="text-align: center; margin: 28px 0 24px;">
      <div style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #1f2937; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 28px; font-family: 'Courier New', Courier, monospace;">${safeOtp}</div>
    </div>
    <p style="margin: 0; font-size: 13px; color: #6b7280; text-align:center;">If you did not sign up, you can safely ignore this email.</p>
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
    console.warn('Verification OTP email not sent: EMAIL_SERVICE_URL not configured');
    return false;
  }
  const html = getVerificationOtpHtml(otpCode, recipientName, expiresInMinutes);
  try {
    const sent = await sendEmail({
      to: toEmail,
      subject: `Verify your email – ${APP_NAME}`,
      html,
    });
    return sent;
  } catch (err) {
    console.error('Send verification OTP email error:', err);
    return false;
  }
}

/**
 * Send password reset email. Resolves to true if sent, false if skipped.
 */
async function sendPasswordResetEmail(toEmail, resetLink, recipientName = null) {
  if (!isEmailConfigured()) {
    console.warn('Password reset email skipped: EMAIL_SERVICE_URL not configured');
    return false;
  }

  const html = getPasswordResetHtml(resetLink, recipientName || toEmail, 60);

  try {
    const sent = await sendEmail({
      to: toEmail,
      subject: `Reset your password - ${APP_NAME}`,
      html,
    });
    return sent;
  } catch (err) {
    console.error('Send password reset email error:', err);
    return false;
  }
}

function isPrivateOrLocalIp(ip) {
  if (!ip || ip === 'Unknown IP') return true;
  const normalised = String(ip).replace(/^::ffff:/i, '').trim();
  const privateRanges = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^::1$/,
    /^localhost$/i,
  ];
  return privateRanges.some((re) => re.test(normalised));
}

/**
 * Resolve geo + ISP fields from an IP via ip-api.com (free, no key).
 */
async function resolveGeoFromIp(ip) {
  const empty = {
    query: '',
    city: '',
    region: '',
    country: '',
    countryCode: '',
    timezone: 'Asia/Kolkata',
    isp: '',
    org: '',
    lat: null,
    lon: null,
  };
  if (!ip || ip === 'Unknown IP') return { ...empty, timezone: 'Asia/Kolkata' };

  const normalised = String(ip).replace(/^::ffff:/i, '').trim();
  if (isPrivateOrLocalIp(normalised)) {
    return { ...empty, query: normalised, timezone: 'Asia/Kolkata', city: 'Private/Local', country: 'Local network' };
  }

  try {
    const { data } = await axios.get(
      `http://ip-api.com/json/${encodeURIComponent(normalised)}?fields=status,message,query,country,countryCode,regionName,city,lat,lon,timezone,isp,org`,
      { timeout: 4000 }
    );
    if (data && data.status === 'success') {
      return {
        query: data.query || normalised,
        city: data.city || '',
        region: data.regionName || '',
        country: data.country || '',
        countryCode: data.countryCode || '',
        timezone: data.timezone || 'UTC',
        isp: data.isp || '',
        org: data.org || '',
        lat: typeof data.lat === 'number' ? data.lat : null,
        lon: typeof data.lon === 'number' ? data.lon : null,
      };
    }
  } catch (err) {
    console.warn('IP geo lookup failed:', err.message);
  }
  return { ...empty, query: normalised, timezone: 'UTC' };
}

/**
 * Resolve IANA timezone string from an IP address using ip-api.com (free, no key needed).
 * Falls back to 'Asia/Kolkata' for private/loopback IPs, and 'UTC' on any error.
 */
async function resolveTimezoneFromIp(ip) {
  const geo = await resolveGeoFromIp(ip);
  return geo.timezone || 'UTC';
}

function getMarketingSignupNotifyTo() {
  return String(process.env.MARKETING_SIGNUP_NOTIFY_EMAIL || 'marketing@documantra.in').trim();
}

function formatLocationLabel(geo = {}) {
  const parts = [geo.city, geo.region, geo.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Unknown';
}

function getSignupMarketingHtml({ user, attribution, signupMethod }) {
  const geo = attribution?.signupGeo || {};
  const location = formatLocationLabel(geo);
  const rows = [
    ['Name', user?.fullname || '—'],
    ['Email', user?.email || '—'],
    ['Phone', user?.phone && !String(user.phone).startsWith('__opt_') ? user.phone : '—'],
    ['Company', user?.company || '—'],
    ['User ID', user?._id ? String(user._id) : '—'],
    ['Signup method', signupMethod || 'email'],
    ['Signed up at', user?.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()],
    ['IP address', attribution?.signupIp || '—'],
    ['Location', location],
    ['Country code', geo.countryCode || '—'],
    ['Timezone', geo.timezone || '—'],
    ['ISP / Org', [geo.isp, geo.org].filter(Boolean).join(' / ') || '—'],
    ['Coordinates', geo.lat != null && geo.lon != null ? `${geo.lat}, ${geo.lon}` : '—'],
    ['Traffic source', attribution?.signupTrafficSource || '—'],
    ['Search keyword', attribution?.signupSearchKeyword || attribution?.signupUtmTerm || '— (not provided by Google / not in URL)'],
    ['External referrer (Google / site)', attribution?.signupExternalReferrer || attribution?.signupHttpReferrer || '— (direct / none)'],
    ['First landing page', attribution?.signupLandingPage || '—'],
    ['Signup page URL', attribution?.signupPageUrl || '—'],
    ['UTM source', attribution?.signupUtmSource || '—'],
    ['UTM medium', attribution?.signupUtmMedium || '—'],
    ['UTM campaign', attribution?.signupUtmCampaign || '—'],
    ['UTM term', attribution?.signupUtmTerm || '—'],
    ['GCLID / FBCLID', [attribution?.signupGclid, attribution?.signupFbclid].filter(Boolean).join(' / ') || '—'],
    ['User-Agent', attribution?.signupUserAgent || '—'],
  ];

  const journey = Array.isArray(attribution?.signupJourney) ? attribution.signupJourney : [];
  const journeyHtml = journey.length
    ? `<ol style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#6b7280;line-height:1.5;">${journey
        .map(
          (step, i) =>
            `<li style="margin:0 0 6px;word-break:break-all;"><strong>${i + 1}.</strong> ${escapeHtml(step.title || 'Page')}<br/><a href="${escapeHtml(step.url)}" style="color:#4D0080;">${escapeHtml(step.url)}</a>${step.referrer ? `<br/><span style="color:#9ca3af;">via ${escapeHtml(step.referrer)}</span>` : ''}</li>`
        )
        .join('')}</ol>`
    : '<span style="color:#6b7280;">—</span>';

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;font-weight:600;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;word-break:break-all;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('') + `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;font-weight:600;width:38%;vertical-align:top;">Pages before signup</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;">${journeyHtml}</td>
      </tr>`;

  return simpleEmailHtml('New User signup', `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#6b7280;">A new customer registered on ${escapeHtml(APP_NAME)}. Tracking details below.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#ffffff;">
      ${tableRows}
    </table>
  `);
}

/**
 * Notify marketing@ of a new signup with IP / geo / referrer attribution.
 */
async function sendSignupMarketingEmail({ user, attribution, signupMethod }) {
  const to = getMarketingSignupNotifyTo();
  if (!isValidEmailAddress(to)) {
    console.warn('Marketing signup email skipped: invalid MARKETING_SIGNUP_NOTIFY_EMAIL');
    return false;
  }
  if (!isEmailConfigured()) {
    console.warn('Marketing signup email skipped: EMAIL_SERVICE_URL not configured');
    return false;
  }

  const name = user?.fullname || user?.email || 'Customer';
  const html = getSignupMarketingHtml({ user, attribution, signupMethod });
  try {
    return await sendEmail({
      to,
      subject: `New signup: ${name} — ${APP_NAME}`,
      html,
    });
  } catch (err) {
    console.error('Send marketing signup email error:', err);
    return false;
  }
}

/**
 * Format a Date in the given IANA timezone with a human-readable layout.
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
    return new Date(date).toUTCString();
  }
}

/**
 * Build HTML body for New Login Alert email.
 */
function getNewLoginAlertHtml(recipientName, deviceInfo, ipAddress, time, userTimezone = 'UTC') {
  const formattedTime = formatTimeInZone(time, userTimezone);

  return simpleEmailHtml('New login detected', `
    <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.6; color: #1f2937;">Hello${recipientName ? ` <strong>${escapeHtml(recipientName)}</strong>` : ''},</p>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.65; color: #6b7280;">We noticed a new login to your ${escapeHtml(APP_NAME)} account.</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 3px solid #ef4444; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #1f2937;"><strong>Device/Browser:</strong> <span style="color: #6b7280;">${escapeHtml(deviceInfo || 'Unknown Device')}</span></p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #1f2937;"><strong>IP Address:</strong> <span style="color: #6b7280;">${escapeHtml(ipAddress || 'Unknown IP')}</span></p>
      <p style="margin: 0; font-size: 14px; color: #1f2937;"><strong>Time:</strong> <span style="color: #6b7280;">${formattedTime}</span></p>
    </div>
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: #6b7280; text-align:center;">If this was you, you can safely ignore this email.</p>
    <p style="margin: 0; font-size: 15px; line-height: 1.65; color: #dc2626; font-weight: 600; text-align:center;">If this was not you, review active sessions and change your password immediately.</p>
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
    console.warn('New login alert email skipped: EMAIL_SERVICE_URL not configured');
    return false;
  }

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
  resolveGeoFromIp,
  resolveTimezoneFromIp,
  sendSignupMarketingEmail,
  getMarketingSignupNotifyTo,
};
