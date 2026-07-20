const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticator } = require('otplib');
const User  = require('../models/User');
const { attachReferralOnSignup } = require('./referralController');
const { isEmailValid, getPasswordPolicyError, getPlainTextFieldError } = require('@draftnsign/validators');
const { sendPasswordResetEmail, sendVerificationOtpEmail, sendNewLoginAlertEmail } = require('../utils/email');
const { sendVerificationOtpSms } = require('../utils/sms');
// const { verifyJWT } = require('@draftnsign/auth-lib');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { getAccessTokenCookieOptions } = require('../utils/cookieOptions');
const { extractAccessToken } = require('@draftnsign/auth-lib');
const { getPasswordReuseError, archiveCurrentPassword } = require('../utils/passwordHistory');
const { enforceConcurrentSessionLimit, getMaxConcurrentSessions } = require('../utils/sessionLimits');
const { getSessionIdleTimeoutMs, getSessionIdleTimeoutHours } = require('../utils/sessionPolicy');
const { shouldRequireTwoFaSetup, isLoginTwoFaEnforcementEnabled, getTwoFaGraceDays, isAdminLoginTwoFaEnforcementEnabled, getAdminTwoFaGraceDays } = require('../utils/twoFaPolicy');
const { recordConsentEntries } = require('../services/consentService');
const {
  CONSENT_TYPES,
  SUBJECT_TYPES,
  CONSENT_SOURCES,
  DEFAULT_CONSENT_VERSIONS,
} = require('@draftnsign/validators/userConsent');

const OTP_EXPIRY_MINUTES = 10;
const SIGNUP_TOKEN_EXPIRY = '15m';
const TWO_FA_TOKEN_EXPIRY = '10m';
const TWO_FA_RECOVERY_TOKEN_EXPIRY = '10m';
const TWO_FA_SETUP_TOKEN_EXPIRY = process.env.TWO_FA_SETUP_TOKEN_EXPIRY || '30m';
const MIN_RECOVERY_QUESTIONS = 3;

authenticator.options = {
  window: [1, 1],
  step: 30,
};

async function verifyRecaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) return true; // Bypass if not configured
  if (!token) return false;
  
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    );
    return response.data.success;
  } catch (error) {
    console.error('Recaptcha verification error:', error);
    return false;
  }
}

function isChromeExtensionClient(req) {
  const clientType = String(req?.headers?.['x-client-type'] || '').toLowerCase().trim();
  if (clientType !== 'chrome-extension') return false;

  const extId = String(req?.headers?.['x-extension-id'] || '').trim();
  if (!extId) return false;

  const allow = String(process.env.EXTENSION_ID_ALLOWLIST || '').trim();
  if (!allow) return true; // If not configured, accept any extension id

  const allowedIds = allow
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return allowedIds.includes(extId);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function hashRecoveryAnswer(answer) {
  return crypto.createHash('sha256').update(`2fa-recovery-answer:${String(answer || '').trim().toLowerCase()}`).digest('hex');
}

/** 10 backup codes, formatted as XXXX-XXXX (8 digits); one-time use each */
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i += 1) {
    const a = String(Math.floor(1000 + Math.random() * 9000));
    const b = String(Math.floor(1000 + Math.random() * 9000));
    codes.push(`${a}-${b}`);
  }
  return codes;
}

function normalizeBackupCode(input) {
  return String(input || '').replace(/\D/g, '').slice(0, 8);
}

function hashBackupCode(normalizedDigits) {
  return crypto.createHash('sha256').update(`2fa-backup:${normalizedDigits}`).digest('hex');
}

function normalizeOtpCode(otp) {
  return String(otp || '').replace(/\s|-/g, '').trim();
}

function hashDeviceId(deviceId) {
  // Use server secret as salt so hashes can't be reversed easily
  const salt = process.env.ACCESS_TOKEN_SECRET || 'draftnsign';
  return crypto.createHash('sha256').update(`${salt}:${String(deviceId)}`).digest('hex');
}

function maskEmail(email) {
  const s = String(email || '');
  const [local, domain] = s.split('@');
  if (!local || !domain) return 'your email';
  const start = local.slice(0, 2);
  return `${start}***@${domain}`;
}

function maskPhone(phoneDigits) {
  const d = String(phoneDigits || '').replace(/\D/g, '');
  if (d.length < 6) return 'your phone';
  return `***${d.slice(-4)}`;
}

function maskQuestion(question) {
  return String(question || '').trim().slice(0, 200);
}

function sanitizeRecoveryQuestions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      question: maskQuestion(item?.question),
      answer: String(item?.answer || '').trim(),
    }))
    .filter((item) => item.question && item.answer);
}

function recoveryEmailChoices(user) {
  const choices = [];
  if (user?.email) choices.push({ key: 'primary', label: 'Primary email', masked: maskEmail(user.email) });
  if (user?.recoveryEmail) choices.push({ key: 'recovery', label: 'Recovery email', masked: maskEmail(user.recoveryEmail) });
  return choices;
}

function issueTwoFaToken(userId, deviceIdHash) {
  return jwt.sign(
    { userId: String(userId), purpose: '2fa_login', deviceIdHash },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: TWO_FA_TOKEN_EXPIRY }
  );
}

function decodeTwoFaToken(twoFaToken) {
  const decoded = jwt.verify(twoFaToken, process.env.ACCESS_TOKEN_SECRET);
  if (decoded?.purpose !== '2fa_login' || !decoded?.userId || !decoded?.deviceIdHash) {
    throw new Error('Invalid 2FA token');
  }
  return decoded;
}

function issueTwoFaRecoveryToken(userId, deviceIdHash, destination) {
  return jwt.sign(
    { userId: String(userId), purpose: '2fa_recovery_login', deviceIdHash, destination },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: TWO_FA_RECOVERY_TOKEN_EXPIRY }
  );
}

function decodeTwoFaRecoveryToken(token) {
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  if (
    decoded?.purpose !== '2fa_recovery_login'
    || !decoded?.userId
    || !decoded?.deviceIdHash
    || !decoded?.destination
  ) {
    throw new Error('Invalid 2FA recovery token');
  }
  return decoded;
}

async function sendTwoFaOtp(user) {
  if (user.twoFaMethod === 'authenticator') {
    return { method: 'authenticator', destination: 'your authenticator app' };
  }

  const otp = generateOtp();
  user.twoFaOtpHash = hashOtp(otp);
  user.twoFaOtpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  if (user.twoFaMethod === 'sms') {
    await sendVerificationOtpSms(user.phone, otp);
    return { method: 'sms', destination: maskPhone(user.phone) };
  }

  await sendVerificationOtpEmail(user.email, otp, user.fullname, OTP_EXPIRY_MINUTES);
  return { method: 'email', destination: maskEmail(user.email) };
}

function issueSignupToken(userId) {
  return jwt.sign(
    { userId: String(userId), purpose: 'signup_verify' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: SIGNUP_TOKEN_EXPIRY }
  );
}

function decodeSignupToken(signupToken) {
  const decoded = jwt.verify(signupToken, process.env.ACCESS_TOKEN_SECRET);
  if (decoded?.purpose !== 'signup_verify' || !decoded?.userId) {
    throw new Error('Invalid signup token');
  }
  return decoded;
}

async function sendEmailOtp(user) {
  const emailOtp = generateOtp();
  user.emailOtpHash = hashOtp(emailOtp);
  user.emailOtpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  await sendVerificationOtpEmail(user.email, emailOtp, user.fullname, OTP_EXPIRY_MINUTES);
}

async function sendPhoneOtp(user) {
  const phoneOtp = generateOtp();
  user.phoneOtpHash = hashOtp(phoneOtp);
  user.phoneOtpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  await sendVerificationOtpSms(user.phone, phoneOtp);
}

function hasEnoughPhoneDigits(user) {
  const d = String(user?.phone || '').replace(/\D/g, '');
  return d.length >= 10;
}

function verificationState(user) {
  return {
    emailVerified: !!user.emailVerified,
    phoneVerified: !!user.phoneVerified,
    canSendPhoneOtp:
      !!user.emailVerified && !user.phoneVerified && hasEnoughPhoneDigits(user),
  };
}

/** Email verification completes signup; phone SMS is optional when a number is on file. */
async function maybeIssueAccessTokenIfVerified(user, res, req) {
  if (!user.emailVerified) return null;
  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '8h';
  const accessToken = await generateAccessTokenUser(user, expireIn, req);
  res.cookie('accessToken', accessToken, getAccessTokenCookieOptions(req, expireIn));
  return {
    status: 200,
    message: 'Account verified successfully',
    user_id: user._id,
    token: accessToken,
    type: 'user',
    phone: user.phone,
    plan: user.plan || 'free',
    isFirstLogin: user.isFirstLogin,
    ...verificationState(user),
  };
}
const { getLoginPublicKeyPem } = require('../utils/loginPayloadCrypto');

const getLoginPublicKey = (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.status(200).json({
    v: 1,
    alg: 'RSA-OAEP-256',
    enc: 'aes-256-gcm',
    publicKey: getLoginPublicKeyPem(),
  });
};

// Login Controller
const login = async (req, res) => {
  const { email, password, deviceId, deviceLabel, recaptchaToken } = req.body;

  if (!email) return res.status(400).json({ message: 'Email required' });
  if (!password) return res.status(400).json({ message: 'Password required' });

  if (!isChromeExtensionClient(req)) {
    const isValidRecaptcha = true; // captcha disabled
    if (!isValidRecaptcha) {
      return res.status(400).json({ message: 'Invalid reCAPTCHA. Please try again.' });
    }
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!isEmailValid(normalizedEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({
      status: 401,
      message: 'Invalid email or password',
      data: null
    });
  }

  if (user?.status === false) {
    return res.status(401).json({
      status: 401,
      message: "Your Account has been suspended, please contact the Admin",
      data: null
    });
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingTime = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000 / 60);
    return res.status(403).json({
      status: 403,
      message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingTime} minutes.`,
      data: null
    });
  }

  const isPasswdCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswdCorrect) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
  
    const maxAttempts = 3;
    const attemptsLeft = Math.max(maxAttempts - user.failedLoginAttempts, 0);
  
    // Lock account if attempts exceeded
    if (user.failedLoginAttempts >= maxAttempts) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
    }
  
    await user.save({ validateBeforeSave: false });
  
    let message = "";
  
    if (attemptsLeft > 0) {
      message = `Invalid email or password. You have ${attemptsLeft} attempt${attemptsLeft > 1 ? "s" : ""} left. Please check your credentials or reset your password.`;
    } else {
      message = "Your account has been temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.";
    }
  
    return res.status(401).json({
      status: 401,
      message,
      attemptsLeft,
      failedLoginAttempts: user.failedLoginAttempts,
      data: null
    });
  }

  // Reset failed attempts on successful login
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });
  }

  if (shouldRequireTwoFaSetup(user)) {
    return respondTwoFaSetupRequired(req, res, user);
  }

  // Optional 2FA: if enabled and device is not trusted, require OTP
  if (user.twoFaEnabled) {
    const did = String(deviceId || req.headers['x-device-id'] || '').trim();
    const didHash = did ? hashDeviceId(did) : null;
    const trusted = didHash ? (user.trustedDevices || []).some(d => d.deviceIdHash === didHash) : false;

    if (!trusted) {
      const twoFaToken = issueTwoFaToken(user._id, didHash || 'unknown');
      let destInfo = {
        method: user.twoFaMethod || 'email',
        destination: user.twoFaMethod === 'sms'
          ? maskPhone(user.phone)
          : (user.twoFaMethod === 'authenticator' ? 'your authenticator app' : maskEmail(user.email))
      };
      try {
        destInfo = await sendTwoFaOtp(user);
      } catch (err) {
        console.error('Failed to send 2FA OTP:', err);
      }
      return res.status(403).json({
        status: 403,
        code: 'TWO_FA_REQUIRED',
        message: `Enter the code we sent to ${destInfo.destination}`,
        method: destInfo.method,
        twoFaToken,
        recoveryAvailable: Array.isArray(user.twoFaRecoveryQuestions) && user.twoFaRecoveryQuestions.length >= MIN_RECOVERY_QUESTIONS,
        deviceIdRequired: true,
        ...(didHash ? {} : { note: 'deviceId missing; provide deviceId to trust this device after verification' })
      });
    }

    // Update last-used timestamp for trusted device
    if (didHash && Array.isArray(user.trustedDevices)) {
      const idx = user.trustedDevices.findIndex(d => d.deviceIdHash === didHash);
      if (idx >= 0) {
        user.trustedDevices[idx].lastUsedAt = new Date();
        await user.save({ validateBeforeSave: false });
      }
    }
  }

  if (!user.emailVerified) {
    const signupToken = issueSignupToken(user._id);
    try {
      await sendEmailOtp(user);
    } catch (err) {
      console.error('Failed to send email OTP during login:', err);
    }
    return res.status(403).json({
      status: 403,
      code: 'VERIFICATION_REQUIRED',
      step: 'email',
      message: 'Please verify your email to continue.',
      signupToken,
      ...verificationState(user),
    });
  }

  // If first login, set isFirstLogin to false after login
  let isFirstLogin = user.isFirstLogin;
  if (user.isFirstLogin) {
    user.isFirstLogin = false;
    await user.save();
  }

  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '8h';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);

  return res.cookie('accessToken', generateToken, getAccessTokenCookieOptions(req, expireIn)).status(200).json({
    status: 201,
    message: "User is logged in successfully",
    user_id: user._id,
    token: generateToken,
    type: 'user',
    phone: user.phone,
    plan: user.plan || 'free',
    isFirstLogin: isFirstLogin
  });
};

// 2FA: verify login OTP and complete login
const verifyTwoFaLogin = async (req, res) => {
  const { twoFaToken, otp, deviceId, deviceLabel } = req.body;
  if (!twoFaToken || !otp) return res.status(400).json({ message: '2FA token and OTP are required' });

  let decoded;
  try {
    decoded = decodeTwoFaToken(twoFaToken);
  } catch {
    return res.status(400).json({ message: 'Invalid or expired 2FA session. Please login again.' });
  }

  const user = await User.findById(decoded.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.twoFaEnabled) return res.status(400).json({ message: '2FA is not enabled for this user' });

  const code = normalizeOtpCode(otp);
  if (user.twoFaMethod === 'authenticator') {
    if (!user.twoFaAuthenticatorSecret) {
      return res.status(400).json({ message: 'Authenticator app is not configured. Please update your 2FA settings.' });
    }
    const validTotp = code.length === 6 && authenticator.check(code, user.twoFaAuthenticatorSecret);
    if (validTotp) {
      // ok
    } else if (code.length === 8 && Array.isArray(user.twoFaBackupCodeHashes) && user.twoFaBackupCodeHashes.length > 0) {
      const h = hashBackupCode(code);
      const idx = user.twoFaBackupCodeHashes.indexOf(h);
      if (idx === -1) {
        return res.status(400).json({ message: 'Invalid authenticator code' });
      }
      user.twoFaBackupCodeHashes.splice(idx, 1);
    } else {
      return res.status(400).json({
        message: code.length === 8
          ? 'Invalid backup code'
          : 'Invalid authenticator code',
      });
    }
  } else {
    const now = new Date();
    if (!user.twoFaOtpExpires || user.twoFaOtpExpires < now) {
      return res.status(400).json({ message: 'OTP expired. Please login again to resend.' });
    }
    const match = user.twoFaOtpHash === hashOtp(code);
    if (!match) return res.status(400).json({ message: 'Invalid OTP' });
  }

  // Clear OTP
  user.twoFaOtpHash = undefined;
  user.twoFaOtpExpires = undefined;

  // Trust device if provided
  const did = String(deviceId || '').trim();
  const didHash = did ? hashDeviceId(did) : decoded.deviceIdHash;
  if (didHash && didHash !== 'unknown') {
    const label = String(deviceLabel || '').trim().slice(0, 80);
    const existing = (user.trustedDevices || []).some(d => d.deviceIdHash === didHash);
    if (!existing) {
      user.trustedDevices = (user.trustedDevices || []).concat([{
        deviceIdHash: didHash,
        label,
        lastUsedAt: new Date(),
        createdAt: new Date(),
      }]);
    } else {
      const idx = user.trustedDevices.findIndex(d => d.deviceIdHash === didHash);
      if (idx >= 0) user.trustedDevices[idx].lastUsedAt = new Date();
    }
  }

  await user.save({ validateBeforeSave: false });

  // Continue normal login (verification gates should already be satisfied for existing users)
  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '8h';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);

  return res.cookie('accessToken', generateToken, getAccessTokenCookieOptions(req, expireIn)).status(200).json({
    status: 201,
    message: "User is logged in successfully",
    user_id: user._id,
    token: generateToken,
    type: 'user',
    phone: user.phone,
    plan: user.plan || 'free',
    isFirstLogin: user.isFirstLogin
  });
};

const getTwoFaRecoveryQuestions = async (req, res) => {
  const { twoFaToken } = req.body;
  if (!twoFaToken) return res.status(400).json({ message: '2FA token is required.' });

  let decoded;
  try {
    decoded = decodeTwoFaToken(twoFaToken);
  } catch {
    return res.status(400).json({ message: 'Invalid or expired 2FA session. Please login again.' });
  }

  const user = await User.findById(decoded.userId).select('twoFaEnabled twoFaRecoveryQuestions email recoveryEmail');
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.twoFaEnabled) return res.status(400).json({ message: '2FA is not enabled for this user' });
  const questions = (user.twoFaRecoveryQuestions || []).map((item) => item.question).filter(Boolean);
  if (questions.length < MIN_RECOVERY_QUESTIONS) {
    return res.status(400).json({ message: 'Recovery questions are not set for this account.' });
  }

  return res.status(200).json({
    questions,
    emailChoices: recoveryEmailChoices(user),
  });
};

const verifyTwoFaRecoveryAnswers = async (req, res) => {
  const { twoFaToken, answers, destination, verifyOnly } = req.body;
  if (!twoFaToken) return res.status(400).json({ message: '2FA token is required.' });

  let decoded;
  try {
    decoded = decodeTwoFaToken(twoFaToken);
  } catch {
    return res.status(400).json({ message: 'Invalid or expired 2FA session. Please login again.' });
  }

  const user = await User.findById(decoded.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const storedQuestions = Array.isArray(user.twoFaRecoveryQuestions) ? user.twoFaRecoveryQuestions : [];
  if (storedQuestions.length < MIN_RECOVERY_QUESTIONS) {
    return res.status(400).json({ message: 'Recovery questions are not set for this account.' });
  }

  const given = sanitizeRecoveryQuestions(answers);
  if (given.length < MIN_RECOVERY_QUESTIONS) {
    return res.status(400).json({ message: `Please answer at least ${MIN_RECOVERY_QUESTIONS} security questions.` });
  }

  const answerMap = new Map(given.map((item) => [item.question.toLowerCase(), hashRecoveryAnswer(item.answer)]));
  const wrongQuestions = storedQuestions
    .filter((item) => answerMap.get(String(item.question || '').toLowerCase()) !== item.answerHash)
    .map((item) => String(item.question || ''))
    .filter(Boolean);
  if (wrongQuestions.length > 0) {
    return res.status(400).json({
      message: 'Some security answers are incorrect.',
      wrongQuestions,
    });
  }

  if (verifyOnly) {
    return res.status(200).json({
      message: 'Security answers verified.',
      verified: true,
    });
  }

  const choice = String(destination || 'primary').toLowerCase();
  let emailDestination = user.email;
  if (choice === 'recovery') {
    if (!user.recoveryEmail) return res.status(400).json({ message: 'Recovery email is not configured for this account.' });
    emailDestination = user.recoveryEmail;
  }

  const otp = generateOtp();
  user.twoFaRecoveryOtpHash = hashOtp(otp);
  user.twoFaRecoveryOtpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  await sendVerificationOtpEmail(emailDestination, otp, user.fullname, OTP_EXPIRY_MINUTES);

  const recoveryToken = issueTwoFaRecoveryToken(user._id, decoded.deviceIdHash, choice);

  return res.status(200).json({
    message: `Recovery OTP sent to ${maskEmail(emailDestination)}.`,
    recoveryToken,
    destination: choice,
    destinationMasked: maskEmail(emailDestination),
  });
};

const verifyTwoFaRecoverySingleAnswer = async (req, res) => {
  const { twoFaToken, question, answer } = req.body;
  if (!twoFaToken || !question || !String(answer || '').trim()) {
    return res.status(400).json({ message: '2FA token, question and answer are required.' });
  }

  let decoded;
  try {
    decoded = decodeTwoFaToken(twoFaToken);
  } catch {
    return res.status(400).json({ message: 'Invalid or expired 2FA session. Please login again.' });
  }

  const user = await User.findById(decoded.userId).select('twoFaEnabled twoFaRecoveryQuestions');
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.twoFaEnabled) return res.status(400).json({ message: '2FA is not enabled for this user' });

  const storedQuestions = Array.isArray(user.twoFaRecoveryQuestions) ? user.twoFaRecoveryQuestions : [];
  if (storedQuestions.length < MIN_RECOVERY_QUESTIONS) {
    return res.status(400).json({ message: 'Recovery questions are not set for this account.' });
  }

  const target = storedQuestions.find(
    (item) => String(item.question || '').toLowerCase() === String(question || '').trim().toLowerCase()
  );
  if (!target) return res.status(400).json({ message: 'Invalid security question.' });

  const match = target.answerHash === hashRecoveryAnswer(answer);
  if (!match) {
    return res.status(400).json({
      message: 'Incorrect answer.',
      wrongQuestions: [String(target.question || question)],
    });
  }

  return res.status(200).json({
    message: 'Answer verified.',
    verified: true,
    question: String(target.question || question),
  });
};

const verifyTwoFaRecoveryOtp = async (req, res) => {
  const { recoveryToken, otp, deviceId, deviceLabel } = req.body;
  if (!recoveryToken || !otp) {
    return res.status(400).json({ message: 'Recovery token and OTP are required.' });
  }

  let decoded;
  try {
    decoded = decodeTwoFaRecoveryToken(recoveryToken);
  } catch {
    return res.status(400).json({ message: 'Invalid or expired recovery session. Please login again.' });
  }

  const user = await User.findById(decoded.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const now = new Date();
  if (!user.twoFaRecoveryOtpExpires || user.twoFaRecoveryOtpExpires < now) {
    return res.status(400).json({ message: 'Recovery OTP expired. Please restart recovery.' });
  }
  const match = user.twoFaRecoveryOtpHash === hashOtp(normalizeOtpCode(otp));
  if (!match) return res.status(400).json({ message: 'Invalid recovery OTP.' });

  user.twoFaRecoveryOtpHash = null;
  user.twoFaRecoveryOtpExpires = null;

  const did = String(deviceId || '').trim();
  const didHash = did ? hashDeviceId(did) : decoded.deviceIdHash;
  if (didHash && didHash !== 'unknown') {
    const label = String(deviceLabel || '').trim().slice(0, 80);
    const existing = (user.trustedDevices || []).some((d) => d.deviceIdHash === didHash);
    if (!existing) {
      user.trustedDevices = (user.trustedDevices || []).concat([{
        deviceIdHash: didHash,
        label,
        lastUsedAt: new Date(),
        createdAt: new Date(),
      }]);
    } else {
      const idx = user.trustedDevices.findIndex((d) => d.deviceIdHash === didHash);
      if (idx >= 0) user.trustedDevices[idx].lastUsedAt = new Date();
    }
  }

  await user.save({ validateBeforeSave: false });

  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '8h';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);

  return res.cookie('accessToken', generateToken, getAccessTokenCookieOptions(req, expireIn)).status(200).json({
    status: 201,
    message: 'User is logged in successfully',
    user_id: user._id,
    token: generateToken,
    type: 'user',
    phone: user.phone,
    plan: user.plan || 'free',
    isFirstLogin: user.isFirstLogin
  });
};

// 2FA: get and update settings (authenticated)
const getTwoFaSettings = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  const user = await User.findById(userId).select('twoFaEnabled twoFaMethod twoFaAuthenticatorSecret twoFaBackupCodeHashes recoveryEmail recoveryEmailVerified pendingRecoveryEmail twoFaRecoveryQuestions');
  if (!user) return res.status(404).json({ message: 'User not found' });
  const backupHashes = user.twoFaBackupCodeHashes || [];
  return res.status(200).json({
    twoFaEnabled: !!user.twoFaEnabled,
    twoFaMethod: user.twoFaMethod || 'email',
    authenticatorConfigured: !!user.twoFaAuthenticatorSecret,
    backupCodesRemaining: backupHashes.length,
    recoveryEmail: user.recoveryEmail || '',
    recoveryEmailMasked: user.recoveryEmail ? maskEmail(user.recoveryEmail) : '',
    recoveryEmailVerified: !!user.recoveryEmailVerified,
    pendingRecoveryEmail: user.pendingRecoveryEmail || '',
    pendingRecoveryEmailMasked: user.pendingRecoveryEmail ? maskEmail(user.pendingRecoveryEmail) : '',
    hasRecoveryQuestions: Array.isArray(user.twoFaRecoveryQuestions) && user.twoFaRecoveryQuestions.length >= MIN_RECOVERY_QUESTIONS,
    recoveryQuestionsLocked: Array.isArray(user.twoFaRecoveryQuestions) && user.twoFaRecoveryQuestions.length >= MIN_RECOVERY_QUESTIONS,
    recoveryQuestions: (user.twoFaRecoveryQuestions || []).map((item) => item.question),
  });
};

const updateTwoFaSettings = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  const { enabled, method, recoveryQuestions } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const nextEnabled = typeof enabled === 'boolean' ? enabled : !!user.twoFaEnabled;
  const nextMethod = (method === 'sms' || method === 'email' || method === 'authenticator')
    ? method
    : (user.twoFaMethod || 'email');
  if (nextMethod === 'authenticator' && nextEnabled && !user.twoFaAuthenticatorSecret) {
    return res.status(400).json({ message: 'Set up your authenticator app first before enabling it.' });
  }

  const questions = sanitizeRecoveryQuestions(recoveryQuestions);
  const hasExistingQuestions = Array.isArray(user.twoFaRecoveryQuestions) && user.twoFaRecoveryQuestions.length >= MIN_RECOVERY_QUESTIONS;
  if (nextEnabled) {
    const hasExistingRecoveryEmail = !!user.recoveryEmail;
    const hasIncomingQuestions = questions.length >= MIN_RECOVERY_QUESTIONS;
    const hasVerifiedRecoveryEmail = hasExistingRecoveryEmail && !!user.recoveryEmailVerified;
    if (!hasExistingQuestions && !hasIncomingQuestions) {
      return res.status(400).json({ message: `Add at least ${MIN_RECOVERY_QUESTIONS} security questions for account recovery.` });
    }
    if (!hasVerifiedRecoveryEmail) {
      return res.status(400).json({ message: 'Please verify your recovery email before enabling 2FA.' });
    }
  }

  if (questions.length > 0) {
    if (hasExistingQuestions) {
      return res.status(400).json({ message: 'Security questions are locked after setup and cannot be changed.' });
    }
    if (questions.length < MIN_RECOVERY_QUESTIONS) {
      return res.status(400).json({ message: `Please provide at least ${MIN_RECOVERY_QUESTIONS} complete security questions.` });
    }
    user.twoFaRecoveryQuestions = questions.map((item) => ({
      question: item.question,
      answerHash: hashRecoveryAnswer(item.answer),
    }));
  }

  user.twoFaEnabled = nextEnabled;
  user.twoFaMethod = nextMethod;
  await user.save({ validateBeforeSave: false });

  const upgradedToken = nextEnabled
    ? await upgradeSessionAfterTwoFaEnabled(req, res, user)
    : null;

  return res.status(200).json({
    message: '2FA settings updated',
    twoFaEnabled: !!user.twoFaEnabled,
    twoFaMethod: user.twoFaMethod,
    recoveryEmail: user.recoveryEmail || '',
    recoveryEmailMasked: user.recoveryEmail ? maskEmail(user.recoveryEmail) : '',
    recoveryEmailVerified: !!user.recoveryEmailVerified,
    pendingRecoveryEmail: user.pendingRecoveryEmail || '',
    pendingRecoveryEmailMasked: user.pendingRecoveryEmail ? maskEmail(user.pendingRecoveryEmail) : '',
    hasRecoveryQuestions: Array.isArray(user.twoFaRecoveryQuestions) && user.twoFaRecoveryQuestions.length >= MIN_RECOVERY_QUESTIONS,
    recoveryQuestionsLocked: Array.isArray(user.twoFaRecoveryQuestions) && user.twoFaRecoveryQuestions.length >= MIN_RECOVERY_QUESTIONS,
    ...(upgradedToken ? { token: upgradedToken } : {}),
  });
};

const sendRecoveryEmailOtp = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { recoveryEmail } = req.body || {};
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const normalizedRecoveryEmail = String(recoveryEmail || '').trim().toLowerCase();
  if (!normalizedRecoveryEmail) return res.status(400).json({ message: 'Recovery email is required.' });
  if (!isEmailValid(normalizedRecoveryEmail)) {
    return res.status(400).json({ message: 'Recovery email format is invalid.' });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = generateOtp();
  user.recoveryEmailOtpHash = hashOtp(otp);
  user.recoveryEmailOtpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.pendingRecoveryEmail = normalizedRecoveryEmail;
  user.recoveryEmailVerified = false;
  await user.save({ validateBeforeSave: false });

  await sendVerificationOtpEmail(normalizedRecoveryEmail, otp, user.fullname, OTP_EXPIRY_MINUTES);

  return res.status(200).json({
    message: 'OTP sent to recovery email.',
    pendingRecoveryEmail: normalizedRecoveryEmail,
    pendingRecoveryEmailMasked: maskEmail(normalizedRecoveryEmail),
    recoveryEmailVerified: false,
  });
};

const verifyRecoveryEmailOtp = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { otp } = req.body || {};
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  if (!otp) return res.status(400).json({ message: 'OTP is required.' });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.pendingRecoveryEmail) {
    return res.status(400).json({ message: 'No recovery email pending verification.' });
  }

  const now = new Date();
  if (!user.recoveryEmailOtpExpires || user.recoveryEmailOtpExpires < now) {
    return res.status(400).json({ message: 'OTP expired. Please resend.' });
  }
  const match = user.recoveryEmailOtpHash === hashOtp(String(otp).trim());
  if (!match) return res.status(400).json({ message: 'Invalid OTP.' });

  user.recoveryEmail = user.pendingRecoveryEmail;
  user.recoveryEmailVerified = true;
  user.pendingRecoveryEmail = null;
  user.recoveryEmailOtpHash = null;
  user.recoveryEmailOtpExpires = null;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    message: 'Recovery email verified successfully.',
    recoveryEmail: user.recoveryEmail,
    recoveryEmailMasked: user.recoveryEmail ? maskEmail(user.recoveryEmail) : '',
    recoveryEmailVerified: !!user.recoveryEmailVerified,
  });
};

const setupAuthenticatorTwoFa = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  const user = await User.findById(userId).select('email fullname twoFaAuthenticatorTempSecret');
  if (!user) return res.status(404).json({ message: 'User not found' });

  const tempSecret = authenticator.generateSecret();
  user.twoFaAuthenticatorTempSecret = tempSecret;
  await user.save({ validateBeforeSave: false });

  const accountLabel = user.email || user.fullname || `user-${user._id}`;
  const issuer = process.env.APP_NAME || 'DocuMantra';
  const otpauthUrl = authenticator.keyuri(accountLabel, issuer, tempSecret);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUrl)}`;

  return res.status(200).json({
    message: 'Authenticator setup generated.',
    secret: tempSecret,
    manualEntryKey: tempSecret,
    otpauthUrl,
    qrCodeUrl,
  });
};

const verifyAuthenticatorTwoFaSetup = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const code = normalizeOtpCode(req.body?.code);
  if (!code) return res.status(400).json({ message: 'Verification code is required.' });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.twoFaAuthenticatorTempSecret) {
    return res.status(400).json({ message: 'Start authenticator setup before verification.' });
  }

  const isValid = authenticator.check(code, user.twoFaAuthenticatorTempSecret);
  if (!isValid) return res.status(400).json({ message: 'Invalid verification code. Please try again.' });

  user.twoFaAuthenticatorSecret = user.twoFaAuthenticatorTempSecret;
  user.twoFaAuthenticatorTempSecret = null;
  user.twoFaMethod = 'authenticator';
  user.twoFaEnabled = true;
  user.twoFaOtpHash = null;
  user.twoFaOtpExpires = null;
  user.twoFaAuthenticatorVerifiedAt = new Date();
  const plainBackupCodes = generateBackupCodes(10);
  user.twoFaBackupCodeHashes = plainBackupCodes.map((c) => hashBackupCode(normalizeBackupCode(c)));
  await user.save({ validateBeforeSave: false });

  const upgradedToken = await upgradeSessionAfterTwoFaEnabled(req, res, user);

  return res.status(200).json({
    message: 'Authenticator app enabled successfully.',
    twoFaEnabled: !!user.twoFaEnabled,
    twoFaMethod: user.twoFaMethod,
    authenticatorConfigured: true,
    backupCodes: plainBackupCodes,
    backupCodesRemaining: user.twoFaBackupCodeHashes.length,
    ...(upgradedToken ? { token: upgradedToken } : {}),
  });
};

const regenerateAuthenticatorBackupCodes = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const totp = normalizeOtpCode(req.body?.code);
  if (!totp || totp.length !== 6) {
    return res.status(400).json({ message: 'Enter your current 6-digit authenticator app code.' });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.twoFaAuthenticatorSecret) {
    return res.status(400).json({ message: 'Authenticator app is not configured.' });
  }
  if (!authenticator.check(totp, user.twoFaAuthenticatorSecret)) {
    return res.status(400).json({ message: 'Invalid authenticator code.' });
  }

  const plainBackupCodes = generateBackupCodes(10);
  user.twoFaBackupCodeHashes = plainBackupCodes.map((c) => hashBackupCode(normalizeBackupCode(c)));
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({
    message: 'New backup codes generated. Previous codes are no longer valid.',
    backupCodes: plainBackupCodes,
    backupCodesRemaining: user.twoFaBackupCodeHashes.length,
  });
};

// Register — email OTP required to activate; phone / SMS verification optional
const register = async (req, res) => {
  const {
    fullname,
    email,
    phone,
    password,
    company,
    address,
    recaptchaToken,
    ref,
    referrerUserId,
    agreeToTerms,
    subscribeNewsletter,
    termsVersion,
    privacyVersion,
    marketingVersion,
  } = req.body;

  if (!agreeToTerms) {
    return res.status(400).json({ message: 'You must accept the Terms of Service and Privacy Policy.' });
  }

  if (!isChromeExtensionClient(req)) {
    const isValidRecaptcha = true; // captcha disabled
    if (!isValidRecaptcha) {
      return res.status(400).json({ message: 'Invalid reCAPTCHA. Please try again.' });
    }
  }

  const normalizedFullname = String(fullname || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(0, 15);

  if (!normalizedFullname || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'Full name, email and password are required' });
  }

  const fullnameError = getPlainTextFieldError(normalizedFullname, 'Full name', { maxLength: 80, required: true });
  if (fullnameError) {
    return res.status(400).json({ message: fullnameError });
  }
  const companyError = company != null && company !== ''
    ? getPlainTextFieldError(company, 'Company', { maxLength: 120 })
    : null;
  if (companyError) {
    return res.status(400).json({ message: companyError });
  }
  const addressError = address != null && address !== ''
    ? getPlainTextFieldError(address, 'Address', { maxLength: 240 })
    : null;
  if (addressError) {
    return res.status(400).json({ message: addressError });
  }

  if (!isEmailValid(normalizedEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const passwordError = getPasswordPolicyError(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    // Sequential verification: send email OTP first; phone OTP is sent only after email verification.
    const emailOtp = generateOtp();
    const emailOtpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const user = await User.create({
      fullname: normalizedFullname,
      email: normalizedEmail,
      phone: normalizedPhone || '',
      password,
      company: company ? String(company).trim() : '',
      address: address ? String(address).trim() : '',
      plan: 'free',
      emailVerified: false,
      phoneVerified: false,
      emailOtpHash: hashOtp(emailOtp),
      emailOtpExpires,
      phoneOtpHash: null,
      phoneOtpExpires: null
    });

    await recordConsentEntries(req, [
      {
        consentType: CONSENT_TYPES.TERMS_OF_SERVICE,
        consentVersion: termsVersion || DEFAULT_CONSENT_VERSIONS.terms_of_service,
        granted: true,
        subjectType: SUBJECT_TYPES.USER,
        subjectId: user._id,
        userId: user._id,
        source: CONSENT_SOURCES.SIGNUP,
      },
      {
        consentType: CONSENT_TYPES.PRIVACY_POLICY,
        consentVersion: privacyVersion || DEFAULT_CONSENT_VERSIONS.privacy_policy,
        granted: true,
        subjectType: SUBJECT_TYPES.USER,
        subjectId: user._id,
        userId: user._id,
        source: CONSENT_SOURCES.SIGNUP,
      },
      {
        consentType: CONSENT_TYPES.MARKETING_EMAIL,
        consentVersion: marketingVersion || DEFAULT_CONSENT_VERSIONS.marketing_email,
        granted: Boolean(subscribeNewsletter),
        subjectType: SUBJECT_TYPES.USER,
        subjectId: user._id,
        userId: user._id,
        source: CONSENT_SOURCES.SIGNUP,
      },
    ]);

    const emailSent = await sendVerificationOtpEmail(user.email, emailOtp, user.fullname, OTP_EXPIRY_MINUTES);

    const signupToken = issueSignupToken(user._id);

    try {
      await axios.post(`${process.env.ESING_SERVICE_URL}/api/e-sign/public/link-user-recipient`, {
        email: user.email,
        userId: user._id
      }, { timeout: 5000 }); // 5 second timeout to prevent hanging
    } catch (linkErr) {
      console.warn('E-sign link-user-recipient failed:', linkErr?.message);
    }

    try {
      await attachReferralOnSignup(user._id, ref || referrerUserId);
    } catch (refErr) {
      console.warn('Referral attach failed:', refErr?.message);
    }

    res.status(201).json({
      message: emailSent
        ? 'Please verify your email with the code we sent.'
        : 'Account created. We could not send the verification email yet — use Resend on the next screen.',
      signupToken,
      emailSent,
      ...verificationState(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      console.error('Email or phone already exists');
      return res.status(400).json({
        message: 'Unable to create account. If you already have an account, try logging in or resetting your password.',
      });
    }
    console.error('Server error', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Send email OTP (resend)
const sendSignupEmailOtp = async (req, res) => {
  const { signupToken } = req.body;
  if (!signupToken) return res.status(400).json({ message: 'Signup token is required' });
  let decoded;
  try {
    decoded = decodeSignupToken(signupToken);
  } catch {
    return res.status(400).json({ message: 'Invalid or expired signup token. Please sign up again.' });
  }
  const user = await User.findById(decoded.userId);
  if (!user) return res.status(404).json({ message: 'User not found. Please sign up again.' });
  if (user.emailVerified) {
    return res.status(200).json({ message: 'Email already verified', ...verificationState(user) });
  }
  await sendEmailOtp(user);
  return res.status(200).json({ message: 'Email OTP sent', ...verificationState(user) });
};

// Verify email OTP
const verifySignupEmailOtp = async (req, res) => {
  const { signupToken, emailOtp } = req.body;
  if (!signupToken || !emailOtp) return res.status(400).json({ message: 'Signup token and email OTP are required' });
  let decoded;
  try {
    decoded = decodeSignupToken(signupToken);
  } catch {
    return res.status(400).json({ message: 'Invalid or expired signup token. Please sign up again.' });
  }
  const user = await User.findById(decoded.userId);
  if (!user) return res.status(404).json({ message: 'User not found. Please sign up again.' });
  const now = new Date();
  if (!user.emailOtpExpires || user.emailOtpExpires < now) return res.status(400).json({ message: 'Email verification code has expired. Please resend.' });
  const emailMatch = user.emailOtpHash === hashOtp(String(emailOtp).trim());
  if (!emailMatch) return res.status(400).json({ message: 'Invalid email verification code' });
  user.emailVerified = true;
  user.emailOtpHash = undefined;
  user.emailOtpExpires = undefined;
  // SMS proof is optional at signup; account is active after email. User can confirm phone later in profile.
  user.phoneVerified = true;
  await user.save({ validateBeforeSave: false });
  const tokenPayload = await maybeIssueAccessTokenIfVerified(user, res, req);
  if (tokenPayload) {
    return res.status(200).json({
      ...tokenPayload,
      user_id: tokenPayload.user_id?.toString?.() ?? tokenPayload.user_id,
    });
  }
  return res.status(200).json({ message: 'Email verified', ...verificationState(user) });
};

// Send phone OTP (only after email verified)
const sendSignupPhoneOtp = async (req, res) => {
  const { signupToken } = req.body;
  if (!signupToken) return res.status(400).json({ message: 'Signup token is required' });
  let decoded;
  try {
    decoded = decodeSignupToken(signupToken);
  } catch {
    return res.status(400).json({ message: 'Invalid or expired signup token. Please sign up again.' });
  }
  const user = await User.findById(decoded.userId);
  if (!user) return res.status(404).json({ message: 'User not found. Please sign up again.' });
  if (!user.emailVerified) return res.status(400).json({ message: 'Please verify email first', ...verificationState(user) });
  if (user.phoneVerified) return res.status(200).json({ message: 'Phone already verified', ...verificationState(user) });
  if (!hasEnoughPhoneDigits(user)) {
    return res.status(400).json({
      message: 'Add a valid phone number on your account to receive an SMS code.',
      ...verificationState(user),
    });
  }
  await sendPhoneOtp(user);
  return res.status(200).json({ message: 'Phone OTP sent', ...verificationState(user) });
};

// Verify phone OTP
const verifySignupPhoneOtp = async (req, res) => {
  const { signupToken, phoneOtp } = req.body;
  if (!signupToken || !phoneOtp) return res.status(400).json({ message: 'Signup token and phone OTP are required' });
  let decoded;
  try {
    decoded = decodeSignupToken(signupToken);
  } catch {
    return res.status(400).json({ message: 'Invalid or expired signup token. Please sign up again.' });
  }
  const user = await User.findById(decoded.userId);
  if (!user) return res.status(404).json({ message: 'User not found. Please sign up again.' });
  if (!user.emailVerified) return res.status(400).json({ message: 'Please verify email first', ...verificationState(user) });
  const now = new Date();
  if (!user.phoneOtpExpires || user.phoneOtpExpires < now) return res.status(400).json({ message: 'Phone verification code has expired. Please resend.' });
  const phoneMatch = user.phoneOtpHash === hashOtp(String(phoneOtp).trim());
  if (!phoneMatch) return res.status(400).json({ message: 'Invalid phone verification code' });
  user.phoneVerified = true;
  user.phoneOtpHash = undefined;
  user.phoneOtpExpires = undefined;
  await user.save({ validateBeforeSave: false });
  const tokenPayload = await maybeIssueAccessTokenIfVerified(user, res, req);
  if (tokenPayload) return res.status(200).json(tokenPayload);
  return res.status(200).json({ message: 'Phone verified', ...verificationState(user) });
};

async function respondTwoFaSetupRequired(req, res, user) {
  const setupToken = await generateAccessTokenUser(user, TWO_FA_SETUP_TOKEN_EXPIRY, req, null, {
    twoFaSetupOnly: true,
  });
  return res
    .cookie('accessToken', setupToken, getAccessTokenCookieOptions(req, TWO_FA_SETUP_TOKEN_EXPIRY))
    .status(403)
    .json({
      status: 403,
      code: 'TWO_FA_SETUP_REQUIRED',
      message: 'Two-factor authentication is required for your account. Enable it in Account Security settings.',
      setupPath: '/account/security',
      twoFaSetupOnly: true,
      user_id: user._id,
      email: user.email,
      token: setupToken,
      type: 'user',
      data: null,
    });
}

async function upgradeSessionAfterTwoFaEnabled(req, res, user) {
  if (!req.user?.twoFaSetupOnly) return null;
  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '8h';
  const sessionId = req.user?.data?.sessionId || req.user?.sessionId || null;
  const token = await generateAccessTokenUser(user, expireIn, req, sessionId);
  res.cookie('accessToken', token, getAccessTokenCookieOptions(req, expireIn));
  return token;
}

// Access Token Generator
async function generateAccessTokenUser(user, expireIn, req, keepSessionId = null, tokenOptions = {}) {
  let sessionId = keepSessionId || crypto.randomBytes(16).toString('hex');
  let ipAddress = 'Unknown IP';
  let deviceInfo = 'Unknown Device';

  let isNewDeviceOrIp = false;
  let wasEmpty = true;

  if (req) {
    ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown IP';
    deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const deviceId = req.body?.deviceId || req.headers?.['x-device-id'] || null;

    if (!keepSessionId) {
      if (!user.knownIps) user.knownIps = [];
      if (!user.knownUserAgents) user.knownUserAgents = [];
      if (!user.knownDeviceIds) user.knownDeviceIds = [];

      wasEmpty = user.knownIps.length === 0 && user.knownUserAgents.length === 0 && user.knownDeviceIds.length === 0;

      const isNewIp = ipAddress !== 'Unknown IP' && !user.knownIps.includes(ipAddress);
      const isNewUa = deviceInfo !== 'Unknown Device' && !user.knownUserAgents.includes(deviceInfo);
      const isNewDeviceId = deviceId && !user.knownDeviceIds.includes(deviceId);

      if (isNewIp || isNewUa || isNewDeviceId) {
        isNewDeviceOrIp = true;
        if (isNewIp) user.knownIps.push(ipAddress);
        if (isNewUa) user.knownUserAgents.push(deviceInfo);
        if (isNewDeviceId) user.knownDeviceIds.push(deviceId);
      }
    }
  }

  user.activeSessions = user.activeSessions || [];
  
  if (keepSessionId) {
    const existingSession = user.activeSessions.find(s => s.sessionId === keepSessionId);
    if (existingSession) {
      existingSession.lastActive = new Date();
      if (ipAddress !== 'Unknown IP') existingSession.ipAddress = ipAddress;
    }
  } else {
    user.activeSessions.push({
      sessionId,
      deviceInfo,
      ipAddress,
      lastActive: new Date(),
      createdAt: new Date()
    });
    enforceConcurrentSessionLimit(user, { keepSessionId: sessionId });
  }
  
  await user.save({ validateBeforeSave: false });

  if (!keepSessionId && !wasEmpty && isNewDeviceOrIp && user.email) {
    sendNewLoginAlertEmail(user.email, user.fullname, deviceInfo, ipAddress, new Date()).catch(err => console.error('Error sending login alert:', err));
  }

  const dataSend = {
    id: user._id,
    email: user.email,
    fullname: user.fullname,
    phone: user.phone,
    company: user.company,
    address: user.address,
    type: 'user',
    sessionId
  };

  const payload = { data: dataSend };
  if (tokenOptions.twoFaSetupOnly) {
    payload.twoFaSetupOnly = true;
  }

  try {
    return jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: expireIn }
    );
  } catch (error) {
    console.error('Error while generating Access Token', error);
    throw error;
  }
};

// Get current user details
const getMe = async (req, res) => {
  try {
    const userId = req.user?.data?.id || req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 401,
        message: "User not authenticated",
        data: null
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
        data: null
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User details retrieved successfully",
      data: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        phone: user.phone,
        company: user.company,
        address: user.address,
        plan: user.plan || 'free',
        twoFaEnabled: !!user.twoFaEnabled,
        twoFaMethod: user.twoFaMethod || 'email',
        twoFaSetupRequired: shouldRequireTwoFaSetup(user),
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      data: null
    });
  }
};
// Switch account (user <-> organization)
const switchAccount = async (req, res) => {
  try {
    const requestingUser = req.user;
    if (!requestingUser) {
      return res.status(401).json({ status: 401, message: 'Not authenticated' });
    }
    const organizationId = req?.query?.orgId || null;
    const accountType = req?.params?.accType;
    if (!accountType || (accountType !== 'user' && accountType !== 'organization')) {
      return res.status(400).json({ status: 400, message: 'Invalid account type' });
    }
    // If switching to organization, organizationId must be present
    if (!organizationId && accountType === 'organization') {
      return res.status(400).json({ status: 400, message: 'organizationId required for organization account' });
    }
    if (accountType === 'user') {
      return res.status(200).json({ status: 200, message: 'Switched to user account successfully',accountType: 'user' });
    }
    if (accountType === 'organization' && organizationId) {
      //post request to organization service with userid in body and token in header
      const orgResp = await axios.get(`${process.env.ORGANIZATION_SERVICE_URL}/api/organization/details-and-permission/${organizationId}`,{
        headers: {
          Authorization: req.headers.authorization || (req.authToken ? `Bearer ${req.authToken}` : undefined),
        }
      });
      console.log("Organization Service Response: ",orgResp.data);
      const organization = orgResp.data.organization;

      if (!organization) {
        return res.status(404).json({ status: 404, message: 'Organization not found' });
      }
      return res.status(200).json({ status: 200, message: 'Switched to organization account successfully', accountType: 'organization', organizationId: organizationId, organization: organization });
    }
  } catch (error) {
    return res.status(500).json({ status: 500, message: 'Internal server error' });
  }
   
};
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getUsersList = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    let users;
    if (q.length === 0) {
      // Keep compatibility but avoid large load by default; clients should provide q for search.
      users = [];
    } else {
      const regex = new RegExp(escapeRegex(q), 'i');
      users = await User.find(
        {
          $or: [
            { fullname: { $regex: regex } },
            { email: { $regex: regex } }
          ]
        },
        { _id: 1, fullname: 1, email: 1 }
      )
        .limit(limit)
        .lean();
    }

    const formattedUsers = users.map((u) => ({
      _id: u._id,
      name: u.fullname || '',
      email: u.email
    }));

    return res.status(200).json({
      status: 200,
      message: 'Users list retrieved successfully',
      data: formattedUsers
    });
  } catch (error) {
    console.error('getUsersList error', error);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error',
      data: null
    });
  }
};
// Forgot password: generate token and save; optionally send email later
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  if (!isEmailValid(email)) return res.status(400).json({ message: 'Invalid email format' });

  const genericSuccess = {
    status: 200,
    message: 'If an account exists with this email, you will receive a password reset link shortly.',
  };

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || user.status === false) {
      return res.status(200).json(genericSuccess);
    }

    // Already have an active reset link (within 1 hour)
    if (user.resetPasswordToken && user.resetPasswordExpires && user.resetPasswordExpires > new Date()) {
      return res.status(429).json({
        status: 429,
        message: 'You already have a password reset link. Please check your email and use that link to reset your password. You can request a new link only after 1 hour.',
      });
    }

    // Max 2 reset requests per 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRequests = (user.resetPasswordRequestLog || []).filter(
      (entry) => entry.requestedAt && new Date(entry.requestedAt) > twentyFourHoursAgo
    );
    if (recentRequests.length >= 2) {
      return res.status(429).json({
        status: 429,
        message: 'You can only request a password reset 2 times in 24 hours. Please try again later.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const prunedLog = recentRequests.concat([{ requestedAt: new Date() }]);
    user.resetPasswordRequestLog = prunedLog;
    await user.save({ validateBeforeSave: false });

    const frontendBase = process.env.FRONTEND_BASE_URL || process.env.BASE_URL || 'https://esp.documantra.in/';
    const resetLink = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${token}`;

    const sent = await sendPasswordResetEmail(user.email, resetLink, user.fullname || null);
    if (!sent) {
      console.error('Forgot password: reset email was not sent for', user.email);
      return res.status(503).json({
        message: 'Unable to send the reset email right now. Please try again in a few minutes or contact support.',
      });
    }

    return res.status(200).json(genericSuccess);
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};

// Reset password: verify token and set new password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token) return res.status(400).json({ message: 'Reset token is required' });

  const passwordError = getPasswordPolicyError(newPassword);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }

    const reuseError = await getPasswordReuseError(user, newPassword);
    if (reuseError) {
      return res.status(400).json({ message: reuseError });
    }

    archiveCurrentPassword(user);
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.activeSessions = [];
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return res.status(200).json({
      status: 200,
      message: 'Password has been reset successfully. You can now sign in.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};

// Update Profile (basic fields)
const updateProfile = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { fullname, company, address } = req.body;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  if (fullname !== undefined) {
    const fullnameError = getPlainTextFieldError(fullname, 'Full name', { maxLength: 80, required: true });
    if (fullnameError) {
      return res.status(400).json({ message: fullnameError });
    }
    user.fullname = String(fullname).trim();
  }
  if (company !== undefined) {
    const companyError = getPlainTextFieldError(company, 'Company', { maxLength: 120 });
    if (companyError) {
      return res.status(400).json({ message: companyError });
    }
    user.company = company ? String(company).trim() : '';
  }
  if (address !== undefined) {
    const addressError = getPlainTextFieldError(address, 'Address', { maxLength: 240 });
    if (addressError) {
      return res.status(400).json({ message: addressError });
    }
    user.address = address ? String(address).trim() : '';
  }
  
  await user.save({ validateBeforeSave: false });
  
  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '8h';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);

  return res.cookie('accessToken', generateToken, getAccessTokenCookieOptions(req, expireIn)).status(200).json({
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      email: user.email,
      fullname: user.fullname,
      phone: user.phone,
      company: user.company,
      address: user.address,
      plan: user.plan
    },
    token: generateToken
  });
};

const sendProfileEmailOtp = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { email } = req.body;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  if (!email) return res.status(400).json({ message: 'Email required' });
  if (!isEmailValid(email)) return res.status(400).json({ message: 'Invalid email format' });
  
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing && existing._id.toString() !== userId.toString()) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = generateOtp();
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.pendingEmail = normalizedEmail;
  await user.save({ validateBeforeSave: false });
  
  await sendVerificationOtpEmail(user.pendingEmail, otp, user.fullname, OTP_EXPIRY_MINUTES);
  
  return res.status(200).json({ message: 'OTP sent to new email' });
};

const verifyProfileEmailOtp = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { otp } = req.body;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  const now = new Date();
  if (!user.emailOtpExpires || user.emailOtpExpires < now) {
    return res.status(400).json({ message: 'OTP expired. Please resend.' });
  }
  
  const match = user.emailOtpHash === hashOtp(String(otp).trim());
  if (!match) return res.status(400).json({ message: 'Invalid OTP' });
  
  if (user.pendingEmail) {
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
  }

  user.emailOtpHash = undefined;
  user.emailOtpExpires = undefined;
  user.emailChangedAt = new Date();
  user.activeSessions = [];
  await user.save({ validateBeforeSave: false });

  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '8h';
  const generateToken = await generateAccessTokenUser(user, expireIn, req);

  return res.cookie('accessToken', generateToken, getAccessTokenCookieOptions(req, expireIn)).status(200).json({ message: 'Email updated successfully. Other sessions have been signed out.', token: generateToken });
};

const sendProfilePhoneOtp = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { phone } = req.body;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  if (!phone) return res.status(400).json({ message: 'Phone required' });
  
  const normalizedPhone = String(phone).replace(/\D/g, '').slice(0, 15);

  const existing = await User.findOne({ phone: normalizedPhone });
  if (existing && existing._id.toString() !== userId.toString()) {
    return res.status(400).json({ message: 'Phone already in use' });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = generateOtp();
  user.phoneOtpHash = hashOtp(otp);
  user.phoneOtpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.pendingPhone = normalizedPhone;
  await user.save({ validateBeforeSave: false });
  
  await sendVerificationOtpSms(user.pendingPhone, otp);
  
  return res.status(200).json({ message: 'OTP sent to new phone' });
};

const verifyProfilePhoneOtp = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { otp } = req.body;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  const now = new Date();
  if (!user.phoneOtpExpires || user.phoneOtpExpires < now) {
    return res.status(400).json({ message: 'OTP expired. Please resend.' });
  }
  
  const match = user.phoneOtpHash === hashOtp(String(otp).trim());
  if (!match) return res.status(400).json({ message: 'Invalid OTP' });
  
  if (user.pendingPhone) {
    user.phone = user.pendingPhone;
    user.pendingPhone = undefined;
  }

  user.phoneVerified = true;
  user.phoneOtpHash = undefined;
  user.phoneOtpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '8h';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);

  return res.cookie('accessToken', generateToken, getAccessTokenCookieOptions(req, expireIn)).status(200).json({ message: 'Phone updated successfully', token: generateToken });
};

const validateAndTouchSession = async (user, sessionId, tokenIssuedAtSec) => {
  const session = (user.activeSessions || []).find((s) => s.sessionId === sessionId);
  if (!session) {
    return { valid: false, message: 'Session expired or revoked' };
  }

  if (user.passwordChangedAt && tokenIssuedAtSec) {
    const tokenIssuedAtMs = tokenIssuedAtSec * 1000;
    if (tokenIssuedAtMs < user.passwordChangedAt.getTime()) {
      return { valid: false, message: 'Session invalidated due to password change' };
    }
  }

  if (user.emailChangedAt && tokenIssuedAtSec) {
    const tokenIssuedAtMs = tokenIssuedAtSec * 1000;
    if (tokenIssuedAtMs < user.emailChangedAt.getTime()) {
      return { valid: false, message: 'Session invalidated due to email change' };
    }
  }

  const idleMs = getSessionIdleTimeoutMs();
  if (session.lastActive) {
    const idle = Date.now() - new Date(session.lastActive).getTime();
    if (idle > idleMs) {
      user.activeSessions = user.activeSessions.filter((s) => s.sessionId !== sessionId);
      await user.save({ validateBeforeSave: false });
      return { valid: false, message: 'Session expired due to inactivity' };
    }
  }

  session.lastActive = new Date();
  await user.save({ validateBeforeSave: false });
  return { valid: true };
};

const verifyActiveSession = async (req, res, next) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const sessionId = req.user?.data?.sessionId || req.user?.sessionId;

  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  
  if (!sessionId) {
    // Legacy token without sessionId, allow it
    return next();
  }

  try {
    const user = await User.findById(userId).select('activeSessions status passwordChangedAt emailChangedAt');
    if (!user || user.status === false) {
      return res.status(401).json({ message: 'User not found or suspended' });
    }

    const sessionCheck = await validateAndTouchSession(
      user,
      sessionId,
      req.user?.iat
    );
    if (!sessionCheck.valid) {
      return res.status(401).json({ message: sessionCheck.message });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error verifying session' });
  }
};

const getSessions = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;

  const sessions = (user.activeSessions || []).map(session => ({
    sessionId: session.sessionId,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
    lastActive: session.lastActive,
    createdAt: session.createdAt,
    isCurrent: session.sessionId === currentSessionId
  }));

  return res.status(200).json({
    sessions,
    maxConcurrentSessions: getMaxConcurrentSessions(),
  });
};

const getSecurityPolicy = (_req, res) => {
  const requireTwoFa = isLoginTwoFaEnforcementEnabled();
  return res.status(200).json({
    requireTwoFaForLogin: requireTwoFa,
    twoFactorAuthenticationAvailable: true,
    requireTwoFaForESign:
      String(process.env.REQUIRE_2FA_FOR_E_SIGN || '').toLowerCase() === 'true',
    requireTwoFaGraceDays: getTwoFaGraceDays(),
    maxConcurrentSessions: getMaxConcurrentSessions(),
    sessionIdleTimeoutHours: getSessionIdleTimeoutHours(),
    transportSecurity: 'https-required',
    passwordPolicy: {
      minLength: 8,
      requiresUppercase: true,
      requiresLowercase: true,
      requiresNumber: true,
      requiresSpecialCharacter: true,
    },
    adminTwoFactorAuthenticationAvailable: true,
    requireTwoFaForAdminLogin: isAdminLoginTwoFaEnforcementEnabled(),
    requireTwoFaAdminGraceDays: getAdminTwoFaGraceDays(),
    adminTwoFactorNote:
      'Admin accounts support TOTP 2FA under Admin → Security. Enable REQUIRE_2FA_FOR_ADMIN_LOGIN for mandatory rollout.',
  });
};

const revokeSession = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { sessionId } = req.body;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  if (!sessionId) return res.status(400).json({ message: 'Session ID required' });
  
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  user.activeSessions = user.activeSessions.filter(s => s.sessionId !== sessionId);
  await user.save({ validateBeforeSave: false });
  
  return res.status(200).json({ message: 'Session revoked successfully' });
};

const changePassword = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  const passwordError = getPasswordPolicyError(newPassword);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.password) {
      return res.status(400).json({
        message: 'Password login is not available for this account',
      });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const reuseError = await getPasswordReuseError(user, newPassword);
    if (reuseError) {
      return res.status(400).json({ message: reuseError });
    }

    archiveCurrentPassword(user);
    user.password = newPassword;
    user.activeSessions = [];
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.clearCookie('accessToken', getAccessTokenCookieOptions(req));

    return res.status(200).json({
      message: 'Password changed successfully. Please sign in again.',
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};

const validateSessionEndpoint = async (req, res) => {
  // This endpoint is meant to be called by other microservices via the auth-lib.
  // IMPORTANT: We decode the JWT locally here instead of using the auth-lib verifyJWT middleware
  // to prevent an infinite loop (where verifyJWT calls this endpoint, which uses verifyJWT, and so on).
  const token = extractAccessToken(req, 'user');
  
  if (!token) {
    return res.status(200).json({ valid: true }); // Fallback
  }
  
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return res.status(401).json({ valid: false, message: 'Invalid token' });
  }

  const userId = decoded?.data?.id || decoded?.id || decoded?._id;
  const sessionId = decoded?.data?.sessionId || decoded?.sessionId;

  if (!userId || !sessionId) {
    // If no sessionId in token (legacy), just say valid to not break things
    return res.status(200).json({ valid: true });
  }

  try {
    const user = await User.findById(userId).select('activeSessions status passwordChangedAt emailChangedAt');
    if (!user || user.status === false) {
      return res.status(401).json({ valid: false, message: 'User suspended or not found' });
    }

    const sessionCheck = await validateAndTouchSession(user, sessionId, decoded?.iat);
    if (!sessionCheck.valid) {
      return res.status(401).json({ valid: false, message: sessionCheck.message });
    }

    return res.status(200).json({ valid: true });
  } catch (error) {
    return res.status(500).json({ valid: false, message: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    const token = extractAccessToken(req, 'user');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const userId = decoded?.data?.id || decoded?.id;
        const sessionId = decoded?.data?.sessionId || decoded?.sessionId;
        if (userId && sessionId) {
          const user = await User.findById(userId);
          if (user?.activeSessions?.length) {
            user.activeSessions = user.activeSessions.filter((s) => s.sessionId !== sessionId);
            await user.save();
          }
        }
      } catch (tokenErr) {
        // Cookie may be expired; still clear it below.
      }
    }
    res.clearCookie('accessToken', { ...getAccessTokenCookieOptions(req), maxAge: 0 });
    return res.status(200).json({ status: 200, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.clearCookie('accessToken', { ...getAccessTokenCookieOptions(req), maxAge: 0 });
    return res.status(200).json({ status: 200, message: 'Logged out successfully' });
  }
};

const { googleLoginFederated } = require('./federatedLoginController');

// Export functions
module.exports = {
  getLoginPublicKey,
  login,
  verifyTwoFaLogin,
  getTwoFaRecoveryQuestions,
  verifyTwoFaRecoverySingleAnswer,
  verifyTwoFaRecoveryAnswers,
  verifyTwoFaRecoveryOtp,
  sendRecoveryEmailOtp,
  verifyRecoveryEmailOtp,
  getTwoFaSettings,
  updateTwoFaSettings,
  setupAuthenticatorTwoFa,
  verifyAuthenticatorTwoFaSetup,
  regenerateAuthenticatorBackupCodes,
  register,
  // Sequential signup verification
  sendSignupEmailOtp,
  verifySignupEmailOtp,
  sendSignupPhoneOtp,
  verifySignupPhoneOtp,
  getMe,
  switchAccount,
  getUsersList,
  forgotPassword,
  resetPassword,
  changePassword,
  googleLogin: googleLoginFederated,
  updateProfile,
  sendProfileEmailOtp,
  verifyProfileEmailOtp,
  sendProfilePhoneOtp,
  verifyProfilePhoneOtp,
  getSessions,
  revokeSession,
  getSecurityPolicy,
  verifyActiveSession,
  validateSessionEndpoint,
  logout,
  generateAccessTokenUser,
  respondTwoFaSetupRequired,
};
