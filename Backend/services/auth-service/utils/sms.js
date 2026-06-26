/**
 * Send SMS OTP. Uses Twilio if TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE are set;
 * otherwise logs OTP to console for development.
 * @param {string} phone - E.164 or 10-digit phone number
 * @param {string} otpCode - 6-digit OTP
 * @returns {Promise<boolean>} - true if sent or logged
 */
async function sendVerificationOtpSms(phone, otpCode) {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  // India-first normalization:
  // - 10 digits => assume India mobile => +91XXXXXXXXXX
  // - 12 digits starting with 91 => +91XXXXXXXXXX
  // - already has leading + => keep digits, prefix +
  let toNumber = '';
  if (raw.startsWith('+') && digits.length >= 10) {
    toNumber = `+${digits}`;
  } else if (digits.length === 10) {
    toNumber = `+91${digits}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    toNumber = `+${digits}`;
  } else if (digits.length > 0) {
    // last-resort: still try as E.164 digits
    toNumber = `+${digits}`;
  }

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE) {
    try {
      const fromRaw = String(process.env.TWILIO_PHONE || '').trim();
      const fromDigits = fromRaw.replace(/\D/g, '');
      const fromNumber = fromRaw.startsWith('+') ? fromRaw : (fromDigits ? `+${fromDigits}` : fromRaw);
      if (!toNumber || toNumber.length < 11) {
        throw new Error(`Invalid destination phone number. Use E.164 like +91XXXXXXXXXX. Got: "${phone}" -> "${toNumber}"`);
      }
      if (!fromNumber || !fromNumber.startsWith('+')) {
        throw new Error(`Invalid TWILIO_PHONE. Set it in E.164 like +91XXXXXXXXXX. Got: "${process.env.TWILIO_PHONE}"`);
      }
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your ${process.env.APP_NAME || 'Documantra'} verification code is: ${otpCode}. Valid for 10 minutes.`,
        from: fromNumber,
        to: toNumber,
      });
      return true;
    } catch (err) {
      console.warn('Twilio SMS failed, falling back to console OTP:', err?.code || err?.message || err);
      // Fallback: log so dev can use it
      console.log(`[SMS OTP fallback] To ${toNumber}: Your verification code is ${otpCode}`);
      return true;
    }
  }

  // Development: log OTP to console so you can use it in UI
  console.log(`[SMS OTP] To ${toNumber}: Your verification code is ${otpCode}`);
  return true;
}

module.exports = { sendVerificationOtpSms };
