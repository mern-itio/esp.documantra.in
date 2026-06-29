const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticator } = require('otplib');

const ADMIN_TWO_FA_TOKEN_EXPIRY = '10m';
const ADMIN_BRAND = process.env.APP_NAME || process.env.BRAND_NAME || 'Documantra';

authenticator.options = {
  window: [1, 1],
  step: 30,
};

const normalizeOtpCode = (value) => String(value || '').replace(/\s+/g, '').trim();

const hashBackupCode = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

const normalizeBackupCode = (code) =>
  String(code || '').replace(/\s+/g, '').toUpperCase();

const generateBackupCodes = (count = 8) => {
  const codes = [];
  for (let i = 0; i < count; i += 1) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

const issueAdminTwoFaToken = (adminId) =>
  jwt.sign(
    { adminId: String(adminId), purpose: 'admin_2fa_login' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ADMIN_TWO_FA_TOKEN_EXPIRY }
  );

const decodeAdminTwoFaToken = (twoFaToken) => {
  const decoded = jwt.verify(twoFaToken, process.env.ACCESS_TOKEN_SECRET);
  if (decoded?.purpose !== 'admin_2fa_login' || !decoded?.adminId) {
    throw new Error('Invalid admin 2FA token');
  }
  return decoded;
};

const verifyAdminAuthenticatorCode = (admin, code) => {
  const normalized = normalizeOtpCode(code);
  if (!admin?.twoFaAuthenticatorSecret) {
    return { valid: false, message: 'Authenticator app is not configured.' };
  }

  if (normalized.length === 6 && authenticator.check(normalized, admin.twoFaAuthenticatorSecret)) {
    return { valid: true };
  }

  if (normalized.length === 8 && Array.isArray(admin.twoFaBackupCodeHashes) && admin.twoFaBackupCodeHashes.length > 0) {
    const hashed = hashBackupCode(normalizeBackupCode(normalized));
    const idx = admin.twoFaBackupCodeHashes.indexOf(hashed);
    if (idx === -1) {
      return { valid: false, message: 'Invalid backup code' };
    }
    admin.twoFaBackupCodeHashes.splice(idx, 1);
    return { valid: true, usedBackupCode: true };
  }

  return {
    valid: false,
    message: normalized.length === 8 ? 'Invalid backup code' : 'Invalid authenticator code',
  };
};

const buildAdminAuthenticatorSetup = (admin) => {
  const tempSecret = authenticator.generateSecret();
  const accountLabel = admin.email || admin.fullname || 'admin';
  const otpauthUrl = authenticator.keyuri(accountLabel, `${ADMIN_BRAND} Admin`, tempSecret);
  return { tempSecret, otpauthUrl };
};

module.exports = {
  normalizeOtpCode,
  hashBackupCode,
  normalizeBackupCode,
  generateBackupCodes,
  issueAdminTwoFaToken,
  decodeAdminTwoFaToken,
  verifyAdminAuthenticatorCode,
  buildAdminAuthenticatorSetup,
  authenticator,
  ADMIN_BRAND,
};
