const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User  = require('../models/User');
const { isEmailValid } = require('@draftnsign/validators');
const { sendPasswordResetEmail, sendVerificationOtpEmail, sendNewLoginAlertEmail } = require('../utils/email');
const { sendVerificationOtpSms } = require('../utils/sms');
// const { verifyJWT } = require('@draftnsign/auth-lib');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const OTP_EXPIRY_MINUTES = 10;
const SIGNUP_TOKEN_EXPIRY = '15m';
const TWO_FA_TOKEN_EXPIRY = '10m';

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

async function sendTwoFaOtp(user) {
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
  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '30d';
  const accessToken = await generateAccessTokenUser(user, expireIn, req);
  const options = { httpOnly: true, expiresIn: expireIn };
  res.cookie('accessToken', accessToken, options);
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
// Login Controller
const login = async (req, res) => {
  const { email, password, deviceId, deviceLabel, recaptchaToken } = req.body;

  if (!email) return res.status(400).json({ message: 'Email required' });
  if (!password) return res.status(400).json({ message: 'Password required' });

  if (!isChromeExtensionClient(req)) {
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
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
      message: "User is not exists with Us! Please check your Email Id",
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

  // Optional 2FA: if enabled and device is not trusted, require OTP
  if (user.twoFaEnabled) {
    const did = String(deviceId || req.headers['x-device-id'] || '').trim();
    const didHash = did ? hashDeviceId(did) : null;
    const trusted = didHash ? (user.trustedDevices || []).some(d => d.deviceIdHash === didHash) : false;

    if (!trusted) {
      const twoFaToken = issueTwoFaToken(user._id, didHash || 'unknown');
      let destInfo = { method: user.twoFaMethod || 'email', destination: user.twoFaMethod === 'sms' ? maskPhone(user.phone) : maskEmail(user.email) };
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

  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '30d';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);
  const options = {
    httpOnly: true,
    expiresIn: expireIn
  };

  return res.cookie('accessToken', generateToken, options).status(200).json({
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

  const now = new Date();
  if (!user.twoFaOtpExpires || user.twoFaOtpExpires < now) {
    return res.status(400).json({ message: 'OTP expired. Please login again to resend.' });
  }
  const match = user.twoFaOtpHash === hashOtp(String(otp).trim());
  if (!match) return res.status(400).json({ message: 'Invalid OTP' });

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
  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '30d';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);
  const options = { httpOnly: true, expiresIn: expireIn };

  return res.cookie('accessToken', generateToken, options).status(200).json({
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

// 2FA: get and update settings (authenticated)
const getTwoFaSettings = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  const user = await User.findById(userId).select('twoFaEnabled twoFaMethod');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.status(200).json({ twoFaEnabled: !!user.twoFaEnabled, twoFaMethod: user.twoFaMethod || 'email' });
};

const updateTwoFaSettings = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  const { enabled, method } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const nextEnabled = typeof enabled === 'boolean' ? enabled : !!user.twoFaEnabled;
  const nextMethod = (method === 'sms' || method === 'email') ? method : (user.twoFaMethod || 'email');

  user.twoFaEnabled = nextEnabled;
  user.twoFaMethod = nextMethod;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({ message: '2FA settings updated', twoFaEnabled: !!user.twoFaEnabled, twoFaMethod: user.twoFaMethod });
};

// Register — email OTP required to activate; phone / SMS verification optional
const register = async (req, res) => {
  const { fullname, email, phone, password, company, address, recaptchaToken } = req.body;

  if (!isChromeExtensionClient(req)) {
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
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

  if (!isEmailValid(normalizedEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
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
      company: company || '',
      address: address || '',
      plan: 'free',
      emailVerified: false,
      phoneVerified: false,
      emailOtpHash: hashOtp(emailOtp),
      emailOtpExpires,
      phoneOtpHash: null,
      phoneOtpExpires: null
    });

    await sendVerificationOtpEmail(user.email, emailOtp, user.fullname, OTP_EXPIRY_MINUTES);

    const signupToken = issueSignupToken(user._id);

    try {
      await axios.post(`${process.env.ESING_SERVICE_URL}/api/e-sign/public/link-user-recipient`, {
        email: user.email,
        userId: user._id
      }, { timeout: 5000 }); // 5 second timeout to prevent hanging
    } catch (linkErr) {
      console.warn('E-sign link-user-recipient failed:', linkErr?.message);
    }

    res.status(201).json({
      message: 'Please verify your email with the code we sent.',
      signupToken,
      ...verificationState(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      console.error('Email or phone already exists');
      return res.status(400).json({ message: 'Email or phone already exists' });
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

// Access Token Generator
async function generateAccessTokenUser(user, expireIn, req, keepSessionId = null) {
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

  try {
    return jwt.sign(
      {
        data: dataSend
      },
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
          Authorization: req.headers.authorization  
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
const getUsersList = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $project: {
          _id: 1,
          name: "$fullname",
          email: 1
        }
      }
    ]);
    return res.status(200).json({
      status: 200,
      message: "Users list retrieved successfully",
      data: users
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
      data: null
    });
  }
};
// Forgot password: generate token and save; optionally send email later
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  if (!isEmailValid(email)) return res.status(400).json({ message: 'Invalid email format' });

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'We don\'t find any account with this email address. Please check the email or sign up for a new account.',
      });
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

    const frontendBase = process.env.FRONTEND_BASE_URL || process.env.BASE_URL || 'http://165.22.215.73:8081/';
    const resetLink = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, resetLink, user.fullname || null);

    return res.status(200).json({
      status: 200,
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
  }
};

// Reset password: verify token and set new password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token) return res.status(400).json({ message: 'Reset token is required' });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
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

// Google Login Controller
const googleLogin = async (req, res) => {
  const { token, deviceId, deviceLabel } = req.body;
  if (!token) return res.status(400).json({ message: 'Google token required' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { email, name, sub: googleId } = payload;
    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create new user for google sign-in
      user = await User.create({
        fullname: name || 'Google User',
        email: normalizedEmail,
        googleId,
        emailVerified: true, // Google already verified email
        phoneVerified: false, 
        plan: 'free',
        isFirstLogin: true,
      });

      try {
        await axios.post(`${process.env.ESING_SERVICE_URL}/api/e-sign/public/link-user-recipient`, {
          email: user.email,
          userId: user._id
        }, { timeout: 5000 });
      } catch (linkErr) {
        console.warn('E-sign link-user-recipient failed:', linkErr?.message);
      }
    } else {
      // Update existing user with googleId if not present
      if (!user.googleId) {
        user.googleId = googleId;
        user.emailVerified = true;
        await user.save({ validateBeforeSave: false });
      }
      if (user.status === false) {
        return res.status(401).json({
          status: 401,
          message: "Your Account has been suspended, please contact the Admin",
          data: null
        });
      }
    }

    let isFirstLogin = user.isFirstLogin;
    if (user.isFirstLogin) {
      user.isFirstLogin = false;
      await user.save({ validateBeforeSave: false });
    }

    const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '30d';
    const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);
    const options = {
      httpOnly: true,
      expiresIn: expireIn
    };

    return res.cookie('accessToken', generateToken, options).status(200).json({
      status: 200,
      message: "User is logged in successfully with Google",
      user_id: user._id,
      token: generateToken,
      type: 'user',
      phone: user.phone || '',
      plan: user.plan || 'free',
      isFirstLogin: isFirstLogin
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Google login failed', error: error.message });
  }
};

// Update Profile (basic fields)
const updateProfile = async (req, res) => {
  const userId = req.user?.data?.id || req.user?.id || req.user?._id;
  const { fullname, company, address } = req.body;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  if (fullname !== undefined) user.fullname = fullname;
  if (company !== undefined) user.company = company;
  if (address !== undefined) user.address = address;
  
  await user.save({ validateBeforeSave: false });
  
  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '30d';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);
  const options = { httpOnly: true, expiresIn: expireIn };

  return res.cookie('accessToken', generateToken, options).status(200).json({
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
  await user.save({ validateBeforeSave: false });
  
  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '30d';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);
  const options = { httpOnly: true, expiresIn: expireIn };

  return res.cookie('accessToken', generateToken, options).status(200).json({ message: 'Email updated successfully', token: generateToken });
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

  const expireIn = process.env.ACCESS_TOKEN_EXPIRY || '30d';
  const currentSessionId = req.user?.data?.sessionId || req.user?.sessionId;
  const generateToken = await generateAccessTokenUser(user, expireIn, req, currentSessionId);
  const options = { httpOnly: true, expiresIn: expireIn };

  return res.cookie('accessToken', generateToken, options).status(200).json({ message: 'Phone updated successfully', token: generateToken });
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
    const user = await User.findById(userId).select('activeSessions status');
    if (!user || user.status === false) {
      return res.status(401).json({ message: 'User not found or suspended' });
    }

    const isActive = user.activeSessions.some(s => s.sessionId === sessionId);
    if (!isActive) {
      return res.status(401).json({ message: 'Session expired or revoked' });
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

  return res.status(200).json({ sessions });
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

const validateSessionEndpoint = async (req, res) => {
  // This endpoint is meant to be called by other microservices via the auth-lib.
  // IMPORTANT: We decode the JWT locally here instead of using the auth-lib verifyJWT middleware
  // to prevent an infinite loop (where verifyJWT calls this endpoint, which uses verifyJWT, and so on).
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  
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
    const user = await User.findById(userId).select('activeSessions status');
    if (!user || user.status === false) {
      return res.status(401).json({ valid: false, message: 'User suspended or not found' });
    }

    const isActive = user.activeSessions.some(s => s.sessionId === sessionId);
    if (!isActive) {
      return res.status(401).json({ valid: false, message: 'Session revoked' });
    }

    return res.status(200).json({ valid: true });
  } catch (error) {
    return res.status(500).json({ valid: false, message: 'Server error' });
  }
};

// Export functions
module.exports = {
  login,
  verifyTwoFaLogin,
  getTwoFaSettings,
  updateTwoFaSettings,
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
  googleLogin,
  updateProfile,
  sendProfileEmailOtp,
  verifyProfileEmailOtp,
  sendProfilePhoneOtp,
  verifyProfilePhoneOtp,
  getSessions,
  revokeSession,
  verifyActiveSession,
  validateSessionEndpoint,
};
